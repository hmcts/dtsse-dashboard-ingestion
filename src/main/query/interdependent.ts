import { Pool } from 'pg';
import { pool } from '../db/store';

export const run = async () => {
  await runInterdependent(pool);
  return [];
};

// These datasets relate to one another and so their execution must be ordered.
export const runInterdependent = async (pool: Pool) => {
  await require('../interdependent/github.repository').run(pool);
  await require('../interdependent/jenkins.metrics').run(pool);
  await require('../interdependent/security.cves').run(pool);
  await require('../interdependent/github.pull-request').run(pool);
  await require('../interdependent/github.dependabot').run(pool);
  await require('../interdependent/sonar.project').run(pool);
};
