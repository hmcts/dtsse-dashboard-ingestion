import { Pool } from 'pg';
import { getCVEs } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const run = async () => {
  const items = await getCVEs(await getUnixTimeToQueryFrom(pool));
  await processCosmosResults(items);
  return [];
};

// CVE reports are stored into cosmos db by the CNP jenkins library.
// Two different tools are used to generate the reports; yarn audit (js) and owasp dependency check (java)
// Our cosmos query gives us these reports as an array of json objects
const processCosmosResults = async (json: string) => {
  await pool.query(
    `
 with details as (
  select
    e->>'_ts' as timestamp,
    e->'build'->>'git_url' git_url,
    vulns.name,
    lower(coalesce(vulns.severity, 'unknown'))::security.cve_severity severity
  from
    /* Go through each CVE report */
    jsonb_array_elements($1::jsonb) e,
    /* Pull out the CVE details for both Java and Node reports */
    lateral (
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
        cve,
        /* Yarn audit uses 'moderate' which we translate to the cvss scale */
        replace(v->>'severity', 'moderate', 'medium')
      from
        jsonb_array_elements((e->'report'->'vulnerabilities') || (e->'report'->'suppressed')) v,
        jsonb_array_elements_text(v->'cves') cve
      where jsonb_typeof(v->'cves') = 'array'
    ) vulns
)
,cves as (
  -- Insert any new CVEs
  insert into security.cves(name, severity)
  select distinct name, severity from details
  where name not in (select name from security.cves) -- Avoid (eventually) wrapping around the serial id
  on conflict do nothing
  returning *
), all_cves as (
  select * from cves union select * from security.cves
)
insert into security.cve_reports
  select timestamp::bigint, repo_id, cve_id
from
  details d
  -- left join so these inserts will fail fast if the join fails
  left join github.repository g on g.id = lower(replace(d.git_url, '.git', ''))
  left join all_cves c using (name)
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
      max(timestamp),
      extract (epoch from (now() - interval '5 day'))
    )::bigint as max
    from security.cve_reports
  `);

  return res.rows[0].max;
};
