---
name: bkend-quickstart
description: |
  bkend.ai BaaS quick start guide. Project setup, MCP connection, and first API call.
  Get started with bkend.ai backend-as-a-service in minutes.
  Triggers: bkend setup, bkend start, BaaS setup, backend setup, first project,
  bkend 시작, bkend 설정, 백엔드 설정, bkend開始, bkendセットアップ,
  bkend开始, bkend设置, empezar bkend, demarrer bkend, bkend starten, iniziare bkend
  Do NOT use for: auth details (use $bkend-auth), data modeling (use $bkend-data).
---

# bkend.ai Quick Start

> Get your backend running in 5 minutes with bkend.ai BaaS.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `setup` | Initial project setup | `$bkend-quickstart setup` |
| `connect` | Connect MCP server | `$bkend-quickstart connect` |
| `test` | Verify connection | `$bkend-quickstart test` |

## Step 1: Create bkend.ai Project

1. Go to bkend.ai dashboard
2. Click "New Project"
3. Enter project name
4. Copy your **Project ID** and **API URL**

## Step 2: Environment Setup

```bash
# Create .env.local
NEXT_PUBLIC_BKEND_API_URL=https://api.bkend.ai/v1
NEXT_PUBLIC_BKEND_PROJECT_ID=your-project-id
NEXT_PUBLIC_BKEND_ENV=dev
```

## Step 3: Install Client

```bash
npm install @bkend/client
# Or use the built-in fetch wrapper (see references/bkend-patterns.md)
```

## Step 4: Create API Client

```typescript
// lib/bkend.ts
const API_BASE = process.env.NEXT_PUBLIC_BKEND_API_URL!;
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
```

## Step 5: Test Connection

```bash
# Test with curl
curl -s https://api.bkend.ai/v1/health \
  -H "x-project-id: your-project-id" | jq .
```

## Step 6: Connect MCP (for Codex)

```json
// .codex/mcp.json
{
  "servers": {
    "bkend": {
      "command": "npx",
      "args": ["@bkend/mcp-server"],
      "env": {
        "BKEND_PROJECT_ID": "your-project-id"
      }
    }
  }
}
```

## What's Next?

- **$bkend-data**: Create tables and manage data
- **$bkend-auth**: Add authentication
- **$bkend-storage**: Handle file uploads
- **$bkend-cookbook**: Follow step-by-step tutorials

## Reference

See `references/bkend-patterns.md` for complete API patterns and code examples.
