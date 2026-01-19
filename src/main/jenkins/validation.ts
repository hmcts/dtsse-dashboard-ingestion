/**
 * Validation utilities for Jenkins data ingestion
 * 
 * Purpose: Prevent invalid enum values from breaking ingestion pipeline
 * Context: Ticket - Prevent invalid Jenkins build enum values (e.g. NOT_BUILT) from breaking ingestion
 */

export type ValidBuildResult = 'ABORTED' | 'FAILURE' | 'SUCCESS' | 'UNSTABLE';

const VALID_BUILD_RESULTS: Set<ValidBuildResult> = new Set(['ABORTED', 'FAILURE', 'SUCCESS', 'UNSTABLE']);

/**
 * Validates and normalizes Jenkins build result values
 * 
 * @param value - The raw build result value from Cosmos DB
 * @param context - Additional context for logging (e.g., correlation_id, build_url)
 * @returns A valid build result or null if the value is invalid
 * 
 * Mapping strategy:
 * - NOT_BUILT → null (build hasn't executed yet, no meaningful result)
 * - Invalid values → null (log warning, don't break ingestion)
 * - null/undefined → null (preserve existing behavior)
 * - Valid enums → pass through unchanged
 */
export const normalizeBuildResult = (
  value: string | null | undefined,
  context?: { correlation_id?: string; build_url?: string; step_name?: string }
): ValidBuildResult | null => {
  // Handle null/undefined - these are valid (build in progress)
  if (value === null || value === undefined) {
    return null;
  }

  const upperValue = value.toUpperCase().trim();

  // Check if it's a valid enum value
  if (VALID_BUILD_RESULTS.has(upperValue as ValidBuildResult)) {
    return upperValue as ValidBuildResult;
  }

  // Handle known invalid values
  if (upperValue === 'NOT_BUILT') {
    console.warn(
      `[VALIDATION] Encountered NOT_BUILT status - treating as null (build not executed)`,
      context ? { ...context, raw_value: value } : { raw_value: value }
    );
    return null;
  }

  // Unknown/invalid value - log warning and return null
  console.warn(
    `[VALIDATION] Invalid build result encountered: "${value}" - treating as null to prevent ingestion failure`,
    context ? { ...context, raw_value: value } : { raw_value: value }
  );

  return null;
};

/**
 * Validates an array of Jenkins build step records from Cosmos DB
 * 
 * @param records - Array of raw records from Cosmos
 * @returns Object containing validated records and validation statistics
 */
export const validateBuildSteps = (
  records: any[]
): {
  validatedRecords: any[];
  stats: {
    total: number;
    normalized: number;
    invalidValues: Map<string, number>;
  };
} => {
  const stats = {
    total: records.length,
    normalized: 0,
    invalidValues: new Map<string, number>(),
  };

  const validatedRecords = records.map(record => {
    const originalResult = record.current_build_current_result;
    const normalizedResult = normalizeBuildResult(originalResult, {
      correlation_id: record.correlation_id,
      build_url: record.build_url,
      step_name: record.current_step_name,
    });

    // Track if we normalized/changed the value
    if (originalResult !== normalizedResult) {
      stats.normalized++;

      // Track frequency of invalid values
      const invalidKey = originalResult ?? 'null';
      stats.invalidValues.set(invalidKey, (stats.invalidValues.get(invalidKey) || 0) + 1);
    }

    return {
      ...record,
      current_build_current_result: normalizedResult,
    };
  });

  // Log summary if we found issues
  if (stats.normalized > 0) {
    console.warn(`[VALIDATION] Normalized ${stats.normalized}/${stats.total} build results`, {
      invalid_values: Object.fromEntries(stats.invalidValues),
    });
  }

  return { validatedRecords, stats };
};
