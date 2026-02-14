# Review Checklist Reference

## Code Review Checklist

### General Quality
- [ ] Code is readable without excessive comments
- [ ] Variable/function names are self-documenting
- [ ] No dead code or commented-out code blocks
- [ ] DRY principle followed (no copy-paste duplication)
- [ ] Functions do one thing (Single Responsibility)
- [ ] Maximum function length: 50 lines
- [ ] Maximum file length: 300 lines
- [ ] Consistent formatting (ESLint + Prettier pass)

### TypeScript Specific
- [ ] Strict mode enabled in tsconfig.json
- [ ] No `any` types (use `unknown` if needed)
- [ ] Interfaces/types defined for all data shapes
- [ ] Generics used appropriately (not over-engineered)
- [ ] Null/undefined handled with optional chaining or guards
- [ ] Enums or union types for fixed value sets

### React Specific
- [ ] Components are focused and reusable
- [ ] Props are properly typed with interfaces
- [ ] `key` prop used correctly in lists (not array index)
- [ ] useEffect cleanup functions prevent memory leaks
- [ ] useMemo/useCallback used only when necessary
- [ ] No state updates on unmounted components
- [ ] Error boundaries in place for error-prone areas
- [ ] Loading and error states handled for all async data

### API & Data
- [ ] API responses validated before use
- [ ] Error responses handled gracefully
- [ ] Loading states shown during data fetching
- [ ] Pagination implemented for list endpoints
- [ ] Cache invalidation strategy defined
- [ ] Optimistic updates used where appropriate
- [ ] Request/response types match API contract

### Authentication & Authorization
- [ ] Protected routes redirect unauthenticated users
- [ ] Token refresh flow handles expired tokens
- [ ] Logout clears all stored credentials
- [ ] API calls include proper auth headers
- [ ] Role-based access enforced on frontend AND backend
- [ ] CSRF protection on state-changing operations

## Architecture Review Checklist

### Project Structure
- [ ] Clear separation: pages, components, hooks, lib, types
- [ ] Feature-based organization (not type-based)
- [ ] No circular dependencies between modules
- [ ] Shared utilities properly extracted
- [ ] Configuration centralized (not scattered)

### Data Flow
- [ ] Unidirectional data flow maintained
- [ ] Global state minimized (prefer local + server state)
- [ ] Props drilling limited (max 2-3 levels)
- [ ] Context used for cross-cutting concerns only
- [ ] Server state managed with TanStack Query (not local state)

### API Architecture
- [ ] RESTful conventions followed
- [ ] Consistent error response format
- [ ] API versioning implemented
- [ ] Rate limiting configured
- [ ] Request validation on server side
- [ ] Response serialization consistent

### Database
- [ ] Schema matches Phase 1 definitions
- [ ] Indexes defined for query patterns
- [ ] Migrations versioned and reversible
- [ ] Connection pooling configured
- [ ] Soft delete implemented where needed
- [ ] Audit trail for sensitive data

## Performance Checklist

### Frontend Performance
- [ ] Lighthouse Performance score > 90
- [ ] LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] JavaScript bundle < 200KB (initial load)
- [ ] Code splitting for routes (lazy loading)
- [ ] Images: WebP format, proper sizes, lazy loaded
- [ ] Fonts: preloaded, font-display: swap
- [ ] No layout shifts from dynamic content

### Backend Performance
- [ ] API response time < 200ms (p95)
- [ ] Database query time < 50ms (p95)
- [ ] No N+1 query problems
- [ ] Proper database indexing
- [ ] Connection pooling active
- [ ] Response compression (gzip/brotli)
- [ ] CDN configured for static assets

### Caching
- [ ] Browser caching headers set for static assets
- [ ] API responses cached where appropriate
- [ ] Cache invalidation strategy documented
- [ ] Redis/in-memory cache for frequent queries
- [ ] Stale-while-revalidate for non-critical data

## Review Report Template

```markdown
# Code Review Report

## Summary
- Files reviewed: XX
- Issues found: XX (Critical: X, Major: X, Minor: X)
- Recommendation: Approve / Request Changes / Block

## Critical Issues
1. [File:Line] Description - Impact - Fix suggestion

## Major Issues
1. [File:Line] Description - Impact - Fix suggestion

## Minor Issues / Suggestions
1. [File:Line] Description - Suggestion

## Positive Highlights
1. Well-implemented: [description]

## Action Items
- [ ] Fix critical issue #1
- [ ] Fix major issues
- [ ] Address minor issues (optional)
```

## Severity Definitions

| Severity | Description | Action |
|----------|------------|--------|
| Critical | Security vulnerability, data loss risk, crash | Must fix before merge |
| Major | Bug, performance issue, broken feature | Should fix before merge |
| Minor | Style issue, naming, optimization opportunity | Can fix later |
| Suggestion | Enhancement idea, alternative approach | Optional |
