import { getTeamName } from '../github/team';
import { listRepos, octokit } from '../github/rest';
import { getJenkinsName } from '../github/repository';
import { InsertRow, store } from 'db/store';
import { Pool, PoolClient } from 'pg';

export const insertRepos = async (client: PoolClient) => {
  const results = await listRepos();

  // console.error(results);
  // throw new Error("foo");
  // const sql = 'insert into github.repositories';
  const sql = `
  insert into github.repository(id, git_url, web_url, short_name, team_alias, jenkins_name, is_archived, language)
  select 
  j->>'html_url',
  j->>'git_url',
  j->>'html_url',
  j->>'name',
  'alias',
  'jenkins',
  (j->'archived')::bool,
  j->>'language'
  from jsonb_array_elements($1::jsonb) as json(j)`;
  const r = await client.query({ text: sql, values: [results], rowMode: 'array' });
  console.error(r.rows);

  // const r = results.map(repo => ({
  //   id: repo.html_url,
  //   git_url: repo.git_url,
  //   web_url: repo.html_url,
  //   short_name: repo.name,
  //   team_alias: getTeamName(repo.name),
  //   jenkins_name: getJenkinsName(repo.html_url),
  //   is_archived: repo.archived,
  //   language: repo.language,
  // }));
  return 5;
};
