import { getMetrics } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const processCosmosResults = async (json: string) => {
  await pool.query(
    `
  with builds as (
    insert into jenkins.builds
    select * from jsonb_populate_recordset(null::jenkins.builds, $1::jsonb)
    on conflict do nothing
  )
  insert into jenkins.build_steps
  select * from jsonb_populate_recordset(null::jenkins.build_steps, $1::jsonb)
  on conflict do nothing`,
    [json]
  );

  return [];
};

export const getUnixTimeToQueryFrom = async () => {
  // Base off the last import time if available, otherwise an hour ago.
  const res = await pool.query(`
  select extract(epoch from max)::bigint max from (
    select max(stage_timestamp) - interval '1 minute' as max from jenkins.build_steps
    union select now() - interval '1 hour'
    order by max asc
  ) s
  `);

  return res.rows[0].max;
};

export const run = async () => {
  const items = await getMetrics(await getUnixTimeToQueryFrom());
  return processCosmosResults(items);
};

export default run;
