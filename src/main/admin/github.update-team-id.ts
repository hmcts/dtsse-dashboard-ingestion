import { pool } from '../db/store';

type ParsedArgs = {
  repoId: string;
  teamId: string;
};

const printUsageAndExit = () => {
  // Keep usage simple so it can be called from CI/CD
  console.error('Usage: ts-node src/main/admin/github.update-team-id.ts --repo-url <github-html-url> --team-id <team-id>');
  process.exit(1);
};

const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);

  let repoId: string | undefined;
  let teamId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if ((arg === '--repo' || arg === '--repo-id' || arg === '--repo-url') && i + 1 < args.length) {
      repoId = args[++i];
    } else if ((arg === '--team' || arg === '--team-id') && i + 1 < args.length) {
      teamId = args[++i];
    }
  }

  if (!repoId || !teamId) {
    printUsageAndExit();
  }

  return { repoId: repoId as string, teamId: teamId as string };
};

const run = async () => {
  const { repoId, teamId } = parseArgs();

  console.log(`Updating github.repository.team_id for repo '${repoId}' to team_id=${teamId}`);

  // Ensure the target team exists to avoid setting an invalid foreign key.
  const teamRes = await pool.query('select id from team where id = $1', [teamId]);
  if (teamRes.rowCount === 0) {
    throw new Error(`Team with id ${teamId} does not exist`);
  }

  // github.repository.id is stored as lower(html_url). Accept an HTML URL and lower it here.
  const updateRes = await pool.query(
    `update github.repository
       set team_id = $1
     where id = lower($2)
     returning id, team_id`,
    [teamId, repoId]
  );

  if (updateRes.rowCount === 0) {
    throw new Error(`No github.repository row found with id/html_url '${repoId}'`);
  }

  console.log(`Updated ${updateRes.rowCount} row(s).`);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
