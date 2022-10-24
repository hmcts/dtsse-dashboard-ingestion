import { shutdown, store } from './db/store';
import { migrate } from './db/migrate';

const runQueryAndStore = async (file: string) => {
  console.log(`Running query: ${file}`);
  const startTime = Date.now();
  const results = await require(__dirname + '/query/' + file).run();
  const queryName = file.replace('.ts', '');

  if (results.length > 0) {
    await store(queryName, results);
  }

  console.log(`Finished query: ${file} in ${Date.now() - startTime}ms`);
};

export const runFiles = async (files: Array<string>) => {
  await migrate();

  const queries = files.map(file => runQueryAndStore(file));

  try {
    await Promise.all(queries);
  } finally {
    await shutdown();
  }
};
