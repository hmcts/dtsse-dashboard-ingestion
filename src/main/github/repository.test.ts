import { describe, expect, test } from '@jest/globals';
import { getJenkinsName } from './repository';

describe('getJenkinsName', () => {
  test('gets the jenkins name', () => {
    expect(getJenkinsName('https://github.com/hmcts/em-native-pdf-annotator-app')).toBe('https://github.com/HMCTS/em-native-pdf-annotator-app.git');
  });
});
