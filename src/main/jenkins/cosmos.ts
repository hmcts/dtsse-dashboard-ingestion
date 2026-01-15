import { config, getJenkinsDatabaseNames } from '../config';

const CosmosClient = require('@azure/cosmos').CosmosClient;

const client = new CosmosClient({
  endpoint: `https://${config.cosmosDbName}.documents.azure.com:443/`,
  key: config.cosmosKey,
});

// Create connections for all jenkins databases
const createJenkinsConnections = () => {
  const dbNames = getJenkinsDatabaseNames();
  return dbNames.map(dbName => ({
    name: dbName,
    database: client.database(dbName),
    pipelineMetrics: client.database(dbName).container('pipeline-metrics'),
    cveReports: client.database(dbName).container('cve-reports'),
    perfReports: client.database(dbName).container('performance-metrics'),
  }));
};

const jenkinsConnections = createJenkinsConnections();

// Keep platform-metrics exactly as is
const platformDatabase = client.database('platform-metrics');
const helmchartMetrics = platformDatabase.container('app-helm-chart-metrics');

export const getMetrics = async (fromUnixtime: bigint) => {
  // Fetch Jenkins metrics from all configured databases
  // Repeated runs will bring the data up to date.
  // Any duplicated data will be ignored with `on conflict do nothing`.
  let allItems: any[] = [];

  for (const connection of jenkinsConnections) {
    const querySpec = {
      query: `SELECT * from c where c._ts >= ${fromUnixtime} order by c._ts asc offset 0 limit 25000`,
    };
    const { resources: items } = await connection.pipelineMetrics.items.query(querySpec).fetchAll();
    console.log(`Processing ${items.length} Jenkins metrics from database: ${connection.name}`);
    allItems = allItems.concat(items);
  }

  // TODO: find an api that gives us a raw json string
  return JSON.stringify(allItems);
};

export const getCVEs = async (fromUnixtime: bigint) => {
  let allItems: any[] = [];

  for (const connection of jenkinsConnections) {
    const querySpec = {
      // TEMPORARY: Increased limit from 200 to 2000 for backfill of CVE enhanced fields
      // TODO: Revert to limit 200 after backfill completes
      query: `SELECT * from c where c._ts >= ${fromUnixtime} and c.build.branch_name = "master" and c.build.codebase_type = "java" order by c._ts asc offset 0 limit 2000`,
    };
    const { resources: items } = await connection.cveReports.items.query(querySpec).fetchAll();
    allItems = allItems.concat(items);
  }

  return JSON.stringify(allItems);
};

export const getGatlingReports = async (fromUnixtime: bigint) => {
  let allItems: any[] = [];

  for (const connection of jenkinsConnections) {
    const querySpec = {
      query: `SELECT * from c
                where
                  c._ts > ${fromUnixtime}
                  and is_defined(c['stats.json'])`,
    };
    const { resources: items } = await connection.perfReports.items.query(querySpec).fetchAll();
    allItems = allItems.concat(items);
  }

  // TODO: find an api that gives us a raw json string
  return JSON.stringify(allItems);
};

export const getHelmChartMetrics = async (fromUnixtime: bigint) => {
  const querySpec = {
    query: `SELECT c.namespace, COUNT(1) AS deprecated_chart_count
    FROM (
        SELECT DISTINCT c.namespace, c.chartName
        FROM c
        WHERE c.isDeprecated = "true"
        AND c._ts > ${fromUnixtime}
    ) c
    GROUP BY c.namespace
    `,
  };
  const { resources: items } = await helmchartMetrics.items.query(querySpec).fetchAll();
  return JSON.stringify(items);
};
