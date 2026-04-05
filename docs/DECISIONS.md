# Design Decisions & Assumptions

## Architectural Decisions

### 1. Technology Stack

**Choice: Node.js + Express + PostgreSQL + Sequelize**

**Rationale:**
- **Node.js**: Fast, non-blocking I/O, large ecosystem
- **Express**: Lightweight, minimal overhead, well-established
- **PostgreSQL**: Reliable relational database, excellent for financial data
- **Sequelize**: Full-featured ORM with migrations, associations, and validation

**Alternatives Considered:**
- Django/Python: More batteries-included but heavier
- FastAPI/Python: Async but smaller ecosystem for this use case
- Java Spring Boot: Overkill for assessment project
- SQLite: Simpler but lacks concurrency for production

### 2. Authentication Strategy

**Choice: JWT (JSON Web Tokens) with bcrypt password hashing**

**Rationale:**
- Stateless: No server-side session storage needed
- Scalable: Works well in distributed systems
- Standard: Well-supported across frontend frameworks
- Token expiry: 7 days (configurable)

**Implementation Details:**
- Passwords hashed with bcrypt (10 rounds)
- Tokens signed with JWT_SECRET
- Token verified on each protected request
- lastLogin timestamp tracks user activity

**Alternatives Considered:**
- Session-based: Requires server-side storage
- OAuth2: Overkill for internal system
- API Keys: Less secure than JWT

### 3. Role-Based Access Control (RBAC)

**Choice: Three-tier role system (VIEWER, ANALYST, ADMIN)**

**Rationale:**
- Simple to understand and implement
- Covers most use cases (view-only, edit, admin)
- Easy to extend with more granular permissions
- Middleware-based enforcement at route level

**Roles Defined:**
```
VIEWER:  Read dashboard, own records only
ANALYST: Full CRUD on all records, analytics
ADMIN:   User management, system administration
```

**Alternatives Considered:**
- Attribute-based: More complex, not needed here
- Fine-grained permissions: Overkill for 3 main actions
- Role hierarchy: Current flat structure is simpler

### 4. Data Model Simplifications

**Choice: Single creator per record, flat categories**

**Rationale:**
- Simpler schema for assessment
- Clear ownership and access control
- Easier to understand and maintain

**Assumptions:**
- Records aren't shared between users
- No budget tracking or categories hierarchy
- No recurring transactions

**What's NOT included:**
- Double-entry bookkeeping
- Budget creation/tracking
- Tag system beyond categories
- Transaction attachments

### 5. Soft Deletes

**Choice: Paranoid mode (soft deletes) for financial records**

**Rationale:**
- Financial data should never be permanently deleted
- Audit trail preservation
- Potential recovery of deleted records
- Compliance considerations

**Implementation:**
```
deletedAt IS NULL → record is active
deletedAt IS NOT NULL → record is deleted
Queries automatically exclude deleted records
```

**Tradeoff:**
- Database size grows over time
- Queries slightly slower (extra WHERE clause)

### 6. Error Handling

**Choice: Custom error classes with HTTP status codes**

**Rationale:**
- Consistent error format across API
- Clear semantics (400 vs 401 vs 403 vs 500)
- Easy to extend with new error types
- Development vs production logging modes

**Error Classes:**
```
BadRequestError (400): Invalid input
UnauthorizedError (401): Missing/invalid token
ForbiddenError (403): Insufficient permissions
NotFoundError (404): Resource not found
ConflictError (409): Resource exists
InternalServerError (500): Server error
```

### 7. Input Validation

**Choice: Joi schema validation at controller level**

**Rationale:**
- Declarative validation rules
- Consistent error messages
- Works with Express middleware
- Good ecosystem and documentation

**Validation Layers:**
1. Schema validation (Joi) - format and type
2. ORM validation (Sequelize) - database constraints
3. Business logic (Services) - permission checks

## Data Model Decisions

### Financial Record Structure

**Fields Included:**
- `amount`: Decimal with 2 decimal places (financial precision)
- `type`: INCOME, EXPENSE, or TRANSFER
- `category`: String for categorization
- `description`: Optional notes
- `date`: Transaction date (not timestamp)

**Fields NOT Included:**
- `payee/payer`: Not in requirement
- `tags`: Categories sufficient for filtering
- `recurring`: Not in requirement
- `status`: Simple create/update/delete

### Why DECIMAL(15, 2)?

```
15 = total digits
2 = decimal places

Range: -999,999,999,999.99 to 999,999,999,999.99
Precision: Exact, no floating-point errors
Suitable for: Financial amounts up to 999 billion
```

### Why Soft Deletes?

**Advantages:**
- Never lose data
- Compliance friendly (audit trails)
- Can undelete if needed
- Foreign key references remain valid

**Disadvantages:**
- Storage overhead
- Query complexity (WHERE deletedAt IS NULL)
- Backup size larger

**Decision:** Advantages outweigh disadvantages for financial data

## Access Control Decisions

### Why Record-Level Access Control?

**Implementation:**
- VIEWER: Only see own records
- ANALYST: See all records
- ADMIN: See all records

**Alternative Approaches:**
- Team-based sharing: More complex, not in requirement
- Record tags for access: Overhead without clear benefit
- Approval workflows: Out of scope

### Permission Check Timing

**Chosen: Route middleware + Service layer**

```
Request → Authenticate → Authorize → Controller → Service → Check Record Owner
```

**Advantages:**
- Multiple safety checks
- Clear separation of concerns
- Easy to debug

## Database Design Decisions

### No Audit Log Table

**Decision:** Simple timestamps only (createdAt, updatedAt)

**Rationale:**
- Simpler for assessment
- Sequelize paranoid mode handles soft deletes
- Can be added later if needed

**Could implement:**
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  changes JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Foreign Key Constraints

**Decision:** Define in models, not database level**

**Rationale:**
- Sequelize handles cascading automatically
- Easier to manage migrations
- Simpler local development

### No Indexes Beyond Primary Keys

**Decision:** Minimal indexing in development**

**Rationale:**
- Dataset is small in development
- Can add in production: email, date ranges, categories

**Recommended Production Indexes:**
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_record_user_date ON financial_records(userId, date DESC);
CREATE INDEX idx_record_category ON financial_records(category);
```

## API Design Decisions

### RESTful Convention

**Chosen: Standard REST endpoints**

```
POST /records         → Create
GET /records          → List
GET /records/:id      → Get single
PATCH /records/:id    → Update
DELETE /records/:id   → Delete
```

**Alternative: GraphQL**
- More flexible querying
- Steeper learning curve
- Overkill for this dataset size

### Pagination Strategy

**Chosen: Limit/Offset pagination**

```
GET /records?page=2&limit=20
```

**Advantages:**
- Simple to implement
- Works well with REST
- Easy for UI

**Disadvantages:**
- Offset performance degrades with large datasets
- Requires manual limit checking

**Alternative: Cursor-based**
- Better for large datasets
- More complex implementation

### Error Response Format

**Chosen: Consistent JSON structure**

```json
{
  "message": "User-friendly message",
  "errors": [
    { "field": "email", "message": "Invalid format" }
  ]
}
```

**Advantages:**
- Consistent across all endpoints
- Easy for frontend to handle
- Field-level error details

## Testing Decisions

### No Automated Testing in Submission

**Rationale:**
- Focus on backend logic implementation
- Manual testing documented comprehensively
- Integration easier with actual database

**Could add:**
```bash
npm test
npm run test:watch
```

## Deployment Assumptions

### Single-Instance Deployment

**Assumption:** Not deployed across multiple servers

**Simplifications:**
- No Redis cache (could add layer)
- No message queues
- No distributed sessions

**For Production:**
- Add caching layer
- Load balancer
- Database replication
- Monitoring/alerting

### Environment-Based Configuration

**Decision:** Use .env file for all configuration**

```env
NODE_ENV=development|production
DB_HOST=localhost
DB_NAME=finance_db
JWT_SECRET=your-secret-key
```

**Advantages:**
- Same code, different environments
- No secrets in version control
- Easy to configure

## Security Assumptions

### Password Policy

**Current:** Minimum 6 characters

**Recommendations for Production:**
- Minimum 12 characters
- Complexity requirements
- Password history

### JWT Secret

**Current:** Single secret for all tokens

**Production Considerations:**
- Use strong random string (256+ bits)
- Rotate periodically
- Store in secret management system

### HTTPS

**Current:** Assumed in development (http)

**Production:** Must use HTTPS

**Implementation:**
```
Nginx/HAProxy terminating SSL
Express behind reverse proxy
All tokens sent over encrypted channel
```

### CORS

**Current:** Allow all origins (unsafe)

**Production Configuration:**
```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

## Performance Considerations

### Current State

- Single database connection
- No caching
- Full table scans for analytics
- No pagination depth limits

### Scaling Opportunities

1. **Database Indexing**: Add indexes for common queries
2. **Caching Layer**: Redis for dashboard summaries
3. **Query Optimization**: Pre-aggregated data
4. **Pagination**: Implement cursor-based
5. **Compression**: gzip responses
6. **Rate Limiting**: Prevent abuse

### Expected Performance

**Rough Estimates (small dataset):**
- Record creation: < 50ms
- List records: < 100ms
- Dashboard summary: < 200ms
- User list: < 100ms

**Bottleneck:** Database query aggregations (analytics)

## Future Enhancements (Not Implemented)

1. **Export to CSV/PDF**: Add in recordController
2. **Recurring Transactions**: New model with cron job
3. **Budgets & Goals**: Separate budget model
4. **Sharing & Collaboration**: Team model
5. **Notifications**: Email alerts for thresholds
6. **Mobile App**: Separate React Native frontend
7. **Advanced Analytics**: Machine learning predictions
8. **API Rate Limiting**: express-rate-limit middleware
9. **Request Logging**: Morgan middleware
10. **Swagger/OpenAPI**: Auto-generated docs

## Trade-offs Summary

| Aspect | Chosen | Alternative | Trade-off |
|--------|--------|-------------|-----------|
| Language | Node.js | Python | Less mature but faster dev |
| Auth | JWT | Sessions | Stateless vs simple |
| DB | PostgreSQL | SQLite | Power vs simplicity |
| RBAC | 3-tier flat | Hierarchy | Simple vs flexible |
| Deletes | Soft | Hard | Storage vs auditability |
| Tests | Manual | Automated | Speed vs coverage |
| Cache | None | Redis | Development vs scale |
| Deploy | Single | Multi | Simplicity vs HA |

## Conclusion

All decisions prioritize:
1. **Clarity**: Easy to understand implementation
2. **Correctness**: Core logic works reliably
3. **Completeness**: Meets all requirements
4. **Maintainability**: Easy to modify and extend
5. **Learning Value**: Demonstrates best practices

