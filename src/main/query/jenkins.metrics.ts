import { Pool } from 'pg';
import { getMetrics } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const run = async () => {
  const items = await getMetrics(await getUnixTimeToQueryFrom(pool));
  return processCosmosResults(items);
};

const processCosmosResults = async (json: string) => {
  await pool.query(
    `
  with builds as (
    insert into jenkins.builds
    select
      correlation_id,
      product,
      branch_name,
      component,
      build_number,
      coalesce(git_url, 'https://github.com/HMCTS/' || split_part(build_url, '/', 7) || '.git'),
      build_url,
      git_commit,
      build_url like '%Nightly%' is_nightly,
      t.id
    from
      jsonb_populate_recordset(null::jenkins.builds, $1::jsonb) r
      left join team_with_alias t on
                  t.alias = split_part(split_part(r.git_url, '/', 5), '-', 1)
                  or t.alias = r.product
    on conflict do nothing
  ),
  steps as (
   select
     (r->>'id')::uuid id,
     (r->>'correlation_id')::uuid correlation_id,
     r->>'current_step_name' current_step_name,
     (r->>'current_build_current_result')::jenkins.buildresult current_build_current_result,
     (r->>'stage_timestamp')::timestamp stage_timestamp
   from jsonb_array_elements($1::jsonb) r
  ),
  -- insert any new step names
  new_names as (
   insert into jenkins.step_names(name)
   select distinct(current_step_name) from steps
   on conflict do nothing
   returning *
  )
  insert into jenkins.steps
  select
    id,
    correlation_id,
    current_build_current_result,
    stage_timestamp,
    null duration,
    names.step_id
  from steps join (
    -- Cannot see the names we just inserted into jenkins.step_names so must union here.
    select * from jenkins.step_names union select * from new_names
  ) names on current_step_name = name
  order by stage_timestamp asc
  on conflict do nothing`,
    [json]
  );

  // precompute the time taken by each build step
  await pool.query(`
    update jenkins.steps steps
    set duration = s.duration
    from (
      select
        id,
        correlation_id,
        coalesce(
          stage_timestamp - lag(stage_timestamp) OVER (
            PARTITION BY correlation_id ORDER BY
              stage_timestamp ASC,
              -- Fail and success can be emitted in the same timestamp as the stage they relate to.
              -- This ensures we correctly attribute the time taken by the build stage and gives the 'success/fail' metric a 0 duration.
              case
                when current_step_name in ('Pipeline Failed', 'Pipeline Succeeded') then 1 else 2
              end desc
          ),
          interval '0 seconds'
        ) AS duration
      from jenkins.build_steps s
    ) s
    where steps.id = s.id and steps.duration is null
   `);

  const client = await pool.connect();
  try {
    await client.query(`
      begin;
      truncate table jenkins.terminal_build_steps_materialized;
      insert into jenkins.terminal_build_steps_materialized
        select
         steps.*,
         steps.stage_timestamp - first_step.stage_timestamp as duration
        from jenkins.terminal_build_steps steps
        join (
          select min(stage_timestamp) as stage_timestamp, correlation_id from jenkins.build_steps group by correlation_id
        ) first_step using (correlation_id);
      commit;
      `);
  } finally {
    client.release();
  }

  return [];
};

export const getUnixTimeToQueryFrom = async (pool: Pool) => {
  // Base off the last import time if available, otherwise the last 12 months
  const res = await pool.query(`
    select extract(epoch from coalesce(
      max(stage_timestamp),
      now() - interval '12 month')
    )::bigint as max
    from jenkins.build_steps
  `);

  return res.rows[0].max;
};
