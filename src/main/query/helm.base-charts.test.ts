import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import * as fs from 'fs';
import { silenceMigrations } from '../../test/support/migrate';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getHelmChartMetrics: () => fs.readFileSync('src/test/data/helm-base-charts.json', 'utf-8') }));
jest.mock('../db/migrate', () => silenceMigrations(() => jest.requireActual('../db/migrate')));

describe('base-charts', () => {
  beforeAll(startPostgres);
  afterAll(stopPostgres);

  test('base-charts', async () => {
    const { runFiles } = require('../executor');
    const { config } = require('../config');

    await runFiles(['helm.base-charts']);

    const pool = new Pool({ connectionString: config.dbUrl });
    const runs = await pool.query('select * from helm.base_charts');
    expect(runs.rowCount).toBe(14);
    runs.rows.forEach(row => {
      expect(row).toHaveProperty('namespace');
      expect(row).toHaveProperty('deprecated_chart_count');
      expect(row).toHaveProperty('date');
    });

    const expectedRows = [
      //set team as namespace if no match
      { namespace: 'disposer', deprecated_chart_count: '1' },
      //find relevant team id from team_with_alias
      { namespace: 'money-claims', deprecated_chart_count: '1' },
      { namespace: 'wa', deprecated_chart_count: '2' },
    ];

    expectedRows.forEach(expectedRow => expect(runs.rows).toEqual(expect.arrayContaining([expect.objectContaining(expectedRow)])));

    await pool.end();
  });
});
