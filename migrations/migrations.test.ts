import { describe, jest, test } from '@jest/globals';


import { instance } from "../src/main/db/migrate";
import { StartedTestContainer, GenericContainer } from 'testcontainers';

jest.setTimeout(180_000);

describe('migrations', () => {
  test('runs migrations', async () => {
    const container: StartedTestContainer = await new GenericContainer('postgres:11').withEnv('POSTGRES_PASSWORD', 'postgres').withExposedPorts(5432).start();

    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:' +  container.getMappedPort(5432) + '/postgres';

    const migrator = instance();


    await migrator.migrate();
    await migrator.migrateDown();
    // Test that down works properly by rerunning the migrations.
    await migrator.migrate();
    await container.stop();
  });
});
