import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';
import { silenceMigrations } from '../../test/support/migrate';

jest.setTimeout(180_000);
jest.mock('../db/migrate', () => silenceMigrations(() => jest.requireActual('../db/migrate')));
jest.mock('../github/rest', () => ({
  listRepos: () => fs.readFileSync('src/test/data/github-repositories.json', 'utf-8'),
  listUpTo100PRsSince: () => JSON.parse(fs.readFileSync('src/test/data/github.pull-request.json', 'utf-8')),
  listPR: () => JSON.parse(fs.readFileSync('src/test/data/github.pr-1260.json', 'utf-8')),
}));
jest.mock('../jenkins/cosmos', () => ({
  getMetrics: () => fs.readFileSync('src/test/data/jenkins-metrics.json', 'utf-8'),
  getCVEs: () => fs.readFileSync('src/test/data/cve-reports.json', 'utf-8'),
}));

describe('integration tests', () => {
  let pool: Pool;
  beforeAll(async () => {
    await startPostgres();

    const { config } = require('../config');
    pool = new Pool({ connectionString: config.dbUrl });
    const { migrate } = require('../db/migrate');
    const { runInterdependent } = require('./interdependent');
    await migrate();
    await runInterdependent(pool);
    // Run the import process twice to ensure idempotency.
    await runInterdependent(pool);

    // Run the jenkins processing a second time, with next set of build steps - one in-progress build should be marked complete.
    const file2 = fs.readFileSync('src/test/data/jenkins-metrics-2.json', 'utf-8');
    const { processCosmosResults } = require('../interdependent/jenkins.metrics');
    await processCosmosResults(pool, file2);
  });

  afterAll(async () => {
    await pool.end();
    await stopPostgres();
  });

  test('repositories are correctly attributed', async () => {
    const repos = await pool.query('select team_id, array_agg(short_name order by short_name) repos from github.repository group by 1');

    const r = repos.rows.map(obj => [obj.team_id as string, obj.repos as string[]] as const);
    const indexedRepos = Object.fromEntries(r);

    expect(indexedRepos['dtsse']).toStrictEqual(['idam-java-client']);
    expect(indexedRepos['lau']).toStrictEqual(['idam-user-disposer', 'lau-frontend']);
  });

  test('jenkins metrics', async () => {
    const builds = await pool.query('select count(*) from jenkins_impl.builds');
    // Total unique builds in our test data
    expect(builds.rows[0].count).toBe('16');

    const steps = await pool.query('select count(*) from jenkins.build_steps');
    // All build steps should be there
    expect(steps.rows[0].count).toBe('36');

    // git_url is null in our test data for this row as is occasionally observed in cosmos.
    // The import should reconstruct this url from the build url.
    const tribs = await pool.query("select * from jenkins_impl.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(tribs.rows[0].build_url).toBe('https://build.platform.hmcts.net/job/HMCTS_j_to_z/job/sscs-tribunals-case-api/job/PR-2973/8/');

    const nightly = await pool.query("select * from jenkins.build_summaries where correlation_id = 'cc5c9e84-5773-49f6-a65d-1be006ba4c1c'");
    expect(nightly.rows[0].is_nightly).toBe(true);

    const rowsWithHash = await pool.query("select * from jenkins_impl.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(rowsWithHash.rows[0].git_commit).toBe('b35f8f48589b48ff8aae98a6dcdd33b2');

    // Should be the timestamp of our imported test data.
    const { getUnixTimeToQueryFrom } = require('../interdependent/jenkins.metrics');
    const time = await getUnixTimeToQueryFrom(pool);
    expect(new Date(time * 1000).getFullYear()).toBe(2023);

    // Step duration should be filled in
    // 2021-12-25T22:46:14Z -> 2021-12-25T22:47:57Z
    const build = await pool.query("select extract(epoch from duration) seconds from jenkins.build_steps where id = '7ad50ad3-2840-43e7-9144-05ae84da761e'");
    expect(build.rows[0].seconds).toBe(103);

    const checkout = await pool.query("select extract(epoch from duration) seconds from jenkins.build_steps where id = '8df51dde-558b-43e5-baca-0bc946e37b1b'");
    expect(checkout.rows[0].seconds).toBe(0);
  });

  test('jenkins build summaries', async () => {
    const summaries = await pool.query('select *, extract(epoch from duration) seconds from jenkins.build_summaries order by correlation_id');
    // In progress builds should not appear
    expect(summaries.rowCount).toBe(10);

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

    const civil = map.get('aac8907e-d110-441c-8b47-b110252d75a0');
    expect(civil.result).toBe('SUCCESS');
  });

  test('view of current cves affecting each app', async () => {
    const cves = (
      await pool.query({
        rowMode: 'array',
        text: 'select git_url, name, severity from security.current_cves order by 1, 2',
      })
    ).rows;
    expect(cves).toEqual([
      ['https://github.com/hmcts/ccd-data-store-api', '1091725', 'unknown'],
      ['https://github.com/hmcts/ccd-data-store-api', 'CVE-2022-8643', 'medium'],
      ['https://github.com/hmcts/fpl-ccd-configuration', 'CVE-2022-45688', 'high'],
      ['https://github.com/hmcts/fpl-ccd-configuration', 'CVE-2022-45689', 'high'],
      ['https://github.com/hmcts/fpl-ccd-configuration', 'CVE-2022-9999', 'critical'],
      ['https://github.com/hmcts/prl-ccd-definitions', 'CVE-2023-28155', 'medium'],
      ['https://github.com/hmcts/prl-ccd-definitions', 'https://github.com/advisories/GHSA-56x4-j7p9-fcf9', 'low'],
      ['https://github.com/hmcts/sscs-submit-your-appeal', 'CVE-2020-24025', 'medium'],
      ['https://github.com/hmcts/sscs-submit-your-appeal', 'CVE-2023-28155', 'medium'],
      // lau-frontend had CVEs on a prior report but not latest, so should not show up.
    ]);
  });

  test('view of pull requests', async () => {
    const pr = (await pool.query('select pr.* from github.pull_request pr join github.repository repo using(repo_id)')).rows[0];
    expect(pr.id).toEqual('https://api.github.com/repos/hmcts/ccd-data-store-api/issues/1260');
    expect(pr.state).toEqual('open');
  });
});
