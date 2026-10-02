#!/bin/bash

# Create Demo Users Script for POS System
# This script creates all demo users with the password 'admin123'

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection check
echo -e "${BLUE}Checking database connection...${NC}"

# Try to connect to the database
if ! docker exec pos-postgres-dev psql -U postgres pos_system -c "SELECT 1;" > /dev/null 2>&1; then
    if ! docker exec pos-postgres psql -U postgres pos_system -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${RED}❌ Could not connect to database. Please ensure containers are running.${NC}"
        exit 1
    fi
    CONTAINER_NAME="pos-postgres"
else
    CONTAINER_NAME="pos-postgres-dev"
fi

echo -e "${GREEN}✅ Connected to database via ${CONTAINER_NAME}${NC}"

# Create the SQL script for demo users
cat > /tmp/create_demo_users.sql << 'EOF'
-- Insert demo users (ignore if they already exist)
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Admin', 'User', 'admin'),
('manager1', 'manager@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'John', 'Manager', 'manager'),
('server1', 'server1@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Sarah', 'Smith', 'server'),
('server2', 'server2@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Mike', 'Johnson', 'server'),
('counter1', 'counter1@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Lisa', 'Davis', 'counter'),
('counter2', 'counter2@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Tom', 'Wilson', 'counter'),
('kitchen1', 'kitchen@pos.com', '$2a$10$FPH.ONfAgquWmXjM3LE61OIgOPgXX8i.jOISCHZ2DpK2gg4krEWfO', 'Chef', 'Williams', 'kitchen')
ON CONFLICT (username) DO NOTHING;
EOF

# Execute the SQL script
echo -e "${BLUE}Executing user creation SQL...${NC}"
docker exec -i ${CONTAINER_NAME} psql -U postgres pos_system < /tmp/create_demo_users.sql

# Clean up temp file
rm -f /tmp/create_demo_users.sql

# Count users created
USER_COUNT=$(docker exec ${CONTAINER_NAME} psql -U postgres pos_system -t -c "SELECT COUNT(*) FROM users;")
echo -e "${GREEN}✅ Total users in database: ${USER_COUNT// /}${NC}"

# Show created users
echo -e "${YELLOW}📋 Users in database:${NC}"
docker exec ${CONTAINER_NAME} psql -U postgres pos_system -c "SELECT username, role, first_name, last_name, is_active FROM users ORDER BY role, username;"

echo -e "${GREEN}🎉 Demo users setup completed!${NC}"
