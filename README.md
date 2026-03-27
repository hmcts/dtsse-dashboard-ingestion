# dtsse-dashboard-ingestion

Kubernetes job to import data into the DTSSE dashboard database.

## Getting started

### Prerequisites

Install the following tools in your environment:

- [Node.js](https://nodejs.org/) v18.0.0 or later
- [yarn](https://yarnpkg.com/) v3.6.4
- [Docker](https://www.docker.com) (optional)
- [nvm](https://github.com/nvm-sh/nvm) (optional, or any Node.js version manager)
- [PostgreSQL](https://www.postgresql.org/download/) (optional, if not using Docker)

### Infrastructure

Grafana, Key Vault, and dashboard configuration that depend on this ingestion app are managed in the [grafana-infrastructure repository](https://github.com/hmcts/grafana-infrastructure/).

### Install dependencies

```bash
yarn install
```

### Run tests

```bash
yarn test
```

## Running locally

### Agent skills

This repository includes GitHub Copilot Skills to automate the local setup process. Skills are automatically loaded when you open this repository in VS Code with the [GitHub Copilot extension](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) installed.

#### How to use the skills

Skills should be automatically picked up by the Copilot but you can also use slash commands imn the Copilot chat:

- /dtsse-local-run
- /dtsse-local-reset

#### Available skills

| Skill | Purpose | Trigger phrases |
|-------|---------|-----------------|
| **DTSSE Local Run** | Automated setup: Azure auth → Key Vault credentials → local run | "How do I run the app locally?", "Help me run this locally", "Set up local environment" |
| **DTSSE Reset Local** | Clean up containers and reset the database | "Reset local", "Clean up Docker" |

### Manually

Set the following values in `.env`:

```dotenv
GITHUB_TOKEN=[Your GitHub token, or token from the AAT DTSSE Key Vault]
DATABASE_URL=[URL of your local PostgreSQL database]
COSMOS_KEY=[Your Cosmos DB key, or key from the AAT DTSSE Key Vault]
COSMOS_DB_NAME=[Cosmos DB name, e.g. sandbox-pipeline-metrics]
SONAR_TOKEN=[From Key Vault; not required for basic CVE/suppressions ingestion]
SNOW_USERNAME=[No longer used]
SNOW_PASSWORD=[No longer used]
```

Running directly against shared environments (for example AAT) is not recommended, as it can cause side effects for others.
Use a local PostgreSQL instance instead.

### Start a local PostgreSQL container

```bash
# Optional: create a network if using Docker for both Postgres and this app
docker network create dtsse-net

# Run the Postgres container
docker run --name dtsse-ingestion-postgres \
  --network dtsse-net \
  -e POSTGRES_PASSWORD=<mysecretpassword> \
  -e POSTGRES_DB=dashboard \
  -p 5432:5432 \
  -d postgres
```

Stop and remove it when done:

```bash
docker ps
docker stop <container_id>
docker rm <container_id>
```

### Run with Node.js

Useful while developing features before an image is built.

```bash
export DATABASE_URL='postgres://postgres:mysecretpassword@localhost:5432/dashboard' && \
export GITHUB_TOKEN='<github_token_from_dtsse_keyvault>' && \
export COSMOS_KEY='<cosmos_key_from_dtsse_keyvault>' && \
export JENKINS_DATABASES='jenkins,sds-jenkins' && \
export COSMOS_DB_NAME='sandbox-pipeline-metrics' && \
yarn start:dev
```

### Run with an existing ACR image

Useful when you want to run exactly what is deployed in pipeline/environment.

1. Log in to ACR:

```bash
az login
az acr login --name hmctsprod
```

2. Create secrets for mounting into the container:

```bash
mkdir -p ~/dashboard-secrets/dtsse && \
echo 'postgres://postgres:mysecretpassword@localhost:5432/dashboard' > ~/dashboard-secrets/dtsse/db-url && \
echo '<github_token_from_keyvault>' > ~/dashboard-secrets/dtsse/github-token && \
echo '<cosmos_key_from_keyvault>' > ~/dashboard-secrets/dtsse/cosmos-key && \
echo 'jenkins,sds-jenkins' > ~/dashboard-secrets/dtsse/jenkins-databases && \
echo 'sandbox-pipeline-metrics' > ~/dashboard-secrets/dtsse/cosmos-db-name
```

3. Run the container:

```bash
docker run \
  --name dtsse-ingestion-app \
  --network dtsse-net \
  -v ./dashboard-secrets:/mnt/secrets \
  hmctsprod.azurecr.io/dtsse/dashboard-ingestion:<DESIRED-TAG-FROM-HMCTSPROD-ACR>
```

4. Inspect the Postgres database:

```bash
psql -h localhost -U postgres -d dashboard
\d
\dt security.*
\dt cve.*
\dt github.*
```

## Developing

### Queries

#### Former query flow (deprecated)

All queries in `./src/main/query` are executed and persisted to the database.
The `store` function expects a table matching the query file name, created by migrations.
Hyphens are converted to underscores, so `query/github.pull-request.ts` maps to `github.pull_request`.

Run an individual query:

```bash
yarn start:dev [your-query-file-name]
# example: yarn start:dev pull-request
```

#### Interdependent query flow (recommended)

Because queries became interdependent over time, use the interdependent query and comment out what is not needed in `interdependent.ts`.

```bash
yarn start:dev [your-query-file-name]
# example: yarn start:dev interdependent
```

### CVE suppressions

For full documentation, see [docs/CVE-SUPPRESSIONS.md](./docs/CVE-SUPPRESSIONS.md).

### Migrations

Create a new migration:

```bash
yarn migration:create [name]
```

Migrations run automatically before queries are executed.

Roll back a migration:

```bash
yarn migration:down [name]
```

### Code style

Linting uses [ESLint](https://github.com/typescript-eslint/typescript-eslint).

Run with auto-fix:

```bash
yarn lint --fix
```

### Tests

Tests use [Jest](https://jestjs.io/).

```bash
yarn test
```

### Increasing reporting interval

If you need to gather reports from a wider timeframe that normally you can use this environment variable:

DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL='X day'

It will cause the unix time query to be overwritten so that reports from a much wider time interval are gathered.
This is useful when you need to test something on AAT but no recent reports with suitable data (such as suppressions or cves exist).
Not recommended to use in production as the number of reports could overwhelm the app.

## Updating repository ownership

In the DTSSE dashboard database, repositories are assigned a `team_id`.
This determines repository ownership and the team grouping used in Grafana reporting.

As repository ownership can change, an Azure Pipeline is available to update `team_id` for specific repositories.

To update `team_id`:

- Go to the [Azure DevOps Pipeline](https://dev.azure.com/hmcts/PlatformOperations/_build?definitionId=1175).
- Click `Run Pipeline` and provide:
  1. GitHub repository URL(s) (comma-separated for multiple repos)
  2. New `team_id` (see list below)
  3. Target environment (determines which database is updated)

This triggers a build and updates the relevant records in the flexible server database.

### `team_id` mappings

| team_id        | Team name                     |
| -------------- | ----------------------------- |
| adoption       | Adoption                      |
| am             | Access Management             |
| bsp            | Bulk Scan and Print           |
| ccd            | CCD                           |
| civil          | Civil Money Claims            |
| cmc            | Old CMC                       |
| da             | Domestic Abuse                |
| div            | Divorce                       |
| em             | Evidence Management           |
| et             | Employment Tribunals          |
| ethos          | ETHOS                         |
| fees-and-pay   | Fees & Pay                    |
| fis            | Family Integration            |
| fpla           | FPLA                          |
| hwf            | Help With Fees                |
| ia             | I & A                         |
| idam           | IDAM                          |
| nfdiv          | No Fault Divorce              |
| prl            | Private Law                   |
| probate        | Probate                       |
| rd             | Ref Data                      |
| rpx            | XUI                           |
| sptribs        | Special Tribunals             |
| sscs           | SSCS                          |
| wa             | Work Allocation               |
| mi             | Management Information        |
| fprl           | Family Private Law            |
| finrem         | Financial Remedy              |
| civil-sdt      | Civil Secure Data Transfer    |
| dtsse          | DTSSE                         |
| platform       | Platform                      |
| ctsc           | CTSC                          |
| fact           | FACT                          |
| lau            | LAU                           |
| pcq            | PCQ                           |
| pre            | Pre-recorded Evidence         |
| rpts           | RPTS                          |
| snl            | Scheduling and Listing        |
| pip            | Publishing & Information      |
| vh             | Video Hearings                |
| et-pet         | Employment Tribunals (Legacy) |
| hmc            | hmc                           |
| other          | Misc other projects           |
| jps            | Judicial Payment Service      |
| cuira          | CUI Reasonable Adjustments    |
| perftest       | Performance Test              |
| appreg         | Applications Register         |
| opal           | Green on Black                |
| pdda           | PDDA                          |
| pdm            | PDM                           |
| courtfines     | Court Fines                   |
| dcs-automation | DCS Automation                |
| juror          | Juror                         |
| mrd            | MRD                           |
| hmi            | Hearing Management Information |

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
