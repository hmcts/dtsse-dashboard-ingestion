-- Stores the names of jenkins build steps, of which there are a few dozen.
create table jenkins.step_names (
  step_id smallserial primary key,
  name varchar unique not null
);
insert into jenkins.step_names(name) select distinct(current_step_name) from jenkins.build_steps;

-- Replace the varchar step names with a foreign key to the step name table.
-- smallint is much faster than varchar for our analytics queries.
alter table jenkins.build_steps add column step_id smallint references jenkins.step_names(step_id);
update jenkins.build_steps s
  set step_id = names.step_id
  from jenkins.step_names names
  where current_step_name = names.name;

-- This view is being moved inline in jenkins.metrics.ts.
drop view jenkins.terminal_build_steps_with_duration;
-- This view depends on the old current_step_name column and must be recreated.
drop view jenkins.terminal_build_steps;
alter table jenkins.build_steps drop column current_step_name, alter column step_id set not null;
alter table jenkins.build_steps rename to steps;

create view jenkins.build_steps as
  select
    id,
    correlation_id,
    names.name as current_step_name,
    current_build_current_result,
    stage_timestamp,
    duration
  from jenkins.steps s join jenkins.step_names names using (step_id);

create index build_step_time on jenkins.steps (stage_timestamp);
-- Order the table chronologically on disk to improve table scan performance.
cluster jenkins.steps using build_step_time;
analyze;

-- Separate our implementation details from our public api.
create schema jenkins_impl;
alter table jenkins.builds set schema jenkins_impl;
alter table jenkins.step_names set schema jenkins_impl;
alter table jenkins.steps set schema jenkins_impl;
alter table jenkins.terminal_build_steps_materialized set schema jenkins_impl;
