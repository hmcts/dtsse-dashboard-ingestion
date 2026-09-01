import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { run } from './github.pull-request-reconcile';
import { listPR } from '../github/rest';

jest.mock('../github/rest', () => ({ listPR: jest.fn() }));

const mockListPR = listPR as jest.MockedFunction<typeof listPR>;

const paramsOf = (pool: any, fragment: string) => pool.query.mock.calls.find(([sql]: [string]) => sql.includes(fragment))?.[1];

const stale = (repo: string, number: number) => ({
  id: `https://api.github.com/repos/hmcts/${repo}/issues/${number}`,
  repo,
  number,
});

describe('github.pull-request-reconcile', () => {
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = { query: (jest.fn() as any).mockResolvedValue({ rows: [] }) };
  });

  test('returns early when nothing is stale', async () => {
    expect(await run(mockPool)).toBe('no stale open pull requests');
    expect(mockListPR).not.toHaveBeenCalled();
  });

  test('closes pull requests github reports as closed', async () => {
    mockPool.query = (jest.fn() as any).mockResolvedValue({ rows: [stale('em-stitching-api', 1994)] });
    mockListPR.mockResolvedValue({
      data: { state: 'closed', closed_at: '2024-01-23T10:31:16Z', merge_commit_sha: 'abc123' },
    } as any);

    expect(await run(mockPool)).toBe('reconciled 1 of 1 pull requests');

    expect(JSON.parse(paramsOf(mockPool, 'jsonb_to_recordset')[0])).toEqual([
      {
        id: 'https://api.github.com/repos/hmcts/em-stitching-api/issues/1994',
        state: 'closed',
        closed_at: '2024-01-23T10:31:16Z',
        commit_hash: 'abc123',
      },
    ]);
    expect(paramsOf(mockPool, 'reconciled_at = now()')[0]).toEqual(['https://api.github.com/repos/hmcts/em-stitching-api/issues/1994']);
  });

  test('leaves open pull requests alone but records the check', async () => {
    mockPool.query = (jest.fn() as any).mockResolvedValue({ rows: [stale('em-cron', 9)] });
    mockListPR.mockResolvedValue({ data: { state: 'open', closed_at: null } } as any);

    expect(await run(mockPool)).toBe('checked 1 pull requests, none closed');

    expect(paramsOf(mockPool, 'jsonb_to_recordset')).toBeUndefined();
    expect(paramsOf(mockPool, 'reconciled_at = now()')[0]).toEqual(['https://api.github.com/repos/hmcts/em-cron/issues/9']);
  });

  test('reports pull requests it could not check', async () => {
    mockPool.query = (jest.fn() as any).mockResolvedValue({ rows: [stale('em-test-helper', 668)] });
    mockListPR.mockRejectedValue(new Error('404'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(await run(mockPool)).toBe('checked 1 pull requests, none closed, 1 could not be checked');
    expect(paramsOf(mockPool, 'reconciled_at = now()')[0]).toEqual(['https://api.github.com/repos/hmcts/em-test-helper/issues/668']);
  });

  test('queries github with the repository from the id, not github.repository', async () => {
    mockPool.query = (jest.fn() as any).mockResolvedValue({ rows: [stale('em-native-pdf-annotator-app', 2818)] });
    mockListPR.mockResolvedValue({ data: { state: 'open', closed_at: null } } as any);

    await run(mockPool);

    expect(mockListPR).toHaveBeenCalledWith('em-native-pdf-annotator-app', 2818);
  });
});
