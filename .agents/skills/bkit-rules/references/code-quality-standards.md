# Code Quality Standards Reference

## OWASP Top 10 Checklist

1. **Broken Access Control**: Enforce least privilege, deny by default
2. **Cryptographic Failures**: Use strong encryption, never hardcode secrets
3. **Injection**: Validate all input, use parameterized queries
4. **Insecure Design**: Follow threat modeling, use secure design patterns
5. **Security Misconfiguration**: Remove default credentials, disable unnecessary features
6. **Vulnerable Components**: Keep dependencies updated, audit regularly
7. **Authentication Failures**: Use MFA, strong password policies
8. **Data Integrity Failures**: Verify software updates, use digital signatures
9. **Logging Failures**: Log security events, monitor for anomalies
10. **SSRF**: Validate and sanitize all URLs, use allowlists

## Code Complexity Guidelines

| Metric | Threshold | Action |
|--------|-----------|--------|
| Function length | > 20 lines | Split into smaller functions |
| Nesting depth | > 3 levels | Flatten with early returns |
| Parameters | > 4 params | Use options object |
| Cyclomatic complexity | > 10 | Refactor into simpler logic |
| File length | > 300 lines | Split into modules |

## Error Handling Patterns

```typescript
// Prefer explicit error handling
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  return { success: false, error: 'Operation failed' };
}

// Avoid silent failures
// BAD: catch (e) {}
// GOOD: catch (e) { logger.error(e); throw e; }
```

## Security Checklist

- [ ] No secrets in source code
- [ ] Input validation at system boundaries
- [ ] Output encoding for XSS prevention
- [ ] CSRF tokens for state-changing operations
- [ ] Rate limiting on authentication endpoints
- [ ] Secure session management
- [ ] HTTPS enforcement
- [ ] Content Security Policy headers
