import { readdirSync } from 'fs';
import { shutdown } from './db/store';
import { create, migrate, migrateDown } from './db/migrate';
import { runQueryAndStore } from './executor';

export const run = async () => {
  await migrate();

  const queryName = process.argv[2] && process.argv[2] + '.ts';
  const queries = readdirSync(__dirname + '/query')
    .filter(file => file.endsWith('.ts') && (!queryName || file.endsWith(queryName)))
    .map(file => runQueryAndStore(file));

  await Promise.all(queries);
  await shutdown();
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
