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
    vulns.affected_package
  from
    /* Go through each CVE report */
    jsonb_array_elements($1::jsonb) e
    left join github.repository g on 
      -- Normalize both sides: remove .git suffix and convert to lowercase for comparison
      lower(regexp_replace(g.id, '\\.git$', '', 'i')) = lower(
        -- Normalize git URL to https://github.com/org/repo format
        regexp_replace(
          regexp_replace(
            regexp_replace(e->'build'->>'git_url', '\\.git$', '', 'i'),  -- Remove .git suffix
            '^git@github\\.com:', 'https://github.com/', 'i'),           -- Convert SSH to HTTPS
            '^git://github\\.com/', 'https://github.com/', 'i')          -- Convert git:// to https://
      )
   /* Pull out the CVE details for Java OWASP dependency check reports */
    left join lateral (
      select
        s->>'name' as name,
        coalesce(s->'cvssv3'->>'baseSeverity', s->'cvssv2'->>'severity') severity,
        coalesce((s->'cvssv3'->>'baseScore')::numeric, (s->'cvssv2'->>'score')::numeric) base_score,
        s->>'description' as description,
        d->>'fileName' as affected_package
      from
        jsonb_array_elements(e->'report'->'dependencies') d,
        jsonb_array_elements(coalesce(d->'suppressedVulnerabilities', '[]'::jsonb) || coalesce(d->'vulnerabilities', '[]'::jsonb)) s
    ) vulns on true -- record the report even if no CVEs found
)
,cves as (
  -- Insert or update CVEs with new fields (backfill mode)
  -- Use DISTINCT ON to pick one row per CVE name (most recent by timestamp)
  insert into security.cves(name, severity, base_score, description, affected_package)
  select distinct on (name) name, severity, base_score, description, affected_package 
  from details
  where name is not null
  order by name, timestamp desc

  on conflict (name) do update set
    base_score = EXCLUDED.base_score,
    description = EXCLUDED.description,
    affected_package = EXCLUDED.affected_package,
    severity = EXCLUDED.severity
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
  // TEMPORARY: Query last 3 months to backfill new CVE fields for existing records
  // TODO: Revert to normal after backfill completes
  const res = await pool.query(`
    select extract (epoch from (now() - interval '3 month'))::bigint as max
  `);

  return res.rows[0].max;

  // ORIGINAL CODE (restore after backfill):
  // const res = await pool.query(`
  //   select coalesce(
  //     extract (epoch from max(timestamp)),
  //     extract (epoch from (now() - interval '5 day'))
  //   )::bigint as max
  //   from security.cve_report
  // `);
  // return res.rows[0].max;
};
