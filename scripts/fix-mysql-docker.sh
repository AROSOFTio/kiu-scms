#!/bin/bash
# =============================================================
# fix-mysql-docker.sh
# Run ONCE as root on the server after first deploy.
# Fixes aaPanel MySQL so Docker containers can connect to it.
# =============================================================
set -euo pipefail

echo "=============================================="
echo " KIU SCMS — MySQL ↔ Docker Network Fix"
echo "=============================================="

# ── 1. Open iptables for all Docker bridge subnets → port 3306 ────────────
echo ""
echo "🔧 [1/3] Opening iptables for Docker → MySQL (port 3306)..."

# Docker uses 172.16.0.0/12 as its default range
iptables -I INPUT -s 172.16.0.0/12 -p tcp --dport 3306 -j ACCEPT
iptables -I INPUT -s 192.168.0.0/16 -p tcp --dport 3306 -j ACCEPT

echo "✅  iptables rules inserted."

# Persist the rules across reboots
if command -v iptables-save &>/dev/null; then
  iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
  iptables-save > /etc/iptables.rules 2>/dev/null || true
  echo "✅  iptables rules persisted."
fi

# ── 2. Fix MySQL bind-address so it accepts connections from Docker ────────
echo ""
echo "🔧 [2/3] Checking MySQL bind-address..."

# Locate the mysql config with bind-address
MYCNF=""
for f in /etc/mysql/mysql.conf.d/mysqld.cnf \
          /etc/mysql/my.cnf \
          /etc/my.cnf \
          /etc/mysql/conf.d/docker.cnf; do
  if [ -f "$f" ] && grep -q "bind-address" "$f"; then
    MYCNF="$f"
    break
  fi
done

if [ -n "$MYCNF" ]; then
  CURRENT=$(grep "bind-address" "$MYCNF" | head -1)
  echo "   Found: $CURRENT  in  $MYCNF"
  # Change bind-address to 0.0.0.0 so Docker can reach it
  sed -i 's/^bind-address\s*=.*/bind-address = 0.0.0.0/' "$MYCNF"
  echo "✅  bind-address set to 0.0.0.0 in $MYCNF"
  echo "🔄 Restarting MySQL..."
  systemctl restart mysql && echo "✅  MySQL restarted." || \
  service mysql restart && echo "✅  MySQL restarted (service)."
else
  echo "⚠️   No bind-address found in standard config files."
  echo "     Manually set bind-address = 0.0.0.0 in aaPanel → Databases → My.cnf"
  echo "     Then restart MySQL from aaPanel."
fi

# ── 3. Grant Docker subnet access to the DB user ──────────────────────────
echo ""
echo "🔧 [3/3] Granting MySQL user access from Docker subnets..."

# Load .env if present
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source <(grep -E '^(DB_USER|DB_PASSWORD|DB_NAME)=' "$ENV_FILE")
fi

DB_USER="${DB_USER:-kiu-scms}"
DB_PASSWORD="${DB_PASSWORD:-GzcWmMW38T5Zmrji}"
DB_NAME="${DB_NAME:-kiu-scms}"

mysql -u root -e "
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'172.%.%.%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'192.168.%.%' IDENTIFIED BY '${DB_PASSWORD}';
FLUSH PRIVILEGES;
" 2>/dev/null && echo "✅  MySQL grants applied." || \
echo "⚠️   Could not apply grants automatically (no root password-less login)."
echo "     If needed, run database/grant-docker-access.sql in phpMyAdmin manually."

echo ""
echo "=============================================="
echo " ✅  Fix complete! Now test connectivity:"
echo "   docker compose -f docker-compose.prod.yml exec backend sh -c 'nc -vz host.docker.internal 3306'"
echo "   docker compose -f docker-compose.prod.yml exec backend npm run debug:db"
echo "=============================================="
