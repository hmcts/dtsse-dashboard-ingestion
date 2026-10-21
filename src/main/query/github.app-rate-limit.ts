import { CosmosClient } from '@azure/cosmos';
import { config, getJenkinsDatabaseNames } from '../config';
import { pool } from '../db/store';

interface RateLimit {
  limit: number;
  used: number;
  remaining: number;
  reset: number;
}

interface RateLimitDocument {
  id: string;
  credential_id: string;
  app_id: string;
  jenkins_instance: string;
  recorded_at: string;
  resources: Record<string, RateLimit>;
  _ts: number;
}

const isNonNegativeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export const toRows = (item: RateLimitDocument, sourceScope: string) => {
  if (!item.id || !item.credential_id || !item.app_id || !item.jenkins_instance || !Number.isSafeInteger(item._ts) || item._ts < 0) {
    throw new Error('Invalid GitHub rate-limit document identity or timestamp');
  }

  const recordedAt = new Date(item.recorded_at);
  if (Number.isNaN(recordedAt.getTime())) {
    throw new Error(`Invalid recorded_at for Cosmos document ${item.id}`);
  }

  if (!item.resources || typeof item.resources !== 'object') {
    throw new Error(`Missing resources for Cosmos document ${item.id}`);
  }

  return Object.entries(item.resources).map(([resourceName, resource]) => {
    if (
      !resourceName ||
      !isNonNegativeInteger(resource.limit) ||
      !isNonNegativeInteger(resource.used) ||
      !isNonNegativeInteger(resource.remaining) ||
      !isNonNegativeInteger(resource.reset)
    ) {
      throw new Error(`Invalid ${resourceName} rate-limit data for Cosmos document ${item.id}`);
    }

    const resetAt = new Date(resource.reset * 1000);
    if (Number.isNaN(resetAt.getTime())) {
      throw new Error(`Invalid reset time for ${resourceName} in Cosmos document ${item.id}`);
    }

    return [
      sourceScope,
      item.id,
      item.credential_id,
      item.app_id,
      item.jenkins_instance,
      recordedAt,
      resourceName,
      resource.limit,
      resource.used,
      resource.remaining,
      resetAt,
      item._ts,
    ];
  });
};

export const run = async () => {
  if (!config.githubAppRateLimitsEnabled) {
    console.log('GitHub app rate-limit import disabled');
    return [];
  }

  if (!config.cosmosDbName || !config.cosmosKey) {
    throw new Error('COSMOS_DB_NAME and COSMOS_KEY are required to import GitHub app rate limits');
  }

  if (!config.jenkinsDatabases) {
    throw new Error('JENKINS_DATABASES is required to import GitHub app rate limits');
  }

  const databaseNames = getJenkinsDatabaseNames();
  if (databaseNames.length === 0) {
    throw new Error('JENKINS_DATABASES must contain at least one database name');
  }

  const cosmos = new CosmosClient({
    endpoint: `https://${config.cosmosDbName}.documents.azure.com:443/`,
    key: config.cosmosKey,
  });

  const client = await pool.connect();
  let rowCount = 0;

  try {
    await client.query('BEGIN');

    for (const databaseName of databaseNames) {
      const sourceScope = `${config.cosmosDbName}/${databaseName}/github-app-rate-limits`;

      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`github.app_rate_limit:${sourceScope}`]);

      const latestResult = await client.query('SELECT COALESCE(MAX(source_ts), 0) AS source_ts FROM github.app_rate_limit WHERE source_scope = $1', [
        sourceScope,
      ]);
      const latestTimestamp = Number(latestResult.rows[0]?.source_ts ?? 0);

      const container = cosmos.database(databaseName).container('github-app-rate-limits');
      const iterator = container.items.query<RateLimitDocument>(
        {
          query: 'SELECT * FROM c WHERE c._ts >= @since',
          parameters: [{ name: '@since', value: Math.max(0, latestTimestamp - 300) }],
        },
        { maxItemCount: 100 }
      );

      while (iterator.hasMoreResults()) {
        const { resources } = await iterator.fetchNext();

        for (const item of resources) {
          for (const row of toRows(item, sourceScope)) {
            await client.query(
              `INSERT INTO github.app_rate_limit (
                 source_scope, cosmos_id, credential_id, app_id, jenkins_instance,
                 recorded_at, resource, limit_value, used, remaining, reset_at, source_ts
               )
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               ON CONFLICT (source_scope, cosmos_id, resource) DO UPDATE SET
                 credential_id = EXCLUDED.credential_id,
                 app_id = EXCLUDED.app_id,
                 jenkins_instance = EXCLUDED.jenkins_instance,
                 recorded_at = EXCLUDED.recorded_at,
                 limit_value = EXCLUDED.limit_value,
                 used = EXCLUDED.used,
                 remaining = EXCLUDED.remaining,
                 reset_at = EXCLUDED.reset_at,
                 source_ts = EXCLUDED.source_ts,
                 imported_at = now()
               WHERE EXCLUDED.source_ts >= github.app_rate_limit.source_ts`,
              row
            );

            rowCount++;
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Imported ${rowCount} GitHub app rate-limit rows`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return [];
};
