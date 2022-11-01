import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';
import { silenceMigrations } from '../../test/support/migrate';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getMetrics: () => fs.readFileSync('src/test/data/jenkins-metrics.json', 'utf-8') }));
jest.mock('../db/migrate', () => silenceMigrations(() => jest.requireActual('../db/migrate')));

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
    expect(builds.rows[0].count).toBe('10');

    const steps = await pool.query('select count(*) from jenkins.build_steps');
    // All build steps should be there
    expect(steps.rows[0].count).toBe('29');

    // git_url is null in our test data for this row as is occasionally observed in cosmos.
    // The import should reconstruct this url from the build url.
    const tribs = await pool.query("select * from jenkins.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(tribs.rows[0].git_url).toBe('https://github.com/HMCTS/sscs-tribunals-case-api.git');
    expect(tribs.rows[0].is_nightly).toBe(false);

    const nightly = await pool.query("select * from jenkins.builds where correlation_id = 'cc5c9e84-5773-49f6-a65d-1be006ba4c1c'");
    expect(nightly.rows[0].is_nightly).toBe(true);

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
    expect(summaries.rowCount).toBe(5);

    const map = new Map(
      summaries.rows.map(r => {
        return [r.correlation_id, r];
      })
    );

    expect(map.get('3974ee85-aebd-4487-b2b9-3f75d309e2f8').result).toBe('FAILURE');
    expect(map.get('3974ee85-aebd-4487-b2b9-3f75d309e2f8').final_step_name).toBe('functionalTest:preview');
    // 2021-10-11T09:15:53Z -> 2021-10-11T09:18:03Z
    expect(map.get('3974ee85-aebd-4487-b2b9-3f75d309e2f8').duration.minutes).toBe(2);
    expect(map.get('3974ee85-aebd-4487-b2b9-3f75d309e2f8').duration.seconds).toBe(10);

    expect(map.get('202d7317-976e-440a-9510-885beb17e426').result).toBe('ABORTED');
    expect(map.get('116726ad-dd77-455e-b33e-5802a9503b59').result).toBe('FAILURE');
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').result).toBe('SUCCESS');
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').final_step_name).toBe('Pipeline Succeeded');
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').team_id).toBe('ccd');
    // 2022-10-07T15:00:10Z -> 2022-10-07T15:05:57Z
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').duration.minutes).toBe(5);
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').duration.seconds).toBe(47);
  });
});
