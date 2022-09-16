import { graphql } from '@octokit/graphql';
import { config } from './config';
import { GraphQlQueryResponse } from '@octokit/graphql/dist-types/types';

const gql = graphql.defaults({
  headers: {
    authorization: `token ${config.githubToken}`,
  },
});

export const query = async <T>(queryString: string, values: Values = undefined): Promise<Result<T>[]> => {
  const result: QueryResult<T> = await gql({ ...values, query: queryString });

  if (isError(result)) {
    console.error(result);

    throw new Error(result.errors[0].message);
  }

  if (result.search.pageInfo.hasNextPage) {
    const nextResult = await query<T>(queryString, { ...values, after: result.search.pageInfo.endCursor });

    return result.search.edges.concat(nextResult);
  }

  return result.search.edges;
};

function isError(result: QueryResult<unknown>): result is QueryError {
  return (result as QueryError).errors !== undefined;
}

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
        edges: Result<T>[];
      };
    };

export type Result<T> = { node: T };

export type Values = Record<string, string | number> | undefined;
