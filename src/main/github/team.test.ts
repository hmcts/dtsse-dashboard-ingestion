import { expect, describe, test } from '@jest/globals';
import { getTeamName } from './team';

describe('getTeamName', () => {
  test('gets the team name', () => {
    expect(getTeamName('team-repo')).toBe('team');
  });

  test('lower cases the name', () => {
    expect(getTeamName('TeAM-repo')).toBe('team');
  });
});
