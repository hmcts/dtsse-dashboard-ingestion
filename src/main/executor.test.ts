import { describe, expect, jest, test, beforeEach, afterEach } from '@jest/globals';

jest.mock('./config', () => ({ config: { databaseUrl: 'test' } }));
jest.mock('./db/store');
jest.mock('./db/migrate');

describe('executor', () => {
  let mockStore: jest.Mock;
  let mockMigrate: jest.Mock;
  let mockShutdownConnectionPool: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockStore = jest.fn().mockImplementation(() => Promise.resolve());
    mockMigrate = jest.fn().mockImplementation(() => Promise.resolve());
    mockShutdownConnectionPool = jest.fn().mockImplementation(() => Promise.resolve());

    jest.doMock('./db/store', () => ({
      store: mockStore,
      shutdownConnectionPool: mockShutdownConnectionPool,
    }));

    jest.doMock('./db/migrate', () => ({
      migrate: mockMigrate,
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('executes query files and stores results', async () => {
    const mockResults = [{ id: 1, name: 'test' }];

    jest.doMock(
      __dirname + '/query/test-query.ts',
      () => ({
        run: jest.fn().mockImplementation(() => Promise.resolve(mockResults)),
      }),
      { virtual: true }
    );

    const { runFiles } = require('./executor');

    await runFiles(['test-query.ts']);

    expect(mockMigrate).toHaveBeenCalledTimes(1);
    expect(mockStore).toHaveBeenCalledWith('test-query', mockResults);
    expect(mockShutdownConnectionPool).toHaveBeenCalledTimes(1);
  });

  test('skips storing when query returns empty results', async () => {
    jest.doMock(
      __dirname + '/query/empty-query.ts',
      () => ({
        run: jest.fn().mockImplementation(() => Promise.resolve([])),
      }),
      { virtual: true }
    );

    const { runFiles } = require('./executor');

    await runFiles(['empty-query.ts']);

    expect(mockMigrate).toHaveBeenCalledTimes(1);
    expect(mockStore).not.toHaveBeenCalled();
    expect(mockShutdownConnectionPool).toHaveBeenCalledTimes(1);
  });

  test('continues execution when query fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.doMock(
      __dirname + '/query/failing-query.ts',
      () => ({
        run: jest.fn().mockImplementation(() => Promise.reject(new Error('Query failed'))),
      }),
      { virtual: true }
    );

    jest.doMock(
      __dirname + '/query/success-query.ts',
      () => ({
        run: jest.fn().mockImplementation(() => Promise.resolve([{ data: 'success' }])),
      }),
      { virtual: true }
    );

    const { runFiles } = require('./executor');

    await runFiles(['failing-query.ts', 'success-query.ts']);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Query failed (failing-query.ts)'), expect.any(Error));
    expect(mockStore).toHaveBeenCalledWith('success-query', [{ data: 'success' }]);
    expect(mockShutdownConnectionPool).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  test('runs migrate before executing queries', async () => {
    jest.doMock(
      __dirname + '/query/test.ts',
      () => ({
        run: jest.fn().mockImplementation(() => Promise.resolve([])),
      }),
      { virtual: true }
    );

    const { runFiles } = require('./executor');

    await runFiles(['test.ts']);

    expect(mockMigrate).toHaveBeenCalled();
    expect(mockMigrate).toHaveBeenCalledTimes(1);
  });

  test('always shuts down connection pool', async () => {
    jest.doMock(
      __dirname + '/query/error-query.ts',
      () => ({
        run: jest.fn().mockImplementation(() => Promise.reject(new Error('Fatal error'))),
      }),
      { virtual: true }
    );

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { runFiles } = require('./executor');

    await runFiles(['error-query.ts']);

    expect(mockShutdownConnectionPool).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  test('executes multiple queries in parallel', async () => {
    const mockQuery1 = jest.fn().mockImplementation(() => Promise.resolve([{ id: 1 }]));
    const mockQuery2 = jest.fn().mockImplementation(() => Promise.resolve([{ id: 2 }]));

    jest.doMock(
      __dirname + '/query/query1.ts',
      () => ({
        run: mockQuery1,
      }),
      { virtual: true }
    );

    jest.doMock(
      __dirname + '/query/query2.ts',
      () => ({
        run: mockQuery2,
      }),
      { virtual: true }
    );

    const { runFiles } = require('./executor');

    await runFiles(['query1.ts', 'query2.ts']);

    expect(mockQuery1).toHaveBeenCalled();
    expect(mockQuery2).toHaveBeenCalled();
    expect(mockStore).toHaveBeenCalledTimes(2);
  });

  test('logs query execution time', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.doMock(
      __dirname + '/query/timed-query.ts',
      () => ({
        run: jest.fn().mockImplementation(() => Promise.resolve([{ data: 'test' }])),
      }),
      { virtual: true }
    );

    const { runFiles } = require('./executor');

    await runFiles(['timed-query.ts']);

    expect(consoleLogSpy).toHaveBeenCalledWith('Running query: timed-query.ts');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Finished query: timed-query\.ts in \d+ms/));

    consoleLogSpy.mockRestore();
  });
});
