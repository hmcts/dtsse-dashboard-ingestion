import { describe, expect, jest, test, afterAll } from '@jest/globals';
import { graphql } from '@octokit/graphql';
import { MockedFunction } from 'jest-mock';

jest.mock('../config', () => ({ config: { githubToken: 'test' } }));
jest.mock('@octokit/graphql');

const mockGraphql = graphql as MockedFunction<typeof graphql>;
mockGraphql.defaults.mockReturnValue(mockGraphql);

import { query } from './graphql';

describe('github client', () => {
  const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterAll(() => {
    consoleMock.mockRestore();
  });

  test('catches errors', () => {
    mockGraphql.mockResolvedValue({
      errors: [{ message: 'GQL error' }],
    });

    const test = () => query('query');

    expect(test).rejects.toThrow('GQL error');
  });

  test('substitutes values', async () => {
    mockGraphql.mockResolvedValue({
      search: {
        pageInfo: {
          endCursor: 'string',
          hasNextPage: false,
        },
        edges: [{ node: 'Value' }],
      },
    });

    await query('query %replace', { replace: 'test' });

    expect(mockGraphql).toHaveBeenCalledWith('query test');
  });

  test('gets all pages', async () => {
    mockGraphql
      .mockResolvedValueOnce({
        search: {
          pageInfo: {
            endCursor: 'nextCursor',
            hasNextPage: true,
          },
          edges: [{ node: 'Value' }],
        },
      })
      .mockResolvedValueOnce({
        search: {
          pageInfo: {
            endCursor: 'nextCursor',
            hasNextPage: false,
          },
          edges: [{ node: 'NextValue' }],
        },
      });

    await query('query %after');

    expect(mockGraphql).toHaveBeenCalledWith('query ');
    expect(mockGraphql).toHaveBeenCalledWith('query , after: "nextCursor"');
  });
});
