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

-- Recreate dropped view.
-- The last build steps of interest for each build.
-- Either the first failing step for unsuccessful builds or the last step for successful builds.
create or replace view jenkins.terminal_build_steps as
  select distinct on(correlation_id)
    id,
    correlation_id,
    current_step_name,
    current_build_current_result,
    stage_timestamp
  from jenkins.build_steps
  order by
     correlation_id,
     case
        -- Looking for the first unsuccessful step if present
        when current_build_current_result != 'SUCCESS' then 2147483647 -- Postgres integer max value
        -- Otherwise we take the last step
        else extract(epoch from stage_timestamp)::integer
     end desc,
     -- Tie breaker for unsuccessful steps so we get the first one that went wrong
     stage_timestamp asc,
     -- Tie breaker for steps with the same timestamp
     case current_step_name
        -- Ensure we get Pipeline Succeeded as the last step of successful builds
        when 'Pipeline Succeeded' then 1
        -- Ensure we do not get 'pipeline failed' as the last step of failed builds, but the step that actually went wrong.
        when 'Pipeline Failed' then 3
        else 2
     end asc;
