const DBMigrate = require('db-migrate');

const ssl = process.env.DATABASE_URL?.includes('sslmode=require') && { require: 'true' };
const instance = DBMigrate.getInstance(true, {
  config: {
    dev: {
      use_env_variable: 'DATABASE_URL',
      ssl,
      schema: 'github',
    },
    cmdOptions: {
      'sql-file': true,
    },
  },
});

export const migrate = async () => {
  await instance.up();
};

export const migrateDown = async () => {
  await instance.down();
};

export const create = async () => {
  await instance.create(process.argv[3]);
};

if (process.argv[2] === 'create') {
  create().catch(console.error);
} else if (process.argv[2] === 'down') {
  migrateDown().catch(console.error);
} else if (process.argv[2] === 'up') {
  migrate().catch(console.error);
}
