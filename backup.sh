#!/bin/bash

# PocketAccountant Backup Script
# Usage: ./backup.sh [full|database]

set -e

BACKUP_TYPE=${1:-database}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${TIMESTAMP}_${BACKUP_TYPE}"
LOG_FILE="backups/backup.log"

echo "📦 Starting PocketAccountant backup ($BACKUP_TYPE) at $(date)" | tee -a "$LOG_FILE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup database
backup_database() {
    echo "💾 Backing up database..." | tee -a "$LOG_FILE"
    
    if [ -f "backend/pocketaccountant" ]; then
        cp "backend/pocketaccountant" "$BACKUP_DIR/pocketaccountant.db"
        DB_SIZE=$(du -h "$BACKUP_DIR/pocketaccountant.db" | cut -f1)
        echo "✅ Database backed up: $BACKUP_DIR/pocketaccountant.db ($DB_SIZE)" | tee -a "$LOG_FILE"
        
        # Create checksum
        md5sum "$BACKUP_DIR/pocketaccountant.db" > "$BACKUP_DIR/pocketaccountant.db.md5"
    else
        echo "⚠️ No database file found at backend/pocketaccountant" | tee -a "$LOG_FILE"
    fi
}

# Function to backup configuration
backup_config() {
    echo "⚙️ Backing up configuration..." | tee -a "$LOG_FILE"
    
    # Backup environment files
    if [ -f ".env" ]; then
        cp ".env" "$BACKUP_DIR/env.backup"
    fi
    
    if [ -f "backend/.env" ]; then
        cp "backend/.env" "$BACKUP_DIR/backend.env.backup"
    fi
    
    # Backup Docker configuration
    if [ -f "docker-compose.yml" ]; then
        cp "docker-compose.yml" "$BACKUP_DIR/"
    fi
    
    if [ -f "deploy.sh" ]; then
        cp "deploy.sh" "$BACKUP_DIR/"
    fi
    
    echo "✅ Configuration backed up" | tee -a "$LOG_FILE"
}

# Function to backup source code
backup_source() {
    echo "📝 Backing up source code..." | tee -a "$LOG_FILE"
    
    # Create git archive if available
    if [ -d ".git" ]; then
        git archive --format=tar HEAD | gzip > "$BACKUP_DIR/source_code.tar.gz"
        echo "✅ Source code backed up via git archive" | tee -a "$LOG_FILE"
    else
        # Manual backup of key directories
        tar -czf "$BACKUP_DIR/backend_source.tar.gz" backend/src backend/package.json backend/tsconfig.json 2>/dev/null || true
        tar -czf "$BACKUP_DIR/frontend_source.tar.gz" frontend/src frontend/package.json frontend/tsconfig.json frontend/vite.config.ts 2>/dev/null || true
        echo "✅ Source code backed up manually" | tee -a "$LOG_FILE"
    fi
}

# Function to create backup report
create_report() {
    echo "📊 Creating backup report..." | tee -a "$LOG_FILE"
    
    cat > "$BACKUP_DIR/backup_report.txt" << EOF
PocketAccountant Backup Report
=============================
Backup Type: $BACKUP_TYPE
Timestamp: $(date)
Backup Directory: $BACKUP_DIR

Contents:
$(find "$BACKUP_DIR" -type f | sed 's|^|  |')

File Sizes:
$(du -h "$BACKUP_DIR"/* 2>/dev/null | sed 's|^|  |')

System Information:
- Hostname: $(hostname)
- Disk Usage: $(df -h . | tail -1)
- Memory: $(free -h | head -2 | tail -1)

Verification:
$(if [ -f "$BACKUP_DIR/pocketaccountant.db.md5" ]; then
    echo "Database MD5: $(cat "$BACKUP_DIR/pocketaccountant.db.md5")"
fi)

EOF
    
    echo "✅ Backup report created: $BACKUP_DIR/backup_report.txt" | tee -a "$LOG_FILE"
}

# Function to rotate old backups
rotate_backups() {
    echo "🔄 Rotating old backups..." | tee -a "$LOG_FILE"
    
    # Keep last 7 daily backups
    find backups -maxdepth 1 -type d -name "*_database" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
    
    # Keep last 4 weekly full backups
    find backups -maxdepth 1 -type d -name "*_full" -mtime +28 -exec rm -rf {} \; 2>/dev/null || true
    
    echo "✅ Old backups rotated" | tee -a "$LOG_FILE"
}

# Main backup logic
case "$BACKUP_TYPE" in
    "database")
        backup_database
        backup_config
        ;;
    "full")
        backup_database
        backup_config
        backup_source
        ;;
    *)
        echo "❌ Unknown backup type: $BACKUP_TYPE" | tee -a "$LOG_FILE"
        echo "Usage: $0 [database|full]" | tee -a "$LOG_FILE"
        exit 1
        ;;
esac

create_report
rotate_backups

# Create symlink to latest backup
ln -sfn "$BACKUP_DIR" "backups/latest"

# Calculate backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo "🎉 Backup completed successfully!" | tee -a "$LOG_FILE"
echo "📁 Location: $BACKUP_DIR" | tee -a "$LOG_FILE"
echo "📊 Size: $TOTAL_SIZE" | tee -a "$LOG_FILE"
echo "🔗 Latest: backups/latest" | tee -a "$LOG_FILE"
echo "---" | tee -a "$LOG_FILE"