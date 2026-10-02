# Role-Based Access Control Implementation

## Overview
The POS system has been updated with comprehensive role-based access control (RBAC) according to your requirements. Each user role now has specific responsibilities and access permissions.

## User Roles & Responsibilities

### 1. **Admin Role** 
**Responsibilities:** Monitoring, create menu, create table, check income, admin-level tasks

**Features Implemented:**
- **Admin Dashboard** - Comprehensive monitoring interface with:
  - Real-time stats (today's orders, revenue, active orders, occupied tables)
  - Income reporting with time-based filtering (today/week/month)
  - Detailed revenue breakdown with gross/tax/net income
  - Quick action cards for management tasks

**API Endpoints:**
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/reports/income` - Income reports
- `GET /admin/reports/sales` - Sales reports
- `POST /admin/categories` - Create categories  
- `PUT /admin/categories/:id` - Update categories
- `DELETE /admin/categories/:id` - Delete categories
- `POST /admin/products` - Create products
- `PUT /admin/products/:id` - Update products
- `DELETE /admin/products/:id` - Delete products
- `POST /admin/tables` - Create tables
- `PUT /admin/tables/:id` - Update tables
- `DELETE /admin/tables/:id` - Delete tables
- `GET /admin/users` - List users
- `POST /admin/users` - Create users
- `PUT /admin/users/:id` - Update users
- `DELETE /admin/users/:id` - Delete users

### 2. **Server Role**
**Responsibilities:** Create orders for guests (dine-in ONLY)

**Features Implemented:**
- **Server Interface** - Specialized interface for dine-in orders:
  - Product catalog with category filtering
  - Table selection (only available tables)
  - Shopping cart with item management
  - Customer name entry (optional)
  - Order notes and special instructions
  - **Restriction:** Can only create dine-in orders

**API Endpoints:**  
- `POST /server/orders` - Create dine-in orders only (automatically forces order_type to 'dine_in')

### 3. **Counter/Checkout Role**
**Responsibilities:** Process payments for dine-in customers + create orders (all types: dine-in, dine-out, take-away)

**Features Implemented:**
- **Counter Interface** - Dual-purpose interface:
  - **Order Creation Tab:**
    - Support for all order types (dine-in, takeout, delivery)
    - Product catalog with category filtering  
    - Table selection (for dine-in orders)
    - Customer information entry
    - Shopping cart management
  - **Payment Processing Tab:**
    - View orders ready for payment
    - Multiple payment methods (cash, credit, debit, digital wallet)
    - Payment amount entry with reference numbers
    - Process payments for completed orders

**API Endpoints:**
- `POST /counter/orders` - Create orders (all types)
- `POST /counter/orders/:id/payments` - Process payments

### 4. **Kitchen Role** (Existing)
**Responsibilities:** Order preparation and status updates

**Features:**
- Kitchen Display System (already implemented)
- Order status management
- Preparation time tracking

## Database Schema Updates

### Updated User Roles
The database schema has been updated to support the new role structure:

```sql
-- Updated user roles constraint
role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'server', 'counter', 'kitchen'))
```

### Sample Users Added
- `server1` / `server2` - Server role users
- `counter1` / `counter2` - Counter/Checkout role users
- Existing admin, manager, kitchen users remain

## Frontend Implementation

### Role-Based Layout System
- **RoleBasedLayout Component** - Central routing component that:
  - Shows appropriate interface based on user role
  - Provides role-based navigation tabs
  - Displays user role badges and permissions
  - Handles role-specific access control

### Interface Components
1. **AdminDashboard** - Full management interface for admins
2. **ServerInterface** - Dine-in order creation for servers  
3. **CounterInterface** - Order creation and payment processing for counter staff
4. **Existing components** - POSLayout, KitchenLayout remain available

### Navigation System
Users see different navigation options based on their role:
- **Admin/Manager:** All interfaces (Dashboard, POS, Server, Counter, Kitchen)
- **Server:** Server Interface + General POS  
- **Counter:** Counter Interface + General POS
- **Kitchen:** Kitchen Display only

## API Client Updates

### New Methods Added
- `createServerOrder()` - Server-specific order creation
- `createCounterOrder()` - Counter-specific order creation  
- `processCounterPayment()` - Counter payment processing
- `getDashboardStats()` - Admin dashboard data
- `getIncomeReport()` - Admin income reporting
- Plus full CRUD operations for categories, products, tables, and users

## Security Implementation

### Role-Based Route Protection
- **Backend middleware** enforces role restrictions
- **JWT tokens** include role information
- **API endpoints** validate user permissions
- **Frontend routing** shows appropriate interfaces

### Access Control Rules
- Servers can ONLY create dine-in orders
- Counter staff can create ANY order type and process payments  
- Admins have full system access
- Kitchen staff limited to order status management

## Testing the Implementation

### 1. Test User Accounts
Login with these sample accounts to test different roles:

```
Admin:
- Username: admin
- Password: admin123

Server:  
- Username: server1
- Password: admin123

Counter:
- Username: counter1  
- Password: admin123

Kitchen:
- Username: kitchen1
- Password: admin123
```

### 2. Testing Scenarios

**Admin Testing:**
1. Login as admin
2. View dashboard with stats and income reports
3. Access all management interfaces
4. Test period filtering on income reports

**Server Testing:**
1. Login as server1
2. Verify only "Server Interface" and "POS" tabs are visible
3. Create a dine-in order (verify table selection is required)
4. Confirm order type is automatically set to 'dine_in'

**Counter Testing:**
1. Login as counter1
2. Verify "Counter/Checkout" and "POS" tabs are visible
3. Test order creation for all types (dine-in, takeout, delivery)
4. Switch to payment processing tab
5. Process payment for a completed order

## File Structure

### New Files Created
```
frontend/src/components/
├── admin/
│   └── AdminDashboard.tsx         # Admin management interface
├── server/
│   └── ServerInterface.tsx        # Server dine-in order interface  
├── counter/
│   └── CounterInterface.tsx       # Counter order & payment interface
└── RoleBasedLayout.tsx           # Main role routing component
```

### Modified Files
```
backend/database/init/
├── 01_schema.sql                 # Added server/counter roles
└── 02_seed_data.sql             # Added sample users

backend/internal/
├── models/models.go             # Updated role comments
└── api/routes.go                # Added role-based endpoints

frontend/src/
├── api/client.ts                # Added role-specific API methods
└── routes/index.tsx             # Updated to use RoleBasedLayout
```

## Next Steps

The core role-based system is now complete. Remaining tasks from your TODO list:

1. **Admin Menu Management UI** - Create admin interface forms for managing categories and products
2. **Admin Table Management UI** - Create admin interface forms for managing dining tables
3. **System Testing** - Comprehensive testing of all role-based workflows
4. **UI Refinements** - Polish the interfaces based on user feedback

## Usage Instructions

1. **Start the system:**
   ```bash
   make dev
   ```

2. **Login with different roles** to see role-specific interfaces

3. **Admin users** will see the dashboard with full management capabilities

4. **Server users** will only be able to create dine-in orders

5. **Counter users** can create any order type and process payments

6. **Kitchen users** will see the kitchen display system

The system now fully implements your role-based requirements with proper access control and specialized interfaces for each user type.

