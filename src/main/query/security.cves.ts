import { Pool } from 'pg';
import { getCVEs } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const run = async () => {
  const items = await getCVEs(await getUnixTimeToQueryFrom(pool));
  await processCosmosResults(items);
  return [];
};

const processCosmosResults = async (json: string) => {
  return await pool.query(
    `
   insert into security_impl.cves(name, severity) select 'CVE-1', 'low';
  `
    // , [json]
  );
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
