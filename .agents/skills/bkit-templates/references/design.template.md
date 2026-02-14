# {feature} Design Document

> **Summary**: {One-line description}
>
> **Project**: {project}
> **Version**: {version}
> **Author**: {author}
> **Date**: {date}
> **Status**: Draft
> **Planning Doc**: [{feature}.plan.md](../01-plan/features/{feature}.plan.md)

---

## 1. Overview

### 1.1 Design Goals

{Technical goals this design aims to achieve}

### 1.2 Design Principles

- {Principle 1: e.g., Single Responsibility Principle}
- {Principle 2: e.g., Extensible architecture}

---

## 2. Architecture

### 2.1 Component Diagram

```
Client (Browser) -> Server (API) -> Database (Storage)
```

### 2.2 Data Flow

```
User Input -> Validation -> Business Logic -> Data Storage -> Response
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| {Component A} | {Component B} | {Purpose} |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
interface {Entity} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields...
}
```

### 3.2 Entity Relationships

```
[User] 1 ---- N [Post]
   |
   +-- 1 ---- N [Comment]
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/{resource} | List all | Required |
| GET | /api/{resource}/:id | Get detail | Required |
| POST | /api/{resource} | Create | Required |
| PUT | /api/{resource}/:id | Update | Required |
| DELETE | /api/{resource}/:id | Delete | Required |

### 4.2 Response Format

```json
{
  "data": { },
  "meta": { "timestamp": "2026-01-01T00:00:00Z" }
}
```

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
+------------------------------------+
|  Header                            |
+------------------------------------+
|                                    |
|  Main Content Area                 |
|                                    |
+------------------------------------+
|  Footer                            |
+------------------------------------+
```

### 5.2 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| {ComponentA} | src/components/ | {Role} |

---

## 6. Error Handling

| Code | Message | Handling |
|------|---------|----------|
| 400 | Invalid input | Request re-entry |
| 401 | Unauthorized | Redirect to login |
| 404 | Not found | Show 404 page |
| 500 | Internal error | Log and notify |

---

## 7. Security Considerations

- [ ] Input validation (XSS, SQL Injection prevention)
- [ ] Authentication/Authorization handling
- [ ] Sensitive data encryption
- [ ] HTTPS enforcement

---

## 8. Test Plan

| Type | Target | Tool |
|------|--------|------|
| Unit Test | Business logic | Jest/Vitest |
| Integration Test | API endpoints | Supertest |
| E2E Test | User scenarios | Playwright |

---

## 9. Implementation Guide

### 9.1 Implementation Order

1. [ ] Define data model
2. [ ] Implement API
3. [ ] Implement UI components
4. [ ] Integration and testing

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial draft | {author} |
