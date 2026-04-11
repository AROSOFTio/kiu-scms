#!/bin/bash

# SCMS Deployment Script
# Usage: ./scripts/deploy.sh

echo "🚀 Starting SCMS Production Deployment in /www/wwwroot/scms.arosoft.io..."

# 1. Verification
if [ ! -f ".env" ]; then
    echo "❌ CRITICAL ERROR: .env file is missing in the root directory!"
    echo "Please copy .env.production.example to .env and configure it before deploying."
    exit 1
fi

# 2. Pull latest changes safely
echo "📥 Pulling latest code from git repository..."
git reset --hard
git pull origin main

# 3. Securely Rebuild and restart containers
echo "🏗️ Rebuilding production containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Apply Database Migrations (Staff Roles & Dept Officer)
echo "📥 Applying database schema updates..."
docker exec -i scms-db-prod mysql -u root -pkiudbpass!23 scms_db < database/migrations/001_add_dept_officer.sql

# 5. Clean up unused and dangling images to save server disk space
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Deployment sequence completed successfully!"
echo "🌐 Your application should now be securely responding on port 8086 internally."
