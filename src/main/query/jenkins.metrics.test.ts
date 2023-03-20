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
    const builds = await pool.query('select count(*) from jenkins_impl.builds');
    // Total unique builds in our test data
    expect(builds.rows[0].count).toBe('12');

    const steps = await pool.query('select count(*) from jenkins.build_steps');
    // All build steps should be there
    expect(steps.rows[0].count).toBe('31');

    // git_url is null in our test data for this row as is occasionally observed in cosmos.
    // The import should reconstruct this url from the build url.
    const tribs = await pool.query("select * from jenkins_impl.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(tribs.rows[0].git_url).toBe('https://github.com/HMCTS/sscs-tribunals-case-api.git');
    expect(tribs.rows[0].is_nightly).toBe(false);

    const nightly = await pool.query("select * from jenkins_impl.builds where correlation_id = 'cc5c9e84-5773-49f6-a65d-1be006ba4c1c'");
    expect(nightly.rows[0].is_nightly).toBe(true);

    const rowsWithHash = await pool.query("select * from jenkins_impl.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(rowsWithHash.rows[0].git_commit).toBe('b35f8f48589b48ff8aae98a6dcdd33b2');

    // Should be the timestamp of our imported test data.
    const { getUnixTimeToQueryFrom } = require('./jenkins.metrics');
    const time = await getUnixTimeToQueryFrom(pool);
    expect(new Date(time * 1000).getFullYear()).toBe(2023);

    // Step duration should be filled in
    // 2021-12-25T22:46:14Z -> 2021-12-25T22:47:57Z
    const build = await pool.query("select extract(epoch from duration) seconds from jenkins.build_steps where id = '7ad50ad3-2840-43e7-9144-05ae84da761e'");
    expect(build.rows[0].seconds).toBe(103);

    const checkout = await pool.query("select extract(epoch from duration) seconds from jenkins.build_steps where id = '8df51dde-558b-43e5-baca-0bc946e37b1b'");
    expect(checkout.rows[0].seconds).toBe(0);
  });

  test('build summaries', async () => {
    const summaries = await pool.query('select *, extract(epoch from duration) seconds from jenkins.build_summaries order by correlation_id');
    // We have four finished builds that should show up in the summary
    // In progress builds should not appear
    expect(summaries.rowCount).toBe(7);

    const map = new Map(
      summaries.rows.map(r => {
        return [r.correlation_id, r];
      })
    );

    expect(map.get('3974ee85-aebd-4487-b2b9-3f75d309e2f8').result).toBe('FAILURE');
    expect(map.get('3974ee85-aebd-4487-b2b9-3f75d309e2f8').final_step_name).toBe('functionalTest:preview');
    // 2021-10-11T09:15:53Z -> 2021-10-11T09:18:03Z
    expect(map.get('3974ee85-aebd-4487-b2b9-3f75d309e2f8').seconds).toBe(130);

    expect(map.get('202d7317-976e-440a-9510-885beb17e426').result).toBe('ABORTED');
    expect(map.get('116726ad-dd77-455e-b33e-5802a9503b59').result).toBe('FAILURE');
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').result).toBe('SUCCESS');
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').final_step_name).toBe('Pipeline Succeeded');
    // 2022-10-07T15:00:10Z -> 2022-10-07T15:05:57Z
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').seconds).toBe(347);

    // Team aliases
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').team_id).toBe('ccd');
    expect(map.get('a707159f-c96e-4391-ba41-94350f6a5c93').team_id).toBe('civil');
    expect(map.get('30102d95-aa57-480c-9f87-1693b316686c').team_id).toBe('civil-sdt');
  });
});
