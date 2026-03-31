# DTSSE Local Run Skill

Interactive skill to help developers run the DTSSE dashboard ingestion app locally with Azure authentication and Key Vault credentials.

## Important
- Do not infer singular/fragmentary commands based on the scripts, scripts are already executable so simply run the scripts as required and allow user to answer prompts.

## Trigger Phrases

This skill activates when users ask:
- "How do I run the app locally?"
- "Help me run this locally"
- "How to run dtsse-dashboard-ingestion locally"
- "Set up local environment"
- "Run app locally"
- "help me run locally for me"

## Workflow

The skill guides users through a three-step interactive journey:

### Pre-check: Existing Credentials
**Before running any script**, check whether `/tmp/.env` already exists:
- If `/tmp/.env` **exists** → skip Steps 1 and 2 entirely and go straight to Step 3.
- If `/tmp/.env` **does not exist** → proceed with Steps 1, 2, and 3 in order.

### Step 1: Azure Authentication
Executes `.github/skills/dtsse-local-run/scripts/01-azure-login.sh` to authenticate with Azure and ACR.

**Actions:**
- Run `az login` to authenticate with Azure
- Run `az acr login --name hmctsprod` to authenticate with Azure Container Registry

### Step 2: Fetch Key Vault Credentials
Executes `.github/skills/dtsse-local-run/scripts/02-fetch-keyvault.sh` to retrieve credentials from Azure Key Vault.

**Actions:**
- Prompt user for Key Vault name (required)
- Prompt user for subscription ID or name (if needed for context switching)
- Fetch the following secrets:
  - `github-token`
  - `cosmos-key`
  - `cosmos-db-name`
  - `jenkins-databases`

**Output:**
- Creates or updates `/tmp/.env` file with fetched credentials (cleared on reboot by the OS)

### Step 3: Run Application
Executes `.github/skills/dtsse-local-run/scripts/03-run-app.sh` to start the application.

**Actions:**
- Prompt user to choose: **Node.js** or **Docker**
  - **Node.js**: Uses fetched credentials to run `yarn start:dev`
  - **Docker**: Creates secrets directory at `/tmp/dashboard-secrets/dtsse/` and runs ACR image with mounted secrets
- Prompt user to optionally set `DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL` for testing purposes.

**Prerequisites for Node.js path:**
- Node.js v18.0.0 or later
- yarn v3.6.4 or later
- Docker running (for PostgreSQL container)

**Prerequisites for Docker path:**
- Docker running locally

**Note:** PostgreSQL container is automatically started by the script. If startup fails, use the `dtsse-reset-local` skill to clean up Docker resources and retry.

## Environment Setup

After successful execution, developers will have:
- Azure CLI authenticated
- ACR access enabled
- `/tmp/.env` file with Key Vault credentials (stored in /tmp, cleared on reboot)
- Application running via their preferred runtime (Node.js or Docker)

## Notes

Ignore errors in the app output, allow the user to deal with them if they desire so, once the app executes this skill is complete. The skill's purpose is to get the user authenticated and running locally, not to troubleshoot app errors.