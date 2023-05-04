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
    const { config } = require('../config');
    pool = new Pool({ connectionString: config.dbUrl });

    const { migrate } = require('../db/migrate');
    await migrate();

    // Populate the github.repositories table which we link to and is populated by another query.
    await pool.query(`
    insert into github.repository(id, short_name, git_url, web_url, team_alias)
      values
          ('https://github.com/hmcts/fpl-ccd-configuration', '', '', '', ''),
          ('https://github.com/hmcts/ccd-data-store-api', '', '', '', ''),
          ('https://github.com/hmcts/sscs-submit-your-appeal', '', '', '', '')
    `);

    const { runFiles } = require('../executor');
    await runFiles(['security.cves']);
  });

  afterAll(async () => {
    await pool.end();
    await stopPostgres();
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
      ['https://github.com/hmcts/sscs-submit-your-appeal', 'CVE-2020-24025', 'medium'],
      ['https://github.com/hmcts/sscs-submit-your-appeal', 'CVE-2023-28155', 'medium'],
    ]);
  });
});
