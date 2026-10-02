#!/bin/bash

# Database and File Restore Script  
# This script restores a complete backup of the POS system

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📥 POS System - Restore from Backup${NC}"
echo "======================================"
echo ""

# Check if database container is running
CONTAINER_NAME="pos-postgres-dev"
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    CONTAINER_NAME="pos-postgres"
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${RED}❌ Database container is not running!${NC}"
        echo -e "${YELLOW}Please run 'make up' or 'make dev' first.${NC}"
        exit 1
    fi
fi

BACKUP_DIR="backups"

# Check if backups directory exists
if [[ ! -d "$BACKUP_DIR" ]]; then
    echo -e "${RED}❌ No backups directory found!${NC}"
    echo -e "${YELLOW}Please create some backups first using 'make backup'${NC}"
    exit 1
fi

# List available backups
echo -e "${YELLOW}📋 Available backups:${NC}"
echo ""

BACKUP_FILES=()
INDEX=1

# Find backup files
for file in $BACKUP_DIR/pos_backup_*_complete.tar.gz; do
    if [[ -f "$file" ]]; then
        BASENAME=$(basename "$file" .tar.gz)
        # Extract timestamp from filename
        TIMESTAMP=$(echo "$BASENAME" | sed 's/pos_backup_//' | sed 's/_complete//')
        
        # Convert timestamp to readable date
        YEAR=${TIMESTAMP:0:4}
        MONTH=${TIMESTAMP:4:2}
        DAY=${TIMESTAMP:6:2}
        HOUR=${TIMESTAMP:9:2}
        MINUTE=${TIMESTAMP:11:2}
        SECOND=${TIMESTAMP:13:2}
        
        READABLE_DATE="$YEAR-$MONTH-$DAY $HOUR:$MINUTE:$SECOND"
        FILE_SIZE=$(du -h "$file" | cut -f1)
        
        echo "$INDEX) $BASENAME"
        echo "   Date: $READABLE_DATE"
        echo "   Size: $FILE_SIZE"
        echo "   File: $(basename "$file")"
        
        # Check if manifest exists
        MANIFEST_FILE="$BACKUP_DIR/${BASENAME}_manifest.txt"
        if [[ -f "$MANIFEST_FILE" ]]; then
            echo -e "   ${GREEN}✅ Manifest available${NC}"
        else
            echo -e "   ${YELLOW}⚠️  No manifest${NC}"
        fi
        echo ""
        
        BACKUP_FILES+=("$file")
        ((INDEX++))
    fi
done

# Also check for individual SQL backups
for file in $BACKUP_DIR/pos_backup_*_database.sql; do
    if [[ -f "$file" && ! "${BACKUP_FILES[@]}" =~ "${file%_database.sql}_complete.tar.gz" ]]; then
        BASENAME=$(basename "$file" _database.sql)
        TIMESTAMP=$(echo "$BASENAME" | sed 's/pos_backup_//')
        
        YEAR=${TIMESTAMP:0:4}
        MONTH=${TIMESTAMP:4:2}
        DAY=${TIMESTAMP:6:2}
        HOUR=${TIMESTAMP:9:2}
        MINUTE=${TIMESTAMP:11:2}
        SECOND=${TIMESTAMP:13:2}
        
        READABLE_DATE="$YEAR-$MONTH-$DAY $HOUR:$MINUTE:$SECOND"
        FILE_SIZE=$(du -h "$file" | cut -f1)
        
        echo "$INDEX) $BASENAME (Database Only)"
        echo "   Date: $READABLE_DATE"
        echo "   Size: $FILE_SIZE"
        echo "   File: $(basename "$file")"
        echo -e "   ${YELLOW}⚠️  Database backup only${NC}"
        echo ""
        
        BACKUP_FILES+=("$file")
        ((INDEX++))
    fi
done

if [[ ${#BACKUP_FILES[@]} -eq 0 ]]; then
    echo -e "${RED}❌ No backup files found in $BACKUP_DIR/${NC}"
    echo -e "${YELLOW}Please create a backup first using 'make backup'${NC}"
    exit 1
fi

# Get user selection
echo -e "${YELLOW}Select a backup to restore (1-$((INDEX-1))):${NC}"
read -p "> " SELECTION

# Validate selection
if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [[ $SELECTION -lt 1 ]] || [[ $SELECTION -gt ${#BACKUP_FILES[@]} ]]; then
    echo -e "${RED}❌ Invalid selection!${NC}"
    exit 1
fi

SELECTED_FILE="${BACKUP_FILES[$((SELECTION-1))]}"
SELECTED_BASENAME=$(basename "$SELECTED_FILE")

echo ""
echo -e "${BLUE}Selected backup: $SELECTED_BASENAME${NC}"

# Show manifest if available
MANIFEST_FILE=""
if [[ "$SELECTED_FILE" == *.tar.gz ]]; then
    BACKUP_NAME=$(basename "$SELECTED_FILE" _complete.tar.gz)
    MANIFEST_FILE="$BACKUP_DIR/${BACKUP_NAME}_manifest.txt"
elif [[ "$SELECTED_FILE" == *_database.sql ]]; then
    BACKUP_NAME=$(basename "$SELECTED_FILE" _database.sql)
    MANIFEST_FILE="$BACKUP_DIR/${BACKUP_NAME}_manifest.txt"
fi

if [[ -f "$MANIFEST_FILE" ]]; then
    echo -e "${YELLOW}📋 Backup manifest:${NC}"
    cat "$MANIFEST_FILE" | head -20
    echo ""
fi

# Warning about data loss
echo -e "${RED}⚠️  WARNING: This will REPLACE all current data!${NC}"
echo -e "${RED}Current database contents will be PERMANENTLY DELETED!${NC}"
echo ""

# Show current database stats
echo -e "${YELLOW}Current database contents:${NC}"
docker exec $CONTAINER_NAME psql -U postgres -d pos_system -c "
SELECT 
    'Users' as table_name, COUNT(*) as records FROM users
UNION ALL SELECT 
    'Orders' as table_name, COUNT(*) as records FROM orders
UNION ALL SELECT 
    'Products' as table_name, COUNT(*) as records FROM products
UNION ALL SELECT 
    'Payments' as table_name, COUNT(*) as records FROM payments
ORDER BY table_name;
"

echo ""
echo -e "${RED}Type 'RESTORE' to confirm (case sensitive):${NC}"
read -p "> " CONFIRMATION

if [[ "$CONFIRMATION" != "RESTORE" ]]; then
    echo -e "${BLUE}❌ Operation cancelled. Data is safe.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}📥 Starting restore process...${NC}"

# Create emergency backup first
EMERGENCY_BACKUP="$BACKUP_DIR/emergency_backup_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${BLUE}Creating emergency backup: $EMERGENCY_BACKUP${NC}"
docker exec $CONTAINER_NAME pg_dump -U postgres pos_system > $EMERGENCY_BACKUP

# Restore process
if [[ "$SELECTED_FILE" == *.tar.gz ]]; then
    echo -e "${YELLOW}📦 Extracting backup bundle...${NC}"
    
    # Extract the backup bundle
    TEMP_DIR=$(mktemp -d)
    tar -xzf "$SELECTED_FILE" -C "$TEMP_DIR"
    
    # Find database backup in extracted files
    DB_BACKUP_FILE=$(find "$TEMP_DIR" -name "*_database.sql" | head -1)
    
    if [[ -z "$DB_BACKUP_FILE" ]]; then
        echo -e "${RED}❌ No database backup found in bundle!${NC}"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    echo -e "${YELLOW}🗄️  Restoring database...${NC}"
    docker exec -i $CONTAINER_NAME psql -U postgres < "$DB_BACKUP_FILE"
    
    # Restore uploads if available
    UPLOADS_BACKUP=$(find "$TEMP_DIR" -name "*_uploads.tar.gz" | head -1)
    if [[ -n "$UPLOADS_BACKUP" ]]; then
        echo -e "${YELLOW}📁 Restoring file uploads...${NC}"
        tar -xzf "$UPLOADS_BACKUP"
        echo -e "${GREEN}✅ File uploads restored${NC}"
    else
        echo -e "${YELLOW}ℹ️  No file uploads in backup${NC}"
    fi
    
    # Restore volumes if available
    VOLUMES_BACKUP=$(find "$TEMP_DIR" -name "*_volumes.tar.gz" | head -1)
    if [[ -n "$VOLUMES_BACKUP" ]]; then
        echo -e "${YELLOW}🐳 Restoring Docker volumes...${NC}"
        # This would require stopping and restarting containers
        echo -e "${YELLOW}⚠️  Volume restore requires manual intervention${NC}"
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
elif [[ "$SELECTED_FILE" == *_database.sql ]]; then
    echo -e "${YELLOW}🗄️  Restoring database from SQL file...${NC}"
    docker exec -i $CONTAINER_NAME psql -U postgres < "$SELECTED_FILE"
else
    echo -e "${RED}❌ Unknown backup file format!${NC}"
    exit 1
fi

# Verify restore
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Database restore completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Restored database contents:${NC}"
    
    docker exec $CONTAINER_NAME psql -U postgres -d pos_system -c "
    SELECT 
        'Users' as table_name, COUNT(*) as records FROM users
    UNION ALL SELECT 
        'Orders' as table_name, COUNT(*) as records FROM orders
    UNION ALL SELECT 
        'Products' as table_name, COUNT(*) as records FROM products
    UNION ALL SELECT 
        'Payments' as table_name, COUNT(*) as records FROM payments
    ORDER BY table_name;
    "
    
    echo ""
    echo -e "${GREEN}🎉 Restore completed successfully!${NC}"
    echo -e "${YELLOW}💾 Emergency backup saved to: $EMERGENCY_BACKUP${NC}"
    echo -e "${BLUE}🚀 You may need to restart containers: make restart${NC}"
    
else
    echo -e "${RED}❌ Restore failed!${NC}"
    echo -e "${YELLOW}💾 Emergency backup is available: $EMERGENCY_BACKUP${NC}"
    echo -e "${YELLOW}You can restore the emergency backup to recover your data.${NC}"
    exit 1
fi
