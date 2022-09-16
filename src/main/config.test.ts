import { describe, expect, jest, test } from '@jest/globals';
process.env.GITHUB_TOKEN = 'test';

describe('config', () => {
  const addTo = jest.fn(conf => (conf['secrets.rse.AppInsightsConnectionString'] = 'test2'));
  jest.mock('@hmcts/properties-volume', () => ({ addTo }));

  const { config } = require('./config');

  test('gets environment variables', () => {
    expect(config.githubToken).toBe('test');
  });

  test('gets vault secrets', () => {
    expect(config.appinsightsKey).toBe('test2');
  });
});
