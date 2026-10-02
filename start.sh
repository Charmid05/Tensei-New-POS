#!/bin/bash

# POS System Startup Script

echo "🚀 Starting POS System..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=pos_system
DB_SSLMODE=disable

# Backend Configuration
PORT=8080
GIN_MODE=debug

# Frontend Configuration
VITE_API_URL=http://localhost:8080
EOF
fi

# Build and start services
echo "🔧 Building and starting services..."
docker-compose up --build

echo "✅ POS System is starting up!"
echo ""
echo "📱 Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   Database: localhost:5432"
echo ""
echo "🔑 Default login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Press Ctrl+C to stop the system"

