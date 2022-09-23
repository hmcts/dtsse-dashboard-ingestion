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

const longOpenPullRequestsQuery = async () => {
  const created = get14DaysAgo();
  const result = await query<Result>(gql, { team: 'rse', created });

  const openPrsPerRepo = result.reduce(
    (result, item) => ({
      ...result,
      [item.repository.name]: result[item.repository.name] ? result[item.repository.name] + 1 : 1,
    }),
    {} as Record<string, number>
  );

  return Object.entries(openPrsPerRepo).map(([team, count]) => ({ team, count }));
};

const get14DaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return date.toISOString();
};

interface Result {
  repository: {
    name: string;
  };
  headRefName: string;
  createdAt: string;
  state: string;
}

export default longOpenPullRequestsQuery;
