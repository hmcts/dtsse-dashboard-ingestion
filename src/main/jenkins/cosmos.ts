import { config } from '../config';

const CosmosClient = require('@azure/cosmos').CosmosClient;

const client = new CosmosClient({ endpoint: 'https://pipeline-metrics.documents.azure.com:443/', key: config.cosmosKey });

const database = client.database('jenkins');
const container = database.container('pipeline-metrics');

// query to return all items
const querySpec = {
  query: 'SELECT * from c order by c._ts desc offset 0 limit 10000',
};

export const getMetrics = async () => {
  const { resources: items } = await container.items.query(querySpec).fetchAll();
  return items;
};
