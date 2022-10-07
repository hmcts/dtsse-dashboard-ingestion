CREATE SCHEMA github;

CREATE TABLE IF NOT EXISTS github.open_pull_requests (
  "timestamp" TIMESTAMP NOT NULL,
  "repository" VARCHAR(255) NOT NULL,
  "url" VARCHAR(255) NOT NULL,
  "count" INT NOT NULL
);

CREATE TABLE IF NOT EXISTS github.long_open_pull_requests (
  "timestamp" TIMESTAMP NOT NULL,
  "team" VARCHAR(255) NOT NULL,
  "count" INT NOT NULL
);
