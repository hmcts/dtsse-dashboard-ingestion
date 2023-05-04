create schema security;

create type security.cve_severity as enum ('none', 'low', 'medium', 'high', 'critical');
create table security.cves (
  cve_id serial primary key,
  severity security.cve_severity not null,
  name varchar unique not null
);

create table security.cve_reports(
  timestamp bigint not null,
  repo_id integer not null references github.repository(repo_id),
  cve_id integer not null references security.cves(cve_id),
  primary key (repo_id, timestamp, cve_id)
);


create view security.current_cves as (
 select
   g.id git_url,
   c.name,
   c.severity
  from security.cve_reports
    join security.cves c using(cve_id)
    join github.repository g using(repo_id)
);
