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

export const openPullRequestsQuery = async () => {
  const result = await query(gql, { team: 'rse' });
  console.log(result);
};
