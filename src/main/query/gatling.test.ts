import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getGatlingReports: () => fs.readFileSync('src/test/data/gatling.json', 'utf-8') }));

describe('gatling', () => {
  beforeAll(startPostgres);
  afterAll(stopPostgres);

  test('gatling', async () => {
    const { runFiles } = require('../executor');
    const { config } = require('../config');

    await runFiles(['gatling']);

    const pool = new Pool({ connectionString: config.dbUrl });
    const runs = await pool.query('select count(*) from gatling.runs');
    expect(runs.rows[0].count).toBe('1');

    const sum = await pool.query('select sum(ok_number_of_requests) from gatling.transactions');
    expect(sum.rows[0].sum).toBe('1350');

    const sscs = (await pool.query("select * from gatling.transactions where name = 'TX05_SSCS_Entry'")).rows[0];
    expect(sscs.ok_number_of_requests).toBe(10);
    expect(sscs.ok_max_response_time).toBe(105);
    await pool.end();
  });
});
