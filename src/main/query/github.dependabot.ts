import { query } from '../github/graphql';
import { getTeamName } from '../github/team';

const gql = `
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
                }
            }
        }
    }
}
`;

export const run = async () => {
  const results: Result[] = await query(gql);
  const uniqueResults = results.reduce((acc: Record<string, Result>, repo: Result) => {
    acc[repo.url] = repo;
    return acc;
  }, {});

  return Object.values(uniqueResults).map(result => ({
    id: result.url,
    repository: result.name,
    team: getTeamName(result.name),
    dependabotv1: !!result.dependabotv1,
    dependabotv2: !!result.dependabotv2,
    renovate: !!result.renovate,
    dependabotv1main: !!result.dependabotv1main,
    dependabotv2main: !!result.dependabotv2main,
    renovatemain: !!result.renovatemain,
    enabled: !!(result.dependabotv1 || result.dependabotv2 || result.renovate || result.dependabotv1main || result.dependabotv2main || result.renovatemain),
  }));
};

interface Result {
  url: string;
  name: string;
  dependabotv1: { abbreviatedOid: string } | null;
  dependabotv2: { abbreviatedOid: string } | null;
  renovate: { abbreviatedOid: string } | null;
  dependabotv1main: { abbreviatedOid: string } | null;
  dependabotv2main: { abbreviatedOid: string } | null;
  renovatemain: { abbreviatedOid: string } | null;
}
