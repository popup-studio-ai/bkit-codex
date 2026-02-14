# API Patterns Reference

## RESTful URL Conventions

### Resource Naming
```
GET    /api/v1/users          # List users
POST   /api/v1/users          # Create user
GET    /api/v1/users/:id      # Get single user
PUT    /api/v1/users/:id      # Update user (full)
PATCH  /api/v1/users/:id      # Update user (partial)
DELETE /api/v1/users/:id      # Delete user
```

### Nested Resources
```
GET    /api/v1/users/:userId/posts        # User's posts
POST   /api/v1/users/:userId/posts        # Create post for user
GET    /api/v1/posts/:postId/comments     # Post's comments
```

### Rules:
- Use plural nouns (users, not user)
- Use kebab-case for multi-word resources (user-profiles)
- Max 2 levels of nesting
- Use query parameters for filtering, not URL segments

## Pagination Pattern

### Offset-based (simple)
```
GET /api/v1/posts?page=1&pageSize=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Cursor-based (scalable)
```
GET /api/v1/posts?cursor=abc123&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "nextCursor": "def456",
    "hasMore": true
  }
}
```

Use cursor-based for: large datasets, real-time feeds, infinite scroll.
Use offset-based for: admin tables, numbered pages.

## Filtering & Sorting

```
GET /api/v1/posts?status=published&author=user123&sort=-created_at&fields=id,title

Query Parameters:
- status=published       # Filter by field value
- author=user123        # Filter by relation
- sort=-created_at      # Sort (- prefix = descending)
- fields=id,title       # Sparse fields (select specific)
- search=keyword        # Full-text search
```

## Standard Response Envelope

### Success (single item)
```json
{
  "data": {
    "id": "uuid",
    "type": "user",
    "attributes": { "email": "...", "name": "..." }
  }
}
```

### Success (list)
```json
{
  "data": [...],
  "pagination": { "page": 1, "pageSize": 20, "total": 150 }
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server error |

## Authentication Patterns

### JWT Bearer Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Token payload:
{
  "sub": "user-uuid",
  "role": "admin",
  "iat": 1700000000,
  "exp": 1700000900
}
```

### Refresh Token Flow
```
1. POST /api/auth/login
   Response: { access_token (15min), refresh_token (7d, httpOnly cookie) }

2. Access token expires -> 401 response

3. POST /api/auth/refresh
   Cookie: refresh_token=...
   Response: { access_token (new 15min) }

4. Refresh token expires -> redirect to login
```

## Rate Limiting

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000060
```

When exceeded:
```json
HTTP 429
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Retry after 60 seconds.",
    "retryAfter": 60
  }
}
```

## API Versioning

### URL-based (recommended)
```
/api/v1/users
/api/v2/users
```

### Header-based
```
Accept: application/vnd.myapp.v1+json
```

Rules:
- Start with v1 from day 1
- Never break existing versions
- Deprecate old versions with sunset headers
- Document migration guides between versions

## Bulk Operations

```
POST /api/v1/users/bulk
{
  "operations": [
    { "action": "create", "data": { "email": "a@b.com" } },
    { "action": "update", "id": "uuid1", "data": { "name": "New" } },
    { "action": "delete", "id": "uuid2" }
  ]
}

Response:
{
  "results": [
    { "status": 201, "data": { "id": "uuid3" } },
    { "status": 200, "data": { "id": "uuid1" } },
    { "status": 204 }
  ]
}
```
