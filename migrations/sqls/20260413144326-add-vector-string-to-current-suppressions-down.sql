-- -- Views do not support ALTER DROP COLUMN so remove the view and recreate with old columns
drop view if exists cve.current_suppressions;
create view cve.current_suppressions as
select
    g.id as git_url,
    g.short_name as repo_name,
    g.team_id,
    c.name as cve_name,
    c.severity,
    s.affected_package_name,
    s.notes,
    s.source,
    s.cvss_v3_base_score,
    s.cvss_v3_severity,
    s.cwes,
    cr.timestamp as report_timestamp,
    s.created_at
from cve.suppressions s
join security.cve_report cr using (cve_report_id)
join security.cves c using (cve_id)
join github.active_repository g using (repo_id)
where cve_report_id in (
    select max(cve_report_id) 
    from security.cve_report 
    group by repo_id
);