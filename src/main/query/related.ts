import { Pool } from 'pg';

export const runRelated = async (pool: Pool) => {
  await require('../v2/github.repository').run(pool);
  await require('../v2/jenkins.metrics').run(pool);
};
