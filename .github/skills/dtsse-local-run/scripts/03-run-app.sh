#!/bin/bash

# Step 3: Run Application
# This script runs the DTSSE ingestion app either with Node.js or Docker

set -e

echo "=========================================="
echo "DTSSE Dashboard Ingestion - Local Setup"
echo "Step 3: Run Application"
echo "=========================================="
echo ""

# Node.js run function
run_nodejs() {
    echo ""
    echo "Running with Node.js..."
    echo ""

    DATABASE_URL="postgres://postgres:mysecretpassword@localhost:5432/dashboard"

    echo "Using PostgreSQL URL: $DATABASE_URL"

    echo "Installing dependencies..."
    yarn install

    echo ""
    echo "Starting application with: yarn start:dev"
    echo ""

    export DATABASE_URL
    export GITHUB_TOKEN
    export COSMOS_KEY
    export COSMOS_DB_NAME
    export JENKINS_DATABASES
    export DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL

    yarn start:dev
}

# Docker run function
run_docker() {
    echo ""
    echo "Running with Docker..."
    echo ""

    DATABASE_URL="postgres://postgres:mysecretpassword@dtsse-ingestion-postgres:5432/dashboard"
    export DATABASE_URL

    echo "Using PostgreSQL URL: $DATABASE_URL"

    # Create secrets directory
    echo "Creating secrets directory..."
    mkdir -p /tmp/dashboard-secrets/dtsse

    echo "$DATABASE_URL" > /tmp/dashboard-secrets/dtsse/db-url
    echo "$GITHUB_TOKEN" > /tmp/dashboard-secrets/dtsse/github-token
    echo "$COSMOS_KEY" > /tmp/dashboard-secrets/dtsse/cosmos-key
    echo "$JENKINS_DATABASES" > /tmp/dashboard-secrets/dtsse/jenkins-databases
    echo "$COSMOS_DB_NAME" > /tmp/dashboard-secrets/dtsse/cosmos-db-name

    echo "Secrets created in /tmp/dashboard-secrets/dtsse/"
    echo ""

    # Create network if it doesn't exist
    echo "Setting up Docker network..."
    docker network create dtsse-net 2>/dev/null || true

    echo ""
    echo "Enter the ACR image tag (e.g., latest, v1.0.0):"
    read -p "Image tag: " IMAGE_TAG
    while [ -z "$IMAGE_TAG" ]; do
        echo "Image tag cannot be empty"
        read -p "Image tag: " IMAGE_TAG
    done

    echo ""
    echo "Starting Docker container..."
    echo ""

    docker_args=(
        --name dtsse-ingestion-app
        --network dtsse-net
        -v /tmp/dashboard-secrets:/mnt/secrets
    )

    if [ -n "$DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL" ]; then
        docker_args+=("-e" "DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL=$DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL")
    fi

    docker run "${docker_args[@]}" "hmctsprod.azurecr.io/dtsse/dashboard-ingestion:$IMAGE_TAG"
}

# Check if .env file exists
if [ ! -f /tmp/.env ]; then
    echo "/tmp/.env file not found!"
    echo "Please run: ./scripts/02-fetch-keyvault.sh"
    exit 1
fi

# Load .env file
set -a
source /tmp/.env
set +a

# Ensure PostgreSQL container is running
echo "Setting up PostgreSQL container..."
docker network create dtsse-net 2>/dev/null || true
docker run --name dtsse-ingestion-postgres \
  --network dtsse-net \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=dashboard \
  -p 5432:5432 \
  -d postgres 2>/dev/null || echo "PostgreSQL container already exists or failed to start"
echo ""

echo "Choose how to run the application:"
echo ""
echo "1) Node.js (for development/feature work)"
echo "2) Docker (production-like image from ACR)"
echo ""

while true; do
    if [ -e /dev/tty ]; then
        read -r -p "Enter your choice (1 or 2): " CHOICE < /dev/tty
    else
        read -r -p "Enter your choice (1 or 2): " CHOICE
    fi

    case "$CHOICE" in
        1|2)
            break
            ;;
        *)
            echo "Invalid choice. Please enter 1 or 2."
            ;;
    esac
done

echo ""
echo "Optional: set DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL (example: 7 day)"
if [ -e /dev/tty ]; then
    read -r -p "Enter lookback interval (press Enter to skip): " DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL < /dev/tty
else
    read -r -p "Enter lookback interval (press Enter to skip): " DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL
fi

if [ -n "$DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL" ]; then
    echo "Using DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL=$DTSSE_INGESTION_FORCE_LOOKBACK_INTERVAL"
else
    echo "No lookback interval override set"
fi
echo ""

case "$CHOICE" in
    1)
        run_nodejs
        ;;
    2)
        run_docker
        ;;
esac

