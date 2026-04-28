#!/bin/bash

# PocketAccountant Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${TIMESTAMP}"

echo "🚀 Starting PocketAccountant deployment for $ENVIRONMENT environment"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup database
backup_database() {
    echo "📦 Backing up database..."
    if [ -f "backend/pocketaccountant" ]; then
        cp "backend/pocketaccountant" "$BACKUP_DIR/pocketaccountant.db"
        echo "✅ Database backed up to $BACKUP_DIR/pocketaccountant.db"
    else
        echo "⚠️ No database file found, skipping backup"
    fi
}

# Function to deploy with Docker Compose
deploy_docker() {
    echo "🐳 Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose down || true
    
    # Build and start new containers
    docker-compose up -d --build
    
    # Wait for services to be healthy
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
    else
        echo "❌ Backend health check failed"
        exit 1
    fi
    
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        echo "✅ Frontend is healthy"
    else
        echo "❌ Frontend health check failed"
        exit 1
    fi
}

# Function to deploy without Docker
deploy_direct() {
    echo "⚡ Deploying directly..."
    
    # Backend
    echo "🔧 Setting up backend..."
    cd backend
    npm install --only=production
    pm2 restart pocketaccountant-backend || pm2 start src/server.js --name pocketaccountant-backend
    cd ..
    
    # Frontend
    echo "🎨 Setting up frontend..."
    cd frontend
    npm install --legacy-peer-deps
    npm run build
    # Serve with serve or nginx
    pm2 restart pocketaccountant-frontend || pm2 serve dist 80 --spa --name pocketaccountant-frontend
    cd ..
}

# Main deployment logic
case "$ENVIRONMENT" in
    "docker")
        backup_database
        deploy_docker
        ;;
    "production"|"staging")
        backup_database
        deploy_direct
        ;;
    *)
        echo "❌ Unknown environment: $ENVIRONMENT"
        echo "Usage: $0 [docker|production|staging]"
        exit 1
        ;;
esac

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend: http://localhost:80"
echo "🔧 Backend API: http://localhost:3000/api"
echo "📊 Health check: http://localhost:3000/api/health"

# Create deployment marker
echo "$TIMESTAMP - $ENVIRONMENT deployment completed" > "$BACKUP_DIR/deployment.log"