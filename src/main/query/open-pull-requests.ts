import { query } from '../github';
import * as applicationInsights from 'applicationinsights';

const gql = `
{
    search(query: "in:name org:hmcts hmcts/%team- sort:created", type: REPOSITORY, first: 100) {
        repositoryCount
        edges {
            node {
                ... on Repository {
                    url
                    name
                    isPrivate
                    pullRequests(first: 20, states:[OPEN]) {
                        totalCount
                        nodes {
                            resourcePath
                            createdAt
                            state
                        }
                    }
                }
            }
        }
    }
}
`;

export const openPullRequestsQuery = async () => {
  const results: Result[] = await query(gql, { team: 'rse' });

  for (const result of results) {
    applicationInsights.defaultClient.trackEvent({
      name: 'openPullRequestsQuery',
      properties: {
        name: result.name,
        repository: result.url,
        pullRequests: result.pullRequests.totalCount,
      },
    });
  }
};

interface Result {
  url: string;
  name: string;
  isPrivate: boolean;
  pullRequests: { totalCount: number; nodes: never[] };
}
