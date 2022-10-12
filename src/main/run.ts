import { runFiles } from './executor';
import { readdirSync } from 'fs';
import { create, migrate, migrateDown } from './db/migrate';

const run = async () => {
  const queryName = process.argv[2] && process.argv[2] + '.ts';
  const isQueryFile = (f: string) => !f.endsWith('test.ts') && f.endsWith('.ts') && (!queryName || f.endsWith(queryName));
  const files = readdirSync(__dirname + '/query').filter(isQueryFile);

  await runFiles(files);
};

if (process.argv[2] === 'create') {
  create().catch(console.error);
} else if (process.argv[2] === 'down') {
  migrateDown().catch(console.error);
} else if (process.argv[2] === 'up') {
  migrate().catch(console.error);
} else {
  run().catch(console.error);
}
