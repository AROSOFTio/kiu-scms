#!/bin/bash

# SCMS Database Restore Script
# Usage: ./scripts/restore.sh <backup_file.sql.gz>

if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified."
    echo "Usage: ./scripts/restore.sh backups/<backup_file.sql.gz>"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ Error: .env file missing. Cannot extract credentials."
    exit 1
fi

set -a
source .env
set +a

BACKUP_FILE=$1
CONTAINER_NAME="scms-db-prod"

echo "📂 Warning: This will overwrite the live database from $BACKUP_FILE!"
read -p "Are you absolutely sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 1
fi

echo "📂 Starting database restore..."

# Execute Restoration
gunzip -c $BACKUP_FILE | docker exec -i $CONTAINER_NAME /usr/bin/mysql -u root --password="${DB_ROOT_PASSWORD}" ${DB_NAME}

echo "✅ Restoration completed forcefully and successfully!"
