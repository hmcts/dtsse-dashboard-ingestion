import { Pool } from 'pg';
import { pool } from '../db/store';
import { getUnixTimeToQueryFrom } from '../interdependent/security.cves.common';

export const run = async () => {
  await runInterdependent(pool);
  return [];
};

const logStep = async (name: string, fn: () => Promise<string | void>) => {
  console.log(`[interdependent] Starting: ${name}`);
  const message = await fn();
  console.log(`[interdependent] Completed: ${name}${message ? ` - ${message}` : ''}`);
};

// These datasets relate to one another and so their execution must be ordered.
export const runInterdependent = async (pool: Pool) => {
  await logStep('github.repository', () => require('../interdependent/github.repository').run(pool));
  await logStep('jenkins.metrics', () => require('../interdependent/jenkins.metrics').run(pool));
  // ensure the same cutoff is used so that ingestion of one report type does not cause CVEs in another to be missed due to updated latest report timestamp
  const cveCutoff = await getUnixTimeToQueryFrom(pool);

  await logStep('security.cves.java', () => require('../interdependent/security.cves.java').run(pool, cveCutoff));
  await logStep('security.cves.node', () => require('../interdependent/security.cves.node').run(pool, cveCutoff));
  // Import CVE suppressions after CVEs are imported
  await logStep('cve.suppressions.java', () => require('../interdependent/cve.suppressions.java').run(pool, cveCutoff));
  await logStep('cve.suppressions.node', () => require('../interdependent/cve.suppressions.node').run(pool, cveCutoff));
  await logStep('github.pull-request', () => require('../interdependent/github.pull-request').run(pool));
  await logStep('github.dependabot', () => require('../interdependent/github.dependabot').run(pool));
  await logStep('sonar.project', () => require('../interdependent/sonar.project').run(pool));
};
