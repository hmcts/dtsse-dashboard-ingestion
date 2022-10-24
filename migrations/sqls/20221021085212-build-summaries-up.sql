
create materialized view jenkins.terminal_build_steps as
  select distinct on(correlation_id)
    *
  from jenkins.build_steps
  order by
     correlation_id,
     case current_build_current_result
        when 'FAILURE' then 1
        when 'ABORTED' then 2
        when 'UNSTABLE' then 3
        when 'SUCCESS' then 2147483647 - extract(epoch from stage_timestamp)::integer
     end;

create view jenkins.build_summaries as
  select
    builds.*,
    steps.current_step_name as final_step_name,
    steps.current_build_current_result as result,
    steps.stage_timestamp as timestamp
   from
     jenkins.terminal_build_steps steps join jenkins.builds builds using(correlation_id)
  where
     current_build_current_result <> 'SUCCESS'
     or current_step_name = 'Pipeline Succeeded';
