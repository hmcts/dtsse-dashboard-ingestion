import { getTeamName } from '../github/team';
import { octokit } from '../github/rest';

export const run = async () => {
  const results = await octokit.paginate(octokit.rest.repos.listForOrg, { org: 'hmcts' });

  return results.map(repo => ({
    id: repo.html_url,
    git_url: repo.git_url,
    web_url: repo.html_url,
    short_name: repo.name,
    team_alias: getTeamName(repo.name),
  }));
};
