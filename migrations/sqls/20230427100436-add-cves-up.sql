create schema security_impl;

create type security_impl.cve_severity as enum ('none', 'low', 'medium', 'high', 'critical');
create table security_impl.cves (
  id serial primary key,
  name varchar unique not null,
  severity security_impl.cve_severity not null
);

-- create table cve_reports (
--   timestamp integer not null,
--
-- )
