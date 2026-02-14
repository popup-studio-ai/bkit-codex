---
name: dynamic
description: |
  Fullstack development with bkend.ai BaaS. Covers authentication,
  data storage, API integration. Project initialization with "init dynamic".
  Triggers: fullstack, BaaS, bkend, authentication, login, signup, database,
  풀스택, 인증, 로그인, フルスタック, 認証, 全栈, 身份验证,
  autenticación, authentification, Authentifizierung, autenticazione
  Do NOT use for: static sites (use $starter), enterprise MSA (use $enterprise).
---

# Intermediate (Dynamic) Skill

> Fullstack development using bkend.ai BaaS platform.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `init` | Project initialization | `$dynamic init my-saas` |
| `guide` | Display development guide | `$dynamic guide` |
| `help` | BaaS integration help | `$dynamic help` |

### init (Project Initialization)

1. Create Next.js + Tailwind project structure
2. Configure bkend.ai MCP connection
3. Create AGENTS.md (Level: Dynamic specified)
4. Create docs/ folder structure
5. Generate src/lib/bkend.ts client template
6. Initialize .pdca-status.json

### guide (Development Guide)

- bkend.ai auth/data configuration guide
- Phase 1-9 full Pipeline guide
- API integration patterns

### help (BaaS Help)

- Explain bkend.ai basic concepts
- Auth, database, file storage usage
- MCP integration methods

## Target Audience

- Frontend developers adding backend features
- Solo entrepreneurs building MVPs
- Those who want to build fullstack services quickly

## Tech Stack

```
Frontend:
- React / Next.js 14+
- TypeScript
- Tailwind CSS
- TanStack Query (data fetching)
- Zustand (state management)

Backend (BaaS):
- bkend.ai
  - Auto REST API
  - MongoDB database
  - Built-in authentication (JWT)
  - Real-time features (WebSocket)

Deployment:
- Vercel (frontend)
- bkend.ai (backend)
```

## Project Structure

```
project/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth-related routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/            # Main routes
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # UI components
│   │   ├── ui/                # Basic UI (Button, Input...)
│   │   └── features/          # Feature-specific components
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useQuery.ts
│   ├── lib/                    # Utilities
│   │   ├── bkend.ts           # bkend.ai client
│   │   └── utils.ts
│   ├── stores/                 # State management (Zustand)
│   │   └── auth-store.ts
│   └── types/                  # TypeScript types
│       └── index.ts
├── docs/                       # PDCA documents
├── .env.local                  # Environment variables
├── package.json
└── README.md
```

## Core Patterns

### bkend.ai Client Setup

```typescript
// lib/bkend.ts
const API_BASE = process.env.NEXT_PUBLIC_BKEND_API_URL || 'https://api.bkend.ai/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!;

async function bkendFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('bkend_access_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-project-id': PROJECT_ID,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const bkend = {
  auth: {
    signup: (body: {email: string; password: string}) =>
      bkendFetch('/auth/email/signup', {method: 'POST', body: JSON.stringify(body)}),
    signin: (body: {email: string; password: string}) =>
      bkendFetch('/auth/email/signin', {method: 'POST', body: JSON.stringify(body)}),
    me: () => bkendFetch('/auth/me'),
    signout: () => bkendFetch('/auth/signout', {method: 'POST'}),
  },
  data: {
    list: (table: string, params?: Record<string,string>) =>
      bkendFetch(`/data/${table}?${new URLSearchParams(params)}`),
    get: (table: string, id: string) => bkendFetch(`/data/${table}/${id}`),
    create: (table: string, body: any) =>
      bkendFetch(`/data/${table}`, {method: 'POST', body: JSON.stringify(body)}),
    update: (table: string, id: string, body: any) =>
      bkendFetch(`/data/${table}/${id}`, {method: 'PATCH', body: JSON.stringify(body)}),
    delete: (table: string, id: string) =>
      bkendFetch(`/data/${table}/${id}`, {method: 'DELETE'}),
  },
};
```

### Authentication Hook

```typescript
// hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bkend } from '@/lib/bkend';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        const { user, token } = await bkend.auth.signin({ email, password });
        localStorage.setItem('bkend_access_token', token);
        set({ user, isLoading: false });
      },
      logout: () => {
        bkend.auth.signout();
        localStorage.removeItem('bkend_access_token');
        set({ user: null });
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### Protected Route

```typescript
// components/ProtectedRoute.tsx
'use client';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) redirect('/login');
  return <>{children}</>;
}
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_BKEND_API_URL=https://api.bkend.ai/v1
NEXT_PUBLIC_BKEND_PROJECT_ID=your-project-id
NEXT_PUBLIC_BKEND_ENV=dev
```

## Pipeline Flow (Dynamic)

```
Phase 1 -> 2 -> 3 -> 4(bkend.ai) -> 5 -> 6 -> 7 -> 8 -> 9
```

## Limitations

- Complex backend logic (serverless function limits)
- Large-scale traffic (within BaaS limits)
- Custom infrastructure control
- Microservices architecture

## When to Upgrade

Move to **Enterprise Level** ($enterprise) if you need:

- Significantly increased traffic handling
- Microservices architecture
- Custom server/infrastructure
- Complex backend logic

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| CORS error | Register domain in bkend.ai console |
| 401 Unauthorized | Token expired, re-login or refresh token |
| Data not showing | Check collection name, query conditions |
| Type error | Sync TypeScript types with schema |
