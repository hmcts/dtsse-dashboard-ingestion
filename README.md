# dtsse-dashboard-ingestion

K8S job to import data to the DTSSE dashboard database.

## Getting Started

### Prerequisites

Running the script requires the following tools to be installed in your environment:

- [Node.js](https://nodejs.org/) v18.0.0 or later
- [yarn](https://yarnpkg.com/) v3.6.4
- [Docker](https://www.docker.com) Optional
- [Nvm](https://github.com/nvm-sh/nvm) To manage node versions
- [Postgres](https://www.postgresql.org/download/) 

### Running the script

Install dependencies by executing the following command:

```bash
$ yarn install
```

Test:

```bash
$ yarn test
```

Run:

```bash
$ yarn start
```

### Local environment variables

To run the script locally you will need some environment variables set in `.env`:

```dotenv
GITHUB_TOKEN=[your github token]
DATABASE_URL=postgres://localhost:5432/dashboard
COSMOS_KEY=[your token]
SONAR_TOKEN=[your token]
SNOW_USERNAME=[your username]
SNOW_PASSWORD=[your password]
```

You will also need to have a local postgres database running on port 5432 with a database called `dashboard` and a schema called `github`.

## Developing

### Queries and Interdependent Query

#### Former Query (Deprecated)
All queries in `./src/main/query` will be executed and the rows returned will be persisted in the database. The `store` function expects a
table with the file name of the query to have been created with the migration scripts. Hyphens will be converted to underscores, so results from
`query/github.pull-request.ts` will be stored in the `github.pull_request` table.

To run an individual query use:

```bash
yarn start:dev [your-query-file-name] # e.g. yarn start:dev pull-request
```

#### One query for all with Interdependent

Because over time the queries became interdependent it's better to use only this query and comment out what not needed in interdependent.ts
```bash
yarn start:dev [your-query-file-name] # e.g. yarn start:dev interdependent
```

### Migrations

Run: `yarn migration:create [name]` to create a new migration.

Migrations are automatically run when before the queries are executed.

To roll back a migration run: `Run: `yarn migration:down [name]`.

### Code style

We use [ESLint](https://github.com/typescript-eslint/typescript-eslint)

Running the linting with auto fix:

```bash
$ yarn lint --fix
```

### Running the tests

This template app uses [Jest](https://jestjs.io//) as the test engine. You can run unit tests by executing
the following command:

```bash
$ yarn test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
