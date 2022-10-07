import { describe, jest, test } from '@jest/globals';
import { StartedTestContainer, PostgreSqlContainer } from 'testcontainers';

jest.setTimeout(180_000);

describe('migrations', () => {
  test('runs migrations', async () => {
    const container: StartedTestContainer = await new PostgreSqlContainer('postgres:11')
      .withUsername('postgres')
      .withPassword('postgres')
      .withExposedPorts(5432)
      .withDatabase('dashboard')
      .start();

    process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:${container.getMappedPort(5432)}/dashboard`;

    const { migrate, migrateDown } = require('./migrate');

    await migrate();
    await migrateDown();
    // Test that down works properly by rerunning the migrations.
    await migrate();

    await container.stop();
  });
});
