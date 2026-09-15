import { CosmosClient } from '@azure/cosmos';
import { config } from '../config';
import { pool } from '../db/store';

interface HelpRequest {
  id: string;
  key?: string;
  created_at?: string;
  closed_at?: string;
  status?: string;
  resolution_type?: string;
  resolution_sub_type?: string;
  ticket_type?: string;
  _ts: number;
}

const nullableText = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null);

export const toRow = (item: HelpRequest) => {
  if (!item.id || !Number.isSafeInteger(item._ts) || item._ts < 0) throw new Error('Invalid Cosmos document identity or timestamp');
  const createdAt = item.created_at ? new Date(item.created_at) : null;
  if (createdAt && Number.isNaN(createdAt.getTime())) throw new Error(`Invalid created_at for Cosmos document ${item.id}`);
  const closedAt = item.closed_at ? new Date(item.closed_at) : null;
  if (closedAt && Number.isNaN(closedAt.getTime())) throw new Error(`Invalid closed_at for Cosmos document ${item.id}`);
  return [
    item.id,
    nullableText(item.key),
    createdAt,
    closedAt,
    nullableText(item.status),
    nullableText(item.resolution_type),
    nullableText(item.resolution_sub_type),
    nullableText(item.ticket_type),
    item._ts,
  ];
};

export const run = async () => {
  if (!config.slackCosmosKey) throw new Error('SLACKBOT_COSMOS_KEY or the slackbot-cosmos-key vault secret is required');
  const cosmos = new CosmosClient({ endpoint: `https://${config.slackCosmosAccountName}.documents.azure.com:443/`, key: config.slackCosmosKey });
  const container = cosmos.database(config.slackCosmosDatabase).container(config.slackCosmosContainer);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize runs so the cutoff only advances with committed ticket updates.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('slack.help_request'))");
    const result = await client.query('SELECT COALESCE(MAX(source_ts), 0) AS source_ts FROM slack.help_request');
    const latest = Number(result.rows[0]?.source_ts ?? 0);
    const iterator = container.items.query<HelpRequest>(
      {
        query:
          'SELECT c.id, c.key, c.created_at, c.closed_at, c.status, c.resolution_type, c.resolution_sub_type, c.ticket_type, c._ts FROM c WHERE c._ts >= @since',
        parameters: [{ name: '@since', value: Math.max(0, latest - 300) }],
      },
      { maxItemCount: 100 }
    );
    let count = 0;
    while (iterator.hasMoreResults()) {
      const { resources } = await iterator.fetchNext();
      for (const item of resources) {
        await client.query(
          `INSERT INTO slack.help_request (id, ticket_key, created_at, closed_at, status, category, subcategory, ticket_type, source_ts)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             ticket_key = EXCLUDED.ticket_key, created_at = EXCLUDED.created_at,
             closed_at = EXCLUDED.closed_at, status = EXCLUDED.status,
             category = EXCLUDED.category, subcategory = EXCLUDED.subcategory,
             ticket_type = EXCLUDED.ticket_type, source_ts = EXCLUDED.source_ts, imported_at = now()
           WHERE EXCLUDED.source_ts >= slack.help_request.source_ts`,
          toRow(item)
        );
        count++;
      }
    }
    await client.query('COMMIT');
    console.log(`Imported ${count} Slack help requests`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return [];
};
