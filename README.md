# 🍽️ Complete POS System - Professional Restaurant Management

> **A modern, enterprise-grade Point of Sale system built for the next generation of restaurants**

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker&logoColor=white)](https://docker.com)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Go](https://img.shields.io/badge/Go-1.21-00ADD8?logo=go&logoColor=white)](https://golang.org)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)](https://postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.13-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

## 📖 Table of Contents

1. [What is this Project?](#what-is-this-project)
2. [System Requirements](#system-requirements)
3. [Step-by-Step Installation Guide](#step-by-step-installation-guide)
4. [Running the System](#running-the-system)
5. [Accessing the Application](#accessing-the-application)
6. [Demo Accounts](#demo-accounts)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)
9. [Features Overview](#features-overview)
10. [Technology Stack](#technology-stack)
11. [Project Structure](#project-structure)
12. [Support & Contribution](#support--contribution)

---

## What is this Project?

This is a **complete, production-ready Point of Sale (POS) system** designed for restaurants and food service businesses. It includes:

- **🍽️ Order Management** - Create, track, and manage customer orders
- **👨‍🍳 Kitchen Display System** - Real-time order preparation workflow
- **💳 Payment Processing** - Complete payment flow with receipt generation
- **👥 Multi-Role Access** - Different interfaces for Admin, Server, Counter, and Kitchen staff
- **📊 Admin Dashboard** - Comprehensive management with reports and analytics
- **🍕 Menu Management** - Full product and category management
- **🪑 Table Management** - Seating and table assignment system

**Built with:** Golang (Backend), React (Frontend), PostgreSQL (Database), and Docker (Containerization)

---

## System Requirements

Before you begin, ensure your computer meets these requirements:

### Required Software

1. **Docker Desktop** (Required - This is essential for running the system)
   - **Windows:** Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - **Mac:** Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - **Linux:** Install Docker and Docker Compose separately

2. **Git** (Optional - for cloning the repository)
   - Download from [git-scm.com](https://git-scm.com/downloads)
   - Or download the ZIP file directly from GitHub

3. **Text Editor/IDE** (Optional - for making code changes)
   - VS Code, Cursor, or any code editor of your choice

### System Specifications

- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** Minimum 2GB free space
- **Operating System:** Windows 10/11, macOS, or Linux

---

## Step-by-Step Installation Guide

### Step 1: Install Docker Desktop

#### For Windows Users:

1. Download Docker Desktop for Windows from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Run the installer and follow the setup wizard
3. When prompted, enable **WSL 2** (Windows Subsystem for Linux)
4. Complete the installation and restart your computer
5. After restart, open Docker Desktop from your Start menu
6. Wait for Docker Desktop to start (you'll see the Docker icon in your system tray turn green)
7. Accept the Docker Desktop service agreement if prompted

#### For Mac Users:

1. Download Docker Desktop for Mac from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Open the downloaded `.dmg` file
3. Drag Docker to your Applications folder
4. Open Docker from Applications
5. Wait for Docker to start (Docker icon in menu bar turns from gray to steady)

#### For Linux Users:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose

# Add your user to docker group (optional but recommended)
sudo usermod -aG docker $USER
```

### Step 2: Verify Docker Installation

Open your terminal or command prompt and run:

```bash
docker --version
```

You should see output like: `Docker version 29.8.1, build 4a63305`

Then check Docker Compose:

```bash
docker-compose --version
```

You should see output like: `Docker Compose version v5.5.1`

**If you see these outputs, Docker is installed correctly! ✅**

### Step 3: Download the Project

#### Option A: Using Git (Recommended)

1. Open your terminal or command prompt
2. Navigate to where you want to store the project:
   ```bash
   cd Desktop
   # or
   cd Documents
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/madebyaris/poinf-of-sales.git
   ```
4. Navigate into the project directory:
   ```bash
   cd poinf-of-sales
   ```

#### Option B: Download ZIP File

1. Go to the GitHub repository: [github.com/madebyaris/poinf-of-sales](https://github.com/madebyaris/poinf-of-sales)
2. Click the green **Code** button
3. Select **Download ZIP**
4. Extract the downloaded ZIP file
5. Navigate into the extracted folder

### Step 4: Configure Environment Variables

The project needs a `.env` file to store configuration settings. This file is automatically created when you start the system, but you can create it manually if needed.

The `.env` file contains these settings (default values):

```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=pos_system
DB_SSLMODE=disable
PORT=8080
GIN_MODE=debug
VITE_API_URL=http://localhost:8080
```

**Note:** You don't need to modify these settings for the default setup. They're already configured to work out of the box.

---

## Running the System

### Method 1: Using Docker Compose (Recommended - Works on All Systems)

This is the simplest method and works on Windows, Mac, and Linux.

1. **Make sure Docker Desktop is running**
   - On Windows/Mac: Check that the Docker icon in your system tray/menu bar is green
   - On Linux: Make sure the Docker service is running

2. **Navigate to the project directory** (if not already there):
   ```bash
   cd poinf-of-sales
   ```

3. **Start the system** with this single command:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

   **What this command does:**
   - Downloads and builds Docker images for the frontend, backend, and database
   - Creates and starts three containers: PostgreSQL database, Golang backend, React frontend
   - Sets up networking between the containers
   - Initializes the database with seed data

4. **Wait for the build to complete**
   - This may take 5-15 minutes on the first run (depending on your internet speed)
   - You'll see lots of output as Docker downloads images and builds the containers
   - When it's done, you'll see logs from all three services

5. **Keep the terminal window open**
   - The system runs in the foreground in this terminal
   - You'll see live logs from all services
   - To stop the system, press `Ctrl+C` in this terminal

### Method 2: Running in Background (Detached Mode)

If you want to run the system in the background and close the terminal:

1. Start the system in detached mode:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

2. The system will start and run in the background
3. You can close the terminal window if needed

4. To view logs later:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

5. To stop the system:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Method 3: Using Make (If Make is Installed)

If you have Make installed on your system (common on Mac/Linux, less common on Windows):

```bash
# Start the development environment
make dev

# Or start in background
make up

# Stop the system
make down
```

---

## Accessing the Application

Once the system is running, you can access it through your web browser:

### Access URLs

- **Frontend Application:** http://localhost:3000
- **Backend API:** http://localhost:8080/api/v1
- **Database:** localhost:5432 (for direct database access)

### First Time Login

1. Open your web browser
2. Navigate to: **http://localhost:3000**
3. You'll see the login page
4. Use the admin credentials (see below)
5. Click **Login**

### What You'll See

After logging in as admin, you'll see:
- **Dashboard** with system overview
- **Sidebar navigation** to different sections
- **Role switcher** to view different interfaces (Server, Counter, Kitchen)
- **Admin management** for users, products, tables, etc.

---

## Demo Accounts

The system comes pre-configured with demo accounts for testing different roles:

| Role | Username | Password | What You Can Do |
|------|----------|----------|-----------------|
| **👑 Admin** | `admin` | `admin123` | Full system access - manage users, products, tables, view all reports, access all role interfaces |
| **📊 Manager** | `manager1` | `admin123` | Business operations - view reports, manage orders, access business analytics |
| **🍽️ Server** | `server1` or `server2` | `admin123` | Dine-in orders only - create orders for dine-in customers, assign tables |
| **💰 Counter** | `counter1` or `counter2` | `admin123` | All order types + payments - create takeout/delivery orders, process payments |
| **👨‍🍳 Kitchen** | `kitchen1` | `admin123` | Order preparation - view orders, mark items as ready, manage kitchen workflow |

### Testing Different Roles

1. **Logout** from the current session
2. **Login** with a different role's credentials
3. Explore the role-specific interface
4. Each role has a different dashboard and features tailored to their responsibilities

---

## Common Commands

### Starting and Stopping

```bash
# Start the system (foreground - shows logs)
docker-compose -f docker-compose.dev.yml up --build

# Start the system (background - detached mode)
docker-compose -f docker-compose.dev.yml up -d --build

# Stop the system
docker-compose -f docker-compose.dev.yml down

# Restart the system
docker-compose -f docker-compose.dev.yml restart
```

### Viewing Logs

```bash
# View logs from all services
docker-compose -f docker-compose.dev.yml logs -f

# View only backend logs
docker-compose -f docker-compose.dev.yml logs -f backend

# View only frontend logs
docker-compose -f docker-compose.dev.yml logs -f frontend

# View only database logs
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Checking System Status

```bash
# Check which containers are running
docker ps

# Check system status
docker-compose -f docker-compose.dev.yml ps
```

### Database Management

```bash
# Access PostgreSQL shell (advanced)
docker exec -it pos-postgres-dev psql -U postgres pos_system

# Reset database with fresh data (destructive - deletes all data)
docker exec pos-postgres-dev psql -U postgres pos_system -f /docker-entrypoint-initdb.d/01_schema.sql
docker exec pos-postgres-dev psql -U postgres pos_system -f /docker-entrypoint-initdb.d/02_seed_data.sql
```

### Cleaning Up

```bash
# Stop and remove containers (keeps data)
docker-compose -f docker-compose.dev.yml down

# Stop and remove containers and volumes (deletes all data - destructive)
docker-compose -f docker-compose.dev.yml down -v

# Clean up unused Docker resources (frees disk space)
docker system prune -f
```

---

## Troubleshooting

### Issue: "Docker Desktop is not running"

**Symptoms:** Error message about Docker daemon not running

**Solution:**
1. Open Docker Desktop from your Start menu (Windows) or Applications folder (Mac)
2. Wait for the Docker icon to turn green
3. Try running the command again

### Issue: Port already in use (3000, 8080, or 5432)

**Symptoms:** Error about port being already allocated

**Solution:**
1. Check what's using the port:
   ```bash
   # On Windows
   netstat -ano | findstr :3000
   
   # On Mac/Linux
   lsof -i :3000
   ```
2. Stop the other application using the port, OR
3. Change the port in `docker-compose.dev.yml` (advanced)

### Issue: Build fails with "go.sum not found"

**Symptoms:** Backend build fails with go.sum error

**Solution:**
```bash
# Generate go.sum file
cd backend
docker run --rm -v "$(pwd):/app" -w /app golang:1.21-alpine sh -c "go mod download && go mod tidy"
cd ..
```

### Issue: Frontend not loading or showing errors

**Symptoms:** Browser shows errors or blank page

**Solution:**
1. Check frontend logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs frontend
   ```
2. Restart the frontend container:
   ```bash
   docker-compose -f docker-compose.dev.yml restart frontend
   ```
3. Clear browser cache and refresh

### Issue: Database connection errors

**Symptoms:** Backend shows database connection errors

**Solution:**
1. Check if PostgreSQL container is running:
   ```bash
   docker ps | grep postgres
   ```
2. Check database logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs postgres
   ```
3. Restart the database:
   ```bash
   docker-compose -f docker-compose.dev.yml restart postgres
   ```

### Issue: Can't login or authentication errors

**Symptoms:** Login fails with invalid credentials error

**Solution:**
1. Check if demo users exist in database:
   ```bash
   docker exec pos-postgres-dev psql -U postgres pos_system -c "SELECT username, role FROM users;"
   ```
2. If no users exist, reset the database:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up --build
   ```

### Issue: System is slow or unresponsive

**Symptoms:** Application loads slowly or times out

**Solution:**
1. Check system resources (RAM, CPU)
2. Restart Docker Desktop
3. Reduce Docker Desktop resource allocation in settings
4. Clean up Docker resources:
   ```bash
   docker system prune -f
   ```

### Issue: Changes to code not reflecting

**Symptoms:** You changed code but don't see changes in the browser

**Solution:**
1. The system has hot-reloading enabled, so changes should appear automatically
2. If not, try refreshing the browser (Ctrl+F5 or Cmd+Shift+R)
3. Check logs to see if backend reloaded:
   ```bash
   docker-compose -f docker-compose.dev.yml logs backend
   ```
4. If still not working, restart the affected service:
   ```bash
   docker-compose -f docker-compose.dev.yml restart backend
   # or
   docker-compose -f docker-compose.dev.yml restart frontend
   ```

### Issue: Docker build takes too long

**Symptoms:** Build process seems stuck or very slow

**Solution:**
1. This is normal on first run - Docker needs to download images
2. Check your internet connection
3. If it's been more than 30 minutes, try:
   ```bash
   # Cancel with Ctrl+C
   # Clean up
   docker system prune -f
   # Try again
   docker-compose -f docker-compose.dev.yml up --build
   ```

### Issue: "Permission denied" errors (Linux/Mac)

**Symptoms:** Permission errors when running commands

**Solution:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### Issue: Out of disk space

**Symptoms:** Docker reports no space left on device

**Solution:**
```bash
# Clean up Docker resources
docker system prune -a -f
docker volume prune -f
```

---

## Features Overview

### 🍽️ Order Management
- Create orders for dine-in, takeout, and delivery
- Add multiple items to orders
- Real-time order tracking
- Order status updates (pending, preparing, ready, completed)
- Order history and search

### 👨‍🍳 Kitchen Display System
- Real-time order queue for kitchen staff
- Individual item tracking
- Mark items as ready independently
- Visual progress indicators
- Sound notifications for new orders
- Touch-optimized interface for tablets

### 💳 Payment Processing
- Multiple payment methods (cash, card, digital)
- Multi-step payment flow
- Receipt generation
- Payment history and reporting
- Tax calculation
- Discount application

### 👥 Multi-Role Access Control
- **Admin:** Full system access and management
- **Manager:** Business operations and reporting
- **Server:** Dine-in order creation
- **Counter:** All order types and payments
- **Kitchen:** Order preparation workflow

### 📊 Admin Dashboard
- System overview and statistics
- User management (create, edit, delete users)
- Product and category management
- Table management
- Sales reports and analytics
- Income reports
- Order reports
- Financial metrics

### 🍕 Menu Management
- Create and manage product categories
- Add, edit, delete products
- Product images
- Pricing management
- Inventory tracking
- Category-based organization

### 🪑 Table Management
- Create and manage dining tables
- Table location assignment
- Table status tracking (available, occupied, reserved)
- Table capacity settings
- Real-time availability updates

---

## Technology Stack

### Backend
- **Language:** Golang 1.21
- **Framework:** Gin Web Framework
- **Database:** PostgreSQL 15
- **Authentication:** JWT (JSON Web Tokens)
- **API:** RESTful API design

### Frontend
- **Framework:** React 18.3
- **Routing:** TanStack Start
- **Language:** TypeScript 5.6
- **Styling:** Tailwind CSS 3.4
- **UI Components:** shadcn/ui + Radix UI
- **Data Tables:** TanStack Table
- **State Management:** TanStack Query
- **Build Tool:** Vite 5.4

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Development Mode:** Hot reloading with Air (Go) and Vite (React)
- **Production Mode:** Optimized multi-stage builds

---

## Project Structure

```
poinf-of-sales/
├── backend/                    # Golang backend API
│   ├── internal/
│   │   ├── api/              # API routes and setup
│   │   ├── handlers/         # Request handlers (business logic)
│   │   ├── middleware/       # Authentication and CORS
│   │   ├── models/           # Data models and DTOs
│   │   └── database/        # Database connection
│   ├── main.go               # Backend entry point
│   ├── go.mod                # Go dependencies
│   ├── go.sum                # Go dependency checksums
│   ├── Dockerfile            # Production Docker image
│   └── Dockerfile.dev        # Development Docker image
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── pos/         # POS interface components
│   │   │   ├── kitchen/     # Kitchen display components
│   │   │   ├── server/      # Server interface components
│   │   │   ├── counter/     # Counter interface components
│   │   │   └── ui/          # Base UI components (shadcn/ui)
│   │   ├── routes/          # File-based routing
│   │   ├── api/             # API client
│   │   ├── types/           # TypeScript type definitions
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utility functions
│   ├── package.json         # Node.js dependencies
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── Dockerfile           # Production Docker image
│   └── Dockerfile.dev       # Development Docker image
├── database/                  # Database schema and seed data
│   └── init/
│       ├── 01_schema.sql    # Database schema
│       └── 02_seed_data.sql # Sample data
├── scripts/                   # Utility scripts
│   ├── create-admin.sh      # Create admin user
│   ├── backup.sh            # Backup database
│   ├── restore.sh           # Restore from backup
│   ├── db-reset.sh          # Reset database
│   └── remove-data.sh       # Remove all data
├── docker-compose.dev.yml    # Development environment config
├── docker-compose.yml        # Production environment config
├── Makefile                  # Convenience commands
├── .env                      # Environment variables (create this)
└── README.md                 # This file
```

---

## Support & Contribution

### Getting Help

If you encounter issues not covered in this guide:

1. **Check the logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

2. **Search existing issues:** [GitHub Issues](https://github.com/madebyaris/poinf-of-sales/issues)

3. **Create a new issue:** Include:
   - Your operating system
   - Docker version
   - Exact error message
   - Steps to reproduce
   - Relevant logs

### Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Donation & Support

This project is free and open source. If you find it valuable:

- ⭐ **Star the repository** on GitHub
- 🐛 **Report bugs** to help improve the system
- 💰 **Sponsor development** to support ongoing work
- ☕ **Buy me a coffee** at: `arissetia.m@gmail.com`

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**MIT License Summary:**
- ✅ Free for commercial use
- ✅ Free for modification
- ✅ Free for distribution
- ✅ Free for private use

---

## Acknowledgments

- **Golang Community** for the amazing ecosystem
- **React Team** for the incredible frontend framework
- **Tailwind CSS** for making beautiful designs accessible
- **TanStack** for powerful data management libraries
- **shadcn/ui** for beautiful component system
- **Docker** for making deployment seamless

---

<div align="center">

### **⭐ Star this project if you find it useful! ⭐**

**Built with ❤️ by developers, for developers**

*Ready to transform your restaurant operations? Get started today!*

</div>
