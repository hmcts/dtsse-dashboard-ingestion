const DBMigrate = require('db-migrate');

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
  await instance.up();
};

export const migrateDown = async () => {
  await instance.down();
};

export const create = async () => {
  instance.internals.argv._ = [];
  await instance.create(process.argv[4]);
};
