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
    /* Go through each CVE report */
    jsonb_array_elements($1::jsonb) e
    left join github.repository g on lower(g.id) = lower(replace(e->'build'->>'git_url', '.git', ''))
   /* Pull out the CVE details for both Java and Node reports */
    left join lateral (
      /* Java OWASP dependency check reports */
      select
        s->>'name' as name,
        coalesce(s->'cvssv3'->>'baseSeverity', s->'cvssv2'->>'severity') severity
      from
        jsonb_array_elements(e->'report'->'dependencies') d,
        jsonb_array_elements(coalesce(d->'suppressedVulnerabilities', '[]'::jsonb) || coalesce(d->'vulnerabilities', '[]'::jsonb)) s
      union all
      /* Yarn audit reports */
      select
        coalesce(cve, v->>'url'),
        /* Yarn audit uses 'moderate' which we translate to the cvss scale */
        replace(v->>'severity', 'moderate', 'medium')
      from
        jsonb_array_elements((e->'report'->'vulnerabilities') || (e->'report'->'suppressed')) v
        -- Vulnerability may not have CVE identifiers but if not should have an advisory url
        left join lateral jsonb_array_elements_text(v->'cves') cve on true
      where jsonb_typeof(v->'cves') = 'array'
    ) vulns on true -- record the report even if no CVEs found
)
,cves as (
  -- Insert any new CVEs
  insert into security.cves(name, severity)
  select distinct name, severity from details
  where
      name is not null
      and name not in (select name from security.cves) -- Avoid (eventually) wrapping around the serial id

  on conflict do nothing
  returning *
), all_cves as (
  select * from cves union select * from security.cves
), reports as (
  -- Insert new reports
 insert into security.cve_report(timestamp, repo_id)
   select timestamp, repo_id from details d
     group by 1, 2
     order by 1 asc
   on conflict do nothing
   returning *
 )
-- Insert new report to CVE mappings
insert into security.cve_report_to_cves
  select cve_id, cve_report_id
from
  details d
  left join all_cves c using (name)
  left join reports using (timestamp, repo_id)
  where cve_id is not null and cve_report_id is not null
on conflict do nothing
  `,
    [json]
  );

  return [];
};

export const getUnixTimeToQueryFrom = async (pool: Pool) => {
  // Base off the last import time if available, otherwise the last 12 months
  const res = await pool.query(`
    select coalesce(
      extract (epoch from max(timestamp)),
      extract (epoch from (now() - interval '5 day'))
    )::bigint as max
    from security.cve_report
  `);

  return res.rows[0].max;
};
