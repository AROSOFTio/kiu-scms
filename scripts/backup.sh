#!/bin/bash

# SCMS Database Backup Script
# Usage: ./scripts/backup.sh

# 1. Check for environments
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file missing. Cannot extract credentials."
    exit 1
fi

set -a
source .env
set +a

# 2. Variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="scms_backup_$TIMESTAMP.sql"
CONTAINER_NAME="scms-db-prod"

if [ -z "$DB_NAME" ] || [ -z "$DB_ROOT_PASSWORD" ]; then
    echo "❌ Error: DB_NAME or DB_ROOT_PASSWORD not set in .env"
    exit 1
fi

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

echo "💾 Starting database backup..."

# 3. Execute isolated mysqldump
docker exec $CONTAINER_NAME /usr/bin/mysqldump -u root --password="${DB_ROOT_PASSWORD}" ${DB_NAME} > $BACKUP_DIR/$BACKUP_NAME

# 4. Compress backup securely
gzip $BACKUP_DIR/$BACKUP_NAME

# 5. Clean up old backups (retention policy limit set to last 7 days)
find $BACKUP_DIR -type f -name("*.gz") -mtime +7 -delete

echo "✅ Backup completed successfully: $BACKUP_DIR/${BACKUP_NAME}.gz"
