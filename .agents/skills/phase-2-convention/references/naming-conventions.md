# Naming Conventions Reference

## File Naming

### React/Next.js Components
```
src/components/
├── UserProfile.tsx          # PascalCase for components
├── UserProfile.test.tsx     # Test file matches component
├── UserProfile.stories.tsx  # Storybook story
└── user-profile.module.css  # kebab-case for styles
```

### Utility Files
```
src/lib/
├── formatDate.ts            # camelCase for utilities
├── apiClient.ts             # camelCase
└── constants.ts             # lowercase for constant files
```

### API Routes (Next.js App Router)
```
src/app/api/
├── users/
│   ├── route.ts             # GET /api/users, POST /api/users
│   └── [id]/
│       └── route.ts         # GET /api/users/:id, PUT, DELETE
├── auth/
│   ├── login/route.ts       # POST /api/auth/login
│   └── register/route.ts    # POST /api/auth/register
```

## Variable Naming

### Boolean Variables
Always prefix with `is`, `has`, `can`, `should`:
```typescript
const isActive = true;
const hasPermission = user.role === 'admin';
const canEdit = hasPermission && isActive;
const shouldRefresh = Date.now() - lastFetch > CACHE_TTL;
```

### Handler Functions
Prefix with `handle` or `on`:
```typescript
const handleSubmit = (e: FormEvent) => { ... };
const handleClick = () => { ... };

interface ButtonProps {
  onClick: () => void;
  onSubmit: (data: FormData) => void;
}
```

### Async Functions
Use verbs: `fetch`, `load`, `get`, `create`, `update`, `delete`:
```typescript
async function fetchUsers(): Promise<User[]> { ... }
async function createPost(data: PostInput): Promise<Post> { ... }
```

### Constants
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;
```

## TypeScript Naming

### Interfaces vs Types
```typescript
// Interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
}

// Types for unions, intersections, utilities
type UserRole = 'admin' | 'user' | 'moderator';
type UserWithPosts = User & { posts: Post[] };
```

### API Response Types
```typescript
interface CreateUserInput { email: string; name: string; password: string; }
interface UserResponse { user: User; token: string; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
```

## Component Naming Patterns

```typescript
// Pages
export default function UsersPage() { ... }
export default function UserDetailPage() { ... }

// Layouts
export default function DashboardLayout({ children }) { ... }

// Features
function UserProfileCard({ user }: { user: User }) { ... }
function PostListItem({ post }: { post: Post }) { ... }

// UI Primitives
function Button({ variant, size, children }: ButtonProps) { ... }
function Input({ label, error, ...props }: InputProps) { ... }
```

## Database Naming (SQL)

```sql
-- Tables: snake_case, plural
CREATE TABLE user_profiles (...);

-- Columns: snake_case
first_name, last_name, created_at, updated_at

-- Foreign keys: singular_table_id
user_id REFERENCES users(id)

-- Junction tables: both table names
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);

-- Indexes: idx_table_column(s)
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

## Git Branch Naming

```
main                    # Production branch
develop                 # Development branch
feature/auth-login      # Feature branch
fix/user-null-error     # Bug fix branch
docs/api-guide          # Documentation branch
```

## Environment Variables

```bash
# Public (client-safe): prefix NEXT_PUBLIC_
NEXT_PUBLIC_API_URL=https://api.example.com

# Private (server-only): no prefix
DATABASE_URL=postgresql://...
JWT_SECRET=...
```
