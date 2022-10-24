import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';
import { silenceMigrations } from '../../test/support/migrate';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getMetrics: () => fs.readFileSync('src/test/data/jenkins-metrics.json', 'utf-8') }));
jest.mock('../db/migrate', () => silenceMigrations(() => jest.requireActual('../db/migrate')));

describe('metrics', () => {
  beforeAll(startPostgres);
  afterAll(stopPostgres);

  test('metrics', async () => {
    const { runFiles } = require('../executor');
    const { config } = require('../config');

    await runFiles(['jenkins.metrics']);

    const pool = new Pool({ connectionString: config.dbUrl });
    const builds = await pool.query('select count(*) from jenkins.builds');
    // Seven unique builds in our test data
    expect(builds.rows[0].count).toBe('7');

    const steps = await pool.query('select count(*) from jenkins.build_steps');
    // All 10 unique build steps should be there
    expect(steps.rows[0].count).toBe('10');

    // git_url is null in our test data for this row as is occasionally observed in cosmos.
    // The import should reconstruct this url from the build url.
    const tribs = await pool.query("select * from jenkins.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(tribs.rows[0].git_url).toBe('https://github.com/HMCTS/sscs-tribunals-case-api.git');

    const rowsWithHash = await pool.query('select * from jenkins.builds where git_commit IS NOT NULL');
    expect(rowsWithHash.rows[0].git_commit).toBe('b35f8f48589b48ff8aae98a6dcdd33b2');

    // Should be the timestamp of our imported test data.
    const { getUnixTimeToQueryFrom } = require('./jenkins.metrics');
    const time = await getUnixTimeToQueryFrom(pool);
    expect(new Date(time * 1000).getFullYear()).toBe(2022);

    await pool.end();
  });
});
