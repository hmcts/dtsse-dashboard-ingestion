import { Pool } from 'pg';
import { getCVEs } from '../jenkins/cosmos';

export const run = async (pool: Pool, cutoff: bigint) => {
  const items = await getCVEs(cutoff, 'node');
  const count = JSON.parse(items)?.length ?? 0;
  await processNodeSuppressions(pool, items);
  return `processed ${count} Node CVE suppressions`;
};

export const processNodeSuppressions = async (pool: Pool, json: string) => {
  await pool.query(
    `
with suppressed_details as (
  select
    to_timestamp((e->>'_ts')::bigint) as timestamp,
    g.repo_id,
    coalesce(cve, v->>'url') as cve_name,
    v->>'module_name' as affected_package_name,
    v->>'title' as notes,
    'yarn-audit' as source,
    -- CVSS score if available
    (v->'cvss'->>'score')::numeric as cvss_v3_base_score,
    replace(v->>'severity', 'moderate', 'medium') as cvss_v3_severity,
    v->'cvss'->>'vector_string' as cvss_v3_vector,
    null::numeric as cvss_v2_score,
    null::varchar as cvss_v2_severity,
    -- CWEs as array
    array(select jsonb_array_elements_text(v->'cwe')) as cwes,
    -- References - yarn audit provides URL
    jsonb_build_array(
      jsonb_build_object(
        'url', v->>'url',
        'name', v->>'title'
      )
    ) as "references",
    -- Vulnerable versions information
    jsonb_build_array(
      jsonb_build_object(
        'module_name', v->>'module_name',
        'vulnerable_versions', v->>'vulnerable_versions',
        'patched_versions', v->>'patched_versions'
      )
    ) as vulnerable_software
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
    jsonb_array_elements(coalesce(e->'report'->'suppressed', '[]'::jsonb)) v
    left join lateral jsonb_array_elements_text(v->'cves') cve on true
  where 
    v is not null
    and (jsonb_typeof(v->'cves') = 'array' or v->>'url' is not null)
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
  where sd.cve_name is not null
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
