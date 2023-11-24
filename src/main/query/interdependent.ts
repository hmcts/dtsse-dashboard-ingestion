import { Pool } from 'pg';
import { pool } from '../db/store';

export const run = async () => {
  await runInterdependent(pool);
};

// These datasets relate to one another and so their execution must be ordered.
export const runInterdependent = async (pool: Pool) => {
  await require('../v2/github.repository').run(pool);
  await require('../v2/jenkins.metrics').run(pool);
  await require('../v2/security.cves').run(pool);
};
