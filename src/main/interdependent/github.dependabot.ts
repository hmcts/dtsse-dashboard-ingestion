import { Result, getDependabotConfig } from '../github/graphql';
import { Pool } from 'pg';

export const run = async (pool: Pool) => {
  const results: Result[] = await getDependabotConfig();
  const uniqueResults = results.reduce((acc: Record<string, Result>, repo: Result) => {
    acc[repo.url] = repo;
    return acc;
  }, {});

  // Find all repos where dependabot or renovate is enabled.
  const res = Object.values(uniqueResults)
    .filter(
      result =>
        !!(
          result.dependabotv1 ||
          result.dependabotv2 ||
          result.renovate ||
          result.renovateroot ||
          result.dependabotv1main ||
          result.dependabotv2main ||
          result.renovatemain ||
          result.renovatemainroot
        )
    )
    .map(result => result.url);

  // Either known to have it or not
  await pool.query(`update github.repository set hasDependabotOrRenovate = (id = any($1))`, [res]);
  return [];
};
