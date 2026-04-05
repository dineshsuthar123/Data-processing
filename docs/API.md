# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All responses follow a consistent format:

### Success Response
```json
{
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "message": "Error description",
  "errors": []
}
```

## Authentication Endpoints

### Register User
Creates a new user account with VIEWER role by default.

**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login
Authenticates user and returns JWT token.

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "VIEWER"
  }
}
```

### Get Current User
Returns information about the currently authenticated user.

**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": {
      "id": 1,
      "name": "VIEWER"
    }
  }
}
```

## Financial Records Endpoints

### Get All Records
Retrieves financial records with role-based filtering and pagination.

**GET** `/records?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31&category=salary&type=INCOME`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Records per page, default 20
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `category` (optional): Filter by category
- `type` (optional): Filter by type (INCOME, EXPENSE, TRANSFER)

**Response (200):**
```json
{
  "message": "Records retrieved successfully",
  "records": [
    {
      "id": 1,
      "amount": "5000.00",
      "type": "INCOME",
      "category": "salary",
      "description": "Monthly salary",
      "date": "2024-01-15",
      "userId": 1,
      "creator": {
        "id": 1,
        "email": "user@example.com"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

### Create Record
Creates a new financial record.

**POST** `/records`

**Required Permission:** `canCreateRecords` (ANALYST, ADMIN)

**Request Body:**
```json
{
  "amount": 5000,
  "type": "INCOME",
  "category": "salary",
  "description": "Monthly salary",
  "date": "2024-01-15"
}
```

**Response (201):**
```json
{
  "message": "Record created successfully",
  "record": {
    "id": 1,
    "amount": "5000.00",
    "type": "INCOME",
    "category": "salary",
    "description": "Monthly salary",
    "date": "2024-01-15",
    "userId": 1,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get Single Record
Retrieves a specific financial record.

**GET** `/records/:id`

**Response (200):**
```json
{
  "message": "Record retrieved successfully",
  "record": {
    "id": 1,
    "amount": "5000.00",
    "type": "INCOME",
    "category": "salary",
    "description": "Monthly salary",
    "date": "2024-01-15",
    "userId": 1,
    "creator": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Update Record
Updates an existing financial record.

**PATCH** `/records/:id`

**Required Permission:** `canUpdateRecords` (ANALYST, ADMIN)

**Request Body:**
```json
{
  "amount": 5500,
  "description": "Updated salary"
}
```

**Response (200):**
```json
{
  "message": "Record updated successfully",
  "record": {
    "id": 1,
    "amount": "5500.00",
    "type": "INCOME",
    "category": "salary",
    "description": "Updated salary",
    "date": "2024-01-15",
    "userId": 1,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### Delete Record
Soft deletes a financial record.

**DELETE** `/records/:id`

**Required Permission:** `canDeleteRecords` (ANALYST, ADMIN)

**Response (200):**
```json
{
  "message": "Record deleted successfully"
}
```

## Dashboard Endpoints

### Get Financial Summary
Returns total income, expenses, and net balance.

**GET** `/dashboard/summary`

**Response (200):**
```json
{
  "message": "Summary retrieved successfully",
  "summary": {
    "totalIncome": 50000,
    "totalExpense": 20000,
    "netBalance": 30000,
    "transactionCount": 45
  }
}
```

### Get Trends
Returns monthly income/expense trends.

**GET** `/dashboard/trends?months=12`

**Query Parameters:**
- `months` (optional): Number of months to retrieve, default 12

**Response (200):**
```json
{
  "message": "Trends retrieved successfully",
  "trends": [
    {
      "month": "2024-01",
      "income": 5000,
      "expense": 1500,
      "net": 3500
    },
    {
      "month": "2024-02",
      "income": 5000,
      "expense": 1800,
      "net": 3200
    }
  ]
}
```

### Get Category Breakdown
Returns income and expense breakdown by category.

**GET** `/dashboard/category-breakdown`

**Response (200):**
```json
{
  "message": "Category breakdown retrieved successfully",
  "breakdown": [
    {
      "category": "salary",
      "income": 30000,
      "expense": 0,
      "total": 30000
    },
    {
      "category": "groceries",
      "income": 0,
      "expense": 5000,
      "total": 5000
    }
  ]
}
```

### Get Recent Transactions
Returns the most recent high-value transactions.

**GET** `/dashboard/recent-transactions?limit=10`

**Query Parameters:**
- `limit` (optional): Number of transactions to retrieve, default 10

**Response (200):**
```json
{
  "message": "Recent transactions retrieved successfully",
  "transactions": [
    {
      "id": 1,
      "amount": "5000.00",
      "type": "INCOME",
      "category": "salary",
      "date": "2024-01-15",
      "creator": {
        "email": "user@example.com"
      }
    }
  ]
}
```

## User Management Endpoints (Admin Only)

### Get All Users
Lists all system users with pagination.

**GET** `/users?page=1&limit=20`

**Required Permission:** `canManageUsers` (ADMIN only)

**Response (200):**
```json
{
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "active": true,
      "role": {
        "name": "VIEWER"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

### Create User
Creates a new user with specified role.

**POST** `/users`

**Required Permission:** `canManageUsers` (ADMIN only)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "roleId": 2
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

### Update User
Updates user profile information.

**PATCH** `/users/:id`

**Required Permission:** `canManageUsers` (ADMIN only)

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "active": true
}
```

**Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "active": true
  }
}
```

### Update User Role
Changes a user's role.

**PATCH** `/users/:id/role`

**Required Permission:** `canManageUsers` (ADMIN only)

**Request Body:**
```json
{
  "roleId": 2
}
```

**Response (200):**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "roleId": 2
  }
}
```

### Deactivate User
Deactivates a user account.

**DELETE** `/users/:id`

**Required Permission:** `canManageUsers` (ADMIN only)

**Response (200):**
```json
{
  "message": "User deactivated successfully"
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

## Test Credentials

Default test users created by seed:

| Email | Password | Role |
|-------|----------|------|
| admin@finance.local | admin123 | ADMIN |
| analyst@finance.local | admin123 | ANALYST |
| viewer@finance.local | admin123 | VIEWER |

