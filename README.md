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

## Updating ownership of a repository

In the dtsse-dashboard database, repositories are assigned a `team_id`. This value is used to determine the owner of the repository and which team it will fall under in Grafana reporting.

As repositories sometimes change ownership, we have created an Azure Pipeline that can be used to update the `team_id` for specific repositories so that they show under the correct team in Grafana.

To update the `team_id` on a repository, follow these steps:

- Navigate to the [Azure DevOps Pipeline](https://dev.azure.com/hmcts/PlatformOperations/_build?definitionId=1175).
- Click `Run Pipeline` and enter:
  1.  The URL(s) of the GitHub repo you want to update (For multiple, use a comma-separated list)
  2.  The new `team_id` (List of current IDs below)
  3.  The environment (Determines which database will be updated)

This will kick of a build and update the appropriate records in the flexible server database.

### Team_id mappings

| Team_id        | Team Name                      |
| -------------- | ------------------------------ |
| adoption       | Adoption                       |
| am             | Access Management              |
| bsp            | Bulk Scan and Print            |
| ccd            | CCD                            |
| civil          | Civil Damages                  |
| cmc            | CMC                            |
| da             | Domestic Abuse                 |
| div            | Divorce                        |
| em             | Evidence Management            |
| et             | Employment Tribunals           |
| ethos          | ETHOS                          |
| fees-and-pay   | Fees & Pay                     |
| fis            | Family Integration             |
| fpla           | FPLA                           |
| hwf            | Help With Fees                 |
| ia             | I & A                          |
| idam           | IDAM                           |
| nfdiv          | No Fault Divorce               |
| prl            | Private Law                    |
| probate        | Probate                        |
| rd             | Ref Data                       |
| rpx            | XUI                            |
| sptribs        | Special Tribunals              |
| sscs           | SSCS                           |
| wa             | Work Allocation                |
| mi             | Management Information         |
| fprl           | Family Private Law             |
| finrem         | Financial Remedy               |
| civil-sdt      | Civil Secure Data Transfer     |
| dtsse          | DTSSE                          |
| platform       | Platform                       |
| ctsc           | CTSC                           |
| fact           | FACT                           |
| lau            | LAU                            |
| pcq            | PCQ                            |
| pre            | Pre-recorded Evidence          |
| rpts           | RPTS                           |
| snl            | Scheduling and Listing         |
| pip            | Publishing & Information       |
| vh             | Video Hearings                 |
| et-pet         | Employment Tribunals (Legacy)  |
| hmc            | hmc                            |
| other          | Misc other projects            |
| jps            | Judicial Payment Service       |
| cuira          | CUI Reasonable Adjustments     |
| perftest       | Performance Test               |
| appreg         | Applications Register          |
| opal           | Green on Black                 |
| pdda           | PDDA                           |
| pdm            | PDM                            |
| courtfines     | Court Fines                    |
| dcs-automation | DCS Automation                 |
| juror          | Juror                          |
| mrd            | MRD                            |
| hmi            | Hearing Management Information |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
