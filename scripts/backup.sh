#!/bin/bash

# SCMS Database Backup Script
# Usage: ./backup.sh

# 1. Variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="scms_backup_$TIMESTAMP.sql"
CONTAINER_NAME="scms-db-prod"
DB_NAME="scms_db"
DB_USER=$(grep DB_USER .env | cut -d '=' -f2) # Try to extract from .env if available
DB_PASS=$(grep DB_PASSWORD .env | cut -d '=' -f2)

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

echo "💾 Starting database backup..."

# 2. Execute mysqldump
docker exec $CONTAINER_NAME /usr/bin/mysqldump -u root --password=kiudbpass!23 $DB_NAME > $BACKUP_DIR/$BACKUP_NAME

# 3. Compress backup
gzip $BACKUP_DIR/$BACKUP_NAME

# 4. Clean up old backups (keep last 7 days)
find $BACKUP_DIR -type f -name "*.gz" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR/${BACKUP_NAME}.gz"
