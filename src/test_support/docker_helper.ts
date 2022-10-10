import { StartedTestContainer, PostgreSqlContainer } from 'testcontainers';

let container: StartedTestContainer;

export const startPostgres = async () => {
  container = await new PostgreSqlContainer('postgres:11')
    .withUsername('postgres')
    .withPassword('postgres')
    .withExposedPorts(5432)
    .withDatabase('dashboard')
    .start();

  process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:${container.getMappedPort(5432)}/dashboard`;
};

export const stopPostgres = async () => {
  container.stop();
};
