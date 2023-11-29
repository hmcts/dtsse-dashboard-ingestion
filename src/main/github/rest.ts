import { Octokit } from '@octokit/rest';
import { config } from '../config';

export const octokit = new Octokit({
  auth: `token ${config.githubToken}`,
});

export const listRepos = async () => {
  return JSON.stringify(await octokit.paginate(octokit.rest.repos.listForOrg, { org: 'hmcts' }));
};

export const listUpTo100PRsSince = async (isoDateSince: string) => {
  return (
    await octokit.rest.issues.list({
      filter: 'all',
      state: 'all',
      pulls: true,
      sort: 'updated',
      direction: 'asc',
      per_page: 100,
      since: isoDateSince,
    })
  ).data;
};

export const listPR = async (name: string, number: number) => {
  return await octokit.rest.pulls.get({
    owner: 'hmcts',
    repo: name,
    pull_number: number,
  });
};
