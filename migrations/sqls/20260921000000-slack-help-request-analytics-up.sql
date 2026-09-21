CREATE SCHEMA IF NOT EXISTS slack;
CREATE TABLE slack.help_request_analytics_event (
  id text PRIMARY KEY,
  session_id text NOT NULL,
  user_id_hash text NOT NULL,
  step text NOT NULL,
  step_value text,
  source text NOT NULL,
  area text,
  ticket_key text,
  occurred_at timestamptz NOT NULL,
  source_ts bigint NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX help_request_analytics_event_occurred_at_idx ON slack.help_request_analytics_event (occurred_at);
CREATE INDEX help_request_analytics_event_source_ts_idx ON slack.help_request_analytics_event (source_ts);
CREATE INDEX help_request_analytics_event_step_idx ON slack.help_request_analytics_event (step);
