import { Pool } from 'pg';
import { config } from '../config';
import format from 'pg-format';

export const pool = new Pool({ connectionString: config.dbUrl });

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
    .map(key => `EXCLUDED.${key}`)
    .join(', ');

  const sql = format(`INSERT INTO ${tableName} (${keys}) VALUES %L ON CONFLICT(id) DO UPDATE SET (${keys}) = (${excluded})`, rows);

  try {
    await client.query(sql, []);
    await client.query(format(`VACUUM FULL ${tableName}`));
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
