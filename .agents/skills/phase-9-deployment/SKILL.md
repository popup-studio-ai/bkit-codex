---
name: phase-9-deployment
description: |
  Phase 9: Deployment & CI/CD. Set up production deployment, CI/CD pipelines,
  monitoring, and operational readiness.
  Triggers: deployment, CI/CD, production, release, monitoring, hosting,
  배포, CI/CD, デプロイ, 部署, despliegue, déploiement, Bereitstellung, distribuzione
  Do NOT use for: API implementation (use $phase-4-api), code review (use $phase-8-review).
---

# Phase 9: Deployment & CI/CD

> Set up production deployment, CI/CD pipelines, monitoring, and operational readiness.

## Purpose

Phase 9 takes the reviewed and approved codebase to production. This phase covers deployment platform selection, CI/CD pipeline configuration, environment management, monitoring, logging, and rollback strategies. A well-configured deployment pipeline ensures reliable, repeatable, and safe releases.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `start` | Begin Phase 9 | `$phase-9-deployment start` |
| `platform` | Choose deployment platform | `$phase-9-deployment platform` |
| `ci-cd` | Set up CI/CD pipeline | `$phase-9-deployment ci-cd` |
| `monitoring` | Configure monitoring | `$phase-9-deployment monitoring` |
| `release` | Execute production release | `$phase-9-deployment release` |
| `rollback` | Execute rollback procedure | `$phase-9-deployment rollback` |

## Deliverables

1. **Deployment Configuration** - Platform-specific config files
2. **CI/CD Pipeline** - GitHub Actions workflows (lint, test, build, deploy)
3. **Environment Management** - Env variable setup per environment
4. **Monitoring & Logging** - Application monitoring and error tracking
5. **Rollback Strategy** - Documented rollback procedures
6. **Operational Runbook** - Incident response and maintenance procedures

```
.github/
├── workflows/
│   ├── ci.yml                 # Lint, type-check, test on PR
│   ├── deploy-staging.yml     # Deploy to staging on merge to develop
│   └── deploy-production.yml  # Deploy to production on release
├── CODEOWNERS                 # Code ownership
└── pull_request_template.md   # PR template
docker/                        # Docker configuration (Enterprise)
├── Dockerfile
├── docker-compose.yml
└── docker-compose.prod.yml
docs/04-deploy/
├── deployment-guide.md        # Deployment procedures
├── environment-vars.md        # Environment variable reference
├── monitoring-setup.md        # Monitoring configuration
└── runbook.md                 # Operational runbook
```

## Process

### Step 1: Choose Deployment Platform

| Criteria | Vercel | Netlify | AWS ECS/EKS | Railway | Fly.io |
|----------|--------|---------|-------------|---------|--------|
| Best for | Next.js | Static/JAMstack | Enterprise | Full-stack | Global edge |
| Complexity | Low | Low | High | Low | Medium |
| Scaling | Auto | Auto | Manual/Auto | Auto | Auto |
| Cost | Free tier | Free tier | Pay-as-you-go | Usage-based | Usage-based |
| Preview deploys | Yes | Yes | Manual | Yes | Yes |

### Step 2: CI/CD Pipeline (GitHub Actions)

#### CI Pipeline (Pull Requests)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main, develop]
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
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
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm test -- --coverage
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci && npm run build
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
```

#### Deploy to Production

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production
on:
  release:
    types: [published]
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci && npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ vars.API_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Step 3: Environment Management

| Environment | Branch | Purpose | URL |
|-------------|--------|---------|-----|
| Development | feature/* | Local development | localhost:3000 |
| Preview | PR branches | PR review | pr-{number}.preview.example.com |
| Staging | develop | Pre-production testing | staging.example.com |
| Production | main | Live application | example.com |

#### Environment Variables Reference

| Variable | Required | Secret | Description |
|----------|----------|--------|-------------|
| NEXT_PUBLIC_APP_URL | Yes | No | Public app URL |
| NEXT_PUBLIC_API_URL | Yes | No | API base URL |
| DATABASE_URL | Yes | Yes | Database connection string |
| AUTH_SECRET | Yes | Yes | JWT signing secret |
| SENTRY_DSN | No | No | Error tracking DSN |

### Step 4: Docker Configuration (Enterprise)

```dockerfile
FROM node:20-alpine AS base
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### Step 5: Monitoring and Logging

#### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/nextjs';
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

#### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'ok', timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown',
    checks: { database: await checkDatabase() },
  };
  return NextResponse.json(health, { status: health.checks.database === 'ok' ? 200 : 503 });
}
```

#### Structured Logging

```typescript
import pino from 'pino';
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'my-app', env: process.env.NODE_ENV },
});
```

### Step 6: Rollback Strategy

| Platform | Rollback Method |
|----------|----------------|
| Vercel/Netlify | Dashboard -> Deployments -> Promote previous deployment |
| Docker/K8s | `kubectl rollout undo deployment/my-app` |
| Database | Create forward migration to undo changes (never auto-rollback migrations) |

## Deployment Checklist

- [ ] All Phase 8 review issues resolved
- [ ] CI pipeline passing (lint, test, build, security)
- [ ] Environment variables configured for target environment
- [ ] Database migrations applied and tested
- [ ] Health check endpoint operational
- [ ] Error tracking configured (Sentry or equivalent)
- [ ] Monitoring dashboards set up
- [ ] SSL/TLS certificate active
- [ ] Custom domain configured and verified
- [ ] Rollback procedure documented and tested
- [ ] On-call or incident response plan in place

## Level-wise Application

| Level | Platform | CI/CD | Monitoring |
|-------|----------|-------|------------|
| Starter | Vercel or Netlify (zero-config) | GitHub Actions: lint + build | Vercel Analytics |
| Dynamic | Vercel + BaaS (Supabase/PlanetScale) | GitHub Actions: lint + test + build + deploy | Sentry + Vercel Analytics |
| Enterprise | AWS ECS/EKS or self-hosted K8s | Full CI/CD: lint + test + build + security + staging + production | Sentry + Datadog/Grafana + PagerDuty |

## Deployment Patterns

See `references/deployment-guide.md` for detailed patterns:
- Platform comparison matrix
- CI/CD pipeline templates
- Docker multi-stage build patterns
- Monitoring and alerting setup

## PDCA Application

- **Plan**: Select deployment platform, define pipeline stages
- **Design**: Configure CI/CD workflows and environment strategy
- **Do**: Deploy to staging, run smoke tests, deploy to production
- **Check**: Monitor health checks, error rates, performance metrics
- **Act**: Fix issues, optimize pipeline, document runbook

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| No staging environment | Always test on staging before production |
| Secrets in code or CI logs | Use GitHub Secrets, never echo secrets |
| No health check endpoint | Implement /api/health for every service |
| No rollback plan | Document and test rollback before first release |
| Manual deployments | Automate everything with CI/CD |
| No monitoring | Set up error tracking and uptime monitoring from day one |
| Skipping database backup | Automate daily backups with retention policy |

## Output Location

```
.github/workflows/             # CI/CD pipeline definitions
docker/                        # Docker configuration (Enterprise)
docs/04-deploy/
├── deployment-guide.md
├── environment-vars.md
├── monitoring-setup.md
└── runbook.md
```

## Post-Deployment

After successful production deployment:
1. **Verify** - Run smoke tests on production
2. **Monitor** - Watch error rates for 24 hours
3. **Communicate** - Notify stakeholders of release
4. **Document** - Update changelog and release notes
5. **Iterate** - Return to Phase 1 for next feature cycle
