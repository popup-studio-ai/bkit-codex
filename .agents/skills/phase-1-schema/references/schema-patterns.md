# Schema Patterns Reference

## Soft Delete Pattern

Instead of physically deleting records, mark them as deleted:

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP NULL;
```

Query active records:
```sql
SELECT * FROM users WHERE deleted_at IS NULL;
```

Benefits: Data recovery, audit compliance, referential integrity preserved.

## Audit Trail Pattern

Track who changed what and when:

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);
```

## Timestamp Pattern

Every table should have:

```sql
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
updated_at TIMESTAMP NOT NULL DEFAULT NOW()
```

Auto-update with trigger:
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## UUID Primary Key Pattern

Use UUIDs instead of auto-increment for distributed systems:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

Benefits: No sequential guessing, merge-safe, distributed generation.

## Multi-tenancy Pattern

### Schema-based (Enterprise)

```sql
CREATE SCHEMA tenant_acme;
CREATE TABLE tenant_acme.users (...);
```

### Column-based (Dynamic)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ...
);
CREATE INDEX idx_users_tenant ON users(tenant_id);
```

## Polymorphic Association Pattern

When multiple entities share a relationship:

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  commentable_type VARCHAR(50) NOT NULL,
  commentable_id UUID NOT NULL,
  body TEXT NOT NULL,
  ...
);
CREATE INDEX idx_comments_poly ON comments(commentable_type, commentable_id);
```

## Enum Pattern

```sql
-- PostgreSQL enum
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Or check constraint (more portable)
CREATE TABLE users (
  role VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'moderator'))
);
```

## JSON/JSONB Column Pattern

For flexible/dynamic data:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  metadata JSONB DEFAULT '{}',
  ...
);
CREATE INDEX idx_products_metadata ON products USING GIN(metadata);
```

## Index Strategy

### Primary patterns:
- **Equality**: `CREATE INDEX idx_users_email ON users(email);`
- **Range**: `CREATE INDEX idx_posts_created ON posts(created_at DESC);`
- **Composite**: `CREATE INDEX idx_posts_user_status ON posts(user_id, status);`
- **Partial**: `CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;`

### Rules of thumb:
1. Index foreign keys
2. Index columns used in WHERE clauses
3. Index columns used in ORDER BY
4. Composite index column order matters (most selective first)
5. Do not over-index (each index slows writes)

## Naming Conventions for Schema

| Element | Convention | Example |
|---------|-----------|---------|
| Table | snake_case, plural | `users`, `blog_posts` |
| Column | snake_case | `first_name`, `created_at` |
| Primary Key | `id` | `id UUID PRIMARY KEY` |
| Foreign Key | `{entity}_id` | `user_id`, `post_id` |
| Index | `idx_{table}_{columns}` | `idx_users_email` |
| Constraint | `chk_{table}_{rule}` | `chk_users_role` |
