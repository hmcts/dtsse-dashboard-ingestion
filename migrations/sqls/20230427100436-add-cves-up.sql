create schema security;
create schema security_impl;

create type security.cve_severity as enum ('none', 'low', 'medium', 'moderate', 'high', 'critical');
create table security_impl.cves (
  id serial primary key,
  severity security.cve_severity not null,
  name varchar unique not null
);


create view security.current_cves as (select * from security_impl.cves);
-- create table cve_reports (
--   timestamp integer not null,
--
-- )
