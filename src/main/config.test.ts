import { describe, expect, jest, test } from '@jest/globals';
process.env.GITHUB_TOKEN = 'test';
process.env.DATABASE_URL = 'postgresql://notreal@notreal:%1*!1$aa)0AaAA<A@not-real-password-secops:5432/test';

describe('config', () => {
  const addTo = jest.fn(
    conf =>
      (conf.secrets = {
        dtsse: {
          AppInsightsConnectionString: 'test2',
        },
      })
  );
  jest.mock('@hmcts/properties-volume', () => ({ addTo }));

  const { config } = require('./config');

  test('gets environment variables', () => {
    expect(config.githubToken).toBe('test');
  });

  test('gets vault secrets', () => {
    expect(config.appinsightsKey).toBe('test2');
  });

  test('encodes the db url', () => {
    expect(config.dbUrl).toBe('postgresql://notreal@notreal:%251*!1%24aa)0AaAA%3CA@not-real-password-secops:5432/test');
  });
});
