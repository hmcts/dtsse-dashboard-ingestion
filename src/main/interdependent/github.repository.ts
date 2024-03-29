import { listRepos } from '../github/rest';
import { Pool } from 'pg';

export const run = async (pool: Pool) => {
  const results = await listRepos();

  const sql = `
  insert into github.repository(id, team_id, git_url, web_url, short_name, is_archived, language)
  select distinct on (lower(j->>'html_url'))
    lower(j->>'html_url'),
    t.id,
    j->>'git_url',
    j->>'html_url',
    j->>'name',
    (j->'archived')::bool,
    j->>'language'
  from jsonb_array_elements($1::jsonb) as json(j)
    -- join against all aliases
    left join team_with_alias t on
      split_part(j->>'html_url', '/', 5) like (t.alias || '%')
  -- Pick the most specific team alias, ie. the longest.
  order by lower(j->>'html_url'), t.alias desc
  on conflict (upper(id)) do update
  set is_archived = excluded.is_archived, language = excluded.language
  `;
  await pool.query(sql, [results]);
};
