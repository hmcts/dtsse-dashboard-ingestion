import { Octokit } from '@octokit/rest';
import { config } from '../config';

export const octokit = new Octokit({
  auth: `token ${config.githubToken}`,
});

export const listRepos = async () => {
  return await octokit.paginate(octokit.rest.repos.listForOrg, { org: 'hmcts' });
};
