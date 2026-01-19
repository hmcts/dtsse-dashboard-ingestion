/**
 * Integration tests for Jenkins validation
 * Simple tests without database mocking - just tests the validation logic directly
 */

import { describe, expect, test } from '@jest/globals';
import { validateBuildSteps } from './validation';

describe('Jenkins Validation Integration Tests', () => {
  describe('Real-world ccd-elastic-search scenario', () => {
    test('should handle NOT_BUILT from ccd-elastic-search', () => {
      const cosmosRecords = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          correlation_id: '660e8400-e29b-41d4-a716-446655440001',
          current_step_name: 'Declarative: Checkout SCM',
          current_build_current_result: 'NOT_BUILT',
          stage_timestamp: '2024-12-10T14:30:00Z',
          build_url: 'https://build.platform.hmcts.net/job/HMCTS_a_to_c/job/ccd-elastic-search/job/master/123/',
          branch_name: 'master',
          build_number: '123',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          correlation_id: '660e8400-e29b-41d4-a716-446655440001',
          current_step_name: 'Build',
          current_build_current_result: 'SUCCESS',
          stage_timestamp: '2024-12-10T14:35:00Z',
          build_url: 'https://build.platform.hmcts.net/job/HMCTS_a_to_c/job/ccd-elastic-search/job/master/123/',
          branch_name: 'master',
          build_number: '123',
        },
      ];

      const { validatedRecords, stats } = validateBuildSteps(cosmosRecords);
      const checkoutStep = validatedRecords.find((r: any) => r.current_step_name === 'Declarative: Checkout SCM');
      const buildStep = validatedRecords.find((r: any) => r.current_step_name === 'Build');

      expect(checkoutStep.current_build_current_result).toBeNull();
      expect(buildStep.current_build_current_result).toBe('SUCCESS');
      expect(stats.total).toBe(2);
      expect(stats.normalized).toBe(1);
    });
  });

  describe('Invalid enum value handling', () => {
    test('should normalize all types of invalid values', () => {
      const invalidValues = ['NOT_BUILT', 'SKIPPED', 'PENDING', 'IN_PROGRESS', 'UNKNOWN', 'CANCELLED', ''];
      const cosmosRecords = invalidValues.map((value, index) => ({
        id: `id-${index}`,
        correlation_id: `corr-${index}`,
        current_step_name: `Step ${index}`,
        current_build_current_result: value,
        stage_timestamp: '2024-12-10T14:30:00Z',
        build_url: `https://jenkins.test/job/test/${index}`,
      }));

      const { validatedRecords, stats } = validateBuildSteps(cosmosRecords);

      validatedRecords.forEach((record: any) => {
        expect(record.current_build_current_result).toBeNull();
      });
      expect(stats.normalized).toBe(invalidValues.length);
    });

    test('should preserve all valid enum values', () => {
      const validValues = ['SUCCESS', 'FAILURE', 'ABORTED', 'UNSTABLE'];
      const cosmosRecords = validValues.map((value, index) => ({
        id: `id-${index}`,
        correlation_id: `corr-${index}`,
        current_step_name: `Step ${index}`,
        current_build_current_result: value,
        stage_timestamp: '2024-12-10T14:30:00Z',
        build_url: `https://jenkins.test/job/test/${index}`,
      }));

      const { validatedRecords, stats } = validateBuildSteps(cosmosRecords);

      validValues.forEach(expectedValue => {
        const found = validatedRecords.find((r: any) => r.current_build_current_result === expectedValue);
        expect(found).toBeDefined();
      });
      expect(stats.normalized).toBe(0);
    });
  });

  describe('Performance', () => {
    test('should handle large batch efficiently', () => {
      const largeCosmosRecords = Array.from({ length: 1000 }, (_, i) => ({
        id: `id-${i}`,
        correlation_id: `corr-${i}`,
        current_step_name: `Step ${i}`,
        current_build_current_result: i % 10 === 0 ? 'NOT_BUILT' : 'SUCCESS',
        stage_timestamp: '2024-12-10T14:30:00Z',
        build_url: `https://jenkins.test/job/test/${i}`,
      }));

      const startTime = Date.now();
      const { validatedRecords, stats } = validateBuildSteps(largeCosmosRecords);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(validatedRecords).toHaveLength(1000);
      expect(stats.normalized).toBe(100);
    });
  });
});
