# Finance Data Processing and Access Control Backend

A comprehensive backend system for managing financial records with **role-based access control (RBAC)**, user management, and advanced analytics dashboards. Built with Node.js, Express, and PostgreSQL.

## 🎯 Project Overview

This project demonstrates a production-quality backend implementation with:
- ✅ JWT-based authentication and authorization
- ✅ Three-tier role system (VIEWER, ANALYST, ADMIN)
- ✅ Financial record management with CRUD operations
- ✅ Analytics dashboard with aggregations and trends
- ✅ Comprehensive input validation and error handling
- ✅ Soft delete implementation for data safety
- ✅ Clean architecture with separation of concerns

## 📚 Documentation

Start here based on your needs:

| Document | Purpose |
|----------|---------|
| **[QUICKSTART.md](./docs/QUICKSTART.md)** | ⚡ 5-minute setup guide |
| **[SETUP.md](./docs/SETUP.md)** | 📝 Detailed installation & configuration |
| **[API.md](./docs/API.md)** | 🔌 Complete API endpoint reference |
| **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | 🏗️ System design and structure |
| **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** | 🗄️ Data model and schema |
| **[PERMISSIONS.md](./docs/PERMISSIONS.md)** | 🔐 Access control matrix |
| **[DECISIONS.md](./docs/DECISIONS.md)** | 💡 Design decisions & trade-offs |
| **[TESTING.md](./docs/TESTING.md)** | 🧪 Testing strategies & scenarios |

## ⚡ Quick Start

### Prerequisites
```bash
node --version  # 18+
npm --version   # 8+
psql --version  # PostgreSQL 12+
```

### Installation (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Create database
psql -U postgres -c "CREATE DATABASE finance_db;"

# 4. Run migrations and seeds
npm run migrate
npm run seed

# 5. Start server
npm run dev
```

**Server running at:** `http://localhost:3000`

## 🔐 Test Credentials

After seeding, login with:

| Email | Password | Role |
|-------|----------|------|
| admin@finance.local | admin123 | Full system access |
| analyst@finance.local | admin123 | Record & analytics access |
| viewer@finance.local | admin123 | Read-only access |

## 📋 Core Features

### 1. Authentication & Authorization
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Three default roles: VIEWER, ANALYST, ADMIN

### 2. Financial Record Management
- Create, read, update, and delete financial records
- Support for income, expense, and transfer types
- Flexible category system
- Date-based filtering and sorting
- Soft deletes for data integrity

### 3. Dashboard Analytics
- Financial summary (totals, balance, count)
- Monthly trend analysis
- Category-wise breakdown
- Recent transaction tracking
- Role-based data filtering

### 4. User Management (Admin only)
- Create and manage users
- Assign and modify roles
- Deactivate user accounts
- View user activity history

## 🏗️ Architecture

### Layered Architecture
```
Request → Routes → Controllers → Services → Models → Database
          ↓ (Middleware: Auth, Validation, Error Handling)
```

### Key Components
- **Models**: Sequelize ORM with Role, User, FinancialRecord
- **Services**: Business logic for auth, records, dashboards
- **Controllers**: Request handlers with input validation
- **Middleware**: Authentication, authorization, error handling
- **Routes**: RESTful API endpoints
- **Validators**: Joi schemas for input validation
- **Utils**: Custom error classes, permission logic

## 🔌 API Quick Reference

### Authentication
```bash
POST   /auth/register          # Create account
POST   /auth/login             # Get token
GET    /auth/me                # Current user (authenticated)
```

### Financial Records
```bash
GET    /records                # List (filtered by role)
POST   /records                # Create (ANALYST/ADMIN)
GET    /records/:id            # Get details
PATCH  /records/:id            # Update
DELETE /records/:id            # Delete (soft)
```

### Dashboard
```bash
GET    /dashboard/summary              # Income, expense, balance
GET    /dashboard/trends               # Monthly trends
GET    /dashboard/category-breakdown   # By category
GET    /dashboard/recent-transactions  # Latest records
```

### User Management (ADMIN only)
```bash
GET    /users                  # List all
POST   /users                  # Create user
GET    /users/:id              # Get details
PATCH  /users/:id              # Update profile
PATCH  /users/:id/role         # Change role
DELETE /users/:id              # Deactivate
```

## 📊 Access Control Matrix

| Action | VIEWER | ANALYST | ADMIN |
|--------|--------|---------|-------|
| View own records | ✓ | ✓ | ✓ |
| View all records | ✗ | ✓ | ✓ |
| Create records | ✗ | ✓ | ✓ |
| Update records | ✗ | ✓ | ✓ |
| Delete records | ✗ | ✓ | ✓ |
| View dashboard | ✓ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |

## 🗄️ Database Schema

### Tables
- **roles**: VIEWER, ANALYST, ADMIN
- **users**: Email-based authentication, role assignment
- **financial_records**: Transactions with amount, type, category, date

### Key Features
- Soft deletes on financial records
- Audit timestamps (createdAt, updatedAt)
- Foreign key relationships
- DECIMAL(15,2) for financial precision

## 🛠️ Development

### Available Commands
```bash
npm run dev              # Start with auto-reload
npm run migrate          # Run migrations
npm run migrate:undo     # Undo last migration
npm run seed             # Populate test data
npm test                 # Run tests
npm start                # Production start
```

### Project Structure
```
src/
├── app.js                   # Express initialization
├── config/                  # Environment & database config
├── models/                  # Sequelize ORM models
├── controllers/             # Request handlers
├── services/                # Business logic
├── routes/                  # API route definitions
├── middleware/              # Auth, validation, error handling
├── validators/              # Input validation schemas
├── utils/                   # Helper functions
├── migrations/              # Database migrations
└── seeders/                 # Test data seeders
```

## 📝 Example Usage

### Register & Login
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"test123","firstName":"John"}'

# Login (get token)
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"test123"}' | jq -r '.token')
```

### Create & View Records
```bash
# Create income record
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":5000,"type":"INCOME","category":"salary","date":"2024-01-15"}'

# Get dashboard summary
curl http://localhost:3000/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with expiration (7 days)
- ✅ Request validation with Joi schemas
- ✅ SQL injection protection via ORM
- ✅ CORS and Helmet security headers
- ✅ Role-based middleware enforcement
- ✅ Soft deletes for data safety

## 🎓 Key Design Decisions

### RBAC Model
Three-tier system balances simplicity and functionality:
- **VIEWER**: Dashboard only
- **ANALYST**: Full record management
- **ADMIN**: User and role management

### Soft Deletes
Financial data is never permanently deleted:
- Records marked with deletedAt timestamp
- Maintains audit trail and referential integrity
- Enables potential recovery

### JWT Authentication
Stateless architecture for scalability:
- No server-side session storage
- Works in distributed systems
- Token-based authorization

### Layered Architecture
Clear separation of concerns:
- Routes → Controllers → Services → Models
- Middleware for cross-cutting concerns
- Easy to test and maintain

See **[DECISIONS.md](./docs/DECISIONS.md)** for detailed trade-offs.

## 🧪 Testing

Comprehensive testing strategies documented in **[TESTING.md](./docs/TESTING.md)**:

- Authentication flows
- Access control enforcement
- CRUD operations
- Dashboard aggregations
- Error scenarios

Manual test credentials provided for all three roles.

## 📦 Production Considerations

- Use environment-specific configuration
- Strong JWT_SECRET in production
- HTTPS/TLS encryption required
- Database backups and monitoring
- CORS origin restrictions
- Rate limiting for APIs
- Error logging to external service
- Database indexing for performance

## 🚀 Deployment

### Prerequisites
- Node.js 18+ server
- PostgreSQL 12+ database
- Environment variables configured

### Process
```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Seed if needed
npm run seed

# Start production server
npm start
```

## 🐛 Troubleshooting

**Database Connection Failed**
- Verify PostgreSQL is running
- Check credentials in .env
- Ensure database exists

**Port 3000 Already in Use**
- Change PORT in .env
- Or kill the process: `lsof -i :3000 | kill -9 <PID>`

**Token Invalid**
- Get new token by logging in again
- Check JWT_SECRET is consistent

See **[SETUP.md](./docs/SETUP.md)** for more troubleshooting.

## 📚 Documentation Structure

- **[QUICKSTART.md](./docs/QUICKSTART.md)** - Fast setup for new developers
- **[SETUP.md](./docs/SETUP.md)** - Comprehensive installation guide
- **[API.md](./docs/API.md)** - Full endpoint documentation with examples
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design and data flow
- **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - ERD and schema details
- **[PERMISSIONS.md](./docs/PERMISSIONS.md)** - Access control matrix and logic
- **[DECISIONS.md](./docs/DECISIONS.md)** - Design choices and rationale
- **[TESTING.md](./docs/TESTING.md)** - Test strategies and scenarios

## 💼 Real-World Applicability

This backend demonstrates:
- ✓ Proper separation of concerns
- ✓ Secure authentication/authorization
- ✓ Scalable architecture
- ✓ Comprehensive error handling
- ✓ Input validation and sanitization
- ✓ Database best practices
- ✓ API design principles
- ✓ Code organization and maintainability

## 📄 License

MIT

---

**Ready to start?** → Check out **[QUICKSTART.md](./docs/QUICKSTART.md)**

**Want details?** → Read **[SETUP.md](./docs/SETUP.md)**

**Need API reference?** → See **[API.md](./docs/API.md)**


