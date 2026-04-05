# Database Schema Documentation

## Overview

The database uses PostgreSQL with Sequelize ORM for data persistence. All tables include audit timestamps (`createdAt`, `updatedAt`) for tracking changes.

## Tables

### roles
Defines user roles and their permission levels.

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name ENUM('VIEWER', 'ANALYST', 'ADMIN') NOT NULL UNIQUE,
  description VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `name`: Role identifier (ENUM)
- `description`: Role description
- `createdAt`: Record creation timestamp
- `updatedAt`: Record last update timestamp

**Sample Data:**
| id | name | description |
|----|------|-------------|
| 1 | VIEWER | Can only view dashboard summaries |
| 2 | ANALYST | Can view records and create insights |
| 3 | ADMIN | Full system access |

---

### users
Stores user account information.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  active BOOLEAN DEFAULT true,
  roleId INTEGER NOT NULL REFERENCES roles(id),
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `email`: Unique email address (used for login)
- `password`: Bcrypt-hashed password
- `firstName`: User's first name
- `lastName`: User's last name
- `active`: Account status (true = active, false = deactivated)
- `roleId`: Foreign key to roles table
- `lastLogin`: Timestamp of last login
- `createdAt`: Account creation timestamp
- `updatedAt`: Last profile update timestamp

**Indexes:**
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_roleId ON users(roleId);
```

**Constraints:**
- Email must be unique
- Email cannot be null
- Password cannot be null
- roleId must exist in roles table

---

### financial_records
Stores financial transactions and entries.

```sql
CREATE TABLE financial_records (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(15, 2) NOT NULL,
  type ENUM('INCOME', 'EXPENSE', 'TRANSFER') NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  userId INTEGER NOT NULL REFERENCES users(id),
  deletedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `amount`: Transaction amount (2 decimal places precision)
- `type`: INCOME, EXPENSE, or TRANSFER
- `category`: Transaction category (e.g., "salary", "groceries")
- `description`: Optional transaction notes
- `date`: Transaction date
- `userId`: Foreign key to users table (creator)
- `deletedAt`: Soft delete timestamp (NULL if not deleted)
- `createdAt`: Record creation timestamp
- `updatedAt`: Last modification timestamp

**Indexes:**
```sql
CREATE INDEX idx_record_user_date ON financial_records(userId, date DESC);
CREATE INDEX idx_record_category ON financial_records(category);
CREATE INDEX idx_record_type ON financial_records(type);
CREATE INDEX idx_record_deleted ON financial_records(deletedAt);
```

**Constraints:**
- Amount must be positive
- Type must be one of the enum values
- userId must exist in users table
- Amount precision: 15 digits total, 2 decimal places

---

## Entity Relationship Diagram

```
┌──────────────┐
│    roles     │
├──────────────┤
│ id (PK)      │
│ name (ENUM)  │
│ description  │
└──────┬───────┘
       │ (1)
       │
       │ (Many)
       │
┌──────▼────────────────┐
│      users            │
├───────────────────────┤
│ id (PK)               │
│ email (UNIQUE)        │
│ password              │
│ firstName             │
│ lastName              │
│ active                │
│ roleId (FK) ─────────────┐
│ lastLogin             │   │
│ createdAt             │   │
│ updatedAt             │   │
└──────┬────────────────┘   │
       │ (1)                │
       │                    │
       │ (Many)             │
       │                    │
┌──────▼─────────────────────┐
│  financial_records          │
├─────────────────────────────┤
│ id (PK)                     │
│ amount (DECIMAL)            │
│ type (ENUM)                 │
│ category                    │
│ description                 │
│ date                        │
│ userId (FK)     ────────────┘
│ deletedAt (Soft Delete)     │
│ createdAt                   │
│ updatedAt                   │
└─────────────────────────────┘
```

## Data Types

| Type | Usage | Example |
|------|-------|---------|
| SERIAL | Auto-increment ID | 1, 2, 3... |
| VARCHAR(n) | Variable text | "user@example.com" |
| TEXT | Long text | Description or notes |
| DECIMAL(15,2) | Monetary values | 1234567.89 |
| ENUM | Fixed set of values | 'INCOME', 'EXPENSE' |
| TIMESTAMP | Date and time | 2024-01-15T10:30:00Z |
| BOOLEAN | True/false | true |

## Query Examples

### Find user with all roles
```sql
SELECT u.*, r.name as role_name
FROM users u
LEFT JOIN roles r ON u.roleId = r.id
WHERE u.email = 'user@example.com';
```

### Get total income by category
```sql
SELECT 
  category,
  SUM(amount) as total
FROM financial_records
WHERE type = 'INCOME' AND deletedAt IS NULL
GROUP BY category
ORDER BY total DESC;
```

### Get monthly trend
```sql
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
FROM financial_records
WHERE deletedAt IS NULL
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;
```

### Get recent transactions
```sql
SELECT 
  *
FROM financial_records
WHERE deletedAt IS NULL
ORDER BY date DESC
LIMIT 10;
```

### Get user records with creator info
```sql
SELECT 
  fr.*,
  u.email as creator_email
FROM financial_records fr
JOIN users u ON fr.userId = u.id
WHERE fr.userId = 1 AND fr.deletedAt IS NULL
ORDER BY fr.date DESC;
```

## Migration Strategy

### Forward Migration (Up)
```javascript
// Create table when deploying new version
await queryInterface.createTable('financial_records', {
  // ... table definition
});
```

### Backward Migration (Down)
```javascript
// Remove table when rolling back
await queryInterface.dropTable('financial_records');
```

### Seeding Data
Initial seed creates three test users:
- admin@finance.local (ADMIN)
- analyst@finance.local (ANALYST)
- viewer@finance.local (VIEWER)

Password: `admin123`

## Soft Deletes

Financial records use soft deletes (paranoid mode in Sequelize):
- Records are never physically deleted
- `deletedAt` field marks deletion
- Queries automatically exclude deleted records
- Recovery is possible by clearing `deletedAt`

### Accessing Deleted Records
```sql
-- Exclude deleted records (default)
SELECT * FROM financial_records WHERE deletedAt IS NULL;

-- Include deleted records
SELECT * FROM financial_records;

-- Only deleted records
SELECT * FROM financial_records WHERE deletedAt IS NOT NULL;
```

## Performance Considerations

### Current Indexes
- Email lookup optimization
- User-date range queries on records
- Category and type filtering

### Recommended Future Indexes
```sql
CREATE INDEX idx_record_amount ON financial_records(amount DESC);
CREATE INDEX idx_record_created ON financial_records(createdAt DESC);
CREATE INDEX idx_user_active ON users(active) WHERE active = true;
```

### Query Optimization Tips
1. **Pagination**: Always use LIMIT and OFFSET for large datasets
2. **Filtering**: Use WHERE clauses before aggregation
3. **Joins**: Index foreign key columns
4. **Aggregations**: Consider materialized views for complex reports

## Backup & Recovery

### Backup Strategy
```bash
# Full backup
pg_dump finance_db > backup.sql

# Compressed backup
pg_dump finance_db | gzip > backup.sql.gz
```

### Recovery
```bash
# Restore from backup
psql finance_db < backup.sql
```

## Constraints & Referential Integrity

### Foreign Key Constraints
- Users must have a valid roleId
- Financial records must have a valid userId
- Deleting a role cascades to users (not implemented by default, manual handling required)

### Unique Constraints
- Email addresses must be unique
- Role names must be unique

### Not Null Constraints
- Amount, type, category, date on financial_records
- Email, password, roleId on users
- Name on roles

