import { beforeAll, afterAll, describe, jest, test } from '@jest/globals';
import { startPostgres, stopPostgres } from '../../test_support/docker_helper';

jest.setTimeout(180_000);

describe('migrations', () => {
  beforeAll(startPostgres);
  afterAll(stopPostgres);

  test('runs migrations', async () => {
    const { migrate, migrateDown } = require('./migrate');

    await migrate();
    await migrateDown();
    // Test that down works properly by rerunning the migrations.
    await migrate();
  });
});
