import { beforeEach, expect, jest, test } from '@jest/globals';

jest.mock('../config', () => ({
  config: {
    githubAppRateLimitsEnabled: true,
    cosmosDbName: 'sandbox-account',
    cosmosKey: 'test-key',
    jenkinsDatabases: 'jenkins',
  },
  getJenkinsDatabaseNames: jest.fn(() => ['jenkins']),
}));

jest.mock('../db/store', () => ({ pool: { connect: jest.fn() } }));
jest.mock('@azure/cosmos', () => ({ CosmosClient: jest.fn() }));

import { CosmosClient } from '@azure/cosmos';
import { pool } from '../db/store';
import { config } from '../config';
import { run, toRows } from './github.app-rate-limit';

const document = {
  id: 'sample-1',
  credential_id: 'hmcts-jenkins-cft',
  app_id: '1949849',
  jenkins_instance: 'https://sandbox-build.hmcts.net/',
  recorded_at: '2026-10-20T08:34:13Z',
  resources: {
    core: { limit: 15000, used: 9, remaining: 14991, reset: 1700000000 },
    search: { limit: 30, used: 0, remaining: 30, reset: 1700003600 },
  },
  _ts: 1000,
};

let query: jest.Mock<(sql: string, values?: any[]) => Promise<{ rows: any[] }>>;
let release: jest.Mock;
let cosmosQuery: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  config.githubAppRateLimitsEnabled = true;
  config.cosmosDbName = 'sandbox-account';
  config.cosmosKey = 'test-key';
  config.jenkinsDatabases = 'jenkins';

  query = jest.fn<(sql: string, values?: any[]) => Promise<{ rows: any[] }>>().mockResolvedValue({ rows: [] });
  release = jest.fn();

  (pool.connect as jest.Mock<() => Promise<unknown>>).mockResolvedValue({ query, release });

  cosmosQuery = jest.fn().mockImplementation(() => {
    let hasDocument = true;

    return {
      hasMoreResults: () => hasDocument,
      fetchNext: async () => {
        hasDocument = false;
        return { resources: [document] };
      },
    };
  });

  (CosmosClient as jest.Mock).mockImplementation(() => ({
    database: () => ({
      container: () => ({
        items: { query: cosmosQuery },
      }),
    }),
  }));
});

test('maps each Cosmos resource to a PostgreSQL row and converts reset seconds to a date', () => {
  const rows = toRows(document, 'sandbox-account/jenkins/github-app-rate-limits');

  expect(rows).toEqual([
    [
      'sandbox-account/jenkins/github-app-rate-limits',
      'sample-1',
      'hmcts-jenkins-cft',
      '1949849',
      'https://sandbox-build.hmcts.net/',
      new Date('2026-10-20T08:34:13Z'),
      'core',
      15000,
      9,
      14991,
      new Date('2023-11-14T22:13:20Z'),
      1000,
    ],
    [
      'sandbox-account/jenkins/github-app-rate-limits',
      'sample-1',
      'hmcts-jenkins-cft',
      '1949849',
      'https://sandbox-build.hmcts.net/',
      new Date('2026-10-20T08:34:13Z'),
      'search',
      30,
      0,
      30,
      new Date('2023-11-14T23:13:20Z'),
      1000,
    ],
  ]);
});

test('does not connect to Cosmos or PostgreSQL when the importer is disabled', async () => {
  config.githubAppRateLimitsEnabled = false;

  await expect(run()).resolves.toEqual([]);

  expect(CosmosClient).not.toHaveBeenCalled();
  expect(pool.connect).not.toHaveBeenCalled();
});

test('uses the same conflict key when the same Cosmos document is imported twice', async () => {
  await run();
  await run();

  const writes = query.mock.calls.filter(([sql]) => sql.startsWith('INSERT INTO github.app_rate_limit'));

  expect(writes).toHaveLength(4);
  expect(writes.every(([sql]) => sql.includes('ON CONFLICT (source_scope, cosmos_id, resource)'))).toBe(true);
  expect(writes.map(([, values]) => [values?.[0], values?.[1], values?.[6]])).toEqual([
    ['sandbox-account/jenkins/github-app-rate-limits', 'sample-1', 'core'],
    ['sandbox-account/jenkins/github-app-rate-limits', 'sample-1', 'search'],
    ['sandbox-account/jenkins/github-app-rate-limits', 'sample-1', 'core'],
    ['sandbox-account/jenkins/github-app-rate-limits', 'sample-1', 'search'],
  ]);
  expect(query.mock.calls.filter(([sql]) => sql === 'COMMIT')).toHaveLength(2);
  expect(release).toHaveBeenCalledTimes(2);
});
