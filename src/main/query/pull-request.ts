import { Octokit } from '@octokit/rest';
import { config } from '../config';

const octokit = new Octokit({
  auth: `token ${config.githubToken}`,
});

const run = async () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  const results = (await octokit.paginate(octokit.rest.issues.list, {
    filter: 'all',
    state: 'open',
    pulls: true,
    since: date.toISOString(),
  })) as Result[];

  const prs = results
    .filter(issue => issue.repository.owner.login === 'hmcts' && !issue.repository.archived && issue.pull_request?.url)
    .map(issue => addPrData(issue));

  return Promise.all(prs);
};

const addPrData = async (issue: Result) => {
  const pull = await octokit.rest.pulls.get({
    owner: 'hmcts',
    repo: issue.repository.name,
    pull_number: issue.number,
  });

  return {
    id: issue.url,
    url: issue.url,
    repository: issue.repository?.name,
    team: issue.repository?.name.substring(0, issue.repository.name.indexOf('-')).toLowerCase(),
    title: issue.title,
    created_at: issue.created_at.replace('T', ' ').replace('Z', ''),
    closed_at: issue.closed_at?.replace('T', ' ').replace('Z', '') || null,
    changed_files: pull.data.changed_files,
    additions: pull.data.additions,
    deletions: pull.data.deletions,
    author: issue.user.login,
    body_text: issue.body,
    labels: issue.labels.map(label => label.name).join(','),
    jira_refs: jiraRef(issue.title + issue.body)?.join(',') || null,
  };
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
  number: number;
  pull_request?: {
    url: string;
  };
  repository: {
    name: string;
    archived: boolean;
    owner: {
      login: string;
    };
  };
  created_at: string;
  closed_at: string | null;
  url: string;
  user: {
    login: string;
  };
  body: string;
  labels: {
    name: string;
  }[];
}

export default run;
