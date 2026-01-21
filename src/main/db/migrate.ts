const DBMigrate = require('db-migrate');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ssl = process.env.DATABASE_URL?.includes('sslmode=require') && { require: 'true' };
const instance = DBMigrate.getInstance(true, {
  config: {
    dev: {
      use_env_variable: 'DATABASE_URL',
      ssl,
    },
  },
  cmdOptions: {
    'sql-file': true,
  },
});

export const migrate = async () => {
  // Debug: Log available migration files
  const migrationsDir = path.join(process.cwd(), 'migrations');
  try {
    const files = fs.readdirSync(migrationsDir).filter((f: string) => f.endsWith('.js')).sort();
    console.log(`[DEBUG] Found ${files.length} migration files in ${migrationsDir}`);
    console.log(`[DEBUG] Last 5 migration files: ${files.slice(-5).join(', ')}`);
  } catch (err) {
    console.error(`[DEBUG] Error reading migrations dir:`, err);
  }
  
  // Debug: Check what's in the migrations table
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const result = await client.query('SELECT COUNT(*) as count, MAX(id) as max_id, (SELECT name FROM migrations ORDER BY id DESC LIMIT 1) as last_name FROM migrations');
    console.log(`[DEBUG] DB migrations table: ${result.rows[0].count} records, last id: ${result.rows[0].max_id}, last name: ${result.rows[0].last_name}`);
    await client.end();
  } catch (err) {
    console.error(`[DEBUG] Error querying migrations table:`, err);
  }
  
  await instance.up();
};

export const migrateDown = async () => {
  await instance.down();
};

export const create = async () => {
  instance.internals.argv._ = [];
  await instance.create(process.argv[4]);
};
