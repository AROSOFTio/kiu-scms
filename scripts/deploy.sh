#!/bin/bash

# SCMS Deployment Script
# Usage: ./scripts/deploy.sh
set -euo pipefail

APP_DIR=${APP_DIR:-/www/wwwroot/kiuscms.arosoft.io}

echo "Starting KIU SCMS Production Deployment in ${APP_DIR}..."

echo "🚀 Starting SCMS Production Deployment in /www/wwwroot/scms.arosoft.io..."

# 1. Verification
if [ ! -f ".env" ]; then
    echo "❌ CRITICAL ERROR: .env file is missing in the root directory!"
    echo "Please copy .env.production.example to .env and configure it before deploying."
    exit 1
fi

# 2. Pull latest changes safely
echo "📥 Pulling latest code from git repository..."
git fetch --all --prune
git pull --ff-only origin main

# 3. Securely Rebuild and restart containers
echo "🏗️ Rebuilding production containers..."
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

${COMPOSE_CMD} -f docker-compose.prod.yml up -d --build

# 4. Apply Database Migrations (Staff Roles & Dept Officer)
echo "📥 Applying database schema updates..."
echo "Database schema import is not automated in aaPanel mode."
echo "For first-time setup, import database/init.sql into the aaPanel MySQL database manually."

# 5. Clean up unused and dangling images to save server disk space
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "Your application should now be securely responding on port ${FRONTEND_PORT:-3001} internally."
echo "Configure aaPanel reverse proxy to http://127.0.0.1:${FRONTEND_PORT:-3001}"
exit 0

echo "✅ Deployment sequence completed successfully!"
echo "🌐 Your application should now be securely responding on port 8086 internally."
