#!/bin/bash

# Step 1: Azure Authentication
# This script authenticates with Azure and ACR

set -e

echo "=========================================="
echo "DTSSE Dashboard Ingestion - Local Setup"
echo "Step 1: Azure Authentication"
echo "=========================================="
echo ""

# Skip if credentials already exist
if [ -f "/tmp/.env" ]; then
    echo "/tmp/.env already exists — skipping Azure login."
    echo "To re-authenticate, delete /tmp/.env and re-run this script."
    echo ""
    exit 0
fi

echo ""
echo "Step 1a: Authenticating with Azure..."
echo ""
az login

echo ""
echo "Step 1b: Authenticating with Azure Container Registry (ACR)..."
echo ""
az acr login --name hmctsprod

echo ""
echo "Azure authentication complete!"
echo ""
