import { config } from '../config';

const CosmosClient = require('@azure/cosmos').CosmosClient;

const client = new CosmosClient({ endpoint: 'https://pipeline-metrics.documents.azure.com:443/', key: config.cosmosKey });

const database = client.database('jenkins');
const pipelineMetrics = database.container('pipeline-metrics');
const cveReports = database.container('cve-reports');
const perfReports = database.container('performance-metrics');

export const getMetrics = async (fromUnixtime: bigint) => {
  const querySpec = {
    query: `SELECT * from c where c._ts > ${fromUnixtime}`,
  };
  const { resources: items } = await pipelineMetrics.items.query(querySpec).fetchAll();
  // TODO: find an api that gives us a raw json string
  return JSON.stringify(items);
};

export const getCVEs = async (fromUnixtime: bigint) => {
  const querySpec = {
    query: `SELECT * from c where c._ts > ${fromUnixtime} and c.build.branch_name = "master"`,
  };
  const { resources: items } = await cveReports.items.query(querySpec).fetchAll();
  return JSON.stringify(items);
};

export const getGatlingReports = async (fromUnixtime: bigint) => {
  const querySpec = {
    query: `SELECT * from c
              where
                c._ts > ${fromUnixtime}
                and is_defined(c['stats.json'])`,
  };
  const { resources: items } = await perfReports.items.query(querySpec).fetchAll();
  // TODO: find an api that gives us a raw json string
  return JSON.stringify(items);
};
