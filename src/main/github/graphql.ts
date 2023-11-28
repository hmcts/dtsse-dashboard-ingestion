import { graphql } from '@octokit/graphql';
import { config } from '../config';
import { GraphQlQueryResponse } from '@octokit/graphql/dist-types/types';

const gql = graphql.defaults({
  headers: {
    authorization: `token ${config.githubToken}`,
  },
});

export const query = async <T>(queryString: string, values: Values = undefined): Promise<T[]> => {
  const formattedQuery = formatQuery(queryString, values);
  const response: QueryResult<T> = await gql(formattedQuery);

  if (isError(response)) {
    console.error(response);

    throw new Error(response.errors[0].message);
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

const isError = (result: QueryResult<unknown>): result is QueryError => {
  return (result as QueryError).errors !== undefined;
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
