#!/bin/bash
set -euo pipefail

APP_DIR="/www/wwwroot/kiuscms.arosoft.io"
COMPOSE="docker compose -f docker-compose.prod.yml"

cd "$APP_DIR"

git pull --ff-only origin main
$COMPOSE up -d --build
$COMPOSE ps
