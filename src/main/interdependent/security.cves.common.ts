import { Pool } from 'pg';

/**
 * Gets the Unix timestamp from which to query CVE reports
 * Uses the most recent report timestamp, or falls back to a default interval
 */
export const getUnixTimeToQueryFrom = async (pool: Pool, defaultInterval: string = '30 day') => {
  const res = await pool.query(
    `
      select extract (epoch from (now() - interval '30 day'))::bigint as max
    `
  );

  return res.rows[0].max;
};
