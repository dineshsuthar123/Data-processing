# Setup Guide

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** 18.x or higher: https://nodejs.org/
- **PostgreSQL** 12 or higher: https://www.postgresql.org/download/
- **npm** or **yarn** package manager (comes with Node.js)
- **Git** for version control

## Installation Steps

### 1. Clone Repository
```bash
cd your-workspace
git clone <repository-url>
cd finance-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
```

### 4. Create PostgreSQL Database

Connect to PostgreSQL and create the database:

```bash
# Using psql
psql -U postgres

# Inside PostgreSQL shell
CREATE DATABASE finance_db;
CREATE USER finance_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE finance_db TO finance_user;
```

Or using a GUI tool like pgAdmin.

**Database Credentials for .env:**
- `DB_HOST`: localhost
- `DB_PORT`: 5432
- `DB_NAME`: finance_db
- `DB_USER`: postgres (or custom user)
- `DB_PASSWORD`: your password

### 5. Run Database Migrations

Initialize the database schema:

```bash
npm run migrate
```

This creates the `roles`, `users`, and `financial_records` tables.

### 6. Seed Initial Data (Optional)

Populate the database with test users and sample data:

```bash
npm run seed
```

This creates:
- Three test users (ADMIN, ANALYST, VIEWER)
- Sample financial records for testing

### 7. Start the Server

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

You should see:
```
Database connection established
Database synced
Server running on port 3000
Environment: development
```

### 8. Verify Installation

Test the API:

```bash
# Check server health
curl http://localhost:3000/health

# Expected response:
# {"message":"Server is running"}
```

## Default Test Credentials

After seeding, use these credentials to test:

| Email | Password | Role |
|-------|----------|------|
| admin@finance.local | admin123 | ADMIN |
| analyst@finance.local | admin123 | ANALYST |
| viewer@finance.local | admin123 | VIEWER |

## Quick Start - Manual Testing

### 1. Register New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

Save the returned `token` for authenticated requests.

### 3. Get Current User
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <your-token-here>"
```

### 4. Create Financial Record
```bash
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token-here>" \
  -d '{
    "amount": 5000,
    "type": "INCOME",
    "category": "salary",
    "description": "Monthly salary",
    "date": "2024-01-15"
  }'
```

### 5. Get Financial Records
```bash
curl http://localhost:3000/records \
  -H "Authorization: Bearer <your-token-here>"
```

### 6. Get Dashboard Summary
```bash
curl http://localhost:3000/dashboard/summary \
  -H "Authorization: Bearer <your-token-here>"
```

## Database Management

### View Migrations
```bash
# List all migrations
sequelize-cli migration:history

# Undo last migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all
```

### View Seeds
```bash
# List all seeds
sequelize-cli seed:history

# Undo last seed
sequelize-cli db:seed:undo

# Undo all seeds
sequelize-cli db:seed:undo:all
```

### Direct Database Access
```bash
# Connect to database with psql
psql -U postgres -d finance_db

# List tables
\dt

# Describe users table
\d users

# Count records
SELECT COUNT(*) FROM users;
```

## Troubleshooting

### Issue: Database Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL service is running
- Verify DB_HOST, DB_PORT, DB_USER, and DB_PASSWORD in .env
- Check PostgreSQL is listening on the correct port

### Issue: Role Does Not Exist
```
error: role "postgres" does not exist
```

**Solution:**
- Create the role: `sudo -u postgres createuser postgres`
- Or use a different user in DB_USER

### Issue: Database Does Not Exist
```
Error: database "finance_db" does not exist
```

**Solution:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE finance_db;"
```

### Issue: Cannot Migrate
```
Error: relation "roles" already exists
```

**Solution:**
- Undo migrations: `npm run migrate:undo:all`
- Drop tables manually
- Run migrations again: `npm run migrate`

### Issue: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Change PORT in .env file
- Or kill process using port: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)

## Environment Configuration

### Development
```env
NODE_ENV=development
LOG_LEVEL=info
# Database auto-syncs schema
# Detailed SQL logging enabled
```

### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
JWT_SECRET=use-strong-random-string
# Use strong, random JWT_SECRET
# Enable HTTPS
# Set appropriate CORS origins
```

## Security Recommendations

1. **Change JWT_SECRET**: Use a strong random string
2. **Use HTTPS**: In production, always use HTTPS
3. **Environment Variables**: Never commit .env to git
4. **Database Password**: Use a strong password
5. **CORS**: Restrict to specific frontend domains
6. **Rate Limiting**: Implement in production

## Next Steps

- Review [API Documentation](./docs/API.md) for endpoint details
- Check [Architecture Guide](./docs/ARCHITECTURE.md) for system design
- Read [Database Schema](./docs/DATABASE_SCHEMA.md) for data model details
- Run tests: `npm test`
- Deploy to production

