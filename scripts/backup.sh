#!/bin/bash

# Database and File Backup Script
# This script creates a complete backup of the POS system

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}💾 POS System - Create Backup${NC}"
echo "=================================="
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

# Create backup directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Generate timestamp for backup files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="pos_backup_${TIMESTAMP}"

echo -e "${YELLOW}📊 Analyzing database contents...${NC}"

# Check database size and record counts
DB_STATS=$(docker exec $CONTAINER_NAME psql -U postgres -d pos_system -tAc "
SELECT 
    COUNT(*) as total_users FROM users
UNION ALL SELECT 
    COUNT(*) as total_orders FROM orders  
UNION ALL SELECT 
    COUNT(*) as total_products FROM products
UNION ALL SELECT 
    COUNT(*) as total_payments FROM payments;
")

# Parse stats
USER_COUNT=$(echo "$DB_STATS" | sed -n '1p')
ORDER_COUNT=$(echo "$DB_STATS" | sed -n '2p')
PRODUCT_COUNT=$(echo "$DB_STATS" | sed -n '3p')
PAYMENT_COUNT=$(echo "$DB_STATS" | sed -n '4p')

echo -e "${BLUE}Database Statistics:${NC}"
echo "  Users: $USER_COUNT"
echo "  Orders: $ORDER_COUNT"
echo "  Products: $PRODUCT_COUNT"
echo "  Payments: $PAYMENT_COUNT"
echo ""

# Database backup
echo -e "${YELLOW}🗄️  Creating database backup...${NC}"
DB_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_database.sql"

# Create comprehensive database dump
docker exec $CONTAINER_NAME pg_dump \
    -U postgres \
    -d pos_system \
    --clean \
    --if-exists \
    --create \
    --verbose \
    --format=plain > $DB_BACKUP_FILE

if [[ $? -eq 0 ]]; then
    DB_SIZE=$(du -h $DB_BACKUP_FILE | cut -f1)
    echo -e "${GREEN}✅ Database backup created: $DB_BACKUP_FILE ($DB_SIZE)${NC}"
else
    echo -e "${RED}❌ Database backup failed!${NC}"
    exit 1
fi

# File uploads backup (if uploads directory exists)
UPLOADS_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz"
UPLOADS_DIR="uploads"

if [[ -d "$UPLOADS_DIR" ]]; then
    echo -e "${YELLOW}📁 Creating file uploads backup...${NC}"
    tar -czf $UPLOADS_BACKUP_FILE $UPLOADS_DIR/
    
    if [[ $? -eq 0 ]]; then
        UPLOADS_SIZE=$(du -h $UPLOADS_BACKUP_FILE | cut -f1)
        UPLOAD_COUNT=$(find $UPLOADS_DIR -type f | wc -l)
        echo -e "${GREEN}✅ Uploads backup created: $UPLOADS_BACKUP_FILE ($UPLOADS_SIZE, $UPLOAD_COUNT files)${NC}"
    else
        echo -e "${RED}❌ Uploads backup failed!${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  No uploads directory found, skipping file backup${NC}"
fi

# Docker volumes backup (optional)
echo -e "${YELLOW}🐳 Creating Docker volumes backup...${NC}"
VOLUMES_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_volumes.tar.gz"

# Get list of POS-related volumes
VOLUMES=$(docker volume ls --filter name=pos --format "{{.Name}}" | grep -E "pos.*postgres.*data")

if [[ -n "$VOLUMES" ]]; then
    # Create a temporary container to access volumes
    docker run --rm -v pos-postgres-data:/data -v $(pwd)/${BACKUP_DIR}:/backup alpine sh -c "cd /data && tar czf /backup/${BACKUP_NAME}_volumes.tar.gz ." 2>/dev/null || \
    docker run --rm -v pos-postgres_data:/data -v $(pwd)/${BACKUP_DIR}:/backup alpine sh -c "cd /data && tar czf /backup/${BACKUP_NAME}_volumes.tar.gz ." 2>/dev/null || \
    echo -e "${YELLOW}⚠️  Could not backup Docker volumes (this is normal if using dev setup)${NC}"
    
    if [[ -f "$VOLUMES_BACKUP_FILE" ]]; then
        VOLUMES_SIZE=$(du -h $VOLUMES_BACKUP_FILE | cut -f1)
        echo -e "${GREEN}✅ Volumes backup created: $VOLUMES_BACKUP_FILE ($VOLUMES_SIZE)${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  No Docker volumes found to backup${NC}"
fi

# Create backup manifest
MANIFEST_FILE="${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt"
echo -e "${YELLOW}📋 Creating backup manifest...${NC}"

cat > $MANIFEST_FILE << EOF
POS System Backup Manifest
==========================
Created: $(date)
Backup Name: $BACKUP_NAME
System: $(uname -s) $(uname -r)
Docker Version: $(docker --version)

Database Statistics:
- Users: $USER_COUNT
- Orders: $ORDER_COUNT  
- Products: $PRODUCT_COUNT
- Payments: $PAYMENT_COUNT

Backup Files:
EOF

# Add database backup info
if [[ -f "$DB_BACKUP_FILE" ]]; then
    echo "- Database: ${BACKUP_NAME}_database.sql ($(du -h $DB_BACKUP_FILE | cut -f1))" >> $MANIFEST_FILE
fi

# Add uploads backup info
if [[ -f "$UPLOADS_BACKUP_FILE" ]]; then
    echo "- Uploads: ${BACKUP_NAME}_uploads.tar.gz ($(du -h $UPLOADS_BACKUP_FILE | cut -f1))" >> $MANIFEST_FILE
fi

# Add volumes backup info
if [[ -f "$VOLUMES_BACKUP_FILE" ]]; then
    echo "- Volumes: ${BACKUP_NAME}_volumes.tar.gz ($(du -h $VOLUMES_BACKUP_FILE | cut -f1))" >> $MANIFEST_FILE
fi

echo "" >> $MANIFEST_FILE
echo "Restore Instructions:" >> $MANIFEST_FILE
echo "1. Run 'make restore' and select this backup" >> $MANIFEST_FILE
echo "2. Or restore manually using the individual backup files" >> $MANIFEST_FILE
echo "" >> $MANIFEST_FILE

# Database schema info
echo "Database Schema Information:" >> $MANIFEST_FILE
docker exec $CONTAINER_NAME psql -U postgres -d pos_system -c "\dt" >> $MANIFEST_FILE 2>/dev/null || echo "Could not retrieve schema info" >> $MANIFEST_FILE

echo -e "${GREEN}✅ Backup manifest created: $MANIFEST_FILE${NC}"

# Create compressed backup bundle
BUNDLE_FILE="${BACKUP_DIR}/${BACKUP_NAME}_complete.tar.gz"
echo -e "${YELLOW}📦 Creating complete backup bundle...${NC}"

tar -czf $BUNDLE_FILE -C $BACKUP_DIR \
    ${BACKUP_NAME}_database.sql \
    ${BACKUP_NAME}_manifest.txt \
    $(test -f ${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz && echo ${BACKUP_NAME}_uploads.tar.gz) \
    $(test -f ${BACKUP_DIR}/${BACKUP_NAME}_volumes.tar.gz && echo ${BACKUP_NAME}_volumes.tar.gz)

if [[ $? -eq 0 ]]; then
    BUNDLE_SIZE=$(du -h $BUNDLE_FILE | cut -f1)
    echo -e "${GREEN}✅ Complete backup bundle: $BUNDLE_FILE ($BUNDLE_SIZE)${NC}"
else
    echo -e "${RED}❌ Failed to create backup bundle!${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Backup Summary:${NC}"
echo "  Name: $BACKUP_NAME"
echo "  Location: $BACKUP_DIR/"
echo "  Database: ✅ ($DB_SIZE)"
echo "  Files: $(test -f $UPLOADS_BACKUP_FILE && echo "✅" || echo "⏭️  (no uploads)")"
echo "  Volumes: $(test -f $VOLUMES_BACKUP_FILE && echo "✅" || echo "⏭️  (dev setup)")"
echo "  Bundle: ✅ ($BUNDLE_SIZE)"
echo ""
echo -e "${YELLOW}💡 To restore this backup, run: make restore${NC}"
echo -e "${YELLOW}📁 Backup files are stored in: $BACKUP_DIR/${NC}"
echo ""

# Clean up old backups (keep last 10)
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last 10)...${NC}"
cd $BACKUP_DIR
ls -t pos_backup_*_complete.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f
cd - > /dev/null

echo -e "${GREEN}✅ Backup process completed!${NC}"
