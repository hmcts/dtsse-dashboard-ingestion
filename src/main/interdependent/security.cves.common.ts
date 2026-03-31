import { Pool } from 'pg';

/**
 * Gets the Unix timestamp from which to query CVE reports
 * Uses the most recent report timestamp, or falls back to a default interval
 */
export const getUnixTimeToQueryFrom = async (pool: Pool, defaultInterval: string = '30 day') => {
  const forcedLookbackInterval = process.env.DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL;
  if (forcedLookbackInterval) {
    const res = await pool.query(
      `
        select extract(epoch from (now() - $1::interval))::bigint as max
      `,
      [forcedLookbackInterval]
    );

    return res.rows[0].max;
  }

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
