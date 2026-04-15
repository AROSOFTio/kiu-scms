#!/bin/bash

# SCMS Database Restore Script
# Usage: ./scripts/restore.sh <backup_file.sql.gz>
set -euo pipefail

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

if [ -z "${DB_HOST:-}" ] || [ -z "${DB_PORT:-}" ] || [ -z "${DB_NAME:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PASSWORD:-}" ]; then
    echo "Database connection settings are incomplete in .env"
    exit 1
fi

echo "📂 Warning: This will overwrite the live database from $BACKUP_FILE!"
read -p "Are you absolutely sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 1
fi

echo "📂 Starting database restore..."

# Execute Restoration
gunzip -c $BACKUP_FILE | docker run --rm -i \
  --add-host=host.docker.internal:host-gateway \
  mysql:8.0 \
  sh -c "mysql -h \"${DB_HOST}\" -P \"${DB_PORT}\" -u \"${DB_USER}\" -p\"${DB_PASSWORD}\" \"${DB_NAME}\""

echo "✅ Restoration completed forcefully and successfully!"
