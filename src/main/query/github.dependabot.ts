import { query } from '../github/graphql';
import { getTeamName } from '../github/team';
import { store } from '../db/store';

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
}
`;

export const run = async () => {
  const results: Result[] = await query(gql);
  const uniqueResults = results.reduce((acc: Record<string, Result>, repo: Result) => {
    acc[repo.url] = repo;
    return acc;
  }, {});

  const rows = Object.values(uniqueResults).map(result => ({
    id: result.url,
    repository: result.name,
    team: getTeamName(result.name),
    dependabotv1: !!result.dependabotv1,
    dependabotv2: !!result.dependabotv2,
    renovate: !!(result.renovate || result.renovateroot),
    dependabotv1main: !!result.dependabotv1main,
    dependabotv2main: !!result.dependabotv2main,
    renovatemain: !!(result.renovatemain || result.renovatemainroot),
    enabled: !!(
      result.dependabotv1 ||
      result.dependabotv2 ||
      result.renovate ||
      result.renovateroot ||
      result.dependabotv1main ||
      result.dependabotv2main ||
      result.renovatemain ||
      result.renovatemainroot
    ),
  }));

  await store('github.dependabot', rows);
};

interface Result {
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
