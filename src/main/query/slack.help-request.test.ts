import { beforeEach, expect, jest, test } from '@jest/globals';
jest.mock('../config', () => ({
  config: {
    slackCosmosEnabled: true,
    slackCosmosKey: 'test-key',
    slackCosmosAccountName: 'example',
    slackCosmosDatabase: 'help-requests',
    slackCosmosContainer: 'help-requests',
  },
}));
jest.mock('../db/store', () => ({ pool: { connect: jest.fn() } }));
jest.mock('@azure/cosmos', () => ({ CosmosClient: jest.fn() }));

import { CosmosClient } from '@azure/cosmos';
import { pool } from '../db/store';
import { config } from '../config';
import { analyticsEventToRow, run, toRow } from './slack.help-request';

const document = {
  id: '1',
  key: 'DTSPO-1',
  created_at: '2020-01-01T00:00:00Z',
  _ts: 1000,
  resolution_type: 'Platform Access',
  resolution_sub_type: 'Azure',
};
let query: jest.Mock<(sql: string, values?: any[]) => Promise<{ rows: any[] }>>;
let release: jest.Mock;
let cosmosQuery: jest.Mock;
let fetchNext: jest.Mock<() => Promise<{ resources: (typeof document)[] }>>;
beforeEach(() => {
  jest.clearAllMocks();
  config.slackCosmosAccountName = 'example';
  config.slackCosmosKey = 'test-key';
  query = jest.fn<(sql: string, values?: any[]) => Promise<{ rows: any[] }>>().mockResolvedValue({ rows: [] });
  release = jest.fn();
  (pool.connect as jest.Mock<() => Promise<unknown>>).mockResolvedValue({ query, release });
  fetchNext = jest.fn<() => Promise<{ resources: (typeof document)[] }>>().mockResolvedValue({ resources: [document] });
  cosmosQuery = jest.fn().mockReturnValue({ hasMoreResults: jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false), fetchNext });
  (CosmosClient as jest.Mock).mockImplementation(() => ({ database: () => ({ container: () => ({ items: { query: cosmosQuery } }) }) }));
});

test('preserves missing classifications and rejects malformed dates', () => {
  expect(toRow({ id: '1', _ts: 1 })).toEqual(['1', null, null, null, null, null, null, null, 1]);
  expect(() => toRow({ id: '1', _ts: 1, created_at: 'invalid' })).toThrow('Invalid created_at');
});

test('maps analytics events for PostgreSQL', () => {
  expect(
    analyticsEventToRow({
      id: 'event-1',
      session_id: 'D1:1.000',
      user_id_hash: 'user-hash',
      step: 'ticket_created',
      source: 'conversational',
      occurred_at: '2026-09-21T12:00:00Z',
      _ts: 1000,
    })
  ).toEqual(['event-1', 'D1:1.000', 'user-hash', 'ticket_created', null, 'conversational', null, null, new Date('2026-09-21T12:00:00Z'), 1000]);
});

test('reads all pages, imports old tickets, and commits imported modification timestamps', async () => {
  query.mockImplementation((sql: string) => Promise.resolve({ rows: sql.startsWith('SELECT COALESCE(MAX(source_ts)') ? [{ source_ts: '900' }] : [] }));
  await run();
  expect(fetchNext).toHaveBeenCalledTimes(2);
  expect(cosmosQuery).toHaveBeenCalledWith(expect.objectContaining({ parameters: [{ name: '@since', value: 600 }] }), { maxItemCount: 100 });
  const writes = query.mock.calls.filter(([sql]) => sql.startsWith('INSERT INTO slack.help_request'));
  expect(writes).toHaveLength(2);
  expect(writes[0][1]).toContain('Platform Access');
  expect(writes[0][1]).toContain('Azure');
  expect(writes[0][1]![8]).toBe(1000);
  expect(CosmosClient).toHaveBeenCalledWith({ endpoint: 'https://example.documents.azure.com:443/', key: 'test-key' });
  expect(query.mock.calls[query.mock.calls.length - 1][0]).toBe('COMMIT');
  expect(release).toHaveBeenCalled();
});

test.each(['read', 'write'])('rolls back imported timestamps and data on %s failure', async failure => {
  if (failure === 'read') fetchNext.mockResolvedValueOnce({ resources: [document] }).mockRejectedValueOnce(new Error('failed'));
  else
    query.mockImplementation((sql: string) =>
      sql.startsWith('INSERT INTO slack.help_request') ? Promise.reject(new Error('failed')) : Promise.resolve({ rows: [] })
    );
  await expect(run()).rejects.toThrow('failed');
  expect(query).toHaveBeenCalledWith('ROLLBACK');
  expect(query).not.toHaveBeenCalledWith('COMMIT');
  expect(release).toHaveBeenCalled();
});

test('does not change stored timestamps when pages contain no documents', async () => {
  query.mockImplementation((sql: string) => Promise.resolve({ rows: sql.startsWith('SELECT COALESCE(MAX(source_ts)') ? [{ source_ts: '900' }] : [] }));
  fetchNext.mockResolvedValue({ resources: [] });
  await run();
  expect(query.mock.calls.some(([sql]) => sql.startsWith('INSERT INTO slack.help_request'))).toBe(false);
  expect(query).toHaveBeenCalledWith('COMMIT');
});

test('initial backfill starts from zero', async () => {
  await run();
  expect(cosmosQuery).toHaveBeenCalledWith(expect.objectContaining({ parameters: [{ name: '@since', value: 0 }] }), { maxItemCount: 100 });
});

test('fails before connecting when the enabled importer has no key', async () => {
  config.slackCosmosKey = '';
  await expect(run()).rejects.toThrow('SLACKBOT_COSMOS_KEY');
  expect(pool.connect).not.toHaveBeenCalled();
});
