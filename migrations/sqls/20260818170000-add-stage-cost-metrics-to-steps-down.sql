drop view jenkins.build_steps;
create view jenkins.build_steps as
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

alter table jenkins_impl.steps
  drop column if exists stage_cost,
  drop column if exists vm_price_currency,
  drop column if exists vm_hourly_price,
  drop column if exists vm_region,
  drop column if exists vm_sku,
  drop column if exists stage_duration_ms;
