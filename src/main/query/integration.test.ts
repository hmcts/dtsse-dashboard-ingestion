import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool, PoolClient } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';
import { silenceMigrations } from '../../test/support/migrate';
import { runRelated } from './related';

jest.setTimeout(180_000);
jest.mock('../db/migrate', () => silenceMigrations(() => jest.requireActual('../db/migrate')));
jest.mock('../github/rest', () => ({ listRepos: () => fs.readFileSync('src/test/data/github-repositories.json', 'utf-8') }));
jest.mock('../jenkins/cosmos', () => ({ getMetrics: () => fs.readFileSync('src/test/data/jenkins-metrics.json', 'utf-8') }));

describe('integration tests', () => {
  let pool: Pool;
  beforeAll(async () => {
    await startPostgres();

    const { config } = require('../config');
    pool = new Pool({ connectionString: config.dbUrl });
    const { migrate } = require('../db/migrate');
    await migrate();
    await runRelated(pool);
    // Run the import process twice to ensure idempotency.
    await runRelated(pool);

    // Run the jenkins processing a second time, with next set of build steps - one in-progress build should be marked complete.
    const file2 = fs.readFileSync('src/test/data/jenkins-metrics-2.json', 'utf-8');
    const { processCosmosResults } = require('../v2/jenkins.metrics');
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
    expect(indexedRepos['lau']).toStrictEqual(['idam-user-disposer']);
  });

  test('jenkins metrics', async () => {
    const builds = await pool.query('select count(*) from jenkins_impl.builds');
    // Total unique builds in our test data
    expect(builds.rows[0].count).toBe('15');

    const steps = await pool.query('select count(*) from jenkins.build_steps');
    // All build steps should be there
    expect(steps.rows[0].count).toBe('35');

    // git_url is null in our test data for this row as is occasionally observed in cosmos.
    // The import should reconstruct this url from the build url.
    const tribs = await pool.query("select * from jenkins_impl.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(tribs.rows[0].build_url).toBe('https://build.platform.hmcts.net/job/HMCTS_j_to_z/job/sscs-tribunals-case-api/job/PR-2973/8/');

    const nightly = await pool.query("select * from jenkins.build_summaries where correlation_id = 'cc5c9e84-5773-49f6-a65d-1be006ba4c1c'");
    expect(nightly.rows[0].is_nightly).toBe(true);

    const rowsWithHash = await pool.query("select * from jenkins_impl.builds where correlation_id = 'b35f8f48-589b-48ff-8aae-98a6dcdd33b2'");
    expect(rowsWithHash.rows[0].git_commit).toBe('b35f8f48589b48ff8aae98a6dcdd33b2');

    // Should be the timestamp of our imported test data.
    const { getUnixTimeToQueryFrom } = require('../v2/jenkins.metrics');
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

    // Team aliases
    expect(map.get('cc5c9e84-5773-49f6-a65d-1be006ba4c1c').team_id).toBe('ccd');
    expect(map.get('a707159f-c96e-4391-ba41-94350f6a5c93').team_id).toBe('civil');
    expect(map.get('30102d95-aa57-480c-9f87-1693b316686c').team_id).toBe('civil-sdt');
    expect(map.get('a0b34ebb-76eb-463e-b52e-dfd1fa5714a3').team_id).toBe('dtsse');
    expect(map.get('a8802399-6752-4a1b-90e7-e5328fa7869c').team_id).toBe('lau');

    const civil = map.get('aac8907e-d110-441c-8b47-b110252d75a0');
    expect(civil.result).toBe('SUCCESS');
  });
});
