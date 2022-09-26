const DBMigrate = require('db-migrate');

export const migrate = async () => {
  const ssl = process.env.DATABASE_URL?.includes('sslmode=require') && { require: 'true' };
  const migrate = DBMigrate.getInstance(true, {
    config: {
      dev: {
        use_env_variable: 'DATABASE_URL',
        ssl,
        schema: 'github',
      },
    },
  });

  await migrate.up();
};
