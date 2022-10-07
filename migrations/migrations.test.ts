import { describe, jest, test } from '@jest/globals';


import { instance } from "../src/main/db/migrate";
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

    process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:${container.getMappedPort(5432)}/dashboard`

    const migrator = instance();

    await migrator.migrate();
    await migrator.migrateDown();
    // Test that down works properly by rerunning the migrations.
    await migrator.migrate();

    await container.stop();
  });
});
