#!/bin/bash
# =============================================================
# fix-mysql-docker.sh
# Run once as root on the server after first deploy.
# Fixes aaPanel MySQL so Docker containers can connect to it.
# =============================================================
set -euo pipefail

echo "=============================================="
echo " KIU SCMS - MySQL to Docker Network Fix"
echo "=============================================="

echo ""
echo "[1/3] Opening iptables for Docker to MySQL (port 3306)..."

# Docker commonly uses private bridge ranges like 172.16.0.0/12.
iptables -I INPUT -s 172.16.0.0/12 -p tcp --dport 3306 -j ACCEPT
iptables -I INPUT -s 192.168.0.0/16 -p tcp --dport 3306 -j ACCEPT

echo "OK: iptables rules inserted."

if command -v iptables-save >/dev/null 2>&1; then
  iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
  iptables-save > /etc/iptables.rules 2>/dev/null || true
  echo "OK: iptables rules persisted."
fi

echo ""
echo "[2/3] Checking MySQL bind-address..."

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
  echo "Found: $CURRENT in $MYCNF"
  sed -i 's/^bind-address\s*=.*/bind-address = 0.0.0.0/' "$MYCNF"
  echo "OK: bind-address set to 0.0.0.0 in $MYCNF"
  echo "Restarting MySQL..."
  systemctl restart mysql && echo "OK: MySQL restarted." || \
  service mysql restart && echo "OK: MySQL restarted (service)."
else
  echo "WARN: No bind-address found in standard config files."
  echo "Set bind-address = 0.0.0.0 in aaPanel -> Databases -> My.cnf, then restart MySQL."
fi

echo ""
echo "[3/3] Granting MySQL user access for aaPanel and Docker..."

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ -f "$ENV_FILE" ]; then
  DB_USER=$(grep -E '^DB_USER=' "$ENV_FILE" | head -1 | cut -d= -f2-)
  DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2-)
  DB_NAME=$(grep -E '^DB_NAME=' "$ENV_FILE" | head -1 | cut -d= -f2-)
fi

DB_USER="${DB_USER:-kiu_scms}"
DB_PASSWORD="${DB_PASSWORD:-CHANGE_ME_STRONG_PASSWORD}"
DB_NAME="${DB_NAME:-kiu_scms}"

mysql -u root -e "
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'::1' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'172.%.%.%' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'192.168.%.%' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'10.%.%.%' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'::1' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'172.%.%.%' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'192.168.%.%' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'10.%.%.%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'::1';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'172.%.%.%';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'192.168.%.%';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'10.%.%.%';
FLUSH PRIVILEGES;
SELECT User, Host FROM mysql.user WHERE User = '${DB_USER}' ORDER BY Host;
" 2>/dev/null && echo "OK: MySQL grants applied." || \
echo "WARN: Could not apply grants automatically (root login may require a password)."
echo "If needed, run database/grant-docker-access.sql in aaPanel phpMyAdmin manually."

echo ""
echo "=============================================="
echo " Fix complete. Test connectivity with:"
echo "   docker compose -f docker-compose.prod.yml exec backend sh -c 'nc -vz host.docker.internal 3306'"
echo "   docker compose -f docker-compose.prod.yml exec backend npm run debug:db"
echo "=============================================="
