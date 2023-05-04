create schema security;

create type security.cve_severity as enum ('unknown', 'none', 'low', 'medium', 'high', 'critical');

create table security.cves (
  cve_id serial primary key,
  severity security.cve_severity not null,
  name varchar unique not null
);

-- We track CVE reports over time, using the cosmos db timestamp.
create table security.cve_reports(
  timestamp bigint not null, -- From cosmosdb, seconds since 1970.
  repo_id integer not null references github.repository(repo_id),
  cve_id integer not null references security.cves(cve_id),
  primary key (repo_id, timestamp, cve_id)
);

-- Gives us the view of current (most recent) CVE reports for each project.
create view security.current_cves as (
 select
   g.id git_url,
   c.name,
   c.severity
  from security.cve_reports
    join security.cves c using(cve_id)
    join github.repository g using(repo_id)
  where timestamp in (select max(timestamp) from security.cve_reports group by repo_id)
);
