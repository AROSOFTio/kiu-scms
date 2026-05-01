#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "======================================================"
echo "  KIU SCMS Production Deployment"
echo "======================================================"
echo "  Root: $ROOT_DIR"
echo

cd "$ROOT_DIR"

if [ ! -f ".env" ]; then
  echo "CRITICAL: .env file is missing."
  echo "Run: cp .env.production.example .env"
  echo "Then set DB_PASSWORD, JWT_SECRET, and FRONTEND_PORT."
  exit 1
fi

set -a
. ./.env
set +a

FRONTEND_PORT="${FRONTEND_PORT:-3001}"
HEALTH_URL="http://127.0.0.1:${FRONTEND_PORT}/health"

if grep -q "REPLACE_ME\|YOUR_SUPER_SECRET\|CHANGE_ME_STRONG_PASSWORD" .env; then
  echo "WARNING: .env still contains placeholder values."
  echo "Update DB_PASSWORD and JWT_SECRET before exposing this deployment."
fi

echo "[1/6] .env loaded."
echo "      FRONTEND_PORT=${FRONTEND_PORT}"

echo
echo "[2/6] Pulling latest code from origin/main..."
git fetch --all --prune
git pull --ff-only origin main
echo "      Current commit: $(git log -1 --oneline)"

echo
echo "[3/6] Ensuring Docker subnets can reach MySQL on the host..."
iptables -C INPUT -s 172.16.0.0/12 -p tcp --dport 3306 -j ACCEPT 2>/dev/null || \
  iptables -I INPUT -s 172.16.0.0/12 -p tcp --dport 3306 -j ACCEPT
echo "      MySQL access rule is active."

echo
echo "[4/6] Building and starting production containers..."
$COMPOSE up -d --build
echo "      Containers started."

echo
echo "[5/6] Waiting for the public container health endpoint..."
for _ in $(seq 1 20); do
  HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
  if [ "$HEALTH_CODE" = "200" ]; then
    echo "      Health check passed at $HEALTH_URL"
    break
  fi
  sleep 3
done

HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
if [ "$HEALTH_CODE" != "200" ]; then
  echo "WARNING: health check returned HTTP $HEALTH_CODE"
  echo "Frontend logs:"
  $COMPOSE logs --tail=40 frontend || true
  echo
  echo "Backend logs:"
  $COMPOSE logs --tail=40 backend || true
fi

echo
echo "[6/6] Pruning dangling Docker images..."
docker image prune -f

echo
echo "======================================================"
echo "Deployment complete."
echo "Frontend target: http://127.0.0.1:${FRONTEND_PORT}"
echo "Health check:    ${HEALTH_URL}"
echo
echo "Useful commands:"
echo "$COMPOSE ps"
echo "$COMPOSE logs -f frontend"
echo "$COMPOSE logs -f backend"
echo "======================================================"
