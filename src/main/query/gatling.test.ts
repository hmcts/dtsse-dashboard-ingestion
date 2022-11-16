import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';
import { silenceMigrations } from '../../test/support/migrate';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getGatlingReports: () => fs.readFileSync('src/test/data/gatling.json', 'utf-8') }));
jest.mock('../db/migrate', () => silenceMigrations(() => jest.requireActual('../db/migrate')));

describe('gatling', () => {
  beforeAll(startPostgres);
  afterAll(stopPostgres);

  test('gatling', async () => {
    const { runFiles } = require('../executor');
    const { config } = require('../config');

    await runFiles(['gatling']);

    const pool = new Pool({ connectionString: config.dbUrl });
    const runs = await pool.query('select * from gatling.runs');
    expect(runs.rowCount).toBe(1);
    expect(runs.rows[0].project).toBe('sscs-performance-tests');

    const sum = await pool.query('select sum(pass) from gatling.transactions');
    expect(sum.rows[0].sum).toBe('1350');

    const sscs = (await pool.query("select * from gatling.transactions where name = 'TX05_SSCS_Entry'")).rows[0];
    expect(sscs.pass).toBe(10);
    expect(sscs.fail).toBe(0);
    expect(sscs.min).toBe(31);
    expect(sscs.max).toBe(105);
    expect(sscs.mean).toBe(72);
    expect(sscs.stddev).toBe(22);
    expect(sscs.percentile50).toBe(78);
    expect(sscs.percentile75).toBe(86);
    expect(sscs.percentile95).toBe(99);
    expect(sscs.percentile99).toBe(104);

    await pool.end();
  });
});
