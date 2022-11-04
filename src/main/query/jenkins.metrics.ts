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
  )
  insert into jenkins.build_steps
  select * from jsonb_populate_recordset(null::jenkins.build_steps, $1::jsonb)
  on conflict do nothing`,
    [json]
  );

  // precompute the time taken by each build step
  await pool.query(`
    update jenkins.build_steps steps
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
      from jenkins.build_steps
    ) s
    where steps.id = s.id and steps.duration is null
   `);

  const client = await pool.connect();
  try {
    await client.query(`
      begin;
      truncate table jenkins.terminal_build_steps_materialized;
      insert into jenkins.terminal_build_steps_materialized select * from jenkins.terminal_build_steps_with_duration;
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
