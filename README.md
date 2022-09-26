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

## Developing

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
