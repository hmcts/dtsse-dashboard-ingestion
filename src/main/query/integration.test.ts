import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool, PoolClient } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';
import { silenceMigrations } from '../../test/support/migrate';
import { insertRepos } from '../v2/github.repository';

jest.setTimeout(180_000);
jest.mock('../db/migrate', () => silenceMigrations(() => jest.requireActual('../db/migrate')));
jest.mock('../github/rest', () => ({ listRepos: () => fs.readFileSync('src/test/data/github-repositories.json', 'utf-8') }));

describe('integration tests', () => {
  let pool: Pool;
  let client: PoolClient;
  beforeAll(async () => {
    await startPostgres();

    const { config } = require('../config');
    pool = new Pool({ connectionString: config.dbUrl });
    const { migrate } = require('../db/migrate');
    await migrate();
    client = await pool.connect();
  });

  afterAll(async () => {
    await client.release();
    await pool.end();
    await stopPostgres();
  });

  test('repositories', async () => {
    await insertRepos(client);
    const repos = await pool.query('select count(*) from github.repository');
    expect(repos.rows[0].count).toBe('35');
  });
});
