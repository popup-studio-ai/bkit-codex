---
name: phase-6-ui-integration
description: |
  Phase 6: UI Integration. Connect frontend components with backend APIs,
  implement state management, and handle data flow.
  Triggers: UI integration, frontend backend, state management, data binding,
  UI 통합, 프론트 백엔드, UI統合, UI集成, integración UI,
  intégration UI, UI-Integration, integrazione UI
  Do NOT use for: component design (use $phase-5-design-system), API design (use $phase-4-api).
  Next: $phase-7-seo-security
---

# Phase 6: UI Integration

> Connect frontend components with backend APIs and implement state management.

## Purpose

Phase 6 bridges the gap between Phase 5 (design system) and Phase 4 (API). This phase wires up data fetching, state management, error handling, and user interactions to create a fully functional application. Every page becomes alive with real data.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `start` | Begin Phase 6 | `$phase-6-ui-integration start` |
| `api-client` | Set up API client | `$phase-6-ui-integration api-client` |
| `state` | Implement state management | `$phase-6-ui-integration state` |
| `forms` | Set up form handling | `$phase-6-ui-integration forms` |
| `review` | Review integration quality | `$phase-6-ui-integration review` |

## Deliverables

1. **API Client** - Configured HTTP client with interceptors and error handling
2. **Data Fetching Hooks** - TanStack Query hooks for each API resource
3. **State Management** - Global state stores (Zustand) for cross-cutting concerns
4. **Page Implementations** - All pages connected with real data
5. **Form Handling** - Validated forms with react-hook-form + Zod
6. **Error Boundaries** - Graceful error handling at every level
7. **Loading States** - Skeleton loaders and progress indicators

```
src/
├── app/                       # Pages (Next.js App Router)
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Home page
│   ├── providers.tsx          # QueryClient, theme, etc.
│   ├── (auth)/                # Auth route group
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (main)/                # Main route group
│       ├── layout.tsx         # Authenticated layout
│       ├── dashboard/page.tsx
│       └── settings/page.tsx
├── features/                  # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── {feature}/
│       ├── components/
│       ├── hooks/
│       └── services/
├── hooks/                     # Shared hooks
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
├── stores/                    # Global state (Zustand)
│   ├── auth-store.ts
│   └── ui-store.ts
└── lib/
    ├── api-client.ts          # Axios/fetch wrapper
    └── query-keys.ts          # TanStack Query key factory
```

## Process

### Step 1: API Client Setup

Create a centralized API client with request/response interceptors:

```typescript
// lib/api-client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Step 2: Data Fetching with TanStack Query

#### Query Key Factory

```typescript
// lib/query-keys.ts
export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (filters?: UserFilters) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: (filters?: PostFilters) => ['posts', 'list', filters] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
  },
};
```

#### Query and Mutation Hooks

```typescript
// features/users/hooks/useUsers.ts
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => userService.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}
```

#### Provider Setup

```tsx
// app/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, retry: 1, refetchOnWindowFocus: false },
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### Step 3: State Management with Zustand

```typescript
// stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

### Step 4: Optimistic Updates

```typescript
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.delete,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previous = queryClient.getQueryData(queryKeys.users.list());
      queryClient.setQueryData(queryKeys.users.list(), (old: User[] | undefined) =>
        old?.filter((user) => user.id !== deletedId)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKeys.users.list(), context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}
```

### Step 5: Form Handling with react-hook-form + Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export function CreateUserForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
  });
  const createUser = useCreateUser();

  return (
    <form onSubmit={handleSubmit((data) => createUser.mutate(data, {
      onSuccess: () => { reset(); onSuccess?.(); },
    }))} className="space-y-4">
      <FormField label="Email" error={errors.email?.message} required>
        <Input type="email" {...register('email')} />
      </FormField>
      <FormField label="Name" error={errors.name?.message} required>
        <Input {...register('name')} />
      </FormField>
      <Button type="submit" isLoading={createUser.isPending}>Create User</Button>
    </form>
  );
}
```

### Step 6: Error and Loading States

```tsx
// components/patterns/AsyncState.tsx
interface AsyncStateProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  children: (data: T) => React.ReactNode;
}

export function AsyncState<T>({ data, isLoading, error, children }: AsyncStateProps<T>) {
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data || (Array.isArray(data) && data.length === 0)) return <EmptyState />;
  return <>{children(data)}</>;
}
```

## Level-wise Application

| Level | Integration Scope |
|-------|------------------|
| Starter | Static pages with no API; content hardcoded or from CMS |
| Dynamic | Full API integration with TanStack Query, Zustand, form validation |
| Enterprise | Multi-service integration, real-time (WebSocket/SSE), optimistic updates, complex caching |

## Integration Patterns

See `references/integration-patterns.md` for detailed patterns:
- Data fetching strategy matrix (server-side, client-side, optimistic, real-time)
- Loading state pattern with skeletons
- Form handling with react-hook-form + Zod
- Route protection middleware
- Toast notification store

## PDCA Application

- **Plan**: Map every page to its API endpoints and state requirements
- **Design**: Define data flow diagrams and state structure
- **Do**: Implement pages with API integration, one feature at a time
- **Check**: Test all user flows end-to-end; verify error states
- **Act**: Fix issues, optimize performance, proceed to Phase 7

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Fetching in useEffect | Use TanStack Query for all server state |
| Global state for server data | Server state belongs in TanStack Query cache |
| No loading states | Always handle loading, error, and empty states |
| Missing error boundaries | Add error.tsx in every route segment |
| No optimistic updates | Use for delete/toggle operations for instant feedback |
| Prop drilling | Use Zustand stores or React Context for shared state |

## Output Location

```
docs/02-design/
└── integration-spec.md        # Integration specifications
src/features/                  # Feature modules with hooks and services
src/stores/                    # Zustand stores
src/lib/api-client.ts          # API client
```

## Next Phase

When integration is complete, proceed to **$phase-7-seo-security** to optimize for search engines and harden security.
