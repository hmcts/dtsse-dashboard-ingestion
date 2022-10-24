-- Cannot modify a materialized view, can only drop and recreate it.
drop materialized view jenkins.terminal_build_steps cascade;


-- The last build steps of interest for each build.
-- Either the first failing step for unsuccessful builds or the last step for successful builds.
create view jenkins.terminal_build_steps as
  select distinct on(correlation_id)
    *
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


create materialized view jenkins.terminal_build_steps_materialized as select * from jenkins.terminal_build_steps;

create index terminal_steps_time_result on jenkins.terminal_build_steps_materialized (stage_timestamp, current_build_current_result);

create view jenkins.build_summaries as
  select
    builds.*,
    steps.current_step_name as final_step_name,
    steps.current_build_current_result as result,
    steps.stage_timestamp as timestamp
   from
     jenkins.terminal_build_steps_materialized steps join jenkins.builds builds using(correlation_id)
  where
     -- Filter out any in progress builds
     current_build_current_result <> 'SUCCESS'
     or current_step_name = 'Pipeline Succeeded';
