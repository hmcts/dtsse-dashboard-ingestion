# DTSSE Reset Local Skill

Interactive skill to reset and clean up local development Docker containers and images for the DTSSE dashboard ingestion app.

## Trigger Phrases

This skill activates when users ask:
- "How do I reset the local environment?"
- "Reset database"
- "Reset local setup"
- "Clean up local containers"
- "Remove local database"
- "Start fresh"
- "Reset ingestion app"
- "Clean local environment"

## Workflow

The skill guides users through a safe cleanup process with confirmation prompts:

### Detection Phase
1. **Find PostgreSQL Container** — Searches for `dtsse-ingestion-postgres`
2. **Find Ingestion App Container** — Searches for `dtsse-ingestion-app`
3. **Find Ingestion App Image** — Searches for `dtsse/dashboard-ingestion` images

### Cleanup Phase (User Confirms Each Step)
1. **Remove PostgreSQL Container** — Confirms before stopping and removing
2. **Remove App Container** — Confirms before stopping and removing
3. **Remove App Image** — Confirms before removing image
4. **Remove Docker Network** — Confirms before removing `dtsse-net`
5. **Remove .env File** — Confirms before removing Key Vault credentials
6. **Remove Secrets Directory** — Confirms before removing mounted secrets

## What Gets Cleaned

- Stops and removes `dtsse-ingestion-postgres` container
- Stops and removes `dtsse-ingestion-app` container
- Removes local `dtsse/dashboard-ingestion` images
- Optionally removes Docker network `dtsse-net`
- Optionally removes `.env` file (Key Vault credentials)
- Optionally removes `secrets/` directory (Docker mounted secrets)

## Output

After successful cleanup:
- All specified containers removed
- All specified images removed
- Ready to start fresh with `./scripts/01-azure-login.sh`
