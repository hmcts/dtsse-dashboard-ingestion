import { MockedFunction } from 'jest-mock';
import { describe, expect, jest, test } from '@jest/globals';
const DBMigrate = require('db-migrate');

jest.mock('db-migrate');

const mockInstance = jest.fn();
const mockDbMigrate = DBMigrate as MockedFunction<typeof DBMigrate>;

mockDbMigrate.getInstance.mockReturnValue({ up: mockInstance });

import { migrate } from './migrate';

describe('migrate', () => {
  test('runs up', async () => {
    await migrate();

    expect(mockDbMigrate.getInstance).toHaveBeenCalled();
    expect(mockInstance).toHaveBeenCalled();
  });
});
