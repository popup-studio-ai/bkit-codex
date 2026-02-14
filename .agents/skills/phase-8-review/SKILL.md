---
name: phase-8-review
description: |
  Phase 8: Code Review & Architecture Review. Comprehensive review of code quality,
  architecture compliance, performance, and security.
  Triggers: code review, architecture review, review, quality check,
  코드 리뷰, 아키텍처, コードレビュー, 代码审查, revisión de código,
  revue de code, Code-Review, revisione del codice
  Do NOT use for: initial design (use $phase-3-mockup), deployment (use $phase-9-deployment).
  Next: $phase-9-deployment
---

# Phase 8: Code Review & Architecture Review

> Comprehensive review of code quality, architecture compliance, and production readiness.

## Purpose

Phase 8 is the quality gate before deployment. Every line of code, every architectural decision, and every security measure is reviewed systematically. This phase catches issues that are exponentially more expensive to fix after deployment. No code should reach production without passing this review.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `start` | Begin Phase 8 review | `$phase-8-review start` |
| `code` | Run code quality review | `$phase-8-review code` |
| `architecture` | Run architecture review | `$phase-8-review architecture` |
| `performance` | Run performance review | `$phase-8-review performance` |
| `security` | Run security review | `$phase-8-review security` |
| `a11y` | Run accessibility review | `$phase-8-review a11y` |
| `full` | Run all reviews | `$phase-8-review full` |

## Deliverables

1. **Code Quality Report** - Linting results, type coverage, test coverage
2. **Architecture Compliance Report** - Structure validation against conventions
3. **Performance Audit** - Lighthouse scores, bundle analysis, query optimization
4. **Security Audit** - OWASP compliance, dependency vulnerabilities, secret scan
5. **Accessibility Report** - WCAG AA compliance, screen reader testing
6. **Review Summary** - Consolidated findings with severity and remediation

```
docs/03-review/
├── code-quality-report.md     # Code quality findings
├── architecture-review.md     # Architecture compliance
├── performance-audit.md       # Performance analysis
├── security-audit.md          # Security findings
├── accessibility-report.md    # Accessibility compliance
└── review-summary.md          # Consolidated review summary
```

## Process

### Step 1: Code Quality Review

#### Naming Conventions Checklist

- [ ] Components: PascalCase (UserCard, LoginForm)
- [ ] Hooks: camelCase with 'use' prefix (useAuth, useUsers)
- [ ] Utilities: camelCase (formatDate, parseQuery)
- [ ] Constants: UPPER_SNAKE_CASE (API_BASE_URL, MAX_RETRIES)
- [ ] Types/Interfaces: PascalCase (User, CreateUserDTO)
- [ ] Files: kebab-case for utilities, PascalCase for components
- [ ] API routes: kebab-case (/api/user-profiles)
- [ ] Database: snake_case (user_profiles, created_at)

#### Code Structure Checklist

- [ ] Feature-based folder organization
- [ ] No circular dependencies
- [ ] Single responsibility per file (< 200 lines ideal)
- [ ] Proper barrel exports (index.ts)
- [ ] No unused imports or dead code
- [ ] Consistent import ordering (external -> internal -> relative)

#### TypeScript Quality Checklist

- [ ] No 'any' types (use 'unknown' or proper types)
- [ ] No type assertions (as) without justification
- [ ] All function parameters typed
- [ ] Return types on public functions
- [ ] Zod schemas match TypeScript types
- [ ] No non-null assertions (!) without safety check

#### Error Handling Checklist

- [ ] All async operations wrapped in try/catch
- [ ] API errors return appropriate HTTP status codes
- [ ] Error messages are user-friendly (no stack traces in production)
- [ ] Error boundaries at route segment level
- [ ] Network errors handled with retry logic

### Step 2: Architecture Compliance Review

- [ ] Folder structure matches Phase 2 convention spec
- [ ] Data flow follows defined patterns (server -> client)
- [ ] State management follows guidelines (server state in TanStack Query, client state in Zustand)
- [ ] API layer properly abstracted (services -> hooks -> components)
- [ ] No business logic in UI components
- [ ] Proper use of Server vs Client Components (Next.js)
- [ ] Environment variables properly managed (.env.example exists)

#### Dependency Review

- [ ] No unnecessary dependencies (check bundle impact)
- [ ] No duplicate functionality (e.g., both axios and fetch wrappers)
- [ ] All dependencies pinned to specific versions
- [ ] No deprecated packages
- [ ] License compatibility verified

### Step 3: Performance Review

#### Frontend Performance Checklist

- [ ] Lighthouse Performance score >= 90
- [ ] Bundle size under budget (main < 200KB gzipped)
- [ ] Images optimized (next/image, WebP/AVIF format)
- [ ] Fonts preloaded and using font-display: swap
- [ ] Code splitting on route boundaries
- [ ] Dynamic imports for heavy components
- [ ] No layout shifts (CLS < 0.1)
- [ ] Memoization where appropriate (useMemo, useCallback)

#### Backend Performance Checklist

- [ ] Database queries optimized (N+1 queries eliminated)
- [ ] Proper indexing on frequently queried columns
- [ ] API response times < 200ms for common operations
- [ ] Pagination implemented for list endpoints
- [ ] Caching strategy defined (Redis / in-memory / CDN)

### Step 4: Security Review

- [ ] All OWASP Top 10 mitigations verified (from Phase 7)
- [ ] Security headers present and correct
- [ ] No secrets in codebase (run secret scanner)
- [ ] Authentication flow secure (token rotation, secure storage)
- [ ] Authorization checks on every protected endpoint
- [ ] Input validation on all API endpoints (server-side)
- [ ] Dependency vulnerabilities patched (npm audit)
- [ ] Error responses do not leak internal details

### Step 5: Accessibility Review (WCAG AA)

- [ ] All images have descriptive alt text
- [ ] Color contrast ratio >= 4.5:1 (text), >= 3:1 (large text)
- [ ] All interactive elements keyboard accessible
- [ ] Focus order is logical and visible
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Page structure uses semantic HTML (nav, main, article, aside)
- [ ] Touch targets >= 44x44px on mobile

### Step 6: Review Severity Classification

| Severity | Definition | Action Required |
|----------|-----------|-----------------|
| Critical | Security vulnerability or data loss risk | Must fix before deployment |
| High | Significant bug or performance issue | Must fix before deployment |
| Medium | Code quality or minor UX issue | Should fix, may defer |
| Low | Style inconsistency or minor improvement | Nice to have |
| Info | Suggestion for future improvement | Document for backlog |

### Step 7: Review Summary Template

```markdown
# Review Summary - [Project Name]
Date: YYYY-MM-DD
## Overall Assessment: [PASS / CONDITIONAL PASS / FAIL]

## Scores
| Category | Score | Status |
|----------|-------|--------|
| Code Quality | X/10 | Pass/Fail |
| Architecture | X/10 | Pass/Fail |
| Performance | X/10 | Pass/Fail |
| Security | X/10 | Pass/Fail |
| Accessibility | X/10 | Pass/Fail |

## Critical Issues (must fix)
1. [Issue description and remediation]

## Recommendations
1. [Future improvement suggestions]
```

## Level-wise Application

| Level | Review Scope |
|-------|-------------|
| Starter | Code quality basics: naming, structure, no dead code |
| Dynamic | Full review: code quality + performance + security + accessibility |
| Enterprise | Full review + load testing + penetration testing + compliance audit |

## Review Patterns

See `references/review-checklist.md` for detailed checklists:
- Code quality review checklist
- Architecture compliance matrix
- Performance benchmarks
- Security audit procedures

## PDCA Application

- **Plan**: Define review scope and criteria
- **Design**: Prepare review checklists and tools
- **Do**: Execute all review categories systematically
- **Check**: Consolidate findings and assign severity
- **Act**: Fix critical/high issues, document medium/low for backlog, proceed to Phase 9

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Skipping review phase | Budget review time into every sprint |
| Only reviewing code style | Review architecture, performance, security, and accessibility too |
| No severity classification | Use Critical/High/Medium/Low/Info to prioritize fixes |
| Reviewing too late | Review incrementally throughout development |
| Ignoring accessibility | Include a11y in every review; it is not optional |
| No automated checks | Set up linting, type checking, and testing in CI |

## Output Location

```
docs/03-review/
├── code-quality-report.md
├── architecture-review.md
├── performance-audit.md
├── security-audit.md
├── accessibility-report.md
└── review-summary.md
```

## Next Phase

When all critical and high issues are resolved, proceed to **$phase-9-deployment** for production deployment and CI/CD setup.
