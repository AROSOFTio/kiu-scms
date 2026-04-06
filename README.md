# KIU Student Complaint Management System (SCMS)

The official KIU Student Complaint Management System repository for centralizing, managing, and tracking student complaints with robust role-based workflows and institutional notifications.

## 🚀 Architecture
This platform is a fully decoupled **TypeScript** monorepo:
- **Frontend**: React + Vite, styled precisely with Tailwind CSS + Lucide Icons. Uses secure Redux/TanStack Context patterns.
- **Backend API**: Node.js + Express, architected with modular middleware routing (JWT, Bcrypt) and pure MySQL2 promise mapping.
- **Database**: MySQL 8.0 containing advanced relational tables measuring complaint workflows, staff assignments, and audit tracking.
- **Infrastructure**: Ultra-secure multi-container Docker cluster isolating backend communication and proxy-passing exclusively via NGINX.

## 📦 Production Deployment
The application utilizes an advanced deploy-and-forget workflow designed for Cloudflare origin mapping or Direct IP routing from a server like aaPanel. 

On the production server (`/www/wwwroot/scms.arosoft.io`):
1. **Initialize Environments**: 
   Rename `.env.production.example` to `.env` and fill in your secure root database configurations.
2. **Launch Cluster**:
   ```bash
   bash ./scripts/deploy.sh
   ```
   *The `deploy.sh` script automates Git synchronization, pulls updates, securely restarts the `80` and `443` proxy bindings inside the Docker Network, and purges dangling disk images.*

### Port Bindings
- **React UI & API Portal**: `80` & `443`
- **Internal API Service**: Reversely fetched locally via Node on `5000` inside the bridge network.
- **Database Web Admin (phpMyAdmin)**: Isolated locally on `8087` ensuring no direct public IP scraping.

## 💼 Role-Based Access Scopes
SCMS utilizes precise JSON Web Token verification mapping to Database Access Controls.
- **Students**: Create complaints, track real-time resolution metrics, withdraw tracking.
- **Staff Resolvers**: View uniquely allocated complaints, transition statuses (Pending -> Under Review -> Resolved).
- **Administrators**: Central insight across all institutional departments, direct staff assignment, system-wide management.

## 🧹 Developer Tools
To enforce automated CI/CD security:
- Run `./scripts/backup.sh` to extract a secure zip snapshot of the production MySQL matrix using native `.env` configurations.
- Run `./scripts/restore.sh <BACKUP_FILE>.sql.gz` to seamlessly format and rewrite table schemas.
