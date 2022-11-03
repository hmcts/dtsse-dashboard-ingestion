alter table gatling.transactions
  add column ok_percentiles_1 integer,
  add column ko_percentiles_1 integer,
  add column ok_percentiles_2 integer,
  add column ko_percentiles_2 integer,
  add column ok_percentiles_3 integer,
  add column ko_percentiles_3 integer,
  add column ok_percentiles_4 integer,
  add column ko_percentiles_4 integer;


-- Trigger re-fetch from cosmos to include the new fields.
truncate table gatling.transactions;

alter table gatling.transactions rename to transactions_raw;

create view gatling.transactions as
  select
    run_id,
    name,
    ok_number_of_requests as pass,
    ko_number_of_requests as fail,
    ok_min_response_time as min,
    ok_max_response_time as max,
    ok_mean_response_time as mean,
    ok_standard_deviation as stddev,
    ok_percentiles_1 as percentile50,
    ok_percentiles_2 as percentile75,
    ok_percentiles_3 as percentile95,
    ok_percentiles_4 as percentile99
  from gatling.transactions_raw;
