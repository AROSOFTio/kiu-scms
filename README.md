# KIU Student Complaint Management System (SCMS)

KIU SCMS is a TypeScript monorepo for managing student complaints with a department-based academic workflow.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + MySQL2
- Database: MySQL 8
- Deployment: Docker Compose + NGINX

## Role Model

This project now uses only these roles:

- HOD
- Lecturer
- Student

Seeded demo data is organized as:

- 1 HOD per department
- 5 Lecturers per department
- 5 Students per department

Departments included:

- Computer Science
- Information Technology
- Software Engineering
- Data Science
- Business Admin

## Database Setup

For a fresh manual install in phpMyAdmin:

1. Create the database `kiu_scms`
2. Select that database
3. Import [database/complete_install.sql](/d:/SYSTEMS/kiu_scms/database/complete_install.sql)

That single SQL file creates the schema and inserts the full demo dataset.

## Production Deployment

Recommended server path:

`/www/wwwroot/kiuscms.arosoft.io`

Setup steps:

1. Clone the repo into `/www/wwwroot/kiuscms.arosoft.io`
2. Copy `.env.production.example` to `.env`
3. Set the aaPanel MySQL credentials in `.env`
4. Keep `VITE_API_URL=/api/v1`
5. Run `bash scripts/deploy.sh`
6. Point aaPanel reverse proxy to `http://127.0.0.1:3001`

## Useful Commands

Production:

```bash
cd /www/wwwroot/kiuscms.arosoft.io
git pull --ff-only origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Local development:

```bash
docker compose up -d
```

Backend reseed on an existing database:

```bash
cd backend
npm run seed
```
