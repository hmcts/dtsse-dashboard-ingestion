import { describe, expect, jest, test } from '@jest/globals';
import { getTeamName } from './team';

jest.mock('../config', () => ({ config: { sonarToken: 'test' } }));

describe('getTeamNAme', () => {
  test.concurrent.each([
    ['AdoptionCcdDefinitions', 'adoption'],
    ['am-db', 'am'],
    ['BAR-WEB', 'bar'],
    ['FPL:service', 'fpl'],
    ['Caveat', 'caveat'],
    ['com.github.hmcts:idam-testing-support-api', 'idam'],
    ['com.github.hmcts:et-ccd-export', 'et-pet'],
    ['uk.gov.hmcts.reform:wa-task-configuration-template', 'wa'],
    ['SSCSCOR', 'sscs'],
    ['Verification:bulk-scan-processor', 'bulk'],
  ])('getTeamName(%s, %s)', async (project, expected) => expect(getTeamName(project)).toBe(expected));
});
