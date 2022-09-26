# dtsse-dashboard-github-ingestion

K8S job to import stats from Github to the DTSSE dashboard database.

## Getting Started

### Prerequisites

Running the script requires the following tools to be installed in your environment:

- [Node.js](https://nodejs.org/) v16.0.0 or later
- [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com)

### Running the script

Install dependencies by executing the following command:

```bash
$ yarn install
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
```

You will also need to have a local postgres database running on port 5432 with a database called `dashboard` and a schema called `github`.

## Developing

### Queries

All queries in `./src/main/query` will be executed and the rows returned will be persisted in the database. The `store` function expects a
table with the file name of the query to have been created with the migration scripts. Hyphens will be converted to underscores, so results from
`query/open-pull-requests.ts` will be stored in the `open_pull_requests` table.

### Migrations

Run: `yarn migratation:generate [name]` to create a new migration.

Migrations are automatically run when before the queries are executed.

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
