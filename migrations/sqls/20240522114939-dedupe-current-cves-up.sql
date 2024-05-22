-- Use cve report id rather than timestamp to identify the latest set of reports - timestamps may not be unique.
begin;
drop view security.current_cves;
create or replace view security.current_cves as (
   select
     g.team_id,
     g.id git_url,
     c.name,
     c.severity
   from security.cve_report
          join github.active_repository g using(repo_id)
          join security.cve_report_to_cves using (cve_report_id)
          join security.cves c using(cve_id)
   where cve_report_id in (select max(cve_report_id) from security.cve_report group by repo_id)
 );
commit;
