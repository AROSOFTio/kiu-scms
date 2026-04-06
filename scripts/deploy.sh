#!/bin/bash

# SCMS Deployment Script
# Usage: ./deploy.sh

echo "🚀 Starting SCMS Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest code from git..."
git pull origin main

# 2. Rebuild and restart containers
echo "🏗️ Rebuilding production containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Clean up unused images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "✅ Deployment completed successfully!"
