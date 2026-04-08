import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { run } from './github.repository';
import { listRepos } from '../github/rest';

jest.mock('../github/rest', () => ({ listRepos: jest.fn() }));

const mockListRepos = listRepos as jest.MockedFunction<typeof listRepos>;

describe('github.repository', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = { query: (jest.fn() as any).mockResolvedValue({ rows: [] }) };
    jest.clearAllMocks();
  });

  test('run returns count of saved repositories', async () => {
    mockListRepos.mockResolvedValue(JSON.stringify([{ html_url: 'https://github.com/hmcts/a' }, { html_url: 'https://github.com/hmcts/b' }]));
    const result = await run(mockPool);
    expect(result).toBe('saved 2 repositories');
  });

  test('run returns 0 when no repositories returned', async () => {
    mockListRepos.mockResolvedValue(JSON.stringify([]));
    const result = await run(mockPool);
    expect(result).toBe('saved 0 repositories');
  });
});
