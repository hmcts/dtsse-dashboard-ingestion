// filepath: src/main/interdependent/security.cves.ts
import { Pool } from 'pg';
import { getCVEs } from '../jenkins/cosmos';

export const run = async (pool: Pool) => {
  const items = await getCVEs(await getUnixTimeToQueryFrom(pool));
  await processCosmosResults(pool, items);
  return [];
};

// CVE reports are stored into cosmos db by the CNP jenkins library.
// Two different tools are used to generate the reports; yarn audit (js) and owasp dependency check (java)
// Our cosmos query gives us these reports as an array of json objects
const processCosmosResults = async (pool: Pool, json: string) => {
  await pool.query(
    `
with details as (
  select
    to_timestamp((e->>'_ts')::bigint) as timestamp,
    g.repo_id,
    vulns.name,
    lower(coalesce(vulns.severity, 'unknown'))::security.cve_severity severity
  from
    jsonb_array_elements($1::jsonb) e
    left join github.repository g on lower(g.id) = lower(replace(e->'build'->>'git_url', '.git', ''))
    left join lateral (
      select
        s->>'name' as name,
        coalesce(s->'cvssv3'->>'baseSeverity', s->'cvssv2'->>'severity') severity
      from
        jsonb_array_elements(e->'report'->'dependencies') d,
        jsonb_array_elements(coalesce(d->'suppressedVulnerabilities', '[]'::jsonb) || coalesce(d->'vulnerabilities', '[]'::jsonb)) s
      union all
      select
        coalesce(cve, v->>'url'),
        replace(v->>'severity', 'moderate', 'medium')
      from
        jsonb_array_elements((e->'report'->'vulnerabilities') || (e->'report'->'suppressed')) v
        left join lateral jsonb_array_elements_text(v->'cves') cve on true
      where jsonb_typeof(v->'cves') = 'array'
    ) vulns on true
  where g.repo_id is not null
),
cves as (
  insert into security.cves(name, severity)
  select distinct name, severity from details
  where
      name is not null
      and name not in (select name from security.cves)
  on conflict do nothing
  returning *
),
all_cves as (
  select * from cves union select * from security.cves
),
report_inserts as (
  insert into security.cve_report(timestamp, repo_id)
  select timestamp, repo_id from details d
  where repo_id is not null
  group by 1, 2
  order by 1 asc
  on conflict do nothing
  returning *
)
insert into security.cve_report_to_cves
select cve_id, cve_report_id
from
  details d
  left join all_cves c using (name)
  left join report_inserts using (timestamp, repo_id)
where cve_id is not null and cve_report_id is not null
on conflict do nothing
  `,
    [json]
  );

  return [];
};

export const getUnixTimeToQueryFrom = async (pool: Pool) => {
  const res = await pool.query(`
    select coalesce(
      extract (epoch from max(timestamp)),
      extract (epoch from (now() - interval '5 day'))
    )::bigint as max
    from security.cve_report
  `);

  return res.rows[0].max;
};
