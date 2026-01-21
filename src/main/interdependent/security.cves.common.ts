import { Pool } from 'pg';

/**
 * Gets the Unix timestamp from which to query CVE reports
 * Uses the most recent report timestamp, or falls back to a default interval
 */
export const getUnixTimeToQueryFrom = async (pool: Pool, defaultInterval: string = '5 day') => {
  const res = await pool.query(
    `
      select coalesce(
        extract (epoch from max(timestamp)),
        extract (epoch from (now() - $1::interval))
      )::bigint as max
      from security.cve_report
    `,
    [defaultInterval]
  );

  return res.rows[0].max;
};
