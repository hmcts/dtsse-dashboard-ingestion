import { Pool } from 'pg';
import { getGatlingReports } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const run = async () => {
  const items = await getGatlingReports(await getUnixTimeToQueryFrom(pool));

  await processCosmosResults(items);
};

const processCosmosResults = async (json: string) => {
  await pool.query(
    `
with runs as (
   insert into gatling.runs
       select
         (j->>'id')::uuid,
         split_part(j->>'job_name', '/', 2),
         j->'branch_name',
         (j->>'stage_timestamp')::timestamp as timestamp
       from jsonb_array_elements($1::jsonb) j
   on conflict do nothing
)
insert into gatling.transactions
  select
    (el->>'id')::uuid as id,
    stat.value->>'name' as name,
    (stat.value->'stats'->'numberOfRequests'->'ok')::integer as ok_number_of_requests,
    (stat.value->'stats'->'numberOfRequests'->'ko')::integer as ko_number_of_requests,

    (stat.value->'stats'->'minResponseTime'->'ok')::integer as ok_min_response_time,
    (stat.value->'stats'->'minResponseTime'->'ko')::integer as ko_min_response_time,

    (stat.value->'stats'->'maxResponseTime'->'ok')::integer as ok_max_response_time,
    (stat.value->'stats'->'maxResponseTime'->'ko')::integer as ko_max_response_time,

    (stat.value->'stats'->'meanResponseTime'->'ok')::integer as ok_mean_response_time,
    (stat.value->'stats'->'meanResponseTime'->'ko')::integer as ko_mean_response_time,

    (stat.value->'stats'->'standardDeviation'->'ok')::integer as ok_standard_deviation,
    (stat.value->'stats'->'standardDeviation'->'ko')::integer as ko_standard_deviation
  from
    jsonb_array_elements($1::jsonb) el,
    jsonb_each(el->'stats.json'->'contents') stat
on conflict do nothing
  `,
    [json]
  );

  return [];
};

export const getUnixTimeToQueryFrom = async (pool: Pool) => {
  // Base off the last import time if available, otherwise the last month
  const res = await pool.query(`
    select extract(epoch from coalesce(
      max(timestamp),
      now() - interval '1 month')
    )::bigint as max
    from gatling.runs
  `);

  return res.rows[0].max;
};
