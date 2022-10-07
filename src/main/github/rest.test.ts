import { describe, expect, jest, test } from '@jest/globals';
import { Octokit } from '@octokit/rest';

jest.mock('../config', () => ({ config: { githubToken: 'test' } }));
jest.mock('@octokit/rest');

describe('github rest client', () => {
  test('catches errors', () => {
    require('./rest');
    expect(Octokit).toHaveBeenCalledWith({ auth: 'token test' } as never);
  });
});
