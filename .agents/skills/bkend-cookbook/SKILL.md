---
name: bkend-cookbook
description: |
  bkend.ai cookbook with step-by-step tutorials and example projects.
  Build a todo app, blog, e-commerce store, and more with bkend.ai BaaS.
  Triggers: bkend cookbook, bkend tutorial, bkend example, todo app, blog app,
  bkend 쿡북, bkend 튜토리얼, 예제 프로젝트, bkendクックブック, チュートリアル,
  bkend教程, 示例项目, tutorial bkend, tutoriel bkend, bkend-Tutorial, ricettario
  Do NOT use for: initial setup (use $bkend-quickstart), specific features (use $bkend-data/auth/storage).
---

# bkend.ai Cookbook

> Step-by-step tutorials and ready-to-use project templates.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `list` | List all recipes | `$bkend-cookbook list` |
| `todo` | Build a todo app | `$bkend-cookbook todo` |
| `blog` | Build a blog | `$bkend-cookbook blog` |

## Available Recipes

| Recipe | Difficulty | Features Used |
|--------|-----------|---------------|
| Todo App | Beginner | Data CRUD |
| Blog | Beginner | Data + Auth |
| User Dashboard | Intermediate | Auth + Data + Storage |
| E-commerce | Intermediate | All features |
| SaaS MVP | Advanced | All + RBAC |

## Recipe 1: Todo App (15 minutes)

### Schema
```
Table: todos
- title (string, required)
- completed (boolean, default: false)
- user_id (reference to users)
- created_at (datetime, auto)
```

### Frontend

```typescript
// hooks/useTodos.ts
export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: () => bkend.data.list('todos', { sort: '-created_at' }),
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => bkend.data.create('todos', { title, completed: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      bkend.data.update('todos', id, { completed: !completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bkend.data.delete('todos', id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
}
```

```typescript
// components/TodoList.tsx
'use client';
import { useTodos, useCreateTodo, useToggleTodo, useDeleteTodo } from '@/hooks/useTodos';
import { useState } from 'react';

export function TodoList() {
  const [newTitle, setNewTitle] = useState('');
  const { data: todos, isLoading } = useTodos();
  const createTodo = useCreateTodo();
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createTodo.mutate(newTitle);
    setNewTitle('');
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todo App</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a todo..." className="flex-1 border rounded px-3 py-2" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
      </form>
      <ul className="space-y-2">
        {todos?.map((todo: any) => (
          <li key={todo.id} className="flex items-center gap-2 p-2 border rounded">
            <input type="checkbox" checked={todo.completed}
              onChange={() => toggleTodo.mutate({ id: todo.id, completed: todo.completed })} />
            <span className={todo.completed ? 'line-through text-gray-400 flex-1' : 'flex-1'}>
              {todo.title}
            </span>
            <button onClick={() => deleteTodo.mutate(todo.id)}
              className="text-red-500 text-sm">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Recipe 2: Blog with Authentication

### Schema
```
Table: users (built-in via bkend auth)

Table: posts
- title (string, required)
- slug (string, unique)
- body (text, required)
- status (enum: draft/published, default: draft)
- author_id (reference to users)
- created_at (datetime, auto)
- updated_at (datetime, auto)

Table: comments
- body (text, required)
- post_id (reference to posts)
- author_id (reference to users)
- created_at (datetime, auto)
```

### Key Patterns
```typescript
// Create post with auth
const { user } = useAuth();
await bkend.data.create('posts', {
  title, slug: title.toLowerCase().replace(/\s+/g, '-'),
  body, status: 'draft', author_id: user.id,
});

// List published posts (public)
const posts = await bkend.data.list('posts', { status: 'published', sort: '-created_at' });

// Get post with comments
const post = await bkend.data.get('posts', postId);
const comments = await bkend.data.list('comments', { post_id: postId, sort: 'created_at' });
```

## Recipe 3: User Dashboard with File Upload

### Key Patterns
```typescript
// Profile with avatar upload
async function updateAvatar(file: File) {
  const { url } = await bkend.storage.upload(file, 'avatars');
  await bkend.data.update('users', user.id, { avatar_url: url });
}

// Dashboard stats
async function getDashboardStats(userId: string) {
  const [posts, comments] = await Promise.all([
    bkend.data.list('posts', { author_id: userId }),
    bkend.data.list('comments', { author_id: userId }),
  ]);
  return { postCount: posts.length, commentCount: comments.length };
}
```

## Project Template

For any recipe, start with:

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npm install @tanstack/react-query zustand
```

Then:
1. Set up bkend client (`lib/bkend.ts`)
2. Create auth store (`stores/auth-store.ts`)
3. Add QueryClientProvider
4. Build features following recipe patterns

## Reference

See `references/bkend-patterns.md` for complete API client and pattern reference.
