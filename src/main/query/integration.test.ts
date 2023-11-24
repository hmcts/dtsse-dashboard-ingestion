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

  test('repositories are correctly attributed', async () => {
    await insertRepos(client);
    const repos = await pool.query('select team_id, array_agg(short_name order by short_name) repos from github.repository group by 1');

    const r = repos.rows.map(obj => [obj.team_id as string, obj.repos as string[]] as const);
    const indexedRepos = Object.fromEntries(r);

    expect(indexedRepos['dtsse']).toStrictEqual(['idam-java-client']);
    expect(indexedRepos['lau']).toStrictEqual(['idam-user-disposer']);
  });
});
