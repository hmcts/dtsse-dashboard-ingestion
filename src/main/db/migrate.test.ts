import { MockedFunction } from 'jest-mock';
import { describe, expect, jest, test } from '@jest/globals';
const DBMigrate = require('db-migrate');

jest.mock('db-migrate');

const mockInstance = jest.fn();
const mockDbMigrate = DBMigrate as MockedFunction<typeof DBMigrate>;

mockDbMigrate.getInstance.mockReturnValue({
  up: mockInstance,
  create: mockInstance,
  down: mockInstance,
  internals: { argv: { _: [] } },
});

import { create, migrate, migrateDown } from './migrate';

describe('migrate', () => {
  test('runs up', async () => {
    await migrate();

    expect(mockDbMigrate.getInstance).toHaveBeenCalled();
    expect(mockInstance).toHaveBeenCalled();
  });
});

describe('create', () => {
  test('runs create', async () => {
    process.argv[4] = 'test';
    await create();

    expect(mockDbMigrate.getInstance).toHaveBeenCalled();
    expect(mockInstance).toHaveBeenCalled();
  });
});

describe('migrateDown', () => {
  test('runs down', async () => {
    await migrateDown();

    expect(mockDbMigrate.getInstance).toHaveBeenCalled();
    expect(mockInstance).toHaveBeenCalled();
  });
});
