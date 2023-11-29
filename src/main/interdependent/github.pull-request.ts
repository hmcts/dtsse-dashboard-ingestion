import { listPR, listUpTo100PRsSince } from '../github/rest';

import { Pool } from 'pg';

export const run = async (pool: Pool) => {
  const date = await getTimeToQueryFrom(pool);

  // // Take up to 100 results to avoid triggering the Github rate limit.
  // // https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api?apiVersion=2022-11-28
  const results = (await listUpTo100PRsSince(date.toISOString())) as Result[];
  const uniqueResults = results.reduce((acc: Record<string, Result>, issue: Result) => {
    acc[issue.url] = issue;
    return acc;
  }, {});

  const prs = Object.values(uniqueResults)
    .filter(issue => issue.repository.owner.login === 'hmcts' && !issue.repository.archived && issue.pull_request?.url)
    .map(issue => addPrData(issue));

  const withPrInfo = await Promise.all(prs);
  await savePRs(pool, withPrInfo);
  return [];
};

const savePRs = async (pool: Pool, prs: Result[]) => {
  const sql = `
  insert into github.pull_request
  select 
  r.*
  from jsonb_array_elements($1::jsonb) e
    left join github.repository repo on repo.short_name = e->>'repository',
    -- Insert the repo_id we've looked up into the json before populating the record.
    jsonb_populate_record(null::github.pull_request, e || jsonb_build_object('repo_id', repo.repo_id)) r
  on conflict (id) do update
  set (closed_at, updated_at, changed_files, additions, deletions, body_text, state, labels, jira_refs, commit_hash) =
  (excluded.closed_at, excluded.updated_at, excluded.changed_files, excluded.additions, excluded.deletions, excluded.body_text, excluded.state, excluded.labels, excluded.jira_refs, excluded.commit_hash)
  `;
  await pool.query(sql, [JSON.stringify(prs)]);
};

const addPrData = async (issue: Result) => {
  const pull = (await listPR(issue.repository.name, issue.number)).data;

  return Object.assign(issue, pull, {
    id: issue.url,
    repository: issue.repository?.name,
    author: issue.user.login,
    body_text: issue.body,
    labels: issue.labels.map(label => label.name).join(','),
    jira_refs: jiraRef(issue.title + issue.body)?.join(',') || null,
    commit_hash: issue.state === 'closed' ? pull.merge_commit_sha : null,
  });
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
  updated_at: string;
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

const getTimeToQueryFrom = async (pool: Pool) => {
  // Base off the last import time if available
  const res = await pool.query(`
    select coalesce(max(updated_at), now() - interval '1 hour') as max
    from github.pull_request
  `);

  return res.rows[0].max;
};
