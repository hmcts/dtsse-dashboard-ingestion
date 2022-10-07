import { describe, jest, test } from '@jest/globals';
import { StartedTestContainer, PostgreSqlContainer } from 'testcontainers';
import * as fs from 'fs';

jest.setTimeout(180_000);
jest.mock('../jenkins/cosmos', () => ({ getMetrics: () => JSON.parse(fs.readFileSync('test_data/jenkins-metrics.json', 'utf-8')) }));

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

    await runFiles(['jenkins.metrics']);

    await container.stop();
  });
});
