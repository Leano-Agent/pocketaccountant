#!/bin/bash

# PocketAccountant Restore Script
# Usage: ./restore.sh [backup_directory]

set -e

if [ $# -eq 0 ]; then
    echo "❌ Please specify backup directory to restore from"
    echo "Usage: $0 [backup_directory]"
    echo "Available backups:"
    find backups -maxdepth 1 -type d -name "*_*" 2>/dev/null | sort -r | head -10
    exit 1
fi

BACKUP_DIR="$1"
LOG_FILE="backups/restore.log"

echo "🔄 Starting PocketAccountant restore from $BACKUP_DIR at $(date)" | tee -a "$LOG_FILE"

# Validate backup directory
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR" | tee -a "$LOG_FILE"
    exit 1
fi

# Function to validate backup integrity
validate_backup() {
    echo "🔍 Validating backup integrity..." | tee -a "$LOG_FILE"
    
    # Check for essential files
    if [ ! -f "$BACKUP_DIR/pocketaccountant.db" ]; then
        echo "⚠️ No database file found in backup" | tee -a "$LOG_FILE"
    fi
    
    # Verify checksum if available
    if [ -f "$BACKUP_DIR/pocketaccountant.db.md5" ]; then
        echo "📊 Verifying database checksum..." | tee -a "$LOG_FILE"
        (cd "$BACKUP_DIR" && md5sum -c pocketaccountant.db.md5) 2>/dev/null && \
            echo "✅ Database checksum verified" | tee -a "$LOG_FILE" || \
            echo "⚠️ Database checksum verification failed" | tee -a "$LOG_FILE"
    fi
    
    # Check backup report
    if [ -f "$BACKUP_DIR/backup_report.txt" ]; then
        echo "📄 Backup report found:" | tee -a "$LOG_FILE"
        grep -E "(Backup Type|Timestamp|Contents:)" "$BACKUP_DIR/backup_report.txt" | tee -a "$LOG_FILE"
    fi
}

# Function to stop services
stop_services() {
    echo "⏸️ Stopping services..." | tee -a "$LOG_FILE"
    
    # Stop Docker containers if running
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose down 2>/dev/null || true
        echo "✅ Docker containers stopped" | tee -a "$LOG_FILE"
    fi
    
    # Stop PM2 processes if running
    if command -v pm2 &> /dev/null; then
        pm2 stop all 2>/dev/null || true
        echo "✅ PM2 processes stopped" | tee -a "$LOG_FILE"
    fi
}

# Function to restore database
restore_database() {
    echo "💾 Restoring database..." | tee -a "$LOG_FILE"
    
    if [ -f "$BACKUP_DIR/pocketaccountant.db" ]; then
        # Backup current database first
        if [ -f "backend/pocketaccountant" ]; then
            CURRENT_BACKUP="backups/pre_restore_$(date +%Y%m%d_%H%M%S).db"
            cp "backend/pocketaccountant" "$CURRENT_BACKUP"
            echo "✅ Current database backed up to $CURRENT_BACKUP" | tee -a "$LOG_FILE"
        fi
        
        # Restore from backup
        cp "$BACKUP_DIR/pocketaccountant.db" "backend/pocketaccountant"
        
        # Set proper permissions
        chmod 664 "backend/pocketaccountant" 2>/dev/null || true
        
        DB_SIZE=$(du -h "backend/pocketaccountant" | cut -f1)
        echo "✅ Database restored: backend/pocketaccountant ($DB_SIZE)" | tee -a "$LOG_FILE"
    else
        echo "⚠️ No database file to restore" | tee -a "$LOG_FILE"
    fi
}

# Function to restore configuration
restore_config() {
    echo "⚙️ Restoring configuration..." | tee -a "$LOG_FILE"
    
    # Restore environment files
    if [ -f "$BACKUP_DIR/env.backup" ]; then
        cp "$BACKUP_DIR/env.backup" ".env.restored"
        echo "✅ Main .env restored to .env.restored" | tee -a "$LOG_FILE"
    fi
    
    if [ -f "$BACKUP_DIR/backend.env.backup" ]; then
        cp "$BACKUP_DIR/backend.env.backup" "backend/.env.restored"
        echo "✅ Backend .env restored to .env.restored" | tee -a "$LOG_FILE"
    fi
    
    # Restore deployment scripts
    if [ -f "$BACKUP_DIR/deploy.sh" ]; then
        cp "$BACKUP_DIR/deploy.sh" "deploy.sh.restored"
        chmod +x "deploy.sh.restored"
        echo "✅ Deployment script restored to deploy.sh.restored" | tee -a "$LOG_FILE"
    fi
    
    if [ -f "$BACKUP_DIR/docker-compose.yml" ]; then
        cp "$BACKUP_DIR/docker-compose.yml" "docker-compose.yml.restored"
        echo "✅ Docker Compose file restored to docker-compose.yml.restored" | tee -a "$LOG_FILE"
    fi
}

# Function to start services
start_services() {
    echo "▶️ Starting services..." | tee -a "$LOG_FILE"
    
    # Start with Docker if available
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose up -d
        echo "✅ Docker containers started" | tee -a "$LOG_FILE"
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to be healthy..." | tee -a "$LOG_FILE"
        sleep 10
        
        # Test backend
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ Backend is healthy" | tee -a "$LOG_FILE"
        else
            echo "⚠️ Backend health check failed" | tee -a "$LOG_FILE"
        fi
        
        # Test frontend
        if curl -f http://localhost:80 > /dev/null 2>&1; then
            echo "✅ Frontend is healthy" | tee -a "$LOG_FILE"
        else
            echo "⚠️ Frontend health check failed" | tee -a "$LOG_FILE"
        fi
    else
        echo "⚠️ Docker not available, manual startup required" | tee -a "$LOG_FILE"
        echo "   Start backend: cd backend && npm start" | tee -a "$LOG_FILE"
        echo "   Start frontend: cd frontend && npm start" | tee -a "$LOG_FILE"
    fi
}

# Function to verify restore
verify_restore() {
    echo "🔎 Verifying restore..." | tee -a "$LOG_FILE"
    
    # Check if database is accessible
    if [ -f "backend/pocketaccountant" ]; then
        DB_SIZE=$(du -h "backend/pocketaccountant" | cut -f1)
        echo "📊 Database size: $DB_SIZE" | tee -a "$LOG_FILE"
        
        # Simple SQLite check
        if command -v sqlite3 &> /dev/null; then
            if sqlite3 "backend/pocketaccountant" "SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null | grep -q "users"; then
                echo "✅ Database structure appears valid" | tee -a "$LOG_FILE"
            else
                echo "⚠️ Could not verify database structure" | tee -a "$LOG_FILE"
            fi
        fi
    fi
    
    # Check if services are running
    if command -v docker &> /dev/null; then
        RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -c "pocketaccountant" || true)
        echo "🐳 Running PocketAccountant containers: $RUNNING_CONTAINERS" | tee -a "$LOG_FILE"
    fi
}

# Main restore process
validate_backup
stop_services
restore_database
restore_config
start_services
verify_restore

echo "🎉 Restore completed successfully!" | tee -a "$LOG_FILE"
echo "📊 Summary:" | tee -a "$LOG_FILE"
echo "  - Restored from: $BACKUP_DIR" | tee -a "$LOG_FILE"
echo "  - Database: $(if [ -f "backend/pocketaccountant" ]; then echo "✅ Restored"; else echo "❌ Not restored"; fi)" | tee -a "$LOG_FILE"
echo "  - Services: $(if command -v docker &> /dev/null && docker ps --format "{{.Names}}" | grep -q "pocketaccountant"; then echo "✅ Running"; else echo "⚠️ Check manually"; fi)" | tee -a "$LOG_FILE"
echo "---" | tee -a "$LOG_FILE"

# Important notes
echo "📝 Important Notes:" | tee -a "$LOG_FILE"
echo "1. Review restored configuration files (.env.restored, etc.)" | tee -a "$LOG_FILE"
echo "2. Update any environment-specific settings" | tee -a "$LOG_FILE"
echo "3. Test all application functionality" | tee -a "$LOG_FILE"
echo "4. Monitor logs for any issues" | tee -a "$LOG_FILE"