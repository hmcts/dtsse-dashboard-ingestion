alter table jenkins_impl.builds
  drop column if exists scheduled_time,
  drop column if exists started_time;

drop view jenkins.build_summaries;
create view jenkins.build_summaries as
select builds.correlation_id,
    repo_id,
    repo.team_id,
    builds.branch_name,
    builds.build_number,
    builds.build_url,
    builds.git_commit,
    builds.shared_library_name,
    builds.shared_library_version,
    build_url like '%Nightly%' is_nightly,
    steps.current_step_name as final_step_name,
    steps.current_build_current_result as result,
    steps.stage_timestamp as "timestamp",
    steps.duration
from jenkins_impl.terminal_build_steps_materialized steps
     join jenkins_impl.builds builds using (correlation_id)
     join github.repository repo using (repo_id)
  where steps.current_build_current_result <> 'SUCCESS'::jenkins.buildresult or steps.current_step_name::text = 'Pipeline Succeeded'::text;
