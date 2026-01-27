import { Pool } from 'pg';
import { getCVEs } from '../jenkins/cosmos';
import { getUnixTimeToQueryFrom } from './security.cves.common';

export const run = async (pool: Pool) => {
  const items = await getCVEs(await getUnixTimeToQueryFrom(pool), 'node');
  await processCosmosNodeResults(pool, items);
  return [];
};

export const processCosmosNodeResults = async (pool: Pool, json: string) => {
  await pool.query(
    `
 with details as (
  select
    to_timestamp((e->>'_ts')::bigint) as timestamp,
    g.repo_id,
    vulns.name as name,
    vulns.description as description,
    vulns.affected_package as affected_package,
    vulns.affected_versions as affected_versions,
    lower(coalesce(vulns.severity, 'unknown'))::security.cve_severity severity,
    vulns.base_score
  from
    /* Go through each CVE report */
    jsonb_array_elements($1::jsonb) e
    left join github.repository g on lower(g.id) = lower(replace(e->'build'->>'git_url', '.git', ''))
   /* Pull out the CVE details for Node.js Yarn audit reports */
    left join lateral (
      select
        coalesce(cve, v->>'url') as name,
        replace(v->>'severity', 'moderate', 'medium') as severity,
        coalesce(v->>'title', 'none') as description,
        coalesce(v->>'module_name', 'none') as affected_package,
        coalesce(v->>'vulnerable_versions', 'none') as affected_versions,
        coalesce((v->'cvss'->>'score')::numeric)
      from
        jsonb_array_elements((e->'report'->'vulnerabilities') || (e->'report'->'suppressed')) v
        left join lateral jsonb_array_elements_text(v->'cves') cve on true
      where jsonb_typeof(v->'cves') = 'array'
    ) vulns on true -- record the report even if no CVEs found
)
,cves as (
  -- Insert or update CVEs with new fields (backfill mode)
  -- Use DISTINCT ON to pick one row per CVE name (most recent by timestamp)
  insert into security.cves(name, severity, base_score, description, affected_package, affected_versions)
  select distinct on (name) name, severity, base_score, description, affected_package, affected_versions
  from details
  where name is not null
  order by name, timestamp desc
  on conflict (name) do update set
    base_score = EXCLUDED.base_score,
    description = EXCLUDED.description,
    affected_package = EXCLUDED.affected_package,
    affected_versions = EXCLUDED.affected_versions,
    severity = EXCLUDED.severity
  returning *
), all_cves as (
  select * from cves union select * from security.cves
), reports as (
  -- Insert new reports (only for repos that match in database)
 insert into security.cve_report(timestamp, repo_id)
   select timestamp, repo_id from details d
     where repo_id is not null  -- Skip reports that don't match any repository
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
