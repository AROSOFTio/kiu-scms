# KIU Student Complaint Management System (SCMS)

The official KIU Student Complaint Management System repository for centralizing, managing, and tracking student complaints with robust role-based workflows and institutional notifications.

## 🚀 Architecture
This platform is a fully decoupled **TypeScript** monorepo:
- **Frontend**: React + Vite, styled precisely with Tailwind CSS + Lucide Icons. Uses secure Redux/TanStack Context patterns.
- **Backend API**: Node.js + Express, architected with modular middleware routing (JWT, Bcrypt) and pure MySQL2 promise mapping.
- **Database**: MySQL 8.0 containing advanced relational tables measuring complaint workflows, staff assignments, and audit tracking.
- **Infrastructure**: Ultra-secure multi-container Docker cluster isolating backend communication and proxy-passing exclusively via NGINX.

## Production Deployment
This repository is now prepared for an aaPanel deployment model where:
- aaPanel manages the public website and reverse proxy
- aaPanel MySQL is the production database
- Docker only runs the application services

Recommended server layout:
1. Clone the repo into `/www/wwwroot/kiuscms.arosoft.io`
2. Copy `.env.production.example` to `.env`
3. Set the aaPanel MySQL credentials in `.env`
4. Keep `FRONTEND_PORT=3001`
5. Run:
   ```bash
   bash ./scripts/deploy.sh
   ```
6. In aaPanel, configure the site reverse proxy to:
   ```text
   http://127.0.0.1:3001
   ```
7. Import `database/init.sql` into the aaPanel MySQL database before first login

### Production Ports
- **Frontend container host port**: `3001`
- **Backend container**: internal-only on `5000`
- **Database**: aaPanel-managed MySQL, typically `3306`

### Reverse Proxy
Use the domain `kiuscms.arosoft.io` in aaPanel and forward traffic to:
```text
http://127.0.0.1:3001
```
The frontend container already proxies `/api/` and `/uploads/` to the backend container over Docker networking.

## 💼 Role-Based Access Scopes
SCMS utilizes precise JSON Web Token verification mapping to Database Access Controls.
- **Students**: Create complaints, track real-time resolution metrics, withdraw tracking.
- **Staff Resolvers**: View uniquely allocated complaints, transition statuses (Pending -> Under Review -> Resolved).
- **Administrators**: Central insight across all institutional departments, direct staff assignment, system-wide management.

## 🧹 Developer Tools
To enforce automated CI/CD security:
- Run `./scripts/backup.sh` to extract a secure zip snapshot of the production MySQL matrix using native `.env` configurations.
- Run `./scripts/restore.sh <BACKUP_FILE>.sql.gz` to seamlessly format and rewrite table schemas.
