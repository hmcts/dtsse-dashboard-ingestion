import { query } from '../github';

const gql = `
{
    search(query: "org:hmcts is:pr is:open created:<%created", type: ISSUE, first: 50%after) {
        pageInfo {
            startCursor
            hasNextPage
            endCursor
        }
        issueCount
        edges {
            node {
                ... on PullRequest {
                    repository {
                        name
                    }
                    headRefName
                    createdAt
                    state
                }
            }
        }
    }
}
`;

export const longOpenPullRequestsQuery = async () => {
  const created = get14DaysAgo();
  const result = await query(gql, { team: 'rse', created });

  console.log(result);
};

const get14DaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return date.toISOString();
};
