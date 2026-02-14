---
name: phase-7-seo-security
description: |
  Phase 7: SEO & Security. Implement search engine optimization, security hardening,
  and OWASP Top 10 compliance.
  Triggers: SEO, security, OWASP, XSS, CSRF, meta tags, sitemap,
  보안, 검색엔진, セキュリティ, SEO, 安全, SEO,
  seguridad, sécurité, Sicherheit, sicurezza
  Do NOT use for: API auth design (use $phase-4-api), deployment (use $phase-9-deployment).
  Next: $phase-8-review
---

# Phase 7: SEO & Security Hardening

> Optimize for search engines and harden application security before production.

## Purpose

Phase 7 ensures the application is discoverable by search engines and protected against common security vulnerabilities. This phase must be completed before any production deployment. SEO drives organic traffic; security protects your users and data.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `start` | Begin Phase 7 | `$phase-7-seo-security start` |
| `seo` | Implement SEO optimizations | `$phase-7-seo-security seo` |
| `security` | Implement security hardening | `$phase-7-seo-security security` |
| `audit` | Run SEO and security audit | `$phase-7-seo-security audit` |
| `checklist` | Review compliance checklist | `$phase-7-seo-security checklist` |

## Deliverables

1. **Meta Tags Configuration** - Title, description, Open Graph, Twitter Cards per page
2. **Sitemap & Robots** - Dynamic sitemap.xml and robots.txt
3. **Structured Data** - JSON-LD schemas (Organization, Article, Product, BreadcrumbList)
4. **Security Headers** - CSP, HSTS, X-Frame-Options, X-Content-Type-Options
5. **Input Validation** - Server-side validation on all endpoints
6. **OWASP Compliance** - Top 10 vulnerability assessment and mitigation
7. **Accessibility Audit** - WCAG AA compliance report

```
src/
├── app/
│   ├── layout.tsx             # Root metadata and security headers
│   ├── robots.ts              # Robots.txt generation
│   ├── sitemap.ts             # Sitemap generation
│   └── manifest.ts            # Web app manifest
├── middleware.ts               # Security headers middleware
└── lib/
    ├── metadata.ts            # Shared metadata helpers
    └── sanitize.ts            # Input sanitization utilities
docs/02-design/
├── seo-spec.md                # SEO strategy document
└── security-spec.md           # Security specifications
```

## SEO Process

### Step 1: Meta Tags

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: { default: 'My App - Tagline', template: '%s | My App' },
  description: 'Application description for search engines (150-160 chars).',
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  openGraph: {
    type: 'website', locale: 'en_US', url: 'https://example.com',
    siteName: 'My App',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'My App' }],
  },
  twitter: { card: 'summary_large_image', creator: '@handle' },
  robots: { index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};
```

### Step 2: Sitemap & Robots

```tsx
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return [
    { url: 'https://example.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://example.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    ...posts.map((post) => ({
      url: `https://example.com/blog/${post.slug}`,
      lastModified: post.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7,
    })),
  ];
}

// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/_next/'] }],
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```

### Step 3: Structured Data (JSON-LD)

```tsx
export function ArticleJsonLd({ post }: { post: Post }) {
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: post.title, description: post.excerpt, image: post.coverImage,
    datePublished: post.publishedAt, dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author.name },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
```

### Step 4: Core Web Vitals

| Metric | Target | Optimization Strategy |
|--------|--------|----------------------|
| LCP | < 2.5s | Optimize images (next/image), preload fonts, SSR critical pages |
| INP | < 200ms | Code splitting, minimize main thread work, defer non-critical JS |
| CLS | < 0.1 | Set explicit image dimensions, font-display: swap, reserve space |

## Security Process

### Step 5: Security Headers Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const h = response.headers;
  h.set('X-Frame-Options', 'DENY');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  h.set('Content-Security-Policy', [
    "default-src 'self'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: https:",
    "font-src 'self'", "connect-src 'self' https://api.example.com",
    "frame-ancestors 'none'",
  ].join('; '));
  return response;
}
```

### Step 6: OWASP Top 10 Compliance

| # | Vulnerability | Prevention | Implementation |
|---|--------------|------------|----------------|
| A01 | Broken Access Control | Role-based checks on every route and API | Middleware + API guards |
| A02 | Cryptographic Failures | HTTPS everywhere, bcrypt for passwords | TLS, env variables |
| A03 | Injection | Parameterized queries, Zod validation | ORM + schema validation |
| A04 | Insecure Design | Threat modeling, least privilege | Design review in Phase 8 |
| A05 | Security Misconfiguration | Remove defaults, minimal permissions | Middleware + config audit |
| A06 | Vulnerable Components | npm audit, Dependabot | CI pipeline checks |
| A07 | Auth Failures | Rate limiting, MFA, secure sessions | Auth middleware + rate limiter |
| A08 | Data Integrity | Input validation, signed JWTs | Zod + JWT verification |
| A09 | Logging Failures | Structured logging, anomaly alerts | Logger + monitoring |
| A10 | SSRF | URL allowlists, validate user URLs | Input validation |

### Step 7: Input Validation and Sanitization

```typescript
// lib/sanitize.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'] });
}

export const emailSchema = z.string().email().max(255).toLowerCase().trim();
export const nameSchema = z.string().min(2).max(100).trim();
export const urlSchema = z.string().url().max(2048);
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200);
```

## SEO Checklist

- [ ] Title tag on every page (50-60 characters)
- [ ] Meta description on every page (150-160 characters)
- [ ] Open Graph tags (title, description, image, type)
- [ ] Twitter Card tags
- [ ] Canonical URLs set
- [ ] sitemap.xml with all public pages
- [ ] robots.txt with appropriate rules
- [ ] JSON-LD structured data
- [ ] Image alt texts on all images
- [ ] Semantic HTML (h1-h6 hierarchy, nav, main, article)
- [ ] Core Web Vitals passing (LCP < 2.5s, INP < 200ms, CLS < 0.1)

## Security Checklist

- [ ] HTTPS enforced (HSTS header)
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] All user inputs validated server-side (Zod)
- [ ] HTML content sanitized (DOMPurify)
- [ ] SQL injection prevented (parameterized queries/ORM)
- [ ] XSS prevention (React auto-escaping + CSP)
- [ ] CSRF protection (SameSite cookies, CSRF tokens)
- [ ] Rate limiting on auth endpoints
- [ ] Dependencies audited (npm audit)
- [ ] Secrets in environment variables (not in code)
- [ ] CORS properly configured
- [ ] Error messages do not leak implementation details

## Level-wise Application

| Level | SEO Scope | Security Scope |
|-------|-----------|----------------|
| Starter | Basic meta tags, robots.txt | Minimal (static site security) |
| Dynamic | Full SEO + sitemap + JSON-LD + Core Web Vitals | Full OWASP basics, auth security, input validation |
| Enterprise | Full SEO + multi-language + schema.org + analytics | Full OWASP, WAF, penetration testing, SOC2 compliance |

## Security Patterns

See `references/security-checklist.md` for detailed patterns:
- Security headers reference
- OWASP Top 10 prevention matrix
- Input validation patterns
- Dependency audit procedures

## PDCA Application

- **Plan**: Audit current SEO and security posture
- **Design**: Define optimization strategy and security requirements
- **Do**: Implement SEO metadata, security headers, input validation
- **Check**: Run Lighthouse audit, OWASP ZAP scan, dependency audit
- **Act**: Fix identified issues and proceed to Phase 8

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Missing meta descriptions | Add unique descriptions to every page |
| Blocking search engines | Check robots.txt is not blocking public pages |
| Exposing stack traces | Return generic error messages in production |
| Hardcoded secrets | Use environment variables exclusively |
| No rate limiting | Add rate limiting to login and API endpoints |
| Ignoring dependency vulnerabilities | Run npm audit in CI pipeline |

## Output Location

```
docs/02-design/
├── seo-spec.md                # SEO strategy and implementation
└── security-spec.md           # Security specifications and audit results
```

## Next Phase

When SEO and security hardening is complete, proceed to **$phase-8-review** for comprehensive code and architecture review.
