import { graphql } from '@octokit/graphql';
import { config } from './config';
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

  const result = response.search.edges.map(edge => edge.node);

  if (response.search.pageInfo.hasNextPage) {
    const nextResult = await query<T>(queryString, { ...values, after: ', after: "' + response.search.pageInfo.endCursor + '"' });

    return result.concat(nextResult);
  }

  return result;
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
  errors: Exclude<GraphQlQueryResponse<any>['errors'], undefined>;
};

type QueryResult<T> =
  | QueryError
  | {
      search: {
        pageInfo: {
          endCursor: string;
          hasNextPage: boolean;
        };
        edges: [{ node: T }];
      };
    };

export type Values = Record<string, string> | undefined;
