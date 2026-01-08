import { Pool } from 'pg';
import { getCVEs } from '../jenkins/cosmos';

export const run = async (pool: Pool) => {
  const items = await getCVEs(await getUnixTimeToQueryFrom(pool));
  await processCosmosResults(pool, items);
  return [];
};

// CVE reports are stored into cosmos db by the CNP jenkins library.
// OWASP dependency check tool is used to generate the reports for Java apps
// Our cosmos query gives us these reports as an array of json objects
const processCosmosResults = async (pool: Pool, json: string) => {
  await pool.query(
    `
 with details as (
  select
    to_timestamp((e->>'_ts')::bigint) as timestamp,
    g.repo_id,
    vulns.name,
    lower(coalesce(vulns.severity, 'unknown'))::security.cve_severity severity,
    vulns.base_score,
    vulns.description,
    vulns.affected_package,
    vulns.affected_versions
  from
    /* Go through each CVE report */
    jsonb_array_elements($1::jsonb) e
    left join github.repository g on lower(g.id) = lower(replace(e->'build'->>'git_url', '.git', ''))
   /* Pull out the CVE details for Java OWASP dependency check reports */
    left join lateral (
      select
        s->>'name' as name,
        coalesce(s->'cvssv3'->>'baseSeverity', s->'cvssv2'->>'severity') severity,
        coalesce((s->'cvssv3'->>'baseScore')::numeric, (s->'cvssv2'->>'score')::numeric) base_score,
        s->>'description' as description,
        d->>'fileName' as affected_package,
        s->>'affectedVersions' as affected_versions
      from
        jsonb_array_elements(e->'report'->'dependencies') d,
        jsonb_array_elements(coalesce(d->'suppressedVulnerabilities', '[]'::jsonb) || coalesce(d->'vulnerabilities', '[]'::jsonb)) s
    ) vulns on true -- record the report even if no CVEs found
)
,cves as (
  -- Insert any new CVEs
  insert into security.cves(name, severity, base_score, description, affected_package, affected_versions)
  select distinct name, severity, base_score, description, affected_package, affected_versions from details
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
