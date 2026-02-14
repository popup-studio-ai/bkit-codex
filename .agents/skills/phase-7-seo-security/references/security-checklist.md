# Security Checklist Reference

## Authentication Security

- [ ] Passwords hashed with bcrypt (cost factor >= 12)
- [ ] JWT access tokens expire in 15 minutes max
- [ ] Refresh tokens stored in httpOnly, Secure, SameSite cookies
- [ ] Failed login attempts are rate-limited (max 5 per minute)
- [ ] Account lockout after 10 consecutive failures
- [ ] Password reset tokens expire in 1 hour
- [ ] Session invalidation on password change
- [ ] No sensitive data in JWT payload (no passwords, SSN, etc.)

## Authorization Security

- [ ] Role-based access control (RBAC) implemented
- [ ] API endpoints check permissions before processing
- [ ] Users cannot access other users' data (IDOR prevention)
- [ ] Admin endpoints require admin role verification
- [ ] File access restricted to authorized users

## Input Validation

- [ ] All user input validated on server side
- [ ] Email format validation
- [ ] String length limits enforced
- [ ] Number range limits enforced
- [ ] File upload type and size validation
- [ ] SQL/NoSQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] Path traversal prevention (sanitize file paths)

## HTTP Security Headers

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 0  (rely on CSP instead)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

## CORS Configuration

- [ ] CORS allows only specific origins (no wildcard in production)
- [ ] Credentials mode properly configured
- [ ] Preflight caching configured (Access-Control-Max-Age)

```typescript
// Correct CORS for production
const allowedOrigins = ['https://yourapp.com', 'https://admin.yourapp.com'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
```

## Data Protection

- [ ] HTTPS enforced everywhere (HSTS enabled)
- [ ] Sensitive data encrypted at rest
- [ ] Database backups encrypted
- [ ] PII (personally identifiable information) minimized
- [ ] Logs do not contain sensitive data (passwords, tokens, PII)
- [ ] Error messages do not expose internal details

## API Security

- [ ] Rate limiting on all public endpoints
- [ ] API keys rotated periodically
- [ ] Unused endpoints removed
- [ ] Request size limits configured
- [ ] File upload limits configured
- [ ] GraphQL query depth limited (if applicable)

## Infrastructure Security

- [ ] Database not publicly accessible
- [ ] Default credentials changed
- [ ] Debug mode disabled in production
- [ ] Source maps not deployed to production
- [ ] Environment variables not committed to git
- [ ] Dependencies regularly updated (npm audit)
- [ ] Container images scanned for vulnerabilities

## SEO Checklist

### Technical SEO
- [ ] Unique title tag per page (50-60 characters)
- [ ] Meta description per page (150-160 characters)
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card meta tags
- [ ] Canonical URLs set
- [ ] XML sitemap generated and submitted
- [ ] robots.txt configured
- [ ] Structured data (JSON-LD) for rich snippets
- [ ] 301 redirects for moved pages

### Performance SEO
- [ ] LCP under 2.5 seconds
- [ ] FID under 100 milliseconds
- [ ] CLS under 0.1
- [ ] Images optimized (WebP, lazy loading)
- [ ] Fonts preloaded
- [ ] JavaScript bundle split and tree-shaken
- [ ] Critical CSS inlined

### Content SEO
- [ ] H1 tag on every page (one per page)
- [ ] Heading hierarchy (H1 > H2 > H3) logical
- [ ] Alt text on all images
- [ ] Internal linking between related pages
- [ ] 404 page with navigation back
- [ ] Breadcrumb navigation

### Mobile SEO
- [ ] Viewport meta tag set
- [ ] Mobile-friendly layout (responsive)
- [ ] Touch targets minimum 48x48px
- [ ] No horizontal scrolling on mobile
- [ ] Text readable without zooming (16px minimum)

## Dependency Security

Run regularly:
```bash
# Node.js
npm audit
npm audit fix

# Check for known vulnerabilities
npx better-npm-audit audit

# Update dependencies
npx npm-check-updates -u
```
