#!/bin/bash

# Remove All Data Script
# This script removes all data from the POS system database (DESTRUCTIVE)

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🗑️  POS System - Remove All Data${NC}"
echo "======================================="
echo ""
echo -e "${RED}⚠️  WARNING: This operation is IRREVERSIBLE!${NC}"
echo -e "${RED}This will DELETE ALL DATA from the database including:${NC}"
echo "- All orders and order items"
echo "- All payments and transactions"
echo "- All users (except system defaults)"
echo "- All custom products and categories" 
echo "- All table assignments and history"
echo "- All inventory records"
echo "- All audit logs and history"
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

echo -e "${YELLOW}Current database contents:${NC}"
# Show current record counts
docker exec $CONTAINER_NAME psql -U postgres -d pos_system -c "
SELECT 
    'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL SELECT 
    'Orders' as table_name, COUNT(*) as record_count FROM orders
UNION ALL SELECT 
    'Order Items' as table_name, COUNT(*) as record_count FROM order_items
UNION ALL SELECT 
    'Payments' as table_name, COUNT(*) as record_count FROM payments
UNION ALL SELECT 
    'Products' as table_name, COUNT(*) as record_count FROM products
UNION ALL SELECT 
    'Categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL SELECT 
    'Tables' as table_name, COUNT(*) as record_count FROM dining_tables
UNION ALL SELECT 
    'Inventory' as table_name, COUNT(*) as record_count FROM inventory
ORDER BY table_name;
"

echo ""
echo -e "${RED}Are you absolutely sure you want to DELETE ALL DATA?${NC}"
echo -e "${YELLOW}Type 'DELETE ALL DATA' to confirm (case sensitive):${NC}"
read -p "> " FINAL_CONFIRMATION

if [[ "$FINAL_CONFIRMATION" != "DELETE ALL DATA" ]]; then
    echo -e "${BLUE}❌ Operation cancelled. Data is safe.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🗑️  Removing all data...${NC}"

# Create a backup first (just in case)
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/emergency_backup_${TIMESTAMP}.sql"

mkdir -p $BACKUP_DIR
echo -e "${BLUE}Creating emergency backup first: $BACKUP_FILE${NC}"
docker exec $CONTAINER_NAME pg_dump -U postgres pos_system > $BACKUP_FILE

# Truncate all tables (in correct order to respect foreign keys)
echo -e "${YELLOW}🗑️  Clearing all data tables...${NC}"

docker exec $CONTAINER_NAME psql -U postgres -d pos_system -c "
-- Disable triggers and constraints temporarily
SET session_replication_role = replica;

-- Clear data tables in dependency order
TRUNCATE TABLE order_status_history CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE inventory CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE dining_tables CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable triggers and constraints
SET session_replication_role = DEFAULT;

-- Reset sequences
SELECT setval('users_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'users_id_seq');
SELECT setval('categories_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'categories_id_seq');
SELECT setval('products_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'products_id_seq');
SELECT setval('dining_tables_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'dining_tables_id_seq');
SELECT setval('orders_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'orders_id_seq');
SELECT setval('order_items_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'order_items_id_seq');
SELECT setval('payments_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'payments_id_seq');
SELECT setval('inventory_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'inventory_id_seq');
SELECT setval('order_status_history_id_seq', 1, false) WHERE EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'order_status_history_id_seq');
"

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ All data removed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Verification - Record counts after cleanup:${NC}"
    
    # Show record counts after cleanup
    docker exec $CONTAINER_NAME psql -U postgres -d pos_system -c "
    SELECT 
        'Users' as table_name, COUNT(*) as record_count FROM users
    UNION ALL SELECT 
        'Orders' as table_name, COUNT(*) as record_count FROM orders
    UNION ALL SELECT 
        'Order Items' as table_name, COUNT(*) as record_count FROM order_items
    UNION ALL SELECT 
        'Payments' as table_name, COUNT(*) as record_count FROM payments
    UNION ALL SELECT 
        'Products' as table_name, COUNT(*) as record_count FROM products
    UNION ALL SELECT 
        'Categories' as table_name, COUNT(*) as record_count FROM categories
    UNION ALL SELECT 
        'Tables' as table_name, COUNT(*) as record_count FROM dining_tables
    UNION ALL SELECT 
        'Inventory' as table_name, COUNT(*) as record_count FROM inventory
    ORDER BY table_name;
    "
    
    echo ""
    echo -e "${YELLOW}💾 Emergency backup saved to: $BACKUP_FILE${NC}"
    echo -e "${BLUE}You can restore data using: make restore${NC}"
    echo ""
    echo -e "${GREEN}✅ Database is now clean and ready for fresh data!${NC}"
    echo -e "${YELLOW}Consider running 'make db-reset' to reload seed data.${NC}"
    
else
    echo -e "${RED}❌ Failed to remove data!${NC}"
    echo -e "${YELLOW}Emergency backup is available at: $BACKUP_FILE${NC}"
    exit 1
fi
