---
name: bkend-data
description: |
  bkend.ai data management guide. Tables, columns, CRUD operations,
  schema design, indexes, and query filtering with bkend.ai BaaS.
  Triggers: bkend table, bkend column, bkend CRUD, bkend schema, bkend data,
  bkend 테이블, bkend 데이터, CRUD, 스키마, bkendテーブル, bkendデータ,
  bkend表, bkend数据, tabla bkend, données bkend, bkend-Daten, dati bkend
  Do NOT use for: auth (use $bkend-auth), file storage (use $bkend-storage).
---

# bkend.ai Data Management

> Create tables, define schemas, and perform CRUD operations.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `table` | Create a new table | `$bkend-data table users` |
| `schema` | Design table schema | `$bkend-data schema` |
| `query` | Query data examples | `$bkend-data query` |

## Creating Tables

Tables in bkend.ai are created through the dashboard or MCP:

### Via Dashboard
1. Go to project > Database
2. Click "New Table"
3. Define columns with types

### Via MCP
```
Create a table called "posts" with:
- title (string, required)
- body (text, required)
- status (enum: draft/published, default: draft)
- author_id (reference to users)
- created_at (datetime, auto)
- updated_at (datetime, auto)
```

## Column Types

| Type | Description | Example |
|------|-----------|---------|
| `string` | Short text (max 255) | name, email, slug |
| `text` | Long text (unlimited) | body, description |
| `number` | Integer or float | age, price, count |
| `boolean` | True/false | is_active, is_published |
| `datetime` | Date and time | created_at, due_date |
| `enum` | Fixed set of values | status, role, type |
| `json` | JSON object | metadata, settings |
| `reference` | Foreign key to another table | author_id, category_id |
| `file` | File reference | avatar, attachment |

## CRUD Operations

### Create
```typescript
const post = await bkend.data.create('posts', {
  title: 'My First Post',
  body: 'Hello world!',
  status: 'draft',
  author_id: currentUser.id,
});
```

### Read (Single)
```typescript
const post = await bkend.data.get('posts', postId);
```

### Read (List with Filters)
```typescript
const posts = await bkend.data.list('posts', {
  status: 'published',
  sort: '-created_at',
  page: '1',
  limit: '20',
});
```

### Update
```typescript
const updated = await bkend.data.update('posts', postId, {
  title: 'Updated Title',
  status: 'published',
});
```

### Delete
```typescript
await bkend.data.delete('posts', postId);
```

## Query Patterns

### Filtering
```typescript
// Exact match
{ status: 'published' }

// Multiple filters (AND)
{ status: 'published', author_id: userId }
```

### Sorting
```typescript
// Ascending
{ sort: 'created_at' }

// Descending (prefix with -)
{ sort: '-created_at' }
```

### Pagination
```typescript
// Page-based
{ page: '2', limit: '10' }
```

### Search
```typescript
// Full-text search
{ search: 'keyword' }
```

## React Hooks

```typescript
// hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePosts(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => bkend.data.list('posts', filters),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostInput) => bkend.data.create('posts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}
```

## Schema Best Practices

1. Always include `created_at` and `updated_at`
2. Use `reference` type for relationships
3. Add indexes on frequently filtered columns
4. Use `enum` for fixed value sets
5. Use `json` sparingly (harder to query)

## Reference

See `references/bkend-patterns.md` for complete API client code and advanced patterns.
