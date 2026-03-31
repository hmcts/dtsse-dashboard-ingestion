#!/bin/bash

# Step 2: Fetch Key Vault Credentials
# This script retrieves secrets from Azure Key Vault and creates .env file

set -e

echo "=========================================="
echo "DTSSE Dashboard Ingestion - Local Setup"
echo "Step 2: Fetch Key Vault Credentials"
echo "=========================================="
echo ""

# Skip if credentials already exist
if [ -f "/tmp/.env" ]; then
    echo "/tmp/.env already exists — skipping Key Vault fetch."
    echo "To refresh credentials, delete /tmp/.env and re-run this script."
    echo ""
    exit 0
fi

# Prompt for Key Vault name
read -p "Enter Key Vault name: " KV_NAME
if [ -z "$KV_NAME" ]; then
    echo "Key Vault name cannot be empty"
    exit 1
fi 

# Optional: Prompt for subscription
read -p "Enter subscription ID or name (press Enter to skip): " SUBSCRIPTION
if [ -n "$SUBSCRIPTION" ]; then
    az account set --subscription "$SUBSCRIPTION"
fi

echo ""
echo "Fetching secrets from Key Vault: $KV_NAME"
echo ""

echo "Fetching github-token..."
GITHUB_TOKEN=$(az keyvault secret show --vault-name "$KV_NAME" --name "github-token" --query "value" -o tsv 2>/dev/null)

echo "Fetching cosmos-key..."
COSMOS_KEY=$(az keyvault secret show --vault-name "$KV_NAME" --name "cosmos-key" --query "value" -o tsv 2>/dev/null)

echo "Fetching cosmos-db-name..."
COSMOS_DB_NAME=$(az keyvault secret show --vault-name "$KV_NAME" --name "cosmos-db-name" --query "value" -o tsv 2>/dev/null)

echo "Fetching jenkins-databases..."
JENKINS_DATABASES=$(az keyvault secret show --vault-name "$KV_NAME" --name "jenkins-databases" --query "value" -o tsv 2>/dev/null)

# Create .env file
echo ""
echo "Creating /tmp/.env file..."
cat > /tmp/.env << EOF
GITHUB_TOKEN=$GITHUB_TOKEN
COSMOS_KEY=$COSMOS_KEY
COSMOS_DB_NAME=$COSMOS_DB_NAME
JENKINS_DATABASES=$JENKINS_DATABASES
EOF

echo "Credentials fetched and /tmp/.env file created!"
echo ""
echo "Note: secrets are stored in /tmp/.env and will be cleared by the OS on reboot"
echo ""
