import { shutdown, store } from './db/store';
import { migrate } from './db/migrate';

const runQueryAndStore = async (file: string) => {
  const results = await require(__dirname + '/query/' + file).default();
  const queryName = file.replace('.ts', '');

  if (results.length > 0) {
    await store(queryName, results);
  }
};

export const runFiles = async (files: Array<string>) => {
  await migrate();

  const queries = files.map(file => runQueryAndStore(file));

  await Promise.all(queries);
  await shutdown();
};
