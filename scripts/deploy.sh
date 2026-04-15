#!/bin/bash
# =============================================================
# deploy.sh  —  KIU SCMS Full Production Deployment
# Usage:  cd /www/wwwroot/kiuscms.arosoft.io && bash scripts/deploy.sh
# =============================================================
set -euo pipefail

APP_DIR="/www/wwwroot/kiuscms.arosoft.io"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "======================================================"
echo " 🚀  KIU SCMS Production Deployment"
echo "======================================================"
echo "   Dir: $APP_DIR"
echo ""

# ── 0. Move to project root ───────────────────────────────
cd "$APP_DIR"

# ── 1. Check .env exists ──────────────────────────────────
if [ ! -f ".env" ]; then
  echo "❌ CRITICAL: .env file is missing!"
  echo "   Run:  cp .env.production.example .env"
  echo "   Then fill in DB_PASSWORD and JWT_SECRET before deploying."
  exit 1
fi

# Quick sanity — warn if placeholder values still present
if grep -q "REPLACE_ME\|YOUR_SUPER_SECRET" .env; then
  echo "⚠️  WARNING: .env still contains placeholder values."
  echo "   Edit .env and set real JWT_SECRET and DB_PASSWORD."
fi

echo "✅ [1/6] .env found."

# ── 2. Pull latest code from GitHub ──────────────────────
echo ""
echo "📥 [2/6] Pulling latest code from origin/main..."
git fetch --all --prune
git pull --ff-only origin main
echo "✅ Code up-to-date: $(git log -1 --oneline)"

# ── 3. Ensure iptables allows Docker → MySQL (port 3306) ──
echo ""
echo "🔧 [3/6] Ensuring Docker subnets can reach MySQL on host..."
iptables -C INPUT -s 172.16.0.0/12 -p tcp --dport 3306 -j ACCEPT 2>/dev/null || \
  iptables -I INPUT -s 172.16.0.0/12 -p tcp --dport 3306 -j ACCEPT
echo "✅ iptables rule active for 172.16.0.0/12 → :3306"

# ── 4. Rebuild and restart containers ────────────────────
echo ""
echo "🏗️  [4/6] Building and starting production containers..."
$COMPOSE up -d --build
echo "✅ Containers started."

# ── 5. Health check ──────────────────────────────────────
echo ""
echo "⏳ [5/6] Waiting 5s for backend to initialize..."
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/v1/health || true)
if [ "$HEALTH" = "200" ]; then
  echo "✅ Health check PASSED (HTTP $HEALTH)"
else
  echo "⚠️  Health check returned HTTP $HEALTH — checking backend logs..."
  $COMPOSE logs --tail=30 backend
  echo ""
  echo "👉 If you see DB connection errors, run:"
  echo "   bash scripts/fix-mysql-docker.sh"
  echo "   Then re-run deploy: bash scripts/deploy.sh"
fi

# ── 6. Clean up old images ───────────────────────────────
echo ""
echo "🧹 [6/6] Pruning dangling Docker images..."
docker image prune -f

echo ""
echo "======================================================"
echo " ✅  Deployment complete!"
echo "   Frontend: http://127.0.0.1:3001  (aaPanel proxy → kiuscms.arosoft.io)"
echo "   Backend:  http://127.0.0.1:3001/api/v1/health"
echo ""
echo "   Useful commands:"
echo "   $COMPOSE logs -f backend          # live backend logs"
echo "   $COMPOSE ps                        # container status"
echo "   $COMPOSE exec backend npm run debug:db  # test DB connection"
echo "======================================================"
