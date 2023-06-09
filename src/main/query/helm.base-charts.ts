import { Pool } from 'pg';
import { getHelmChartMetrics } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const run = async () => {
  const items = await getHelmChartMetrics(await getUnixTimeToQueryFrom(pool));
  await processCosmosResults(items);
  return [];
};

// CVE reports are stored into cosmos db by the CNP jenkins library.
// Two different tools are used to generate the reports; yarn audit (js) and owasp dependency check (java)
// Our cosmos query gives us these reports as an array of json objects
const processCosmosResults = async (json: string) => {
  console.log(json)
  await pool.query(`INSERT INTO helm.base_charts (namespace, deprecated_chart_count, team)
  SELECT bc.namespace, bc.deprecated_chart_count, COALESCE(twa.id, bc.namespace) AS id
  FROM json_populate_recordset(NULL::helm.base_charts, $1::JSON) AS bc
  LEFT JOIN team_with_alias AS twa ON bc.namespace = twa.alias
  ON CONFLICT (namespace, date)
  DO UPDATE SET deprecated_chart_count = EXCLUDED.deprecated_chart_count;`, [json]);

  return [];
};

export const getUnixTimeToQueryFrom = async (pool: Pool) => {
  // Base off the last import time if available, otherwise the last 5 days
  const res = await pool.query(`
    select coalesce(
      max(timestamp),
      extract (epoch from (now() - interval '2 day'))
    )::bigint as max
    from security.cve_reports
  `);

  return res.rows[0].max;
};
