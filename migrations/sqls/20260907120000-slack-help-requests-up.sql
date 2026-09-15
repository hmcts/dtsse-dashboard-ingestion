CREATE SCHEMA IF NOT EXISTS slack;
CREATE TABLE slack.help_request (
  id text PRIMARY KEY,
  ticket_key text,
  created_at timestamptz,
  closed_at timestamptz,
  status text,
  category text,
  subcategory text,
  ticket_type text,
  source_ts bigint NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX help_request_created_at_idx ON slack.help_request (created_at);
CREATE INDEX help_request_closed_at_idx ON slack.help_request (closed_at);
CREATE INDEX help_request_source_ts_idx ON slack.help_request (source_ts);
