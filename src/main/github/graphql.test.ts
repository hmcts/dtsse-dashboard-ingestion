import { describe, expect, jest, test, beforeEach, afterAll } from '@jest/globals';
import { graphql } from '@octokit/graphql';
import { MockedFunction } from 'jest-mock';

jest.mock('../config', () => ({ config: { githubToken: 'test' } }));
jest.mock('@octokit/graphql');

const mockGraphql = graphql as MockedFunction<typeof graphql>;
mockGraphql.defaults.mockReturnValue(mockGraphql);

import { query } from './graphql';

describe('github client', () => {
  const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  test('handles network errors gracefully', async () => {
    mockGraphql.mockRejectedValue(new Error('Network error'));

    await expect(query('query')).rejects.toThrow('Network error');
  });

  test('handles 502 Bad Gateway with retry', async () => {
    // Mock console.warn to silence retry logs in tests
    const warnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    mockGraphql
      .mockRejectedValueOnce({ status: 502, message: 'Bad Gateway' })
      .mockRejectedValueOnce({ status: 502, message: 'Bad Gateway' })
      .mockResolvedValueOnce({
        search: {
          pageInfo: {
            endCursor: 'cursor',
            hasNextPage: false,
          },
          edges: [{ node: 'Value' }],
        },
      });

    const result = await query('query');

    expect(mockGraphql).toHaveBeenCalledTimes(3);
    expect(result).toEqual(['Value']);
    
    warnMock.mockRestore();
  }, 15000); // Increase timeout to 15 seconds

  test('returns empty array when no edges', async () => {
    // Clear all previous mocks to ensure clean state
    mockGraphql.mockClear();
    mockGraphql.mockResolvedValueOnce({
      search: {
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
        edges: [],
      },
    });

    const result = await query('query');

    expect(result).toEqual([]);
  });

  test('handles queries with single page of results', async () => {
    mockGraphql.mockResolvedValue({
      search: {
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
        edges: [{ node: 'single' }, { node: 'page' }],
      },
    });

    const result = await query('query');

    expect(result).toEqual(['single', 'page']);
  });
});
