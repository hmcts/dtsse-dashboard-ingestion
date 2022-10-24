import { jest } from '@jest/globals';

export const silenceMigrations = (getOriginalModule: () => any) => {
  const originalModule = callQuietly(getOriginalModule);

  return {
    __esModule: true,
    ...originalModule,
    migrate: jest.fn(() => awaitQuietly(() => originalModule.migrate())),
    migrateDown: jest.fn(() => awaitQuietly(() => originalModule.migrateDown())),
  };
};

const callQuietly = <T>(fn: () => T) => {
  const consoleMock = jest.spyOn(console, 'log').mockReturnValue();
  const consoleMock2 = jest.spyOn(console, 'info').mockReturnValue();
  const result = fn();
  consoleMock.mockRestore();
  consoleMock2.mockRestore();
  return result;
};

const awaitQuietly = async <T>(fn: () => Promise<T>) => {
  const consoleMock = jest.spyOn(console, 'log').mockReturnValue();
  const consoleMock2 = jest.spyOn(console, 'info').mockReturnValue();
  const result = await fn();
  consoleMock.mockRestore();
  consoleMock2.mockRestore();
  return result;
};
