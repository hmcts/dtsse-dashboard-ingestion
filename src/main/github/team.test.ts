import { expect, describe, test } from '@jest/globals';
import { getTeamName } from './team';

const specialCases = [
  ['java-logging', 'platform'],
  ['attic-cmc-legal-integration-tests', 'cmc'],
  ['reform-api-standards', 'platform'],
  ['restful-api-standards', 'dtsse'],
  ['expressjs-template', 'platform'],
  ['send-letter-client', 'bsp'],
  ['send-letter-performance-tests', 'bsp'],
  ['scheduling-and-listing-poc', 'snl'],
  ['ccd-definition-processor', 'community'],
  ['build-failure-analyzer-plugin', 'platform'],
  ['befta-fw', 'ccd'],
  ['ccd-client', 'community'],
  ['ccd-case-ui-toolkit', 'xui'],
  ['ccd-case-document-am-api', 'am'],
  ['ccd-case-document-utilities', 'am'],
  ['case-document-metadata-migration', 'am'],
  ['ccd-case-document-am-client', 'am'],
  ['template-spring-boot', 'platform'],
  ['template-product-infrastructure', 'platform'],
  ['template-expressjs', 'platform'],
  ['template-java-client', 'platform'],
  ['slack-help-bot', 'platform'],
  ['life-events-client', 'probate'],
  ['arch-case-access-reference-implementation', 'am'],
  ['dts-pre-rec-evidence-poc', 'pre'],
  ['golden-path-java', 'platform'],
  ['golden-path-nodejs', 'platform'],
  ['old-employment-tribunals-shared-infrastructure', 'et'],
];

describe('getTeamName', () => {
  test('gets the team name', () => {
    expect(getTeamName('team-repo')).toBe('team');
  });

  test('lower cases the name', () => {
    expect(getTeamName('TeAM-repo')).toBe('team');
  });

  test('handles special cases', () => {
    for (const [repository, team] of specialCases) {
      expect(getTeamName(repository)).toBe(team);
    }
  });
});
