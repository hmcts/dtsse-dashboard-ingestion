import { afterAll, beforeAll, describe, jest, test } from '@jest/globals';
import { startPostgres, stopPostgres } from '../../test/support/docker';
import { silenceMigrations } from '../../test/support/migrate';

jest.setTimeout(180_000);

jest.mock('./migrate', () => silenceMigrations(() => jest.requireActual('./migrate')));

describe('migrations', () => {
  beforeAll(startPostgres);
  afterAll(stopPostgres);

  test('runs migrations', async () => {
    const { migrate, migrateDown } = require('./migrate');

    await migrate();
  });
});
