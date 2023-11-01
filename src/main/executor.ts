import { shutdownConnectionPool, store } from './db/store';
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
    // Wait for all tasks to complete, successful or not.
    const rejected = (await Promise.allSettled(queries)).filter(result => result.status === 'rejected').map(result => result as PromiseRejectedResult);
    if (rejected.length > 0) {
      throw rejected;
    }
  } finally {
    await shutdownConnectionPool();
  }
};
