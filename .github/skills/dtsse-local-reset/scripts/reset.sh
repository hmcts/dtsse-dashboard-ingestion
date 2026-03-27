#!/bin/bash

# DTSSE Local Reset Script
# Safely removes local Docker containers and images for a fresh start

set -e

confirm() {
    local prompt_msg="$1"
    local response
    
    while true; do
        read -p "$prompt_msg (y/n): " response
        case "$response" in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer y or n.";;
        esac
    done
}

# Find and remove PostgreSQL container
remove_postgres_container() {
    echo "Checking for PostgreSQL container..."
    
    local pg_container=$(docker ps -a --filter "name=dtsse-ingestion-postgres" --quiet)
    
    if [ -z "$pg_container" ]; then
        echo "No PostgreSQL container found"
        return 0
    fi
    
    echo ""
    echo "Found PostgreSQL container:"
    docker ps -a --filter "name=dtsse-ingestion-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    if confirm "Remove this container?"; then
        docker stop "$pg_container" 2>/dev/null || true
        docker rm "$pg_container"
        echo "PostgreSQL container removed"
    else
        echo "Skipped PostgreSQL container removal"
    fi
}

# Find and remove ingestion app container
remove_app_container() {
    echo "Checking for ingestion app container..."
    
    local app_container=$(docker ps -a --filter "name=dtsse-ingestion-app" --quiet)
    
    if [ -z "$app_container" ]; then
        echo "No ingestion app container found"
        return 0
    fi
    
    echo ""
    echo "Found ingestion app container:"
    docker ps -a --filter "name=dtsse-ingestion-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    if confirm "Remove this container?"; then
        docker stop "$app_container" 2>/dev/null || true
        docker rm "$app_container"
        echo "Ingestion app container removed"
    else
        echo "Skipped ingestion app container removal"
    fi
}

# Find and remove ingestion app images
remove_app_images() {
    echo "Checking for ingestion app images..."
    
    local app_images=$(docker images --filter "reference=*dashboard-ingestion*" --quiet)
    
    if [ -z "$app_images" ]; then
        echo "No ingestion app images found"
        return 0
    fi
    
    echo ""
    echo "Found ingestion app images:"
    docker images --filter "reference=*dashboard-ingestion*"
    echo ""
    
    if confirm "Remove these images?"; then
        echo "$app_images" | xargs docker rmi -f
        echo "Ingestion app images removed"
    else
        echo "Skipped image removal"
    fi
}

# Optional: remove Docker network
remove_docker_network() {
    echo "Checking for Docker network..."
    
    local network=$(docker network ls --filter "name=dtsse-net" --quiet)
    
    if [ -z "$network" ]; then
        echo "Docker network 'dtsse-net' not found"
        return 0
    fi
    
    echo ""
    echo "Found Docker network:"
    docker network ls --filter "name=dtsse-net"
    echo ""
    
    if confirm "Remove this network?"; then
        docker network rm "$network"
        echo "Docker network removed"
    else
        echo "Skipped network removal"
    fi
}

# Remove .env file
remove_env_file() {
    echo "Checking for /tmp/.env file..."
    
    if [ ! -f "/tmp/.env" ]; then
        echo "No /tmp/.env file found"
        return 0
    fi
    
    echo ""
    echo "Found /tmp/.env file (contains Key Vault credentials)"
    echo ""
    
    if confirm "Remove /tmp/.env file?"; then
        rm "/tmp/.env"
        echo "/tmp/.env file removed"
    else
        echo "Skipped /tmp/.env removal"
    fi
}

# Remove secrets directory
remove_secret_directory() {
    echo "Checking for /tmp/dashboard-secrets directory..."
    
    if [ ! -d "/tmp/dashboard-secrets" ]; then
        echo "No /tmp/dashboard-secrets directory found"
        return 0
    fi
    
    echo ""
    echo "Found /tmp/dashboard-secrets directory"
    ls -la /tmp/dashboard-secrets/ 2>/dev/null || true
    echo ""
    
    if confirm "Remove /tmp/dashboard-secrets directory?"; then
        rm -rf "/tmp/dashboard-secrets"
        echo "/tmp/dashboard-secrets directory removed"
    else
        echo "Skipped secrets directory removal"
    fi
}

# Main execution
main() {
    echo "This script will help you reset your local DTSSE environment."
    echo ""
    echo "NOTE: Your source code WILL NOT be affected."
    echo ""
    echo "Starting cleanup process..."
    echo ""
    
    remove_postgres_container
    echo ""
    
    remove_app_container
    echo ""
    
    remove_app_images
    echo ""
    
    if confirm "Remove Docker network 'dtsse-net'?"; then
        remove_docker_network
    fi
    echo ""
    
    remove_env_file
    echo ""
    
    remove_secret_directory
    
    echo ""
    echo "Cleanup complete!"
    echo ""
    echo "To start fresh, run:"
    echo "  ./scripts/01-azure-login.sh"
    echo "  ./scripts/02-fetch-keyvault.sh"
    echo "  ./scripts/03-run-app.sh"
    echo ""
}

# Run main
main "$@"
