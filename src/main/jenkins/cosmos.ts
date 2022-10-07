import { config } from '../config';

const CosmosClient = require('@azure/cosmos').CosmosClient;

const client = new CosmosClient({ endpoint: 'https://pipeline-metrics.documents.azure.com:443/', key: config.cosmosKey });

const database = client.database('jenkins');
const container = database.container('pipeline-metrics');

const querySpec = {
  // Get everything modified in the last hour
  query: `SELECT * from c where c._ts > ${Date.now() / 1000 - 60 * 60}`,
};

export const getMetrics = async () => {
  const { resources: items } = await container.items.query(querySpec).fetchAll();
  return items;
};
