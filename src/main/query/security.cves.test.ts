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

    const client = await pool.connect();
    try {
      await client.query(`
      insert into github.repository(id, short_name, git_url, web_url, team_alias)
        values
            ('https://github.com/hmcts/fpl-ccd-configuration.git', '', '', '', ''),
            ('https://github.com/hmcts/ccd-data-store-api.git', '', '', '', ''),
            ('https://github.com/hmcts/sscs-submit-your-appeal.git', '', '', '', '')
      `);
    } finally {
      client.release();
    }

    const { runFiles } = require('../executor');
    await runFiles(['security.cves']);
  });

  afterAll(async () => {
    await pool.end();
    await stopPostgres();
  });

  test('cves', async () => {
    const cves = (
      await pool.query({
        rowMode: 'array',
        text: 'select git_url, name, severity from security.current_cves order by 1, 2',
      })
    ).rows;
    expect(cves).toEqual([
      ['https://github.com/hmcts/ccd-data-store-api.git', 'CVE-2022-8643', 'medium'],
      ['https://github.com/hmcts/fpl-ccd-configuration.git', 'CVE-2022-45688', 'high'],
      ['https://github.com/hmcts/sscs-submit-your-appeal.git', 'CVE-2020-24025', 'medium'],
      ['https://github.com/hmcts/sscs-submit-your-appeal.git', 'CVE-2023-28155', 'medium'],
    ]);
  });
});