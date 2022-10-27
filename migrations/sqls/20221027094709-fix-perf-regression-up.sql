
create view jenkins.terminal_build_steps_with_duration as
  select
   steps.*,
   steps.stage_timestamp - first_step.stage_timestamp as duration
  from jenkins.terminal_build_steps steps
  join (
    select min(stage_timestamp) as stage_timestamp, correlation_id from jenkins.build_steps group by correlation_id
  ) first_step using (correlation_id);


-- Replace the materialized view with a regular table which will be easier to change in future.
drop materialized view jenkins.terminal_build_steps_materialized cascade;
create table jenkins.terminal_build_steps_materialized (
  like jenkins.build_steps including all,
  duration interval not null
);

create index terminal_steps_time_result on jenkins.terminal_build_steps_materialized(stage_timestamp, current_build_current_result);

create view jenkins.build_summaries as
  select
    builds.*,
    steps.current_step_name as final_step_name,
    steps.current_build_current_result as result,
    steps.stage_timestamp as timestamp,
    steps.duration
   from
     jenkins.terminal_build_steps_materialized steps join jenkins.builds builds using(correlation_id)
  where
     -- Filter out any in progress builds
     current_build_current_result <> 'SUCCESS'
     or current_step_name = 'Pipeline Succeeded';
