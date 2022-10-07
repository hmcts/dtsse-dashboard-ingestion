import { shutdown, store } from './db/store';
import { migrate } from './db/migrate';

export const runQueryAndStore = async (file: string) => {
  const results = await require(__dirname + '/query/' + file).default();
  const queryName = file.replace('.ts', '');

  await store(queryName, results);
};

export const runFiles = async (files: Array<string>) => {
  await migrate();

  const queries = files.map(file => runQueryAndStore(file));

  await Promise.all(queries);
  await shutdown();
};
