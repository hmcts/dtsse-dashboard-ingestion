
create view jenkins.build_summaries as
 select * from (
  select distinct on(correlation_id)
    correlation_id,
    stage_timestamp as timestamp,
    current_step_name as step,
    current_build_current_result as result
  from jenkins.build_steps
  order by
     correlation_id,
     case current_build_current_result
        when 'FAILURE' then 1
        when 'ABORTED' then 2
        when 'UNSTABLE' then 3
        when 'SUCCESS' then 2147483647 - extract(epoch from stage_timestamp)::integer
     end
  ) s
  where
     result <> 'SUCCESS'
     or step = 'Pipeline Succeeded';
