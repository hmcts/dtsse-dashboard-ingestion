import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getMetrics: () => fs.readFileSync('src/test/data/jenkins-metrics.json', 'utf-8') }));

describe('metrics', () => {
  let pool: Pool;
  beforeAll(async () => {
    await startPostgres();
    const { runFiles } = require('../executor');
    await runFiles(['jenkins.metrics']);

    const { config } = require('../config');
    pool = new Pool({ connectionString: config.dbUrl });
  });

  afterAll(async () => {
    await stopPostgres();
    await pool.end();
  });

  test('metrics', async () => {
    const builds = await pool.query('select count(*) from jenkins.builds');
    // Total unique builds in our test data
    expect(builds.rows[0].count).toBe('9');

    const steps = await pool.query('select count(*) from jenkins.build_steps');
    // All build steps should be there
    expect(steps.rows[0].count).toBe('26');

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
  });

  test('build summaries', async () => {
    const summaries = await pool.query('select * from jenkins.build_summaries order by correlation_id');
    // We have four finished builds that should show up in the summary
    // In progress builds should not appear
    expect(summaries.rowCount).toBe(4);
    expect(summaries.rows[0].result).toBe('FAILURE');
    expect(summaries.rows[1].result).toBe('ABORTED');
    expect(summaries.rows[2].result).toBe('FAILURE');
    expect(summaries.rows[3].result).toBe('SUCCESS');
    expect(summaries.rows[3].final_step_name).toBe('Pipeline Succeeded');
    expect(summaries.rows[3].correlation_id).toBe('cc5c9e84-5773-49f6-a65d-1be006ba4c1c');
  });
});
