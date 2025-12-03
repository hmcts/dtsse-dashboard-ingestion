import { graphql } from '@octokit/graphql';
import { config } from '../config';
import { GraphQlQueryResponse } from '@octokit/graphql/dist-types/types';

const gql = graphql.defaults({
  headers: {
    authorization: `token ${config.githubToken}`,
    'User-Agent': 'dtsse-dashboard-ingestion/1.0',
    Accept: 'application/vnd.github.v3+json',
  },
});

// Retry wrapper for transient errors with intelligent rate limit handling
const requestWithRetry = async (fn: (...args: any[]) => Promise<any>, args: any[] = [], retries = 5, baseDelayMs = process.env.NODE_ENV === 'test' ? 10 : 3000) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(...args);
    } catch (err: any) {
      const status = err && (err.status || (err.response && err.response.status));
      const isRateLimit = status === 403 || status === 429;
      const isTransient = status >= 500 || status === 502 || isRateLimit || (err && err.message && err.message.includes('Bad Gateway'));

      // Extract rate limit headers if available
      const rateLimitRemaining = err.response?.headers?.['x-ratelimit-remaining'];
      const rateLimitReset = err.response?.headers?.['x-ratelimit-reset'];

      console.warn(`Transient GitHub error, retry ${attempt + 1}/${retries + 1}:`, {
        status,
        isRateLimit,
        remaining: rateLimitRemaining,
        message: err.message || status,
      });

      if (attempt === retries || !isTransient) throw err;

      // Calculate delay - longer for rate limits
      let delay = baseDelayMs * Math.pow(1.5, attempt);

      if (isRateLimit && rateLimitReset) {
        // Wait until rate limit resets + small buffer
        const resetTime = parseInt(rateLimitReset) * 1000;
        const waitTime = Math.max(resetTime - Date.now() + 5000, delay);
        delay = Math.min(waitTime, 300000); // Cap at 5 minutes max
        console.warn(`Rate limit hit, waiting ${Math.round(delay / 1000)}s until reset`);
      }

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }
};

export const query = async <T>(queryString: string, values: Values = undefined): Promise<T[]> => {
  const formattedQuery = formatQuery(queryString, values);
  const response: QueryResult<T> | undefined = await requestWithRetry(() => gql(formattedQuery));

  if (!response) {
    throw new Error('No response from GitHub GraphQL API after retries');
  }

  if (isError(response)) {
    console.error(response);
    throw new Error(response.errors?.[0]?.message ?? 'Unknown GraphQL error');
  }

  // Defensive check for expected response shape
  if (!('search' in response) || !response.search?.edges) {
    throw new Error('Unexpected GraphQL response shape');
  }

  const results = response.search.edges.map(edge => edge.node);

  if (response.search.pageInfo?.hasNextPage) {
    const after = ', after: "' + response.search.pageInfo.endCursor + '"';
    const nextPages = await query<T>(queryString, { ...values, after });

    return results.concat(nextPages);
  }

  return results;
};

const formatQuery = (queryString: string, values: Values): string => {
  const valuesWithDefaultAfter: Values = { after: '', ...values };
  let result = queryString;

  for (const key in valuesWithDefaultAfter) {
    result = result.replace(`%${key}`, valuesWithDefaultAfter[key]);
  }

  return result;
};

const isError = (result: QueryResult<unknown> | null | undefined): result is QueryError => {
  return !!result && (result as QueryError).errors !== undefined;
};

type QueryError = {
  errors: Exclude<GraphQlQueryResponse<never>['errors'], undefined>;
};

type QueryResult<T> =
  | QueryError
  | {
      search: {
        pageInfo?: {
          endCursor: string;
          hasNextPage: boolean;
        };
        edges: [{ node: T }];
      };
    };

export type Values = Record<string, string> | undefined;

export interface Result {
  url: string;
  name: string;
  dependabotv1: { abbreviatedOid: string } | null;
  dependabotv2: { abbreviatedOid: string } | null;
  renovate: { abbreviatedOid: string } | null;
  renovateroot: { abbreviatedOid: string } | null;
  dependabotv1main: { abbreviatedOid: string } | null;
  dependabotv2main: { abbreviatedOid: string } | null;
  renovatemain: { abbreviatedOid: string } | null;
  renovatemainroot: { abbreviatedOid: string } | null;
}
export const getDependabotConfig = async (): Promise<Result[]> => {
  const q = `
{
    search(query: "org:hmcts archived:false", type: REPOSITORY, first: 50%after) {
        pageInfo {
            startCursor
            hasNextPage
            endCursor
        }
        edges {
            node {
                ... on Repository {
                    url
                    name
                    dependabotv1: object(expression: "master:.dependabot/config.yml") {
                        ... on Blob {
                            abbreviatedOid
                        }
                    }
                    dependabotv2: object(expression: "master:.github/dependabot.yml") {
                        ... on Blob {
                            abbreviatedOid
                        }
                    }
                    renovate: object(expression: "master:.github/renovate.json") {
                        ... on Blob {
                            abbreviatedOid
                        }
                    }
                    renovateroot: object(expression: "master:renovate.json") {
                        ... on Blob {
                            abbreviatedOid
                        }
                    }
                    dependabotv1main: object(expression: "main:.dependabot/config.yml") {
                        ... on Blob {
                            abbreviatedOid
                        }
                    }
                    dependabotv2main: object(expression: "main:.github/dependabot.yml") {
                        ... on Blob {
                            abbreviatedOid
                        }
                    }
                    renovatemain: object(expression: "main:.github/renovate.json") {
                        ... on Blob {
                            abbreviatedOid
                        }
                    }
                    renovatemainroot: object(expression: "main:renovate.json") {
                        ... on Blob {
                            abbreviatedOid
                        }
                    }
                }
            }
        }
    }
}`;
  return await query(q);
};
