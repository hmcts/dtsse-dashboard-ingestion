import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getMetrics: () => fs.readFileSync('src/test/data/jenkins-metrics.json', 'utf-8') }));

describe('metrics', () => {
  beforeAll(async () => {
    await startPostgres();
    const { runFiles } = require('../executor');

    await runFiles(['jenkins.metrics']);
  });
  afterAll(stopPostgres);

  test('metrics', async () => {
    const { config } = require('../config');
    const pool = new Pool({ connectionString: config.dbUrl });
    const builds = await pool.query('select count(*) from jenkins.builds');
    // Eight unique builds in our test data
    expect(builds.rows[0].count).toBe('8');

    const steps = await pool.query('select count(*) from jenkins.build_steps');
    // All 18 unique build steps should be there
    expect(steps.rows[0].count).toBe('18');

    // git_url is null in our test data for this row as is occasionally observed in cosmos.
    // The import should reconstruct this url from the build url.
    const tribs = await pool.query("select * from jenkins.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(tribs.rows[0].git_url).toBe('https://github.com/HMCTS/sscs-tribunals-case-api.git');

    // Should be the timestamp of our imported test data.
    const { getUnixTimeToQueryFrom } = require('./jenkins.metrics');
    const time = await getUnixTimeToQueryFrom(pool);
    expect(new Date(time * 1000).getFullYear()).toBe(2022);

    await pool.end();
  });

  test('build summaries', async () => {
    const { config } = require('../config');
    const pool = new Pool({ connectionString: config.dbUrl });
    const summaries = await pool.query('select * from jenkins.build_summaries');
    expect(summaries.rowCount).toBe(1);

    await pool.end();
  });
});
