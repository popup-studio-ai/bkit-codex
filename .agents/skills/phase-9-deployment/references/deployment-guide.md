# Deployment Guide Reference

## Vercel Deployment (Recommended for Next.js)

### Setup
```bash
npm i -g vercel
vercel login
vercel link
```

### Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

### Environment Variables
```bash
# Add secrets via CLI
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production

# Or via dashboard: Settings > Environment Variables
```

### Deploy Commands
```bash
vercel              # Deploy to preview
vercel --prod       # Deploy to production
vercel rollback     # Rollback to previous deployment
```

## Docker Deployment

### Multi-stage Build (Optimized)
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  app:
    build: .
    restart: unless-stopped
    ports: ["3000:3000"]
    env_file: .env.production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      db: { condition: service_healthy }

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}

volumes:
  postgres_data:
```

## GitHub Actions CI/CD

### Complete CI Pipeline
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: echo "Deploy to staging environment"

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: echo "Deploy to production environment"
```

## Rollback Strategy

### Vercel
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>

# Or promote a previous preview to production
vercel promote <deployment-url>
```

### Docker
```bash
# Tag releases
docker tag myapp:latest myapp:v1.2.3

# Rollback by running previous tag
docker compose down
docker compose up -d --pull never myapp:v1.2.2
```

### Database Rollback
```bash
# Revert last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Or with raw SQL
psql -f rollback-v1.2.3.sql
```

## Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || 'unknown',
  };

  // Add database check
  try {
    await db.raw('SELECT 1');
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

## Monitoring Setup

### Essential Metrics
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- CPU and memory usage
- Database connection pool usage
- Active users / requests per second

### Recommended Tools
| Tool | Purpose | Free Tier |
|------|---------|-----------|
| Vercel Analytics | Web Vitals, page views | Yes |
| Sentry | Error tracking | 5K events/mo |
| Uptime Robot | Uptime monitoring | 50 monitors |
| LogTail | Log aggregation | 1GB/mo |

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds with no warnings
- [ ] Environment variables set for target environment
- [ ] Database migrations applied
- [ ] Health check endpoint working
- [ ] SSL certificate valid
- [ ] DNS records configured
- [ ] CDN cache invalidation planned
- [ ] Rollback procedure documented
- [ ] Team notified of deployment window
