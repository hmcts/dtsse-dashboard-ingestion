import { store } from './db/store';

export const runQueryAndStore = async (file: string) => {
  const results = await require(__dirname + '/query/' + file).default();
  const queryName = file.replace('.ts', '');

  await store(queryName, results);
};
