import { addTo } from '@hmcts/properties-volume';

const vault: Record<string, string> = {};
addTo(vault);

export const config = {
  appinsightsKey: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || vault['secrets.dtsse.AppInsightsConnectionString'],
  githubToken: process.env.GITHUB_TOKEN || vault['secrets.dtsse.github-token'],
  dbUrl: process.env.DATABASE_URL || vault['secrets.dtsse.db-url'],
};
