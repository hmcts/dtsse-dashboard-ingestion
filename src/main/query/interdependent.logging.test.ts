import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../db/store', () => ({
  pool: {},
}));

jest.mock('../interdependent/security.cves.common', () => ({
  getUnixTimeToQueryFrom: jest.fn(async () => BigInt(1234567890)),
}));

jest.mock('../interdependent/github.repository', () => ({
  run: jest.fn(async () => 'saved 10 repositories'),
}));

jest.mock('../interdependent/jenkins.metrics', () => ({
  run: jest.fn(async () => 'processed 7 Jenkins records'),
}));

jest.mock('../interdependent/security.cves.java', () => ({
  run: jest.fn(async () => 'processed 4 Java CVE reports'),
}));

jest.mock('../interdependent/security.cves.node', () => ({
  run: jest.fn(async () => 'processed 6 Node CVE reports'),
}));

jest.mock('../interdependent/cve.suppressions.java', () => ({
  run: jest.fn(async () => 'processed 2 Java CVE suppressions'),
}));

jest.mock('../interdependent/cve.suppressions.node', () => ({
  run: jest.fn(async () => 'processed 3 Node CVE suppressions'),
}));

jest.mock('../interdependent/github.pull-request', () => ({
  run: jest.fn(async () => 'saved 5 PRs'),
}));

jest.mock('../interdependent/github.dependabot', () => ({
  run: jest.fn(async () => 'found 2 repos with dependabot or renovate config out of 9'),
}));

jest.mock('../interdependent/sonar.project', () => ({
  run: jest.fn(async () => 'processed 8 Sonar projects'),
}));

describe('runInterdependent logging', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  test('logs start and completion lines with run return messages', async () => {
    const mockPool = {} as any;
    const { runInterdependent } = require('./interdependent');

    await runInterdependent(mockPool);

    expect(consoleLogSpy).toHaveBeenCalledWith('[interdependent] Starting: github.repository');
    expect(consoleLogSpy).toHaveBeenCalledWith('[interdependent] Completed: github.repository - saved 10 repositories');
    expect(consoleLogSpy).toHaveBeenCalledWith('[interdependent] Starting: github.dependabot');
    expect(consoleLogSpy).toHaveBeenCalledWith('[interdependent] Completed: github.dependabot - found 2 repos with dependabot or renovate config out of 9');
    expect(consoleLogSpy).toHaveBeenCalledWith('[interdependent] Completed: sonar.project - processed 8 Sonar projects');
  });
});
