import { describe, expect, jest, test } from '@jest/globals';
import { StartedTestContainer, PostgreSqlContainer } from 'testcontainers';
import { Pool } from 'pg';
import * as fs from 'fs';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getMetrics: () => fs.readFileSync('test_data/jenkins-metrics.json', 'utf-8') }));

describe('metrics', () => {
  test('metrics', async () => {
    const container: StartedTestContainer = await new PostgreSqlContainer('postgres:11')
      .withUsername('postgres')
      .withPassword('postgres')
      .withExposedPorts(5432)
      .withDatabase('dashboard')
      .start();

    process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:${container.getMappedPort(5432)}/dashboard`;

    const { runFiles } = require('../executor');
    const { config } = require('../config');

    await runFiles(['jenkins.metrics']);

    const pool = new Pool({ connectionString: config.dbUrl });
    const client = await pool.connect();
    const builds = await client.query('select count(*) from jenkins.builds');
    // Seven unique builds in our test data
    expect(builds.rows[0].count).toBe('7');

    const steps = await client.query('select count(*) from jenkins.build_steps');
    // All 10 unique build steps should be there
    expect(steps.rows[0].count).toBe('10');

    client.release();

    await pool.end();

    await container.stop();
  });
});
