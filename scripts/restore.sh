#!/bin/bash

# SCMS Database Restore Script
# Usage: ./restore.sh <backup_file.sql.gz>

if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified."
    echo "Usage: ./restore.sh <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="scms-db-prod"
DB_NAME="scms_db"

echo "📂 Starting database restore from $BACKUP_FILE..."

# 1. Unzip backup
gunzip -c $BACKUP_FILE | docker exec -i $CONTAINER_NAME /usr/bin/mysql -u root --password=kiudbpass!23 $DB_NAME

echo "✅ Restoration completed successfully!"
