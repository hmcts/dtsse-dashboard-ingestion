const DBMigrate = require('db-migrate');

export const migrate = async () => {
  const migrate = DBMigrate.getInstance(true);

  await migrate.up();
};
