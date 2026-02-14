# Integration Patterns Reference

## Data Fetching with TanStack Query

### Basic Query
```typescript
function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => apiClient.get<PaginatedResponse<User>>('/api/users', { params: filters }),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });
}
```

### Dependent Queries
```typescript
function useUserPosts(userId: string) {
  return useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => apiClient.get<Post[]>(`/api/users/${userId}/posts`),
    enabled: !!userId,  // Only fetch when userId exists
  });
}
```

### Infinite Query (Infinite Scroll)
```typescript
function useInfiniteUsers() {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<PaginatedResponse<User>>('/api/users', { params: { page: pageParam } }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}
```

## Mutation Patterns

### Basic Mutation with Cache Update
```typescript
function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostInput) =>
      apiClient.post<Post>('/api/posts', data),
    onSuccess: (newPost) => {
      // Add to existing list cache
      queryClient.setQueryData<Post[]>(['posts'], (old) =>
        old ? [newPost, ...old] : [newPost]
      );
    },
  });
}
```

### Optimistic Update
```typescript
function useToggleLike(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/api/posts/${postId}/like`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['posts', postId] });
      const previous = queryClient.getQueryData<Post>(['posts', postId]);
      queryClient.setQueryData<Post>(['posts', postId], (old) =>
        old ? { ...old, isLiked: !old.isLiked, likeCount: old.likeCount + (old.isLiked ? -1 : 1) } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['posts', postId], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
    },
  });
}
```

## State Management (Zustand)

### Auth Store
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { user, access_token } = await apiClient.post('/api/auth/login', { email, password });
        set({ user, token: access_token });
      },
      logout: () => {
        apiClient.post('/api/auth/logout').catch(() => {});
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'auth-storage', partialize: (state) => ({ token: state.token }) }
  )
);
```

### UI Store (Non-persistent)
```typescript
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
```

## Form Handling

### React Hook Form + Zod
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short').max(100),
  password: z.string().min(8, 'Password must be 8+ characters'),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

function CreateUserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
  });
  const createUser = useCreateUser();

  return (
    <form onSubmit={handleSubmit((data) => createUser.mutate(data))}>
      <Input {...register('email')} error={errors.email?.message} />
      <Input {...register('name')} error={errors.name?.message} />
      <Input {...register('password')} type="password" error={errors.password?.message} />
      <Button type="submit" loading={createUser.isPending}>Create</Button>
    </form>
  );
}
```

## Error Handling

### Global Error Boundary
```typescript
'use client';
export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-gray-500">{error.message}</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
```

### API Error Handler
```typescript
class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

// In query client config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 3;
      },
    },
  },
});
```

## Loading Patterns

### Skeleton Loading
```typescript
function UserCardSkeleton() {
  return (
    <Card>
      <div className="animate-pulse space-y-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
    </Card>
  );
}

function UserList() {
  const { data, isLoading } = useUsers();
  if (isLoading) return Array(3).fill(0).map((_, i) => <UserCardSkeleton key={i} />);
  return data?.map((user) => <UserCard key={user.id} user={user} />);
}
```
