# Permissions Reference

## Permission Matrix

### Role Permissions Overview

| Permission | VIEWER | ANALYST | ADMIN |
|------------|--------|---------|-------|
| View dashboard | ✓ | ✓ | ✓ |
| View own records | ✓ | ✓ | ✓ |
| View all records | ✗ | ✓ | ✓ |
| Create records | ✗ | ✓ | ✓ |
| Update own records | ✗ | ✓ | ✓ |
| Update all records | ✗ | ✓ | ✓ |
| Delete own records | ✗ | ✓ | ✓ |
| Delete all records | ✗ | ✓ | ✓ |
| Export data | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| Manage roles | ✗ | ✗ | ✓ |
| View audit logs | ✗ | ✗ | ✓ |

## Detailed Permission Descriptions

### Dashboard Permissions

#### canViewDashboard
- **Roles:** VIEWER, ANALYST, ADMIN
- **Endpoints Affected:**
  - `GET /dashboard/summary`
  - `GET /dashboard/trends`
  - `GET /dashboard/category-breakdown`
  - `GET /dashboard/recent-transactions`
- **Description:** Access to dashboard analytics and summaries
- **Data Filtering:** VIEWER sees only own data, ANALYST/ADMIN see all

### Financial Record Permissions

#### canViewRecords
- **Roles:** ANALYST, ADMIN
- **Endpoint Affected:** `GET /records`
- **Description:** View all financial records (not just own)
- **Default Behavior:** VIEWER can only see own records
- **Access Control:** Record-level check in service layer

#### canCreateRecords
- **Roles:** ANALYST, ADMIN
- **Endpoint Affected:** `POST /records`
- **Description:** Create new financial records
- **Validation:** Requires valid amount, type, date, category
- **Ownership:** Record created with current user as owner

#### canUpdateRecords
- **Roles:** ANALYST, ADMIN
- **Endpoint Affected:** `PATCH /records/:id`
- **Description:** Modify existing financial records
- **Restrictions:** Cannot change record owner
- **Validation:** Same as creation

#### canDeleteRecords
- **Roles:** ANALYST, ADMIN
- **Endpoint Affected:** `DELETE /records/:id`
- **Description:** Delete (soft-delete) financial records
- **Implementation:** Sets deletedAt timestamp
- **Recovery:** Records can be recovered by clearing deletedAt

#### canExportData
- **Roles:** ANALYST, ADMIN
- **Future Endpoint:** `GET /records/export`
- **Description:** Export records to CSV/PDF
- **Format:** Configurable (CSV, Excel, PDF)
- **Scope:** Filtered records based on user role

### User Management Permissions

#### canManageUsers
- **Roles:** ADMIN only
- **Endpoints Affected:**
  - `GET /users`
  - `POST /users`
  - `GET /users/:id`
  - `PATCH /users/:id`
  - `PATCH /users/:id/role`
  - `DELETE /users/:id`
- **Description:** Full user lifecycle management
- **Capabilities:**
  - Create users with specific roles
  - Update user profiles
  - Change user roles
  - Deactivate/activate users
  - View user activity

#### canManageRoles
- **Roles:** ADMIN only
- **Future Endpoint:** `POST /roles`, `PATCH /roles/:id`
- **Description:** Create and modify roles
- **Current State:** Roles are fixed (VIEWER, ANALYST, ADMIN)
- **Future Enhancement:** Allow custom roles with permission combinations

## Permission Enforcement

### Middleware Enforcement

Permissions are enforced at multiple levels:

#### 1. Authentication Level
```javascript
// Authenticate middleware
- Verifies JWT token
- Attaches user object to request
- Returns 401 if invalid/missing
```

#### 2. Authorization Level
```javascript
// Authorize middleware
router.post('/records', authorize('canCreateRecords'), handler);
- Checks if user's role has permission
- Returns 403 if denied
- Proceeds if allowed
```

#### 3. Service Level
```javascript
// Service layer checks
const canAccess = canAccessRecord(userRole, recordOwnerId, currentUserId);
- Validates record ownership
- Enforces data filtering
- Returns appropriate error
```

### Permission Flow Example

**Request:** `POST /records` with VIEWER token

```
1. Request arrives with Authorization header
   ↓
2. Authenticate middleware
   - Verifies JWT signature
   - Extracts user: {id: 1, email: "viewer@...", role: "VIEWER"}
   ↓
3. Authorize middleware (canCreateRecords)
   - Checks: hasPermission("VIEWER", "canCreateRecords")
   - Result: false
   - Response: 403 Forbidden
```

**Request:** `POST /records` with ANALYST token

```
1. Request arrives with Authorization header
   ↓
2. Authenticate middleware
   - Verifies JWT signature
   - Extracts user: {id: 2, email: "analyst@...", role: "ANALYST"}
   ↓
3. Authorize middleware (canCreateRecords)
   - Checks: hasPermission("ANALYST", "canCreateRecords")
   - Result: true
   ↓
4. Controller processes request
   - Validates input (amount, type, date, category)
   - Calls recordService.createRecord()
   ↓
5. Service layer
   - Creates record with current user as owner
   - Returns record with ID
```

## Record Access Control

### Access Decision Logic

```javascript
// In recordService.js
const canAccessRecord = (userRole, recordUserId, currentUserId) => {
  if (userRole === 'ADMIN' || userRole === 'ANALYST') {
    return true;  // Can access any record
  }
  // VIEWER can only access own records
  return recordUserId === currentUserId;
};
```

### Scenarios

#### Scenario 1: VIEWER Reading Own Record
```
User: VIEWER (id=1)
Record: id=5, userId=1

Access Check:
- canAccessRecord("VIEWER", 1, 1)
- userRole !== "ADMIN" && userRole !== "ANALYST"
- recordUserId (1) === currentUserId (1)
- Result: ✓ ALLOWED
```

#### Scenario 2: VIEWER Reading Another's Record
```
User: VIEWER (id=1)
Record: id=5, userId=2

Access Check:
- canAccessRecord("VIEWER", 2, 1)
- userRole !== "ADMIN" && userRole !== "ANALYST"
- recordUserId (2) !== currentUserId (1)
- Result: ✗ DENIED (403 Forbidden)
```

#### Scenario 3: ANALYST Reading Any Record
```
User: ANALYST (id=2)
Record: id=5, userId=1

Access Check:
- canAccessRecord("ANALYST", 1, 2)
- userRole === "ANALYST"
- Result: ✓ ALLOWED
```

## Dashboard Access Control

Dashboard endpoints apply data filtering based on role:

```javascript
// In dashboardService.js
const getSummary = async (userId, userRole) => {
  const where = userRole === 'VIEWER' ? { userId } : {};
  // VIEWER only gets their own data
  // ANALYST/ADMIN get all data
};
```

### Summary Calculation Examples

#### For VIEWER (id=1):
```
Records accessed: Only user 1's records
Calculation:
- Total Income = Sum of own INCOME records
- Total Expense = Sum of own EXPENSE records
- Net Balance = Income - Expense

Example:
- Own Income: $5,000
- Own Expense: $1,500
- Net: $3,500
```

#### For ANALYST:
```
Records accessed: ALL users' records
Calculation:
- Total Income = Sum of ALL INCOME records
- Total Expense = Sum of ALL EXPENSE records
- Net Balance = Income - Expense

Example:
- All Income: $50,000
- All Expense: $20,000
- Net: $30,000
```

## Permission Matrix by Endpoint

### Authentication Endpoints

| Endpoint | Method | Auth | Permission | Description |
|----------|--------|------|-----------|-------------|
| /auth/register | POST | None | - | Register new user |
| /auth/login | POST | None | - | Login and get token |
| /auth/me | GET | JWT | - | Get current user |

### Records Endpoints

| Endpoint | Method | Auth | Permission | Description |
|----------|--------|------|-----------|-------------|
| /records | GET | JWT | - | List records (filtered) |
| /records | POST | JWT | canCreateRecords | Create record |
| /records/:id | GET | JWT | - | Get record (with access check) |
| /records/:id | PATCH | JWT | canUpdateRecords | Update record |
| /records/:id | DELETE | JWT | canDeleteRecords | Delete record |

### Dashboard Endpoints

| Endpoint | Method | Auth | Permission | Description |
|----------|--------|------|-----------|-------------|
| /dashboard/summary | GET | JWT | - | Financial summary |
| /dashboard/trends | GET | JWT | - | Monthly trends |
| /dashboard/category-breakdown | GET | JWT | - | Category breakdown |
| /dashboard/recent-transactions | GET | JWT | - | Recent transactions |

### User Management Endpoints

| Endpoint | Method | Auth | Permission | Description |
|----------|--------|------|-----------|-------------|
| /users | GET | JWT | canManageUsers | List users |
| /users | POST | JWT | canManageUsers | Create user |
| /users/:id | GET | JWT | canManageUsers | Get user |
| /users/:id | PATCH | JWT | canManageUsers | Update user |
| /users/:id/role | PATCH | JWT | canManageUsers | Change role |
| /users/:id | DELETE | JWT | canManageUsers | Deactivate user |

## Custom Role Creation (Future)

If custom roles are implemented:

```javascript
const customPermissions = {
  ACCOUNTANT: {
    canViewRecords: true,
    canCreateRecords: true,
    canUpdateRecords: true,
    canDeleteRecords: false,  // Cannot delete
    canViewDashboard: true,
    canExportData: true,
    canManageUsers: false,
    canManageRoles: false,
  }
};
```

## Testing Permissions

### Access Control Test Cases

```javascript
// VIEWER cannot create
POST /records { VIEWER token }
Expected: 403 Forbidden

// ANALYST can create
POST /records { ANALYST token }
Expected: 201 Created

// VIEWER sees only own records
GET /records { VIEWER token, owns 5 records, total 50 }
Expected: 200, 5 records returned

// ANALYST sees all records
GET /records { ANALYST token }
Expected: 200, all 50 records returned

// Non-owner VIEWER cannot access
GET /records/99 { VIEWER token, owner is different }
Expected: 403 Forbidden

// ANALYST can access any record
GET /records/99 { ANALYST token }
Expected: 200, record details
```

## Debugging Permissions

### Check User Role
```sql
SELECT u.email, r.name as role
FROM users u
JOIN roles r ON u.roleId = r.id
WHERE u.email = 'user@example.com';
```

### Check Record Permissions
```sql
SELECT 
  fr.id, 
  fr.amount, 
  u.email as creator,
  CASE 
    WHEN r.name = 'VIEWER' AND fr.userId = ? THEN 'Can access'
    WHEN r.name IN ('ANALYST', 'ADMIN') THEN 'Can access'
    ELSE 'Cannot access'
  END as access_status
FROM financial_records fr
JOIN users u ON fr.userId = u.id
WHERE fr.id = ?;
```

## Common Permission Errors

### Error: "You do not have permission"
**HTTP Status:** 403 Forbidden

**Causes:**
- User role lacks required permission
- Try to access record owned by others (VIEWER only)
- Try to manage users (non-ADMIN)

**Solution:** Check user's role and required permission

### Error: "Not authenticated"
**HTTP Status:** 401 Unauthorized

**Causes:**
- Missing Authorization header
- Invalid or expired token
- Malformed token

**Solution:** Include valid JWT token in Authorization header

