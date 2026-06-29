import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { log } from './log';

describe('log utility', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  test('logs message with prefix format', () => {
    log('github.dependabot', 'Done, found 3 repos');

    expect(consoleLogSpy).toHaveBeenCalledWith('[github.dependabot] Done, found 3 repos');
  });
});
