begin;
-- Normalise the existing cve_reports table into a cve_report table and a report_to_cves joining table
create table security.cve_report(
    cve_report_id serial primary key,
    timestamp timestamp not null,
    repo_id integer not null references github.repository(repo_id),
    unique (timestamp, repo_id)
);

insert into security.cve_report(repo_id, timestamp)
select repo_id, to_timestamp(timestamp)
from security.cve_reports
group by 1, 2
order by 2 asc;

create table security.cve_report_to_cves (
    cve_id integer not null references security.cves(cve_id),
    cve_report_id integer not null references security.cve_report(cve_report_id),
    unique (cve_report_id, cve_id)
);

insert into security.cve_report_to_cves
select cve_id, cve_report_id from security.cve_reports r join security.cve_report r2 on to_timestamp(r.timestamp) = r2.timestamp and r.repo_id = r2.repo_id;

drop table security.cve_reports cascade;

-- Recreate this view based on the new schema
create view security.current_cves as (
   select
     g.id git_url,
     c.name,
     c.severity
   from security.cve_report
          join security.cve_report_to_cves using (cve_report_id)
          join security.cves c using(cve_id)
          join github.repository g using(repo_id)
   where timestamp in (select max(timestamp) from security.cve_report group by repo_id)
 );

commit;
