# Architecture Documentation

## System Overview

The Finance Data Processing and Access Control Backend is a role-based access control (RBAC) system built with Node.js, Express, and PostgreSQL. It manages financial records with granular permission controls and provides analytics dashboards.

## Core Architecture Principles

1. **Separation of Concerns**: Routes → Controllers → Services → Models
2. **Role-Based Access Control**: Middleware enforces permissions based on user roles
3. **Consistent Error Handling**: Centralized error handler with custom error classes
4. **Data Validation**: Input validation at controller level using Joi schemas
5. **Soft Deletes**: Financial records can be soft-deleted for data safety

## Folder Structure

```
src/
├── config/
│   ├── environment.js         # Environment variables and configuration
│   ├── database.js            # Sequelize database connection
│   └── database.config.js     # Database configuration for CLI
├── models/
│   ├── Role.js               # Role model (VIEWER, ANALYST, ADMIN)
│   ├── User.js               # User model with password hashing
│   ├── FinancialRecord.js    # Financial transaction/entry model
│   └── index.js              # Model associations and exports
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── recordController.js   # Financial record CRUD
│   ├── dashboardController.js # Analytics and dashboard
│   └── userController.js     # User management (Admin only)
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── records.js           # Record management endpoints
│   ├── dashboard.js         # Dashboard/analytics endpoints
│   └── users.js             # User management endpoints
├── services/
│   ├── authService.js       # Authentication business logic
│   ├── recordService.js     # Record management business logic
│   └── dashboardService.js  # Dashboard aggregation logic
├── middleware/
│   ├── authenticate.js      # JWT verification middleware
│   ├── authorize.js         # Permission checking middleware
│   └── errorHandler.js      # Global error handler
├── validators/
│   ├── authValidator.js     # Auth schema validation
│   ├── recordValidator.js   # Record schema validation
│   └── userValidator.js     # User schema validation
├── utils/
│   ├── errors.js           # Custom error classes
│   └── permissions.js      # Permission matrix and utilities
├── migrations/             # Database schema migrations
├── seeders/               # Initial data seeders
└── app.js                # Express app initialization
```

## Data Models & Relationships

### Role Model
```
Roles:
├── VIEWER: Read-only access to dashboard summaries
├── ANALYST: Full record access and analytics
└── ADMIN: System administration
```

### User Model
```
Fields:
- id: Primary key
- email: Unique identifier
- password: Hashed with bcrypt
- firstName, lastName: User information
- roleId: Foreign key to Role
- active: Account status
- lastLogin: Track user activity
```

### FinancialRecord Model
```
Fields:
- id: Primary key
- amount: Decimal amount
- type: INCOME | EXPENSE | TRANSFER
- category: Text description
- description: Additional notes
- date: Transaction date
- userId: Foreign key to User (creator)
- deletedAt: Soft delete timestamp
- createdAt, updatedAt: Audit timestamps
```

### Model Relationships
```
Role (1) ─── (Many) User
User (1) ─── (Many) FinancialRecord
```

## Request-Response Flow

### Authentication Flow
```
1. POST /auth/register
   └─ Register → AuthService → Hash Password → Create User → Return User Info

2. POST /auth/login
   └─ Login → Verify Password → Generate JWT → Return Token

3. GET /protected-route (with JWT)
   └─ Request → Authenticate Middleware (Verify Token) → Attach User → Route Handler
```

### Authorization Flow
```
Authenticated Request with RBAC:
1. Request arrives with JWT token
2. Authenticate middleware verifies token and attaches user (id, email, role)
3. Authorize middleware checks if user's role has required permission
4. If permitted: Route handler executes
5. If denied: Return 403 Forbidden
```

### Financial Record Access Control
```
VIEWER Role:
- Can only see their own records
- Cannot create, update, or delete
- Can view dashboard summaries

ANALYST Role:
- Can see all records
- Can create, update, and delete their own and others' records
- Can view detailed analytics

ADMIN Role:
- Full access to all records
- Can manage users and roles
- Can view all analytics
```

## Permission Matrix

| Action | VIEWER | ANALYST | ADMIN |
|--------|--------|---------|-------|
| View own records | ✓ | ✓ | ✓ |
| View all records | ✗ | ✓ | ✓ |
| Create records | ✗ | ✓ | ✓ |
| Update records | ✗ | ✓ | ✓ |
| Delete records | ✗ | ✓ | ✓ |
| View dashboard | ✓ | ✓ | ✓ |
| Export data | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| Manage roles | ✗ | ✗ | ✓ |

## Error Handling Strategy

### Custom Error Classes
```javascript
- AppError: Base class for all custom errors
- BadRequestError: 400 - Invalid input
- UnauthorizedError: 401 - Missing/invalid auth
- ForbiddenError: 403 - Insufficient permissions
- NotFoundError: 404 - Resource not found
- ConflictError: 409 - Resource already exists
- InternalServerError: 500 - Server error
```

### Error Response Format
```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## API Validation

All inputs are validated using Joi schemas:

### Auth Validation
- Email format validation
- Password minimum length (6 characters)
- Required field checking

### Record Validation
- Amount must be positive number
- Type must be INCOME, EXPENSE, or TRANSFER
- Date must be valid ISO date
- Optional description field

### User Validation
- Email uniqueness checking
- Role existence checking
- Active status validation

## Database Design

### Key Features
1. **Relationships**: Foreign keys enforce referential integrity
2. **Soft Deletes**: Records marked with deletedAt timestamp
3. **Timestamps**: createdAt and updatedAt for audit trail
4. **Constraints**: Unique email, NOT NULL constraints on critical fields
5. **Decimal Precision**: DECIMAL(15,2) for accurate financial amounts

### Queries and Indexes (Recommended)
```sql
-- Index for faster lookups
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_record_user_date ON financial_records(userId, date DESC);
CREATE INDEX idx_record_category ON financial_records(category);
CREATE INDEX idx_record_type ON financial_records(type);
```

## Security Considerations

1. **Password Security**: Passwords hashed with bcrypt (salt rounds: 10)
2. **JWT Security**: Tokens expire after 7 days (configurable)
3. **HTTPS**: Required in production
4. **CORS**: Configured to allow frontend requests
5. **Helmet**: Security headers via Helmet.js
6. **Input Validation**: All inputs validated before processing
7. **SQL Injection**: Protected by Sequelize ORM parameterized queries

## Scalability & Future Improvements

### Current State
- Single-instance deployment
- In-memory session management
- No caching layer

### Recommended Improvements
1. **Caching**: Redis for frequently accessed data
2. **Database Indexing**: Optimize query performance for analytics
3. **Pagination**: Implemented with limit/offset
4. **Rate Limiting**: Prevent API abuse
5. **Background Jobs**: Bull.js for async operations (e.g., exports)
6. **Monitoring**: APM tools for performance tracking
7. **API Versioning**: Support multiple API versions

## Testing Strategy

### Unit Tests
- Service layer business logic
- Permission checking logic
- Validation schemas

### Integration Tests
- API endpoint flows
- Database operations
- Access control enforcement

### Test Coverage
- Authentication flows (register, login)
- RBAC enforcement (permission denials)
- CRUD operations
- Error handling

## Deployment Considerations

### Environment Configuration
- Development: Auto-sync schema, detailed logging
- Production: Migrations only, minimal logging

### Database Migration
- Sequelize CLI for schema versioning
- Forward and backward migrations supported
- Seed data for initial setup

### Assumptions & Trade-offs

1. **Single User Records**: Each record belongs to one creator (user_id)
2. **Flat Categories**: No hierarchical category structure
3. **No Transaction Support**: Records are independent (no double-entry bookkeeping)
4. **Simplified Audit**: Only timestamps, not full audit log
5. **In-memory Storage**: Production should use persistent cache layer

