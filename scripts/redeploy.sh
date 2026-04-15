#!/bin/bash
# SCMS Redeployment Script (Docker)
set -euo pipefail

echo "🚀 Starting Redeployment..."

# Pull latest changes
exec bash ./scripts/deploy.sh

# Build and restart containers
docker-compose down
docker-compose up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to initialize..."
until docker exec scms-db mysqladmin ping -h localhost --silent; do
    sleep 2
done

# Apply database migration
echo "📥 Applying Staff Role migration..."
docker exec -i scms-db mysql -u kiu_user -pkiupass!123 scms_db < database/migrations/001_add_dept_officer.sql

echo "✅ Deployment Successful!"
