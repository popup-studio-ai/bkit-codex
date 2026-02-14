---
name: bkend-auth
description: |
  bkend.ai authentication guide. Signup, login, JWT tokens, sessions,
  role-based access control, and password management with bkend.ai BaaS.
  Triggers: bkend auth, bkend login, bkend signup, JWT, session, RBAC, password,
  bkend 인증, 로그인, 회원가입, bkend認証, ログイン, 新規登録,
  bkend认证, 登录, 注册, autenticacion bkend, authentification bkend, bkend-Auth
  Do NOT use for: data operations (use $bkend-data), file storage (use $bkend-storage).
---

# bkend.ai Authentication

> Implement user authentication with bkend.ai BaaS.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `setup` | Set up auth | `$bkend-auth setup` |
| `flow` | Auth flow diagram | `$bkend-auth flow` |
| `rbac` | Role-based access | `$bkend-auth rbac` |

## Authentication Flow

```
1. User submits email + password
2. POST /auth/email/signup (new user) or /auth/email/signin (existing)
3. Server returns { user, access_token, refresh_token }
4. Store access_token in memory/localStorage
5. Store refresh_token in httpOnly cookie (secure)
6. Include access_token in Authorization header for API calls
7. When access_token expires -> use refresh_token to get new one
8. On logout -> invalidate tokens
```

## Signup

```typescript
async function handleSignup(email: string, password: string, name: string) {
  const { user, access_token, refresh_token } = await bkend.auth.signup({
    email, password, name,
  });
  localStorage.setItem('bkend_access_token', access_token);
  return user;
}
```

## Login

```typescript
async function handleLogin(email: string, password: string) {
  const { user, access_token, refresh_token } = await bkend.auth.signin({
    email, password,
  });
  localStorage.setItem('bkend_access_token', access_token);
  return user;
}
```

## Get Current User

```typescript
async function getCurrentUser() {
  return bkend.auth.me();  // Uses token from localStorage
}
```

## Logout

```typescript
function handleLogout() {
  bkend.auth.signout().catch(() => {});
  localStorage.removeItem('bkend_access_token');
  localStorage.removeItem('bkend_refresh_token');
  window.location.href = '/login';
}
```

## Token Refresh

```typescript
async function refreshToken() {
  const refreshToken = localStorage.getItem('bkend_refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const { access_token } = await bkend.auth.refresh(refreshToken);
  localStorage.setItem('bkend_access_token', access_token);
  return access_token;
}
```

## Protected Route Component

```typescript
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

## Role-Based Access Control

```typescript
// Check user role
function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== role) return <div>Access denied</div>;
  return <>{children}</>;
}

// Usage
<RequireRole role="admin">
  <AdminDashboard />
</RequireRole>
```

## Login Form Example

```typescript
'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Email" required className="w-full border rounded px-3 py-2" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Password" required className="w-full border rounded px-3 py-2" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={isLoading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50">
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## Reference

See `references/bkend-patterns.md` for the full auth store implementation and advanced patterns.
