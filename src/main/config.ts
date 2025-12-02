import { addTo } from '@hmcts/properties-volume';

// pg expects the password in the connection string to be encoded
const getConnectionString = (dbUrl: string): string => {
  const passwordIndex = dbUrl.indexOf(':', 11) + 1;

  return [
    dbUrl.substring(0, passwordIndex),
    encodeURIComponent(dbUrl.substring(passwordIndex, dbUrl.indexOf('@', passwordIndex))),
    dbUrl.substring(dbUrl.indexOf('@', passwordIndex)),
  ].join('');
};

const vault: Record<string, never> = {};
addTo(vault);

const unencodedDbUrl = process.env.DATABASE_URL || vault['secrets']?.['dtsse']?.['db-url'];
const encodedDbUrl = (process.env.DATABASE_URL = getConnectionString(unencodedDbUrl));

export const config = {
  appinsightsKey: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || vault['secrets']?.['dtsse']?.['AppInsightsConnectionString'],
  azureFinOpsConnectionString: process.env.AZURE_FINOPS_CONNECTION_STRING || vault['secrets']?.['dtsse']?.['azure-finops-connection-string'],
  jiraToken: process.env.JIRA_TOKEN || vault['secrets']?.['dtsse']?.['jira-token'],
  githubToken: process.env.GITHUB_TOKEN || vault['secrets']?.['dtsse']?.['github-token'],
  sonarToken: process.env.SONAR_TOKEN || vault['secrets']?.['dtsse']?.['sonar-token'],
  cosmosKey: process.env.COSMOS_KEY || vault['secrets']?.['dtsse']?.['cosmos-key'],
  cosmosDbName: process.env.COSMOS_DB_NAME || vault['secrets']?.['dtsse']?.['cosmos-db-name'],
  jenkinsDatabases: process.env.JENKINS_DATABASES || vault['secrets']?.['dtsse']?.['jenkins-databases'],
  snowUsername: process.env.SNOW_USERNAME || vault['secrets']?.['dtsse']?.['snow-username'],
  snowPassword: process.env.SNOW_PASSWORD || vault['secrets']?.['dtsse']?.['snow-password'],
  dbUrl: encodedDbUrl,
};

// Helper to get jenkins database names as array
export const getJenkinsDatabaseNames = (): string[] => {
  return config.jenkinsDatabases.split(',').map(name => name.trim());
};
