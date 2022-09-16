import { addTo } from '@hmcts/properties-volume';

const vault: Record<string, string> = {};
addTo(vault);

export const config = {
  appinsightsKey: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || vault['secrets.rse.AppInsightsConnectionString'],
  githubToken: process.env.GITHUB_TOKEN || vault['secrets.rse.github-token'],
};
