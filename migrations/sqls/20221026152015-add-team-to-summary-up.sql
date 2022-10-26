drop view jenkins.build_summaries;
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

update team_jira_project set jira_project_id = 'RDM' where team_id = 'ccd';
update team_jira_project set jira_project_id = 'DTSBPS' where team_id = 'bsp';
