import { describe, expect, jest, test } from '@jest/globals';

jest.mock('../config', () => ({ config: { dbUrl: 'test' } }));

const mockedConnect = jest.fn();
const mockedClient = jest.fn();
const mockedRelease = jest.fn();

mockedConnect.mockResolvedValue({ query: mockedClient, release: mockedRelease } as never);

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: mockedConnect,
  })),
}));

import { store } from './store';

describe('store', () => {
  test('formats sql', async () => {
    await store('table', [{ col: 'data' }]);

    expect(mockedConnect).toHaveBeenCalled();
    expect(mockedClient).toHaveBeenCalled();
    expect(mockedRelease).toHaveBeenCalled();
  });
});
