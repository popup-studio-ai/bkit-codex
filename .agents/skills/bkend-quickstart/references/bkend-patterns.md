# bkend.ai Patterns Reference

## Quick Start

### 1. Create Project
1. Sign up at bkend.ai
2. Create new project
3. Copy Project ID and API URL
4. Configure environment variables

### 2. Environment Setup
```bash
# .env.local
NEXT_PUBLIC_BKEND_API_URL=https://api.bkend.ai/v1
NEXT_PUBLIC_BKEND_PROJECT_ID=your-project-id
NEXT_PUBLIC_BKEND_ENV=dev
```

### 3. API Client
```typescript
// lib/bkend.ts
const API_BASE = process.env.NEXT_PUBLIC_BKEND_API_URL || 'https://api.bkend.ai/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!;

async function bkendFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('bkend_access_token')
    : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-project-id': PROJECT_ID,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new BkendError(res.status, error.message || res.statusText);
  }
  return res.json();
}

class BkendError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'BkendError';
  }
}
```

## Data Operations

### CRUD Operations
```typescript
export const bkend = {
  data: {
    // List with filters
    list: (table: string, params?: Record<string, string>) =>
      bkendFetch(`/data/${table}?${new URLSearchParams(params)}`),

    // Get single record
    get: (table: string, id: string) =>
      bkendFetch(`/data/${table}/${id}`),

    // Create record
    create: (table: string, body: any) =>
      bkendFetch(`/data/${table}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    // Update record
    update: (table: string, id: string, body: any) =>
      bkendFetch(`/data/${table}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    // Delete record
    delete: (table: string, id: string) =>
      bkendFetch(`/data/${table}/${id}`, { method: 'DELETE' }),
  },
};
```

### Query Parameters
```typescript
// Filtering
bkend.data.list('posts', { status: 'published', author_id: userId });

// Sorting
bkend.data.list('posts', { sort: '-created_at' });  // descending

// Pagination
bkend.data.list('posts', { page: '1', limit: '20' });

// Search
bkend.data.list('posts', { search: 'keyword' });

// Combine
bkend.data.list('posts', {
  status: 'published',
  sort: '-created_at',
  page: '1',
  limit: '20',
});
```

## Authentication

### Auth Operations
```typescript
export const bkend = {
  auth: {
    // Email signup
    signup: (body: { email: string; password: string; name?: string }) =>
      bkendFetch('/auth/email/signup', { method: 'POST', body: JSON.stringify(body) }),

    // Email signin
    signin: (body: { email: string; password: string }) =>
      bkendFetch('/auth/email/signin', { method: 'POST', body: JSON.stringify(body) }),

    // Get current user
    me: () => bkendFetch('/auth/me'),

    // Sign out
    signout: () => bkendFetch('/auth/signout', { method: 'POST' }),

    // Refresh token
    refresh: (refreshToken: string) =>
      bkendFetch('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
  },
};
```

### Auth Hook with Zustand
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bkend } from '@/lib/bkend';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { user, access_token, refresh_token } = await bkend.auth.signin({ email, password });
          localStorage.setItem('bkend_access_token', access_token);
          localStorage.setItem('bkend_refresh_token', refresh_token);
          set({ user, token: access_token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const { user, access_token, refresh_token } = await bkend.auth.signup({ email, password, name });
          localStorage.setItem('bkend_access_token', access_token);
          localStorage.setItem('bkend_refresh_token', refresh_token);
          set({ user, token: access_token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        bkend.auth.signout().catch(() => {});
        localStorage.removeItem('bkend_access_token');
        localStorage.removeItem('bkend_refresh_token');
        set({ user: null, token: null });
      },

      checkAuth: async () => {
        try {
          const user = await bkend.auth.me();
          set({ user });
        } catch {
          set({ user: null, token: null });
        }
      },
    }),
    { name: 'auth-storage', partialize: (state) => ({ token: state.token }) }
  )
);
```

## File Storage

### Upload Files
```typescript
export const bkend = {
  storage: {
    // Upload file
    upload: async (file: File, bucket: string = 'default') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const token = localStorage.getItem('bkend_access_token');
      const res = await fetch(`${API_BASE}/storage/upload`, {
        method: 'POST',
        headers: {
          'x-project-id': PROJECT_ID,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,  // No Content-Type header for FormData
      });

      if (!res.ok) throw new Error(await res.text());
      return res.json();  // { url, key, size, contentType }
    },

    // Get presigned URL
    getUrl: (key: string) =>
      bkendFetch(`/storage/url/${key}`),

    // Delete file
    delete: (key: string) =>
      bkendFetch(`/storage/${key}`, { method: 'DELETE' }),

    // List files in bucket
    list: (bucket: string = 'default') =>
      bkendFetch(`/storage/list/${bucket}`),
  },
};
```

### Image Upload Component
```typescript
function ImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const { url } = await bkend.storage.upload(file, 'images');
      onUpload(url);
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="cursor-pointer">
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <div className="border-2 border-dashed rounded-lg p-4 text-center">
        {uploading ? 'Uploading...' : 'Click to upload image'}
      </div>
    </label>
  );
}
```

## MCP Integration

### bkend.ai MCP Server
```json
{
  "servers": {
    "bkend": {
      "command": "npx",
      "args": ["@bkend/mcp-server"],
      "env": {
        "BKEND_API_URL": "https://api.bkend.ai/v1",
        "BKEND_PROJECT_ID": "your-project-id",
        "BKEND_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Available MCP Tools
- `bkend_list_tables` - List all tables
- `bkend_describe_table` - Get table schema
- `bkend_query` - Query data with filters
- `bkend_create` - Create records
- `bkend_update` - Update records
- `bkend_delete` - Delete records

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Validation error | Check request body |
| 401 | Unauthorized | Token expired, re-login |
| 403 | Forbidden | Check user permissions |
| 404 | Not found | Check table name, record ID |
| 409 | Conflict | Duplicate unique field |
| 429 | Rate limited | Reduce request frequency |
| 500 | Server error | Report to bkend.ai support |
