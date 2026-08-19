import { listPR } from '../github/rest';
import { Pool } from 'pg';

const BATCH_SIZE = 100;
const CONCURRENCY = 10;
const STALE_AFTER = '2 days';

interface Stale {
  id: string;
  repo: string;
  number: number;
}

interface Reconciled {
  id: string;
  state: string;
  closed_at: string;
  commit_hash: string | null;
}

type Checked = { outcome: 'closed'; pull: Reconciled } | { outcome: 'open' } | { outcome: 'failed' };

export const run = async (pool: Pool) => {
  const stale = await findStale(pool);

  if (!stale.length) {
    return 'no stale open pull requests';
  }

  const checked: Checked[] = [];
  for (let i = 0; i < stale.length; i += CONCURRENCY) {
    checked.push(...(await Promise.all(stale.slice(i, i + CONCURRENCY).map(row => check(row)))));
  }

  const closed = checked.flatMap(result => (result.outcome === 'closed' ? [result.pull] : []));
  const failed = checked.filter(result => result.outcome === 'failed').length;
  const unchecked = failed ? `, ${failed} could not be checked` : '';

  if (closed.length) {
    await save(pool, closed);
  }
  await markChecked(pool, stale);

  return closed.length
    ? `reconciled ${closed.length} of ${stale.length} pull requests${unchecked}`
    : `checked ${stale.length} pull requests, none closed${unchecked}`;
};

const findStale = async (pool: Pool): Promise<Stale[]> => {
  const sql = `
  select
    pr.id,
    split_part(pr.id, '/', 6) as repo,
    split_part(pr.id, '/', 8)::int as number
  from github.pull_request pr
  where pr.closed_at is null
    and pr.id ~ '^https://api\\.github\\.com/repos/hmcts/[^/]+/issues/[0-9]+$'
    and (pr.updated_at is null or pr.updated_at < now() - $1::interval)
    and (pr.reconciled_at is null or pr.reconciled_at < now() - $1::interval)
  order by pr.reconciled_at nulls first
  limit $2
  `;
  return (await pool.query(sql, [STALE_AFTER, BATCH_SIZE])).rows;
};

const check = async (row: Stale): Promise<Checked> => {
  try {
    const pull = (await listPR(row.repo, row.number)).data;

    if (!pull.closed_at) {
      return { outcome: 'open' };
    }

    return {
      outcome: 'closed',
      pull: {
        id: row.id,
        state: pull.state,
        closed_at: pull.closed_at,
        commit_hash: pull.merge_commit_sha,
      },
    };
  } catch (err) {
    console.error(`[pull-request-reconcile] could not check ${row.id}:`, err);
    return { outcome: 'failed' };
  }
};

const markChecked = async (pool: Pool, stale: Stale[]) => {
  const sql = `
  update github.pull_request
  set reconciled_at = now()
  where id = any($1::text[])
  `;
  await pool.query(sql, [stale.map(row => row.id)]);
};

const save = async (pool: Pool, closed: Reconciled[]) => {
  const sql = `
  update github.pull_request pr
  set state = v.state, closed_at = v.closed_at, commit_hash = v.commit_hash
  from jsonb_to_recordset($1::jsonb)
    as v(id text, state text, closed_at timestamp, commit_hash text)
  where pr.id = v.id
  `;
  await pool.query(sql, [JSON.stringify(closed)]);
};
