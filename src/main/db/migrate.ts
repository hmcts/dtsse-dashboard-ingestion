const DBMigrate = require('db-migrate');

export interface Migrator {
  migrate(): Promise<void>;
  migrateDown(): Promise<void>;
  create(): Promise<void>;
}

export const instance = (): Migrator => {
  const ssl = process.env.DATABASE_URL?.includes('sslmode=require') && { require: 'true' };
  const instance = DBMigrate.getInstance(true, {
    config: {
      dev: {
        driver: 'pg',
        use_env_variable: 'DATABASE_URL',
        ssl,
        schema: 'github',
      },
    },
    cmdOptions: {
      'sql-file': true,
    },
  });
  return {
    migrate: async () => {
      await instance.up();
    },

    migrateDown: async () => {
      await instance.down();
    },

    create: async () => {
      instance.internals.argv._ = [];
      await instance.create(process.argv[4]);
    },
  };
};
