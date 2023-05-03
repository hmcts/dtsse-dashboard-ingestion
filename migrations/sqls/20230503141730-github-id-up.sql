-- Add an integer identifier for github repos for efficiency in tables that reference repositories
-- This will be automatically backfilled for existing rows.
alter table github.repository add column repo_id serial unique not null;
