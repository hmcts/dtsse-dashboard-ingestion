CREATE SCHEMA IF NOT EXISTS github;

CREATE TABLE github.app_rate_limit (
  source_scope text NOT NULL,
  cosmos_id text NOT NULL,
  credential_id text NOT NULL,
  app_id text NOT NULL,
  jenkins_instance text NOT NULL,
  recorded_at timestamptz NOT NULL,
  resource text NOT NULL,
  limit_value bigint NOT NULL CHECK (limit_value >= 0),
  used bigint NOT NULL CHECK (used >= 0),
  remaining bigint NOT NULL CHECK (remaining >= 0),
  reset_at timestamptz NOT NULL,
  source_ts bigint NOT NULL CHECK (source_ts >= 0),
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_scope, cosmos_id, resource)
);

CREATE INDEX app_rate_limit_latest_idx
  ON github.app_rate_limit (jenkins_instance, credential_id, resource, recorded_at DESC);

CREATE INDEX app_rate_limit_recorded_at_idx
  ON github.app_rate_limit (recorded_at);

CREATE INDEX app_rate_limit_source_ts_idx
  ON github.app_rate_limit (source_scope, source_ts);
