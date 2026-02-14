# Naming Conventions Reference

## Code Naming Rules

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `UserProfile`, `LoginForm`, `DashboardCard` |
| Functions | camelCase | `getUserById()`, `handleSubmit()`, `formatDate()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL`, `DEFAULT_TIMEOUT` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse`, `AuthState` |
| Enums | PascalCase (type) | `type Status = 'active' \| 'inactive'` |
| Files (component) | PascalCase.tsx | `UserProfile.tsx`, `LoginForm.tsx` |
| Files (utility) | camelCase.ts | `formatDate.ts`, `apiClient.ts` |
| Files (config) | kebab-case | `next.config.js`, `tailwind.config.js` |
| Folders | kebab-case | `user-profile/`, `auth-provider/` |
| CSS Classes | kebab-case | `main-container`, `nav-item` |
| Environment Vars | UPPER_SNAKE_CASE | `DATABASE_URL`, `AUTH_SECRET` |

## Import Order

```typescript
// 1. External libraries
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports
import { Button } from '@/components/ui';
import { userService } from '@/services/user';

// 3. Relative imports
import { useLocalState } from './hooks';

// 4. Type imports
import type { User } from '@/types';

// 5. Styles
import './styles.css';
```

## Environment Variable Prefixes

| Prefix | Purpose | Scope | Example |
|--------|---------|-------|---------|
| `NEXT_PUBLIC_` | Client-side accessible | Browser | `NEXT_PUBLIC_API_URL` |
| `DB_` | Database connections | Server only | `DB_HOST`, `DB_PASSWORD` |
| `API_` | External API keys | Server only | `API_STRIPE_SECRET` |
| `AUTH_` | Authentication secrets | Server only | `AUTH_SECRET` |
