-- Add scheduled_time (when the build entered the Jenkins queue) and
-- started_time (when the build began executing on an agent, derived from
-- stage_timestamp - current_build_duration for the first step).
-- started_time is what Jenkins uses as the origin of "full run time" in the stage view.
alter table jenkins_impl.builds
  add column if not exists scheduled_time timestamp,
  add column if not exists started_time timestamp;

-- Recreate the view to expose the three timing metrics:
--   queue_time            : time waiting for an executor (started_time - scheduled_time)
--   execution_time        : active run time matching the Jenkins stage view "full run time"
--                           (terminal stage_timestamp - started_time)
--   user_experienced_duration : total elapsed time from trigger to completion
--                           (terminal stage_timestamp - scheduled_time)
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
    steps.duration,
    builds.scheduled_time,
    builds.started_time,
    builds.started_time - builds.scheduled_time as queue_time,
    steps.stage_timestamp - builds.started_time as execution_time,
    steps.stage_timestamp - builds.scheduled_time as user_experienced_duration
from jenkins_impl.terminal_build_steps_materialized steps
     join jenkins_impl.builds builds using (correlation_id)
     join github.repository repo using (repo_id)
  where steps.current_build_current_result <> 'SUCCESS'::jenkins.buildresult or steps.current_step_name::text = 'Pipeline Succeeded'::text;
