import { query } from '../github';

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

const openPullRequestsQuery = async () => {
  const results: Result[] = await query(gql, { team: 'rse' });

  return results.map(result => ({
    repository: result.name,
    url: result.url,
    count: result.pullRequests.totalCount,
  }));
};

interface Result {
  url: string;
  name: string;
  isPrivate: boolean;
  pullRequests: { totalCount: number; nodes: never[] };
}

export default openPullRequestsQuery;
