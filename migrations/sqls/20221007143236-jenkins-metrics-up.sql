create schema jenkins;

create type jenkins.BuildResult as enum ('ABORTED', 'FAILURE', 'SUCCESS', 'UNSTABLE');

create table jenkins.builds(
  "correlation_id" uuid primary key,
  "product" varchar not null,
  "branch_name" varchar not null,
  "component" varchar,
  "build_number" varchar not null,
  "git_url" varchar not null,
  "build_url" varchar not null
);

create table jenkins.build_steps(
  "id" uuid primary key,
  "correlation_id" uuid not null references jenkins.builds(correlation_id),
  "current_step_name" varchar not null,
  "current_build_current_result" jenkins.BuildResult,
  "stage_timestamp" timestamp not null
);
