import { Pool } from 'pg';
import { pool } from '../db/store';
import { getUnixTimeToQueryFrom } from '../interdependent/security.cves.common';

export const run = async () => {
  await runInterdependent(pool);
  return [];
};

// These datasets relate to one another and so their execution must be ordered.
export const runInterdependent = async (pool: Pool) => {
  await require('../interdependent/github.repository').run(pool);
  await require('../interdependent/jenkins.metrics').run(pool);
  // ensure the same cutoff is used so that ingestion of one report type does not cause CVEs in another to be missed due to updated latest report timestamp
  const cveCutoff = await getUnixTimeToQueryFrom(pool);

  await require('../interdependent/security.cves.java').run(pool, cveCutoff);
  await require('../interdependent/security.cves.node').run(pool, cveCutoff);
  // Import CVE suppressions after CVEs are imported
  await require('../interdependent/cve.suppressions.java').run(pool, cveCutoff);
  await require('../interdependent/cve.suppressions.node').run(pool, cveCutoff);
  await require('../interdependent/github.pull-request').run(pool);
  await require('../interdependent/github.dependabot').run(pool);
  await require('../interdependent/sonar.project').run(pool);
};
