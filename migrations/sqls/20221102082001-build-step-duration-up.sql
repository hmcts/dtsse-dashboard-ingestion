CREATE VIEW jenkins.build_step_durations AS
  SELECT
    id,
    correlation_id,
    current_step_name,
    stage_timestamp,
    current_build_current_result,
    stage_timestamp - lag(stage_timestamp) OVER (PARTITION BY correlation_id ORDER BY stage_timestamp ASC) AS duration
  FROM jenkins.build_steps;
