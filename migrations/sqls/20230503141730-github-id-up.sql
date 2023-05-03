-- Add an integer identifier for github repos for efficiency in tables that reference repositories
-- This will be automatically backfilled for existing rows.
alter table github.repository add column id_int serial unique not null;
