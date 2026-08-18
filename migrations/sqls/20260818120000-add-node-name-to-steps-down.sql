drop view jenkins.build_steps;
create view jenkins.build_steps as
  select
    id,
    correlation_id,
    names.name as current_step_name,
    current_build_current_result,
    stage_timestamp,
    duration
  from jenkins_impl.steps s join jenkins_impl.step_names names using (step_id);

alter table jenkins_impl.steps
  drop column if exists node_labels,
  drop column if exists node_name;
