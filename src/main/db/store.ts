import { Pool } from 'pg';
import { config } from '../config';
import format from 'pg-format';

const pool = new Pool({ connectionString: config.dbUrl, options: '-c search_path=github' });

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const store = async (name: string, values: InsertRow[]) => {
  const client = await pool.connect();
  const tableName = name.replaceAll('-', '_');
  const rows = values.map(values => Object.values(values));
  const keys = Object.keys(values[0]).join(', ');
  const excluded = Object.keys(values[0])
    .map(key => `${key} = EXCLUDED.${key}`)
    .join(', ');
  const sql = format(`INSERT INTO %I (${keys}) VALUES %L ON CONFLICT(id) DO UPDATE SET ${excluded}`, tableName, rows);

  try {
    await client.query(sql, []);
  } catch (err) {
    console.error(`Error executing: ${sql}`);
    console.error(err.stack);
  } finally {
    client.release();
  }
};

export const shutdown = async () => {
  await pool.end();
};

export type InsertRow = Record<string, string | number | boolean | null | Date>;
