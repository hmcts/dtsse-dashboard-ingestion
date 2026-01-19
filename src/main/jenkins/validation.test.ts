import { describe, expect, test, jest } from '@jest/globals';
import { normalizeBuildResult, validateBuildSteps, ValidBuildResult } from './validation';

describe('Jenkins validation utilities', () => {
  describe('normalizeBuildResult', () => {
    test('should pass through valid enum values unchanged', () => {
      expect(normalizeBuildResult('SUCCESS')).toBe('SUCCESS');
      expect(normalizeBuildResult('FAILURE')).toBe('FAILURE');
      expect(normalizeBuildResult('ABORTED')).toBe('ABORTED');
      expect(normalizeBuildResult('UNSTABLE')).toBe('UNSTABLE');
    });

    test('should handle case-insensitive valid values', () => {
      expect(normalizeBuildResult('success')).toBe('SUCCESS');
      expect(normalizeBuildResult('Failure')).toBe('FAILURE');
      expect(normalizeBuildResult('  ABORTED  ')).toBe('ABORTED');
    });

    test('should convert NOT_BUILT to null', () => {
      expect(normalizeBuildResult('NOT_BUILT')).toBeNull();
      expect(normalizeBuildResult('not_built')).toBeNull();
      expect(normalizeBuildResult('  NOT_BUILT  ')).toBeNull();
    });

    test('should handle null and undefined inputs', () => {
      expect(normalizeBuildResult(null)).toBeNull();
      expect(normalizeBuildResult(undefined)).toBeNull();
    });

    test('should convert unknown/invalid values to null', () => {
      expect(normalizeBuildResult('INVALID_STATUS')).toBeNull();
      expect(normalizeBuildResult('IN_PROGRESS')).toBeNull();
      expect(normalizeBuildResult('UNKNOWN')).toBeNull();
      expect(normalizeBuildResult('')).toBeNull();
    });

    test('should log context when normalizing invalid values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      normalizeBuildResult('NOT_BUILT', {
        correlation_id: '123e4567-e89b-12d3-a456-426614174000',
        build_url: 'https://build.example.com/job/test/42',
        step_name: 'Checkout'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('NOT_BUILT'),
        expect.objectContaining({
          correlation_id: '123e4567-e89b-12d3-a456-426614174000',
          raw_value: 'NOT_BUILT'
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('validateBuildSteps', () => {
    test('should validate array of build step records', () => {
      const records = [
        {
          id: '1',
          correlation_id: 'abc-123',
          current_step_name: 'Build',
          current_build_current_result: 'SUCCESS',
          stage_timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          correlation_id: 'abc-124',
          current_step_name: 'Test',
          current_build_current_result: 'FAILURE',
          stage_timestamp: '2024-01-01T10:05:00Z'
        }
      ];

      const { validatedRecords, stats } = validateBuildSteps(records);

      expect(validatedRecords).toHaveLength(2);
      expect(stats.total).toBe(2);
      expect(stats.normalized).toBe(0);
      expect(validatedRecords[0].current_build_current_result).toBe('SUCCESS');
      expect(validatedRecords[1].current_build_current_result).toBe('FAILURE');
    });

    test('should normalize NOT_BUILT values in records', () => {
      const records = [
        {
          id: '1',
          correlation_id: 'abc-123',
          current_step_name: 'Build',
          current_build_current_result: 'NOT_BUILT',
          stage_timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          correlation_id: 'abc-124',
          current_step_name: 'Test',
          current_build_current_result: 'SUCCESS',
          stage_timestamp: '2024-01-01T10:05:00Z'
        }
      ];

      const { validatedRecords, stats } = validateBuildSteps(records);

      expect(validatedRecords[0].current_build_current_result).toBeNull();
      expect(validatedRecords[1].current_build_current_result).toBe('SUCCESS');
      expect(stats.total).toBe(2);
      expect(stats.normalized).toBe(1);
      expect(stats.invalidValues.get('NOT_BUILT')).toBe(1);
    });

    test('should track multiple different invalid values', () => {
      const records = [
        {
          id: '1',
          correlation_id: 'abc-123',
          current_step_name: 'Build',
          current_build_current_result: 'NOT_BUILT',
          stage_timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          correlation_id: 'abc-124',
          current_step_name: 'Test',
          current_build_current_result: 'INVALID_STATUS',
          stage_timestamp: '2024-01-01T10:05:00Z'
        },
        {
          id: '3',
          correlation_id: 'abc-125',
          current_step_name: 'Deploy',
          current_build_current_result: 'NOT_BUILT',
          stage_timestamp: '2024-01-01T10:10:00Z'
        }
      ];

      const { validatedRecords, stats } = validateBuildSteps(records);

      expect(stats.normalized).toBe(3);
      expect(stats.invalidValues.get('NOT_BUILT')).toBe(2);
      expect(stats.invalidValues.get('INVALID_STATUS')).toBe(1);
      expect(validatedRecords.every(r => r.current_build_current_result === null)).toBe(true);
    });

    test('should log warning when invalid values are found', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const records = [
        {
          id: '1',
          correlation_id: 'abc-123',
          current_step_name: 'Build',
          current_build_current_result: 'NOT_BUILT',
          stage_timestamp: '2024-01-01T10:00:00Z'
        }
      ];

      validateBuildSteps(records);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should preserve other fields in records', () => {
      const records = [
        {
          id: '1',
          correlation_id: 'abc-123',
          current_step_name: 'Build',
          current_build_current_result: 'NOT_BUILT',
          stage_timestamp: '2024-01-01T10:00:00Z',
          build_url: 'https://example.com/build/1',
          custom_field: 'custom_value'
        }
      ];

      const { validatedRecords } = validateBuildSteps(records);

      expect(validatedRecords[0].id).toBe('1');
      expect(validatedRecords[0].correlation_id).toBe('abc-123');
      expect(validatedRecords[0].current_step_name).toBe('Build');
      expect(validatedRecords[0].stage_timestamp).toBe('2024-01-01T10:00:00Z');
      expect(validatedRecords[0].build_url).toBe('https://example.com/build/1');
      expect(validatedRecords[0].custom_field).toBe('custom_value');
    });

    test('should handle empty array', () => {
      const { validatedRecords, stats } = validateBuildSteps([]);

      expect(validatedRecords).toHaveLength(0);
      expect(stats.total).toBe(0);
      expect(stats.normalized).toBe(0);
    });
  });

  describe('Real-world scenario: ccd-elastic-search NOT_BUILT issue', () => {
    test('should handle the exact scenario that caused the outage', () => {
      // Simulate Cosmos data from ccd-elastic-search with NOT_BUILT status
      const cosmosData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          correlation_id: '660e8400-e29b-41d4-a716-446655440001',
          current_step_name: 'Declarative: Checkout SCM',
          current_build_current_result: 'NOT_BUILT',
          stage_timestamp: '2024-12-10T14:30:00Z',
          build_url: 'https://build.platform.hmcts.net/job/HMCTS_a_to_c/job/ccd-elastic-search/job/master/123/',
          branch_name: 'master',
          build_number: '123'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          correlation_id: '660e8400-e29b-41d4-a716-446655440001',
          current_step_name: 'Build',
          current_build_current_result: 'SUCCESS',
          stage_timestamp: '2024-12-10T14:35:00Z',
          build_url: 'https://build.platform.hmcts.net/job/HMCTS_a_to_c/job/ccd-elastic-search/job/master/123/',
          branch_name: 'master',
          build_number: '123'
        }
      ];

      const { validatedRecords, stats } = validateBuildSteps(cosmosData);

      // First record should have NULL instead of NOT_BUILT
      expect(validatedRecords[0].current_build_current_result).toBeNull();
      // Second record should remain SUCCESS
      expect(validatedRecords[1].current_build_current_result).toBe('SUCCESS');
      
      // Stats should reflect the normalization
      expect(stats.normalized).toBe(1);
      expect(stats.invalidValues.get('NOT_BUILT')).toBe(1);

      // This data can now be safely inserted into Postgres without enum violation
    });
  });
});
