import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';
import { silenceMigrations } from '../../test/support/migrate';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getCVEs: () => fs.readFileSync('src/test/data/cve-reports.json', 'utf-8') }));
jest.mock('../db/migrate', () => silenceMigrations(() => jest.requireActual('../db/migrate')));

describe('cves', () => {
  let pool: Pool;
  beforeAll(async () => {
    await startPostgres();
    const { runFiles } = require('../executor');
    await runFiles(['security.cves']);

    const { config } = require('../config');
    pool = new Pool({ connectionString: config.dbUrl });
  });

  afterAll(async () => {
    await stopPostgres();
    await pool.end();
  });

  test('cves', async () => {
    const cves = (await pool.query({ rowMode: 'array', text: 'select name, severity from security_impl.cves' })).rows;
    expect(cves).toEqual([['CVE-1', 'low']]);
  });
});
