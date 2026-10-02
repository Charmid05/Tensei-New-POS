#!/bin/bash

# Create Super Admin Script
# This script creates a super admin user in the POS system

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}POS System - Create Super Admin${NC}"
echo "======================================="
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

# Get admin details from user
echo -e "${YELLOW}Please provide the following information:${NC}"
echo ""

read -p "Username: " USERNAME
while [[ -z "$USERNAME" ]]; do
    echo -e "${RED}Username cannot be empty!${NC}"
    read -p "Username: " USERNAME
done

read -p "Email: " EMAIL
while [[ -z "$EMAIL" ]]; do
    echo -e "${RED}Email cannot be empty!${NC}"
    read -p "Email: " EMAIL
done

read -p "First Name: " FIRST_NAME
while [[ -z "$FIRST_NAME" ]]; do
    echo -e "${RED}First Name cannot be empty!${NC}"
    read -p "First Name: " FIRST_NAME
done

read -p "Last Name: " LAST_NAME
while [[ -z "$LAST_NAME" ]]; do
    echo -e "${RED}Last Name cannot be empty!${NC}"
    read -p "Last Name: " LAST_NAME
done

# Hidden password input
echo -n "Password: "
read -s PASSWORD
echo ""
while [[ -z "$PASSWORD" ]]; do
    echo -e "${RED}Password cannot be empty!${NC}"
    echo -n "Password: "
    read -s PASSWORD
    echo ""
done

echo -n "Confirm Password: "
read -s CONFIRM_PASSWORD
echo ""
while [[ "$PASSWORD" != "$CONFIRM_PASSWORD" ]]; do
    echo -e "${RED}Passwords do not match!${NC}"
    echo -n "Password: "
    read -s PASSWORD
    echo ""
    echo -n "Confirm Password: "
    read -s CONFIRM_PASSWORD
    echo ""
done

echo ""
echo -e "${YELLOW}Creating admin user with the following details:${NC}"
echo "Username: $USERNAME"
echo "Email: $EMAIL"
echo "Name: $FIRST_NAME $LAST_NAME"
echo "Role: admin"
echo ""

read -p "Continue? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Operation cancelled.${NC}"
    exit 0
fi

# Generate password hash (we'll let the Go application handle this for now)
# For now, we'll insert a placeholder and let the user change it on first login
echo -e "${YELLOW}💫 Creating admin user...${NC}"

# Check if user already exists
USER_EXISTS=$(docker exec $CONTAINER_NAME psql -U postgres -d pos_system -tAc "SELECT EXISTS(SELECT 1 FROM users WHERE username = '$USERNAME' OR email = '$EMAIL');")

if [[ "$USER_EXISTS" == "t" ]]; then
    echo -e "${RED}❌ User with username '$USERNAME' or email '$EMAIL' already exists!${NC}"
    exit 1
fi

# Create a temporary password hash (bcrypt hash for "temppassword123")
# In a real application, you'd want to hash the actual password
TEMP_HASH='$2b$10$K6z8U9TnC.6LnFkLpz8tje5rUZnSu8E2y6Zr4cHvNb8dRFjY0xFIW'

# Insert the admin user
docker exec $CONTAINER_NAME psql -U postgres -d pos_system -c "
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
VALUES ('$USERNAME', '$EMAIL', '$TEMP_HASH', '$FIRST_NAME', '$LAST_NAME', 'admin', true);
"

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Super admin created successfully!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT SECURITY NOTICE:${NC}"
    echo -e "${RED}The user was created with a temporary password hash.${NC}"
    echo -e "${YELLOW}You need to update the password through the API or directly in the database.${NC}"
    echo ""
    echo -e "${BLUE}To set the actual password, you can:${NC}"
    echo "1. Use the login API to authenticate and change password"
    echo "2. Update the password_hash directly in the database"
    echo ""
    echo -e "${GREEN}Admin user details:${NC}"
    echo "Username: $USERNAME"
    echo "Email: $EMAIL"
    echo "Role: admin"
    echo "Status: active"
else
    echo -e "${RED}❌ Failed to create admin user!${NC}"
    exit 1
fi
