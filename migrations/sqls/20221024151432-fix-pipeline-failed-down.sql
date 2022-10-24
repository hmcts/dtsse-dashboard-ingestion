drop view jenkins.terminal_build_steps cascade;
-- Placeholder restoration of preceding view version.
create materialized view jenkins.terminal_build_steps as select 1;
