import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { run } from './github.dependabot';
import { getDependabotConfig } from '../github/graphql';

jest.mock('../github/graphql', () => ({ getDependabotConfig: jest.fn() }));

const mockGetDependabotConfig = getDependabotConfig as jest.MockedFunction<typeof getDependabotConfig>;

describe('github.dependabot', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = { query: (jest.fn() as any).mockResolvedValue({ rows: [] }) };
    jest.clearAllMocks();
  });

  test('run returns count of repos with dependabot or renovate configured', async () => {
    mockGetDependabotConfig.mockResolvedValue([
      {
        url: 'https://github.com/hmcts/a',
        name: 'a',
        dependabotv1: null,
        dependabotv2: { abbreviatedOid: 'abc' },
        renovate: null,
        renovateroot: null,
        dependabotv1main: null,
        dependabotv2main: null,
        renovatemain: null,
        renovatemainroot: null,
      },
      {
        url: 'https://github.com/hmcts/b',
        name: 'b',
        dependabotv1: null,
        dependabotv2: null,
        renovate: null,
        renovateroot: null,
        dependabotv1main: null,
        dependabotv2main: null,
        renovatemain: null,
        renovatemainroot: null,
      },
    ]);
    const result = await run(mockPool);
    expect(result).toBe('found 1 repos with dependabot or renovate config out of 2');
  });

  test('run returns 0 of 0 when no repos returned', async () => {
    mockGetDependabotConfig.mockResolvedValue([]);
    const result = await run(mockPool);
    expect(result).toBe('found 0 repos with dependabot or renovate config out of 0');
  });
});
