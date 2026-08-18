-- Agent attribution for build steps (agent lifetime/SKU/cost analysis).
-- node_name / node_labels have been published by cnp-jenkins-library's
-- MetricsPublisher all along; this surfaces them in the warehouse.
alter table jenkins_impl.steps
  add column if not exists node_name varchar,
  add column if not exists node_labels varchar;

-- Appending columns is allowed with create or replace view.
create or replace view jenkins.build_steps as
  select
    id,
    correlation_id,
    names.name as current_step_name,
    current_build_current_result,
    stage_timestamp,
    duration,
    node_name,
    node_labels
  from jenkins_impl.steps s join jenkins_impl.step_names names using (step_id);
