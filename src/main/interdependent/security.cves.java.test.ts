import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { run } from './security.cves.java';
import { getCVEs } from '../jenkins/cosmos';

jest.mock('../jenkins/cosmos', () => ({ getCVEs: jest.fn() }));

const mockGetCVEs = getCVEs as jest.MockedFunction<typeof getCVEs>;

describe('security.cves.java', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = { query: (jest.fn() as any).mockResolvedValue({ rows: [] }) };
    jest.clearAllMocks();
  });

  test('run returns count of processed Java CVE reports', async () => {
    mockGetCVEs.mockResolvedValue(JSON.stringify([{ id: 1 }, { id: 2 }]));
    const result = await run(mockPool, 0n);
    expect(result).toBe('processed 2 Java CVE reports');
  });

  test('run returns 0 when items is empty array', async () => {
    mockGetCVEs.mockResolvedValue(JSON.stringify([]));
    const result = await run(mockPool, 0n);
    expect(result).toBe('processed 0 Java CVE reports');
  });

  test('run returns 0 when items parses to null', async () => {
    mockGetCVEs.mockResolvedValue(JSON.stringify(null));
    const result = await run(mockPool, 0n);
    expect(result).toBe('processed 0 Java CVE reports');
  });
});
