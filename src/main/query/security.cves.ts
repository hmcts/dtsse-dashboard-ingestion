import { Pool } from 'pg';
import { getCVEs } from '../jenkins/cosmos';
import { pool } from '../db/store';

export const run = async () => {
  const items = await getCVEs(await getUnixTimeToQueryFrom(pool));
  await processCosmosResults(items);
  return [];
};

const processCosmosResults = async (json: string) => {
  await pool.query(
    `
 with details as (
  select
    e->>'_ts' as timestamp,
    e->'build'->>'git_url' git_url,
    vulns.name,
    lower(vulns.severity)::security.cve_severity severity
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
        jsonb_array_elements(d->'suppressedVulnerabilities') s
      union all
      /* Yarn audit reports */
      select
        cve,
        /* Yarn audit uses 'moderate' which we translate to the cvss scale */
        replace(v->>'severity', 'moderate', 'medium')
      from
        jsonb_array_elements(e->'report'->'vulnerabilities') v,
        jsonb_array_elements_text(v->'cves') cve
      where jsonb_typeof(v->'cves') = 'array'
    ) vulns
)
,cves as (
  insert into security.cves(name, severity)
  select distinct name, severity from details
  where name not in (select name from security.cves)
  returning *
), all_cves as (
  select * from cves union select * from security.cves
)
insert into security.cve_reports
  select timestamp::bigint, repo_id, cve_id
from
  details d
  join github.repository g on g.id = lower(d.git_url)
  join all_cves c using (name)
   `,
    [json]
  );

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