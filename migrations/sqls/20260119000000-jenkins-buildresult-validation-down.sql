-- Rollback migration: Remove validation documentation
DROP VIEW IF EXISTS jenkins.build_steps_with_null_results;

COMMENT ON COLUMN jenkins.build_steps.current_build_current_result IS NULL;
COMMENT ON TYPE jenkins.buildresult IS NULL;
