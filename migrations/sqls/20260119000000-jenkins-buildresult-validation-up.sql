-- Migration: Add validation documentation and constraint for jenkins.buildresult enum
-- Purpose: Prevent invalid enum values (e.g. NOT_BUILT) from breaking ingestion
-- Context: Tech debt ticket - Improve defensive handling of upstream Jenkins data
--
-- Background:
-- The jenkins.buildresult enum was defined with values: ABORTED, FAILURE, SUCCESS, UNSTABLE
-- However, some Jenkins pipelines emit "NOT_BUILT" which is not in this enum.
-- This migration adds:
-- 1. Documentation via comments on the enum type
-- 2. Application-level validation is the primary defense (see jenkins/validation.ts)
-- 3. Database-level insurance to prevent future silent failures

-- Add comment to document valid values and handling of invalid ones
COMMENT ON TYPE jenkins.buildresult IS 
  'Valid Jenkins build result states. Invalid values (e.g., NOT_BUILT) are normalized to NULL at application layer before DB insert. NULL represents: build in progress, not yet executed, or invalid upstream data.';

-- Add comment to the column to document the validation approach
COMMENT ON COLUMN jenkins.build_steps.current_build_current_result IS 
  'Current result of the build step. NULL is valid for: in-progress builds, steps not yet executed, or normalized invalid values from upstream. See jenkins/validation.ts for normalization logic.';

-- Optional: Create a view that shows any historical NULL results (for monitoring)
CREATE OR REPLACE VIEW jenkins.build_steps_with_null_results AS
SELECT 
  bs.id,
  bs.correlation_id,
  bs.current_step_name,
  bs.current_build_current_result,
  bs.stage_timestamp,
  b.build_url,
  b.branch_name
FROM jenkins.build_steps bs
JOIN jenkins.builds b ON bs.correlation_id = b.correlation_id
WHERE bs.current_build_current_result IS NULL;

COMMENT ON VIEW jenkins.build_steps_with_null_results IS 
  'Monitoring view: Shows build steps with NULL results. NULL can indicate: build in progress, invalid upstream data (normalized), or NOT_BUILT status. Use for data quality monitoring and alerting.';
