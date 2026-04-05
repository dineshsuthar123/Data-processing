# Testing Guide

## Test Strategy

The backend uses comprehensive testing at multiple levels:

1. **Unit Tests**: Service layer business logic
2. **Integration Tests**: API endpoints and database interactions
3. **Access Control Tests**: RBAC enforcement

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Auto-run on file changes)
```bash
npm run test:watch
```

### Specific Test File
```bash
npm test -- records.test.js
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Files

### Authentication Tests (`auth.test.js`)

Tests for registration, login, and user authentication:

```javascript
// Registration with valid data
POST /auth/register
Expected: 201 Created, user object returned

// Registration with duplicate email
POST /auth/register (same email)
Expected: 409 Conflict

// Login with valid credentials
POST /auth/login
Expected: 200 OK, JWT token returned

// Login with invalid password
POST /auth/login (wrong password)
Expected: 400 Bad Request

// Get current user (authenticated)
GET /auth/me (with valid token)
Expected: 200 OK, user data returned

// Get current user (unauthenticated)
GET /auth/me (no token)
Expected: 401 Unauthorized
```

### Financial Records Tests (`records.test.js`)

Tests for CRUD operations on financial records:

```javascript
// Create record (ANALYST)
POST /records (with ANALYST role)
Expected: 201 Created, record returned

// Create record (VIEWER)
POST /records (with VIEWER role)
Expected: 403 Forbidden

// Get all records (VIEWER)
GET /records
Expected: 200 OK, only user's own records

// Get all records (ANALYST)
GET /records
Expected: 200 OK, all records returned

// Get single record (owner)
GET /records/:id
Expected: 200 OK, record details

// Get single record (non-owner VIEWER)
GET /records/:id
Expected: 403 Forbidden

// Update record (owner)
PATCH /records/:id
Expected: 200 OK, updated record

// Delete record (ANALYST)
DELETE /records/:id
Expected: 200 OK, soft delete

// Delete record (VIEWER)
DELETE /records/:id
Expected: 403 Forbidden
```

### Dashboard Tests (`dashboard.test.js`)

Tests for analytics and dashboard endpoints:

```javascript
// Get summary
GET /dashboard/summary
Expected: 200 OK, summary stats

// Get trends
GET /dashboard/trends?months=6
Expected: 200 OK, monthly trends

// Get category breakdown
GET /dashboard/category-breakdown
Expected: 200 OK, category data

// Get recent transactions
GET /dashboard/recent-transactions?limit=5
Expected: 200 OK, recent records
```

### Access Control Tests (`access-control.test.js`)

Tests for RBAC enforcement:

```javascript
// VIEWER cannot create records
POST /records (VIEWER token)
Expected: 403 Forbidden

// VIEWER can only see own records
GET /records (VIEWER token)
Expected: 200 OK, filtered to own records only

// ANALYST can create records
POST /records (ANALYST token)
Expected: 201 Created

// ADMIN can manage users
POST /users (ADMIN token)
Expected: 201 Created or appropriate response

// VIEWER cannot manage users
POST /users (VIEWER token)
Expected: 403 Forbidden

// ANALYST cannot update user roles
PATCH /users/:id/role (ANALYST token)
Expected: 403 Forbidden
```

## Manual Testing with cURL

### Setup: Get Auth Token

```bash
# Login with test user
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@finance.local",
    "password": "admin123"
  }' | jq -r '.token')

# Verify token
echo $TOKEN
```

### Test Scenario 1: Create and View Records

```bash
# 1. Create an income record
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

# 2. Create an expense record
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 200,
    "type": "EXPENSE",
    "category": "groceries",
    "description": "Weekly groceries",
    "date": "2024-01-16"
  }'

# 3. Get all records with pagination
curl http://localhost:3000/records?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"

# 4. Get records filtered by type
curl "http://localhost:3000/records?type=INCOME" \
  -H "Authorization: Bearer $TOKEN"

# 5. Get records filtered by date range
curl "http://localhost:3000/records?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Scenario 2: Dashboard Analytics

```bash
# 1. Get financial summary
curl http://localhost:3000/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"

# 2. Get monthly trends
curl http://localhost:3000/dashboard/trends?months=6 \
  -H "Authorization: Bearer $TOKEN"

# 3. Get category breakdown
curl http://localhost:3000/dashboard/category-breakdown \
  -H "Authorization: Bearer $TOKEN"

# 4. Get recent transactions
curl http://localhost:3000/dashboard/recent-transactions?limit=5 \
  -H "Authorization: Bearer $TOKEN"
```

### Test Scenario 3: Access Control

```bash
# 1. Login as VIEWER
VIEWER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@finance.local",
    "password": "admin123"
  }' | jq -r '.token')

# 2. Try to create record (should fail with 403)
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{
    "amount": 100,
    "type": "INCOME",
    "category": "test",
    "description": "This should fail",
    "date": "2024-01-20"
  }'

# 3. Try to manage users (should fail with 403)
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $VIEWER_TOKEN"
```

### Test Scenario 4: User Management (Admin)

```bash
# 1. Login as ADMIN
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance.local",
    "password": "admin123"
  }' | jq -r '.token')

# 2. Get all users
curl http://localhost:3000/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Create new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "email": "newanalyst@example.com",
    "password": "securepass123",
    "firstName": "New",
    "lastName": "Analyst",
    "roleId": 2
  }'

# 4. Update user role
curl -X PATCH http://localhost:3000/users/2/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "roleId": 1
  }'
```

## Postman Collection

Import this collection into Postman for interactive testing:

### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Records
- `POST /records` (Create)
- `GET /records` (List with filters)
- `GET /records/:id` (Get single)
- `PATCH /records/:id` (Update)
- `DELETE /records/:id` (Delete)

### Dashboard
- `GET /dashboard/summary`
- `GET /dashboard/trends`
- `GET /dashboard/category-breakdown`
- `GET /dashboard/recent-transactions`

### Users (Admin)
- `GET /users` (List)
- `POST /users` (Create)
- `GET /users/:id` (Get)
- `PATCH /users/:id` (Update)
- `PATCH /users/:id/role` (Update role)
- `DELETE /users/:id` (Deactivate)

## Expected Test Results

### Success Cases
- ✓ New user registration with valid data
- ✓ User login with correct credentials
- ✓ ANALYST can create records
- ✓ Records are soft-deleted (not removed)
- ✓ Dashboard returns correct aggregations
- ✓ VIEWER sees only own records
- ✓ ADMIN can manage users

### Failure Cases
- ✗ VIEWER cannot create records (403)
- ✗ Invalid token returns 401
- ✗ Duplicate email returns 409
- ✗ Non-existent record returns 404
- ✗ Invalid input returns 400

## Performance Testing

Monitor response times and database queries:

```bash
# Test concurrent requests
for i in {1..10}; do
  curl http://localhost:3000/dashboard/summary \
    -H "Authorization: Bearer $TOKEN" &
done
wait

# Check database connection pool
# Review logs for query execution times
```

## Debugging

### Enable Detailed Logging
Set in `.env`:
```env
LOG_LEVEL=debug
```

### Check Database Queries
Connect to database and run:
```sql
SELECT * FROM financial_records WHERE userId = 1;
SELECT * FROM users WHERE email = 'test@example.com';
```

### Monitor Requests
```bash
# Watch server logs during requests
npm run dev

# In another terminal, run requests
curl http://localhost:3000/health
```

## CI/CD Integration

For GitHub Actions or similar:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm test -- --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Known Limitations

1. No API rate limiting (implement for production)
2. No request timeout handling
3. Limited error details in production mode
4. No request logging to external service

