import { getMetrics } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const processCosmosResults = async (json: string) => {
  const client = await pool.connect();
  await client.query(
    `
  with builds as (
    insert into jenkins.builds
    select * from jsonb_populate_recordset(null::jenkins.builds, $1::jsonb)
    on conflict do nothing
  )
  insert into jenkins.build_steps
  select * from jsonb_populate_recordset(null::jenkins.build_steps, $1::jsonb)
  on conflict do nothing
  `,
    [json]
  );
  client.release();

  return [];
};

export const run = async () => {
  const items = await getMetrics();
  return processCosmosResults(items);
};

export default run;
