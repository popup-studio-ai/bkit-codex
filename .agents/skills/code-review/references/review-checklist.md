# Code Review Checklist

## Pre-Review Setup

- [ ] Understand the purpose of the change
- [ ] Read related issue/ticket/spec
- [ ] Check the scope of changes (files modified)

## Correctness

- [ ] Logic matches requirements
- [ ] Edge cases handled (null, undefined, empty array, boundary values)
- [ ] Error paths tested and handled
- [ ] Async operations properly awaited
- [ ] Race conditions prevented
- [ ] Cleanup performed (event listeners, timers, subscriptions)

## TypeScript Quality

- [ ] No `any` types without explicit justification
- [ ] Interfaces defined for object shapes
- [ ] Union types used for fixed sets of values
- [ ] Null checks performed before property access
- [ ] Generic types used appropriately
- [ ] Strict mode compliance

## React Quality

- [ ] Components have single responsibility
- [ ] Props interface clearly typed
- [ ] Controlled vs uncontrolled forms consistent
- [ ] useEffect has correct dependency array
- [ ] useEffect includes cleanup function where needed
- [ ] Key prop uses stable unique identifier (not array index)
- [ ] Memoization (useMemo, useCallback) justified by measurement
- [ ] No state updates during render

## Performance

- [ ] No N+1 data fetching
- [ ] List rendering uses pagination or virtualization
- [ ] Images optimized (size, format, lazy loading)
- [ ] Dynamic imports for large components
- [ ] Debounce/throttle for frequent events (scroll, resize, input)
- [ ] No memory leaks from subscriptions or listeners

## Security

- [ ] User input validated on server side
- [ ] No innerHTML with user content (XSS risk)
- [ ] SQL/NoSQL injection prevented
- [ ] Authentication checked on protected endpoints
- [ ] Authorization verified for resource access
- [ ] No secrets in code or logs
- [ ] CSRF protection on mutations

## Naming & Style

- [ ] Variable names are descriptive and self-documenting
- [ ] Function names use verbs (create, fetch, handle)
- [ ] Boolean names use is/has/can/should prefix
- [ ] File names follow project convention
- [ ] Consistent formatting (prettier applied)

## Testing

- [ ] New features have tests
- [ ] Bug fixes include regression test
- [ ] Tests are readable and maintainable
- [ ] Test descriptions explain expected behavior
- [ ] Edge cases tested
- [ ] Mocks are minimal and focused

## Documentation

- [ ] Complex logic has inline comments
- [ ] Public APIs have JSDoc comments
- [ ] README updated if setup changed
- [ ] Breaking changes documented

## Severity Guide

| Level | Description | Example |
|-------|------------|---------|
| Critical | Security, data loss, crash | SQL injection, missing auth |
| Major | Bug, broken feature | Wrong calculation, missing error handler |
| Minor | Style, readability | Naming convention, unused variable |
| Nit | Preference, optional | Alternative approach suggestion |
