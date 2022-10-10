import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import { startPostgres, stopPostgres } from '../../test_support/docker_helper';
import * as fs from 'fs';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getMetrics: () => fs.readFileSync('test_data/jenkins-metrics.json', 'utf-8') }));

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
  });
});
