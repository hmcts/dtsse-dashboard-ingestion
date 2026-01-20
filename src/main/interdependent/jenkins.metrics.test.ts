import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { processCosmosResults, getUnixTimeToQueryFrom, run } from './jenkins.metrics';
import { Pool } from 'pg';
import { getMetrics } from '../jenkins/cosmos';
import { validateBuildSteps } from '../jenkins/validation';

// Mock the cosmos module
jest.mock('../jenkins/cosmos', () => ({
  getMetrics: jest.fn(),
}));

// Mock the validation module
jest.mock('../jenkins/validation', () => ({
  validateBuildSteps: jest.fn(),
}));

const mockGetMetrics = getMetrics as jest.MockedFunction<typeof getMetrics>;
const mockValidateBuildSteps = validateBuildSteps as jest.MockedFunction<typeof validateBuildSteps>;

describe('jenkins.metrics unit tests', () => {
  let mockPool: any;
  let mockClient: any;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mockClient = {
      query: (jest.fn() as any).mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };

    mockPool = {
      query: (jest.fn() as any).mockResolvedValue({ rows: [] }),
      connect: (jest.fn() as any).mockResolvedValue(mockClient),
    };

    jest.clearAllMocks();
  });

  test('processCosmosResults should log validation summary when records are normalized', async () => {
    const testData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        correlation_id: 'abc-123',
        current_step_name: 'Build',
        current_build_current_result: 'NOT_BUILT',
        stage_timestamp: '2024-01-01T10:00:00Z',
        branch_name: 'main',
        build_number: '42',
        build_url: 'https://build.example.com/job/test/42/',
        git_commit: 'abc123',
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        correlation_id: 'abc-124',
        current_step_name: 'Test',
        current_build_current_result: 'SUCCESS',
        stage_timestamp: '2024-01-01T10:05:00Z',
        branch_name: 'main',
        build_number: '42',
        build_url: 'https://build.example.com/job/test/42/',
        git_commit: 'abc123',
      },
    ];

    mockValidateBuildSteps.mockReturnValueOnce({
      validatedRecords: testData,
      stats: { total: 2, normalized: 1, invalidValues: new Map() },
    });

    const json = JSON.stringify(testData);
    await processCosmosResults(mockPool, json);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[JENKINS INGESTION] Validated 2 records, normalized 1 invalid build results'
    );
  });

  test('processCosmosResults should not log validation summary when no records are normalized', async () => {
    const testData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        correlation_id: 'abc-123',
        current_step_name: 'Build',
        current_build_current_result: 'SUCCESS',
        stage_timestamp: '2024-01-01T10:00:00Z',
        branch_name: 'main',
        build_number: '42',
        build_url: 'https://build.example.com/job/test/42/',
        git_commit: 'abc123',
      },
    ];

    mockValidateBuildSteps.mockReturnValueOnce({
      validatedRecords: testData,
      stats: { total: 1, normalized: 0, invalidValues: new Map() },
    });

    const json = JSON.stringify(testData);
    await processCosmosResults(mockPool, json);

    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('[JENKINS INGESTION]'));
  });

  test('processCosmosResults should handle multiple normalized records', async () => {
    const testData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        correlation_id: 'abc-123',
        current_step_name: 'Build',
        current_build_current_result: 'NOT_BUILT',
        stage_timestamp: '2024-01-01T10:00:00Z',
        branch_name: 'main',
        build_number: '42',
        build_url: 'https://build.example.com/job/test/42/',
        git_commit: 'abc123',
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        correlation_id: 'abc-124',
        current_step_name: 'Test',
        current_build_current_result: 'INVALID_STATUS',
        stage_timestamp: '2024-01-01T10:05:00Z',
        branch_name: 'main',
        build_number: '43',
        build_url: 'https://build.example.com/job/test/43/',
        git_commit: 'def456',
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        correlation_id: 'abc-125',
        current_step_name: 'Deploy',
        current_build_current_result: 'SUCCESS',
        stage_timestamp: '2024-01-01T10:10:00Z',
        branch_name: 'main',
        build_number: '44',
        build_url: 'https://build.example.com/job/test/44/',
        git_commit: 'ghi789',
      },
    ];

    mockValidateBuildSteps.mockReturnValueOnce({
      validatedRecords: testData,
      stats: { total: 3, normalized: 2, invalidValues: new Map() },
    });

    const json = JSON.stringify(testData);
    await processCosmosResults(mockPool, json);

    expect(consoleLogSpy).toHaveBeenCalledWith('[JENKINS INGESTION] Validated 3 records, normalized 2 invalid build results');
  });

  test('getUnixTimeToQueryFrom should return max timestamp from database', async () => {
    const mockTimestamp = 1672531200; // 2023-01-01 00:00:00 UTC
    mockPool.query.mockResolvedValue({
      rows: [{ max: mockTimestamp }],
    } as any);

    const result = await getUnixTimeToQueryFrom(mockPool);

    expect(result).toBe(mockTimestamp);
    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('select extract(epoch from coalesce'));
  });

  test('run should query metrics and process results', async () => {
    const mockTimestamp = 1672531200;
    mockPool.query.mockResolvedValue({
      rows: [{ max: mockTimestamp }],
    } as any);

    const testData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        correlation_id: 'abc-123',
        current_step_name: 'Build',
        current_build_current_result: 'SUCCESS',
        stage_timestamp: '2024-01-01T10:00:00Z',
        branch_name: 'main',
        build_number: '42',
        build_url: 'https://build.example.com/job/test/42/',
        git_commit: 'abc123',
      },
    ];

    mockGetMetrics.mockResolvedValue(JSON.stringify(testData));
    mockValidateBuildSteps.mockReturnValueOnce({
      validatedRecords: testData,
      stats: { total: 1, normalized: 0, invalidValues: new Map() },
    });

    await run(mockPool);

    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('max(stage_timestamp)'));
    expect(mockGetMetrics).toHaveBeenCalledWith(mockTimestamp);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Querying Jenkins metrics from'));
  });
});
