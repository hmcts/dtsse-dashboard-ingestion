import { readdirSync } from 'fs';
import { shutdown, store } from './db/store';
import { create, migrate, migrateDown } from './db/migrate';

const runQueryAndStore = async (file: string) => {
  const results = await require(__dirname + '/query/' + file).default();
  const queryName = file.replace('.ts', '');

  await store(queryName, results);
};

const run = async () => {
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
