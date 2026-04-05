# Quick Start Guide

## 5-Minute Setup

### Step 1: Prerequisites Check
```bash
node --version  # Should be 18+
npm --version   # Should be 8+
psql --version  # PostgreSQL must be running
```

### Step 2: Clone & Install
```bash
cd your-workspace
git clone <repo-url>
cd finance-backend
npm install
```

### Step 3: Database Setup
```bash
# Create database and user
psql -U postgres -c "CREATE DATABASE finance_db;"
psql -U postgres -c "CREATE USER finance_user WITH PASSWORD 'pass123';"
psql -U postgres -c "GRANT ALL ON DATABASE finance_db TO finance_user;"
```

### Step 4: Environment Configuration
```bash
cp .env.example .env

# Edit .env with database credentials:
# DB_USER=postgres
# DB_PASSWORD=your_postgres_password
# DB_NAME=finance_db
```

### Step 5: Run Migrations & Seeds
```bash
npm run migrate
npm run seed
```

### Step 6: Start Server
```bash
npm run dev
```

**Expected Output:**
```
Database connection established
Database synced
Server running on port 3000
```

## First Test Request

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{ "message": "Server is running" }
```

### Test 2: Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test 3: Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "test123456"
  }'
```

Save the returned `token` value.

### Test 4: Create Financial Record
```bash
# Replace TOKEN with the token from login response
TOKEN="your-token-here"

curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 5000,
    "type": "INCOME",
    "category": "salary",
    "description": "Monthly salary",
    "date": "2024-01-15"
  }'
```

### Test 5: Get Dashboard Summary
```bash
curl http://localhost:3000/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
```

Response example:
```json
{
  "message": "Summary retrieved successfully",
  "summary": {
    "totalIncome": 5000,
    "totalExpense": 0,
    "netBalance": 5000,
    "transactionCount": 1
  }
}
```

## Use Pre-Seeded Test Accounts

Skip registration and use built-in test accounts:

```bash
# Login as ANALYST (full access)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@finance.local",
    "password": "admin123"
  }'

# Login as ADMIN (user management)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance.local",
    "password": "admin123"
  }'

# Login as VIEWER (read-only)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@finance.local",
    "password": "admin123"
  }'
```

## Key Endpoints

### Authentication
- **POST** `/auth/register` - Create account
- **POST** `/auth/login` - Get token
- **GET** `/auth/me` - Current user info

### Records (ANALYST/ADMIN can create, VIEWER can only view own)
- **POST** `/records` - Create
- **GET** `/records` - List
- **GET** `/records/:id` - Get details
- **PATCH** `/records/:id` - Update
- **DELETE** `/records/:id` - Delete

### Dashboard (All roles can access)
- **GET** `/dashboard/summary` - Totals & balance
- **GET** `/dashboard/trends` - Monthly trends
- **GET** `/dashboard/category-breakdown` - By category
- **GET** `/dashboard/recent-transactions` - Latest records

### Users (ADMIN only)
- **GET** `/users` - List all
- **POST** `/users` - Create user
- **PATCH** `/users/:id` - Update profile
- **PATCH** `/users/:id/role` - Change role
- **DELETE** `/users/:id` - Deactivate

## Troubleshooting

### "Database connection refused"
**Solution:** Start PostgreSQL service
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL from Services
```

### "Port 3000 already in use"
**Solution:** Change PORT in .env or kill the process
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

### "Invalid token"
**Solution:** Token might be expired. Get a new token by logging in again.

### "Cannot find module"
**Solution:** Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

```
src/
├── app.js              # Express setup
├── config/             # Database & env config
├── models/             # Data models
├── controllers/        # Request handlers
├── services/           # Business logic
├── middleware/         # Auth, error handling
├── routes/             # API routes
└── validators/         # Input validation
```

## Development Commands

```bash
npm run dev            # Start with auto-reload
npm run migrate        # Run migrations
npm run seed           # Seed test data
npm run migrate:undo   # Undo migrations
npm test               # Run tests (when added)
npm start              # Start production
```

## Database Commands

```bash
# Access database
psql -U postgres -d finance_db

# List tables
\dt

# Exit
\q

# Run SQL directly
psql -U postgres -d finance_db -c "SELECT * FROM users;"
```

## Next Steps

1. **Read Full Setup:** See [SETUP.md](./SETUP.md)
2. **Understand API:** Check [API.md](./API.md)
3. **Learn Architecture:** Review [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Test Thoroughly:** Follow [TESTING.md](./TESTING.md)
5. **Explore Code:** Start with `src/app.js`

## Tips for Testing

### Use jq for Pretty JSON Output
```bash
curl http://localhost:3000/health | jq .
```

### Save Token to File
```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@finance.local","password":"admin123"}' | jq -r '.token' > token.txt

# Use it
TOKEN=$(cat token.txt)
curl http://localhost:3000/records -H "Authorization: Bearer $TOKEN"
```

### Test All Record Types
```bash
# Income
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":1000,"type":"INCOME","category":"bonus","date":"2024-01-20"}'

# Expense
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":50,"type":"EXPENSE","category":"food","date":"2024-01-21"}'

# Transfer
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":200,"type":"TRANSFER","category":"savings","date":"2024-01-22"}'
```

## Stopping the Server

Press `Ctrl+C` in the terminal running the server.

## Getting Help

- **API Issues:** Check [API.md](./API.md)
- **Setup Problems:** See [SETUP.md](./SETUP.md) troubleshooting
- **Permission Errors:** Review [PERMISSIONS.md](./PERMISSIONS.md)
- **Database Errors:** Verify PostgreSQL is running and accessible
- **Code Understanding:** Read [ARCHITECTURE.md](./ARCHITECTURE.md)

## Support Credentials

Default test accounts (after seed):

| Email | Password | Access |
|-------|----------|--------|
| admin@finance.local | admin123 | Manage users + all records |
| analyst@finance.local | admin123 | Full record management |
| viewer@finance.local | admin123 | View-only mode |

