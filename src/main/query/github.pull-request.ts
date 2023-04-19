import { getTeamName } from '../github/team';
import { octokit } from '../github/rest';

export const run = async () => {
  const date = new Date();
  date.setHours(date.getHours() - 1);

  const results = (await octokit.paginate(octokit.rest.issues.list, {
    filter: 'all',
    state: 'all',
    pulls: true,
    since: date.toISOString(),
  })) as Result[];

  const uniqueResults = results.reduce((acc: Record<string, Result>, issue: Result) => {
    acc[issue.url] = issue;
    return acc;
  }, {});

  const prs = Object.values(uniqueResults)
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
    url: issue.pull_request?.html_url,
    repository: issue.repository?.name,
    team: getTeamName(issue.repository?.name),
    title: issue.title,
    created_at: issue.created_at.replace('T', ' ').replace('Z', ''),
    closed_at: issue.closed_at?.replace('T', ' ').replace('Z', '') || null,
    changed_files: pull.data.changed_files,
    additions: pull.data.additions,
    deletions: pull.data.deletions,
    author: issue.user.login,
    body_text: issue.body,
    state: issue.state,
    labels: issue.labels.map(label => label.name).join(','),
    jira_refs: jiraRef(issue.title + issue.body)?.join(',') || null,
    commit_hash: issue.state === 'closed' ? pull.data.merge_commit_sha : null,
    date_recorded: new Date(),
  };
};

const jiraRef = (text: string) => {
  const regex = /\d+-[A-Z]+(?!-?[a-zA-Z]{1,10})/g;
  const reversed = text.split('').reverse().join('');

  const refs = reversed
    .match(regex)
    ?.map(match => match.split('').reverse().join(''))
    .reverse()
    .filter(ref => !ref.startsWith('CVE-'));

  return refs?.filter((ref, index) => refs?.indexOf(ref) === index);
};

interface Result {
  title: string;
  number: number;
  state: string;
  pull_request?: {
    url: string;
    html_url: string;
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
