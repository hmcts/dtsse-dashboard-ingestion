-- Per-stage VM cost metrics published by cnp-jenkins-library's MetricsPublisher
-- (stage_duration_ms, vm_sku, vm_region, vm_hourly_price, vm_price_currency, stage_cost).
-- All nullable: whole-pipeline-level events (e.g. "Pipeline Succeeded") do not carry
-- a stage duration and so never populate these fields, by design.
alter table jenkins_impl.steps
  add column if not exists stage_duration_ms bigint,
  add column if not exists vm_sku varchar,
  add column if not exists vm_region varchar,
  add column if not exists vm_hourly_price numeric,
  add column if not exists vm_price_currency varchar,
  add column if not exists stage_cost numeric;

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
    node_labels,
    stage_duration_ms,
    vm_sku,
    vm_region,
    vm_hourly_price,
    vm_price_currency,
    stage_cost
  from jenkins_impl.steps s join jenkins_impl.step_names names using (step_id);
