#!/bin/bash

# Step 1: Azure Authentication
# This script authenticates with Azure and ACR

set -e

echo "=========================================="
echo "DTSSE Dashboard Ingestion - Local Setup"
echo "Step 1: Azure Authentication"
echo "=========================================="
echo ""
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
