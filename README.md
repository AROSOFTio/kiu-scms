# Student Complaint Management System (SCMS) - Phase 1 Foundation

This is the monorepo for the SCMS platform for Kampala International University (KIU). 

## Technology Stack
- **Frontend**: React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, Axios, React Hook Form + Zod, Recharts, Lucide.
- **Backend**: Node.js + Express + TypeScript, MySQL 2, JWT, bcrypt.
- **Database**: MySQL 8.0, phpMyAdmin.
- **Infrastructure**: Docker & Docker Compose, Nginx Reverse Proxy.

## Directory Structure
- `/frontend`: React client code (Vite dev server)
- `/backend`: Node.js Express server
- `/nginx`: Initial Nginx reverse proxy configurations
- `/database`: Initialization scripts for MySQL

## Running the Application
Ensure you have Docker and Docker Compose installed.

To spin up the entire cluster (Frontend, Backend, Database, Nginx, phpMyAdmin):

```bash
docker compose up --build -d
```

### Access Points

| Service | Local URL | Description |
|---|---|---|
| **Frontend/App** | [http://localhost:8086](http://localhost:8086) | Main website running through Nginx proxy |
| **API** | [http://localhost:8086/api/v1/health](http://localhost:8086/api/v1/health) | Backend healthcheck via Nginx proxy |
| **Backend Raw** | [http://localhost:5000](http://localhost:5000) | For raw API interactions |
| **phpMyAdmin** | [http://localhost:8080](http://localhost:8080) | Database visual administration |

## Database Information
When accessing phpMyAdmin:
- **Server**: `db`
- **Username**: `root`
- **Password**: `rootpassword` (or `scms_user` / `scms_password` for the specific database user).

The initial migrations and seed data are populated via `database/init.sql` upon the very first start of the MySQL container. If you wish to re-run the initialization, you must drop the `db_data` volume and restart.

## Next Steps (Phase 2)
The UI framework will now be expanded internally to build out the required designs, including the login screens, dashboard interfaces, and mobile responsiveness. Backend API endpoints for Authentication and Complaints tracking will be fully developed to connect to the raw MySQL models defined.
