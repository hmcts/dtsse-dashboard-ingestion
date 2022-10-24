-- The last build steps of interest for each build.
-- Either the first failing step for unsuccessful builds or the last step for successful builds.
create materialized view jenkins.terminal_build_steps as
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
     -- Tie breaker for steps with the same timestamp which happens at the end of a build;
     -- ensures we get Pipeline Succeeded as the last step in this case.
     case current_step_name
        when 'Pipeline Succeeded' then 1
        else 2
     end asc;


create index terminal_steps_time_result on jenkins.terminal_build_steps (stage_timestamp, current_build_current_result);

create view jenkins.build_summaries as
  select
    builds.*,
    steps.current_step_name as final_step_name,
    steps.current_build_current_result as result,
    steps.stage_timestamp as timestamp
   from
     jenkins.terminal_build_steps steps join jenkins.builds builds using(correlation_id)
  where
     -- Filter out any in progress builds
     current_build_current_result <> 'SUCCESS'
     or current_step_name = 'Pipeline Succeeded';
