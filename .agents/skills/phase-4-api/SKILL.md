---
name: phase-4-api
description: |
  Phase 4: API Design and REST Endpoint Planning.
  Design RESTful APIs, define endpoints, request/response schemas.
  Includes Zero Script QA integration for API testing.
  Next: $phase-5-design-system.
  Triggers: API design, REST, endpoint, API schema, request response,
  API 설계, 엔드포인트, REST API, API設計, エンドポイント,
  API设计, 端点, diseno de API, conception API, API-Design, progettazione API
  Do NOT use for: data modeling (use $phase-1-schema), frontend (use $phase-6-ui-integration).
---

# Phase 4: API Design

> Design your API contracts before implementation.

## Purpose

Phase 4 defines the communication layer between frontend and backend. Well-designed APIs reduce integration friction and enable parallel development.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `start` | Begin Phase 4 | `$phase-4-api start` |
| `endpoints` | List all endpoints | `$phase-4-api endpoints` |
| `test` | Generate API test plan | `$phase-4-api test` |

## Deliverables

1. **API Endpoint List** - All routes with methods
2. **Request/Response Schemas** - Per-endpoint data contracts
3. **Authentication Spec** - Auth flow and token handling
4. **Error Response Format** - Standardized error structure
5. **API Document** - `docs/02-design/api.md`

## Process

### Step 1: Resource Identification

Map entities from Phase 1 to API resources:

```markdown
| Entity | Resource Path | Methods |
|--------|--------------|---------|
| User | /api/users | GET, POST |
| User (single) | /api/users/:id | GET, PUT, DELETE |
| Post | /api/posts | GET, POST |
| Post (single) | /api/posts/:id | GET, PUT, DELETE |
| Comment | /api/posts/:id/comments | GET, POST |
```

### Step 2: Endpoint Specifications

For each endpoint:

```markdown
### POST /api/users
- **Description**: Create new user
- **Auth**: None (public)
- **Request Body**:
  ```json
  { "email": "string", "name": "string", "password": "string" }
  ```
- **Response 201**:
  ```json
  { "id": "uuid", "email": "string", "name": "string", "created_at": "datetime" }
  ```
- **Errors**: 400 (validation), 409 (email exists)
```

### Step 3: Authentication Design

```markdown
## Auth Flow
1. POST /api/auth/login -> Returns { access_token, refresh_token }
2. Include `Authorization: Bearer <token>` in subsequent requests
3. POST /api/auth/refresh -> Renew expired access token
4. POST /api/auth/logout -> Invalidate tokens

## Token Specs
- Access token: JWT, 15min expiry
- Refresh token: opaque, 7d expiry, stored in httpOnly cookie
```

### Step 4: Error Response Standard

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
```

### Step 5: API Testing with Zero Script QA

Use Docker logs and curl for testing without test scripts:

```bash
# Test user creation
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"pass123"}'

# Check docker logs for errors
docker logs app-container --tail 50
```

## API Patterns

See `references/api-patterns.md` for REST conventions, pagination, filtering, and versioning patterns.

## Output Location

```
docs/02-design/
├── api.md             # Full API specification
├── auth-flow.md       # Authentication design
└── error-codes.md     # Error code reference
```

## Next Phase

When API design is complete, proceed to **$phase-5-design-system** for component library.

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Inconsistent naming | Use plural nouns for resources |
| No pagination | Always paginate list endpoints |
| Missing error codes | Define all error responses upfront |
| No versioning plan | Use URL prefix /api/v1/ from start |
| Tight coupling | Design for frontend/backend independence |
