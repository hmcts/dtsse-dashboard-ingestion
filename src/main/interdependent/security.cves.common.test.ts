import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { getUnixTimeToQueryFrom } from './security.cves.common';

describe('security.cves.common unit tests', () => {
  let mockPool: any;

  beforeEach(() => {
    delete process.env.DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL;

    mockPool = {
      query: (jest.fn() as any).mockResolvedValue({ rows: [] }),
    };
  });

  test('getUnixTimeToQueryFrom should query from max timestamp with default interval fallback', async () => {
    const mockTimestamp = BigInt(1672531200);
    mockPool.query.mockResolvedValue({ rows: [{ max: mockTimestamp }] } as any);

    const result = await getUnixTimeToQueryFrom(mockPool);

    expect(result).toBe(mockTimestamp);
    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('extract (epoch from max(timestamp))'), ['30 day']);
  });

  test('getUnixTimeToQueryFrom should use passed default interval when no env override is set', async () => {
    const mockTimestamp = BigInt(1672531200);
    mockPool.query.mockResolvedValue({ rows: [{ max: mockTimestamp }] } as any);

    await getUnixTimeToQueryFrom(mockPool, '150 day');

    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('extract (epoch from max(timestamp))'), ['150 day']);
  });

  test('getUnixTimeToQueryFrom should use forced lookback interval when configured', async () => {
    process.env.DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL = '30 day';
    const forcedTimestamp = BigInt(1711324800);
    mockPool.query.mockResolvedValue({ rows: [{ max: forcedTimestamp }] } as any);

    const result = await getUnixTimeToQueryFrom(mockPool, '150 day');

    expect(result).toBe(forcedTimestamp);
    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('now() - $1::interval'), ['30 day']);
  });
});
