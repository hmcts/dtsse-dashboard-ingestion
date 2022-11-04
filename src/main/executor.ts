import { shutdown } from './db/store';
import { migrate } from './db/migrate';

const runFile = async (file: string) => {
  console.log(`Running: ${file}`);
  const startTime = Date.now();

  await require(__dirname + '/query/' + file).run();

  console.log(`Finished: ${file} in ${Date.now() - startTime}ms`);
};

export const runFiles = async (queries: string[], views: string[]) => {
  await migrate();

  try {
    await Promise.all(queries.map(runFile));
    await Promise.all(views.map(runFile));
  } finally {
    await shutdown();
  }
};
