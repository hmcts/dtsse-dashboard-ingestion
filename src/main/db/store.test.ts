import { afterAll, describe, expect, jest, test } from '@jest/globals';

jest.mock('../config', () => ({ config: { dbUrl: 'test' } }));

const mockedConnect = jest.fn();
const mockedEnd = jest.fn();
const mockedClient = jest.fn();
const mockedRelease = jest.fn();

mockedConnect.mockResolvedValue({ query: mockedClient, release: mockedRelease } as never);

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: mockedConnect,
    end: mockedEnd,
  })),
}));

import { shutdown, store } from './store';

describe('store', () => {
  const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterAll(() => {
    consoleMock.mockRestore();
  });

  test('formats sql', async () => {
    await store('table', [{ col: 'data' }]);

    expect(mockedConnect).toHaveBeenCalled();
    expect(mockedClient).toHaveBeenCalled();
    expect(mockedRelease).toHaveBeenCalled();
  });

  test('closes the connection even on error', async () => {
    mockedClient.mockRejectedValue(new Error('test') as never);
    await store('table', [{ col: 'data' }]);

    expect(mockedConnect).toHaveBeenCalled();
    expect(mockedClient).toHaveBeenCalled();
    expect(mockedRelease).toHaveBeenCalled();
  });
});

describe('shutdown', () => {
  test('calls end', async () => {
    await shutdown();

    expect(mockedEnd).toHaveBeenCalled();
  });
});
