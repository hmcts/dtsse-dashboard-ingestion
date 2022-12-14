create schema gatling;

create table gatling.runs(
  run_id uuid primary key,
  project varchar not null,
  branch_name varchar not null,
  timestamp timestamp not null
);

-- A 'transaction' represents a type of request, eg. an endpoint URL
create table gatling.transactions(
  run_id uuid not null references gatling.runs(run_id),
  name varchar not null,
  ok_number_of_requests integer not null,
  ko_number_of_requests integer not null,
  ok_min_response_time integer not null,
  ko_min_response_time integer not null,
  ok_max_response_time integer not null,
  ko_max_response_time integer not null,
  ok_mean_response_time integer not null,
  ko_mean_response_time integer not null,
  ok_standard_deviation integer not null,
  ko_standard_deviation integer not null,

  unique(run_id, name)
);
