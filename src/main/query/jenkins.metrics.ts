import { Pool } from 'pg';
import { getMetrics } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const run = async () => {
  const items = await getMetrics(await getUnixTimeToQueryFrom(pool));
  return processCosmosResults(pool, items);
};

export const processCosmosResults = async (pool: Pool, json: string) => {
  await pool.query(
    `
  with builds as (
    insert into jenkins_impl.builds
    select distinct on (correlation_id)
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
      jsonb_populate_recordset(null::jenkins_impl.builds, $1::jsonb) r
      left join team_with_alias t on
                  -- join against all aliases
                  split_part(r.git_url, '/', 5) like (t.alias || '%')
    -- Pick the most specific team alias, ie. the longest.
    order by correlation_id, t.alias desc
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
   insert into jenkins_impl.step_names(name)
   select distinct(current_step_name) from steps
   on conflict do nothing
   returning *
  )
  insert into jenkins_impl.steps
  select
    id,
    correlation_id,
    current_build_current_result,
    stage_timestamp,
    null duration,
    names.step_id
  from steps join (
    -- Cannot see the names we just inserted into jenkins.step_names so must union here.
    select * from jenkins_impl.step_names union select * from new_names
  ) names on current_step_name = name
  order by stage_timestamp asc
  on conflict do nothing`,
    [json]
  );

  // precompute the time taken by each build step
  await pool.query(`
    update jenkins_impl.steps steps
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
      insert into jenkins_impl.terminal_build_steps_materialized
        select
         steps.*,
         steps.stage_timestamp - first_step.stage_timestamp as duration
        from (
          select distinct on(correlation_id)
            id,
            correlation_id,
            current_step_name,
            current_build_current_result,
            stage_timestamp
          from jenkins.build_steps
          order by
             correlation_id,
             case
                -- Looking for the first unsuccessful step if present
                when current_build_current_result != 'SUCCESS' then 2147483647 -- Postgres integer max value
                -- Otherwise we take the last step
                else extract(epoch from stage_timestamp)::integer
             end desc,
             -- Tie breaker for unsuccessful steps so we get the first one that went wrong
             stage_timestamp asc,
             -- Tie breaker for steps with the same timestamp
             case current_step_name
                -- Ensure we get Pipeline Succeeded as the last step of successful builds
                when 'Pipeline Succeeded' then 1
                -- Ensure we do not get 'pipeline failed' as the last step of failed builds, but the step that actually went wrong.
                when 'Pipeline Failed' then 3
                else 2
             end asc
        ) steps
        join (
          select min(stage_timestamp) as stage_timestamp, correlation_id from jenkins.build_steps group by correlation_id
        ) first_step using (correlation_id)
        on conflict(correlation_id) do update set
            current_step_name = excluded.current_step_name,
            current_build_current_result = excluded.current_build_current_result,
            stage_timestamp = excluded.stage_timestamp
            -- Only do the update where we need to to avoid bloating the table.
           where jenkins_impl.terminal_build_steps_materialized.current_step_name <> excluded.current_step_name;
      -- Reset the sequence to the next free value to avoid exhausting it, since it gets incremented even when no rows are added.
      select setval('jenkins_impl.step_names_step_id_seq', (select max(step_id)+1 from jenkins_impl.step_names))
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
