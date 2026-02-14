---
name: phase-1-schema
description: |
  Phase 1: Data Modeling and Terminology Definition.
  Define database schema, entity relationships, and project glossary.
  Next: $phase-2-convention.
  Triggers: schema, data model, entity, ERD, database design, terminology,
  스키마, 데이터 모델, 엔티티, 용어 정의, スキーマ, データモデル, 用語,
  esquema, modelo de datos, schéma, modèle de données, Datenmodell, Schema
  Do NOT use for: API design (use $phase-4-api), coding rules (use $phase-2-convention).
---

# Phase 1: Schema & Data Modeling

> Define your data foundation before writing any code.

## Purpose

Phase 1 establishes the data layer that everything else builds on. Poor data modeling leads to costly refactors later.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `start` | Begin Phase 1 | `$phase-1-schema start` |
| `review` | Review current schema | `$phase-1-schema review` |
| `glossary` | Generate terminology glossary | `$phase-1-schema glossary` |

## Deliverables

1. **Terminology Glossary** - Project-wide term definitions
2. **Entity List** - All data entities with descriptions
3. **ERD (Entity Relationship Diagram)** - Visual entity relationships
4. **Field Definitions** - Per-entity field specs (name, type, constraints)
5. **Schema Document** - `docs/01-plan/schema.md`

## Process

### Step 1: Define Terminology

Create a glossary of domain terms used across the project:

```markdown
| Term | Definition | Korean | Example |
|------|-----------|--------|---------|
| User | Person with an account | 사용자 | john@example.com |
| Post | Content created by a user | 게시글 | Blog article |
| Comment | Response to a post | 댓글 | Feedback on article |
```

### Step 2: Identify Entities

List all data entities:

```markdown
## Entities
- User: Account holder (email, name, role)
- Post: User-generated content (title, body, status)
- Comment: Feedback on posts (body, author)
- Tag: Content categorization (name, slug)
```

### Step 3: Define Relationships

```
User 1--* Post       (one user has many posts)
Post 1--* Comment    (one post has many comments)
User 1--* Comment    (one user has many comments)
Post *--* Tag        (many-to-many via PostTag)
```

### Step 4: Field Specifications

For each entity, define fields:

```markdown
### User
| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | auto | Primary key |
| email | String(255) | Yes | Yes | - | Login email |
| name | String(100) | Yes | No | - | Display name |
| role | Enum | Yes | No | 'user' | user/admin |
| created_at | DateTime | Yes | No | now() | Creation time |
```

### Step 5: Validation Rules

Define business rules per entity:

- Email must be valid format
- Name must be 2-100 characters
- Role must be one of: user, admin
- Post title must be 1-200 characters

## Schema Patterns

See `references/schema-patterns.md` for common patterns:
- Soft delete pattern
- Audit trail pattern
- Multi-tenancy pattern
- Polymorphic associations

## Output Location

```
docs/01-plan/
├── schema.md          # Full schema document
├── glossary.md        # Terminology glossary
└── erd.md             # Entity relationship diagram
```

## Next Phase

When schema is complete, proceed to **$phase-2-convention** for coding conventions.

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Skipping terminology | Leads to naming inconsistency later |
| Over-normalizing | Start simple, normalize when needed |
| Missing timestamps | Always include created_at, updated_at |
| No soft delete | Add deleted_at for recoverable data |
| Ignoring indexes | Plan indexes for query patterns early |
