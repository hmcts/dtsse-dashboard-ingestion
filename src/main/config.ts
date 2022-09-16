import { addTo } from '@hmcts/properties-volume';

const vault: Record<string, string> = {};
addTo(vault);

export const config = {
  appinsightsKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY || vault['secrets.rse.AppInsightsInstrumentationKey'],
  githubToken: process.env.GITHUB_TOKEN || vault['secrets.rse.github-token'],
};
