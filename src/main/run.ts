import { readdirSync } from 'fs';
import { store } from './appinsights';

const runQueryAndStore = async (file: string) => {
  const results = await require(__dirname + '/query/' + file).default();
  const queryName = file.replace('.ts', '');

  store(queryName, results);
};

const queries = readdirSync(__dirname + '/query')
  .filter(file => file.endsWith('.ts'))
  .map(file => runQueryAndStore(file));

Promise.all(queries).catch(console.error);
