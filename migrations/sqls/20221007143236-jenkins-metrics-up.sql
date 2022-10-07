create schema jenkins;

create type jenkins.BuildResult as enum ('ABORTED', 'FAILURE', 'SUCCESS', 'UNSTABLE');

create table jenkins.metrics(
  "id" uuid primary key,
  "product" varchar not null,
  "branch_name" varchar not null,
  "correlation_id" uuid not null,
  "component" varchar not null,
  "build_number" varchar not null,
  "build_url" varchar not null,
  "current_step_name" varchar not null,
  "current_build_current_result" jenkins.BuildResult,
  "timestamp" timestamp not null
);
