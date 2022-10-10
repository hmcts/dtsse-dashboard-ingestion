import { beforeAll, afterAll, describe, jest, test } from '@jest/globals';
import { StartedTestContainer } from 'testcontainers';
import { startPostgres } from '../../test_support/docker_helper';

jest.setTimeout(180_000);

describe('migrations', () => {
  let postgres: StartedTestContainer;
  beforeAll(async () => {
    postgres = await startPostgres();
  });
  afterAll(async () => {
    await postgres.stop();
  });

  test('runs migrations', async () => {
    const { migrate, migrateDown } = require('./migrate');

    await migrate();
    await migrateDown();
    // Test that down works properly by rerunning the migrations.
    await migrate();
  });
});
