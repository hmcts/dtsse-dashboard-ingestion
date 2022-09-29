import { query } from '../github';

const gql = `
{
  search(query: "repo:\\"NOT cnp NOT aks NOT azure\\" org:hmcts sort:created is:pr is:unmerged is:public archived:false", type: ISSUE, first: 50%after){
    pageInfo {
        startCursor
        hasNextPage
        endCursor
    }
    issueCount
    edges {
      node {
        ... on PullRequest {
          title
          repository {
            nameWithOwner
          }
          createdAt
          closedAt
          url
          changedFiles
          additions
          deletions
          author {
            login
          }
          bodyText
          reviewDecision
          labels (first: 100) {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    }
  }
}
`;

const run = async () => {
  const results: Result[] = await query(gql);

  return results.map(result => ({
    team: result.repository.nameWithOwner.substring(0, result.repository.nameWithOwner.indexOf('-')),
    repository: result.repository.nameWithOwner,
    title: result.title,
    url: result.url,
    created_at: result.createdAt.replace('T', ' ').replace('Z', ''),
    closed_at: result.closedAt?.replace('T', ' ').replace('Z', ''),
    changed_files: result.changedFiles,
    additions: result.additions,
    deletions: result.deletions,
    author: result.author.login,
    body_text: result.bodyText,
    review_decision: result.reviewDecision?.toLowerCase(),
    labels: result.labels.edges.map(edge => edge.node.name).join(','),
    jira_refs: jiraRef(result.title + result.bodyText)?.join(',') || null,
  }));
};

const jiraRef = (text: string) => {
  const regex = /\d+-[A-Z]+(?!-?[a-zA-Z]{1,10})/g;
  const reversed = text.split('').reverse().join('');

  return reversed
    .match(regex)
    ?.map(match => match.split('').reverse().join(''))
    .reverse();
};

interface Result {
  title: string;
  repository: {
    nameWithOwner: string;
  };
  createdAt: string;
  closedAt: string | null;
  url: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  author: {
    login: string;
  };
  bodyText: string;
  reviewDecision: 'REVIEW_REQUIRED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED' | null;
  labels: {
    edges: {
      node: {
        name: string;
      };
    }[];
  };
}

export default run;
