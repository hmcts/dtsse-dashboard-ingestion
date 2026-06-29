import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { run } from './github.pull-request';
import { listPR, listUpTo100PRsSince } from '../github/rest';

jest.mock('../github/rest', () => ({
  listPR: jest.fn(),
  listUpTo100PRsSince: jest.fn(),
}));

const mockListPR = listPR as jest.MockedFunction<typeof listPR>;
const mockListUpTo100PRsSince = listUpTo100PRsSince as jest.MockedFunction<typeof listUpTo100PRsSince>;

const makePR = (url: string) => ({
  url,
  title: 'Test PR',
  number: 1,
  state: 'open',
  pull_request: { url, html_url: url },
  repository: { name: 'my-repo', archived: false, owner: { login: 'hmcts' } },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  closed_at: null,
  user: { login: 'testuser' },
  body: '',
  labels: [],
});

describe('github.pull-request', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: (jest.fn() as any).mockResolvedValue({ rows: [{ max: new Date() }] }),
    };
    mockListPR.mockResolvedValue({ data: { merge_commit_sha: null } } as any);
    jest.clearAllMocks();
  });

  test('run returns count of saved PRs', async () => {
    mockPool.query = (jest.fn() as any).mockResolvedValue({ rows: [{ max: new Date('2024-01-01') }] });
    mockListUpTo100PRsSince.mockResolvedValue([makePR('https://github.com/hmcts/my-repo/pull/1')] as any);
    mockListPR.mockResolvedValue({ data: { merge_commit_sha: null, changed_files: 1, additions: 1, deletions: 0 } } as any);
    const result = await run(mockPool);
    expect(result).toBe('saved 1 PRs');
  });

  test('run returns 0 when no matching PRs', async () => {
    mockPool.query = (jest.fn() as any).mockResolvedValue({ rows: [{ max: new Date('2024-01-01') }] });
    mockListUpTo100PRsSince.mockResolvedValue([] as any);
    const result = await run(mockPool);
    expect(result).toBe('saved 0 PRs');
  });
});
