import { Pool } from 'pg';
import { getCVEs } from '../jenkins/cosmos';

export const run = async (pool: Pool, cutoff: bigint) => {
  const items = await getCVEs(cutoff, 'java');
  await processJavaSuppressions(pool, items);
  return [];
};

export const processJavaSuppressions = async (pool: Pool, json: string) => {
  await pool.query(
    `
with suppressed_details as (
  select
    to_timestamp((e->>'_ts')::bigint) as timestamp,
    g.repo_id,
    s->>'name' as cve_name,
    d->>'fileName' as affected_package_name,
    s->>'notes' as notes,
    s->>'source' as source,
    -- CVSS v3
    (s->'cvssv3'->>'baseScore')::numeric as cvss_v3_base_score,
    s->'cvssv3'->>'baseSeverity' as cvss_v3_severity,
    -- Build CVSS v3 vector from individual components
    case 
      when s->'cvssv3' is not null then
        format('CVSS:3.1/AV:%s/AC:%s/PR:%s/UI:%s/S:%s/C:%s/I:%s/A:%s',
          substring(s->'cvssv3'->>'attackVector', 1, 1),
          substring(s->'cvssv3'->>'attackComplexity', 1, 1),
          substring(s->'cvssv3'->>'privilegesRequired', 1, 1),
          substring(s->'cvssv3'->>'userInteraction', 1, 1),
          substring(s->'cvssv3'->>'scope', 1, 1),
          substring(s->'cvssv3'->>'confidentialityImpact', 1, 1),
          substring(s->'cvssv3'->>'integrityImpact', 1, 1),
          substring(s->'cvssv3'->>'availabilityImpact', 1, 1)
        )
      else null
    end as cvss_v3_vector,
    -- CVSS v2
    (s->'cvssv2'->>'score')::numeric as cvss_v2_score,
    s->'cvssv2'->>'severity' as cvss_v2_severity,
    -- CWEs as array
    array(select jsonb_array_elements_text(s->'cwes')) as cwes,
    -- References as JSONB
    s->'references' as "references",
    -- Vulnerable software as JSONB
    s->'vulnerableSoftware' as vulnerable_software
  from
    jsonb_array_elements($1::jsonb) e
    left join github.repository g on 
      lower(regexp_replace(g.id, '\\.git$', '', 'i')) = lower(
        regexp_replace(
          regexp_replace(
            regexp_replace(e->'build'->>'git_url', '\\.git$', '', 'i'),
            '^git@github\\.com:', 'https://github.com/', 'i'),
            '^git://github\\.com/', 'https://github.com/', 'i')
      ),
    jsonb_array_elements(e->'report'->'dependencies') d,
    jsonb_array_elements(coalesce(d->'suppressedVulnerabilities', '[]'::jsonb)) s
  where s->>'name' is not null
),
matched_reports as (
  select 
    cve_report_id,
    sd.cve_name,
    sd.affected_package_name,
    sd.notes,
    sd.source,
    sd.cvss_v3_base_score,
    sd.cvss_v3_severity,
    sd.cvss_v3_vector,
    sd.cvss_v2_score,
    sd.cvss_v2_severity,
    sd.cwes,
    sd."references",
    sd.vulnerable_software,
    c.cve_id
  from suppressed_details sd
  join security.cve_report cr using (timestamp, repo_id)
  join security.cves c on c.name = sd.cve_name
)
-- Insert suppressions
insert into cve.suppressions(
  cve_report_id,
  cve_id,
  affected_package_name,
  notes,
  source,
  cvss_v3_base_score,
  cvss_v3_severity,
  cvss_v3_vector,
  cvss_v2_score,
  cvss_v2_severity,
  cwes,
  "references",
  vulnerable_software
)
select 
  cve_report_id,
  cve_id,
  affected_package_name,
  notes,
  source,
  cvss_v3_base_score,
  cvss_v3_severity,
  cvss_v3_vector,
  cvss_v2_score,
  cvss_v2_severity,
  cwes,
  "references",
  vulnerable_software
from matched_reports
on conflict do nothing`,
    [json]
  );

  return [];
};
