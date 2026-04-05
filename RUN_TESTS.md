# Testing Guide

## Overview

This document describes how to test all endpoints and features of the Finance Data Processing Backend. A comprehensive PowerShell test suite has been provided to validate all functionality.

## Prerequisites

- Node.js running with the application started
- PowerShell 5.0 or higher (Windows)
- `Invoke-RestMethod` available (built-in)

## Quick Start Testing

### 1. Start the Server

```bash
# Terminal 1: Start the development server
npm run dev
```

The server will output:
```
Database connection established
Database synced
Default roles initialized
Created test user: admin@finance.local
Created test user: analyst@finance.local
Created test user: viewer@finance.local
Server running on port 3000
Environment: development
```

### 2. Run the Test Suite

```powershell
# Terminal 2: Run comprehensive tests
powershell -ExecutionPolicy Bypass -File TEST_ALL_ENDPOINTS.ps1
```

## Test Coverage

The test suite validates **27 critical paths**:

### Phase 1: Health & Authentication (5 tests)
- ✅ Server health check
- ✅ User registration
- ✅ Admin login
- ✅ Analyst login  
- ✅ Viewer login
- ✅ Get current user

### Phase 2: Financial Records CRUD (9 tests)
- ✅ Create record as Admin
- ✅ Create record as Analyst
- ✅ Reject record creation by Viewer
- ✅ Get all records (paginated)
- ✅ Filter records (date, type, category)
- ✅ Get single record
- ✅ Update record
- ✅ Delete record (soft delete)
- ✅ Verify deleted records excluded

### Phase 3: Dashboard Analytics (4 tests)
- ✅ Get financial summary (totals, balance)
- ✅ Get category breakdown
- ✅ Get recent activity
- ✅ Get monthly trends

### Phase 4: User Management (2 tests)
- ✅ Admin can list users
- ✅ Analyst cannot access user management

### Phase 5: Access Control (3 tests)
- ✅ Viewer can access dashboard
- ✅ Viewer cannot create records
- ✅ Viewer cannot update records

### Phase 6: Error Handling (4 tests)
- ✅ Reject invalid credentials
- ✅ Reject missing required fields
- ✅ Return 404 for non-existent records
- ✅ Reject unauthorized access (no token)

## Test Results Interpretation

### Success Output
```
✓ Server Health: Server is running
✓ User registered: testuser_12345@finance.local
✓ Admin login successful, token: eyJhbGciOiJIUzI1NiIs...
✓ Record created: ID=1, Amount=1500.50
```

### Error Output
```
ERROR: Server not running
ERROR: Admin login failed: connect ECONNREFUSED
ERROR: Create record failed: Request failed
```

## Manual API Testing

### Using PowerShell Invoke-RestMethod

#### 1. Authentication
```powershell
# Register user
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body (@{
    email = "newuser@example.com"
    password = "SecurePass123"
    firstName = "John"
    lastName = "Doe"
  } | ConvertTo-Json)

# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body (@{
    email = "admin@finance.local"
    password = "admin123"
  } | ConvertTo-Json)

$token = $loginResponse.token

# Get current user
$userResponse = Invoke-RestMethod -Uri "http://localhost:3000/auth/me" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }
```

#### 2. Records Management
```powershell
# Create record
$recordResponse = Invoke-RestMethod -Uri "http://localhost:3000/records" `
  -Method Post `
  -Headers @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
  } `
  -Body (@{
    amount = 1500.00
    type = "INCOME"
    category = "Salary"
    description = "Monthly salary"
    date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  } | ConvertTo-Json)

$recordId = $recordResponse.record.id

# Get all records with filtering
$getResponse = Invoke-RestMethod -Uri "http://localhost:3000/records?page=1&limit=20&type=INCOME" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }

# Get single record
$singleResponse = Invoke-RestMethod -Uri "http://localhost:3000/records/$recordId" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }

# Update record
$updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/records/$recordId" `
  -Method Patch `
  -Headers @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
  } `
  -Body (@{
    amount = 2000.00
    description = "Updated salary"
  } | ConvertTo-Json)

# Delete record
$deleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/records/$recordId" `
  -Method Delete `
  -Headers @{ "Authorization" = "Bearer $token" }
```

#### 3. Dashboard Analytics
```powershell
# Get financial summary
$summaryResponse = Invoke-RestMethod -Uri "http://localhost:3000/dashboard/summary" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }

# Get category breakdown
$categoryResponse = Invoke-RestMethod -Uri "http://localhost:3000/dashboard/category-breakdown" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }

# Get recent transactions
$recentResponse = Invoke-RestMethod -Uri "http://localhost:3000/dashboard/recent-transactions?limit=10" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }

# Get trends
$trendsResponse = Invoke-RestMethod -Uri "http://localhost:3000/dashboard/trends?months=12" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }
```

#### 4. User Management
```powershell
# Get all users (Admin only)
$usersResponse = Invoke-RestMethod -Uri "http://localhost:3000/users" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $token" }

# This will fail if not admin:
# 403 Forbidden error
```

## Test Scenarios by Role

### Admin User
- Can create records: ✅
- Can read all records: ✅
- Can update records: ✅
- Can delete records: ✅
- Can access dashboard: ✅
- Can manage users: ✅
- Email: `admin@finance.local`
- Password: `admin123`

### Analyst User
- Can create records: ✅
- Can read all records: ✅
- Can update records: ✅
- Can delete records: ✅
- Can access dashboard: ✅
- Can manage users: ❌
- Email: `analyst@finance.local`
- Password: `admin123`

### Viewer User
- Can create records: ❌
- Can read own records: ✅
- Can update records: ❌
- Can delete records: ❌
- Can access dashboard: ✅
- Can manage users: ❌
- Email: `viewer@finance.local`
- Password: `admin123`

## API Endpoint Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current user info |

### Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/records` | Create record |
| GET | `/records` | Get all records (paginated) |
| GET | `/records/:id` | Get single record |
| PATCH | `/records/:id` | Update record |
| DELETE | `/records/:id` | Delete record |

Query Parameters for `/records`:
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20)
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `type`: Filter by type (INCOME, EXPENSE, TRANSFER)
- `category`: Filter by category

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Get financial summary |
| GET | `/dashboard/category-breakdown` | Get category totals |
| GET | `/dashboard/recent-transactions` | Get recent records |
| GET | `/dashboard/trends` | Get monthly trends |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |

## Expected Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Missing/invalid fields |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## Error Response Format

```json
{
  "message": "Error description",
  "stack": "Stack trace (development only)"
}
```

## Performance Testing

### Load Testing
```powershell
# Simple loop to create records
$token = (Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method Post `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body (@{
    email = "analyst@finance.local"
    password = "admin123"
  } | ConvertTo-Json)).token

# Create 100 records
for ($i = 1; $i -le 100; $i++) {
  $response = Invoke-RestMethod -Uri "http://localhost:3000/records" `
    -Method Post `
    -Headers @{ 
      "Content-Type" = "application/json"
      "Authorization" = "Bearer $token"
    } `
    -Body (@{
      amount = [decimal]::Round((Get-Random -Minimum 10 -Maximum 1000), 2)
      type = @("INCOME", "EXPENSE", "TRANSFER") | Get-Random
      category = @("Salary", "Groceries", "Utilities", "Entertainment") | Get-Random
      description = "Test record $i"
      date = (Get-Date).AddDays(-$i).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json)
  
  Write-Host "Created record $i"
}
```

## Troubleshooting Tests

### Connection Refused
```
Error: Cannot connect to localhost:3000
Solution: Ensure server is running (npm run dev)
```

### Invalid Token
```
Error: Invalid token
Solution: Token may have expired (7 days). Login again.
```

### Access Denied (403)
```
Error: You do not have permission to access this resource
Solution: Check user role and permissions in permissions.js
```

### Database Locked
```
Error: Database is locked
Solution: This is normal in SQLite. Wait a moment and retry.
```

## Continuous Testing

### Watch Mode
```bash
npm run test:watch
```

### Run All Tests
```bash
npm test
```

## Reporting Issues

When reporting test failures, include:
1. Server startup logs
2. Test output with error messages
3. .env configuration (without passwords)
4. Node.js version: `node --version`
5. npm version: `npm --version`

---

**Last Updated**: April 2026
**Test Suite Version**: 1.0.0
**Total Test Cases**: 27

