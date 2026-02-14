# {feature} Analysis Report

> **Analysis Type**: Gap Analysis
>
> **Project**: {project}
> **Analyst**: {author}
> **Date**: {date}
> **Design Doc**: [{feature}.design.md](../02-design/features/{feature}.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Scope

- **Design Document**: `docs/02-design/features/{feature}.design.md`
- **Implementation Path**: `src/features/{feature}/`
- **Analysis Date**: {date}

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API Endpoints

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| POST /api/{resource} | POST /api/{resource} | Match | |
| GET /api/{resource}/:id | GET /api/{resource}/:id | Match | |
| DELETE /api/{resource}/:id | - | Not implemented | |

### 2.2 Data Model

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|--------|
| id | string | string | Match |
| email | string | string | Match |

### 2.3 Component Structure

| Design Component | Implementation File | Status |
|------------------|---------------------|--------|
| {ComponentA} | src/components/{ComponentA}.tsx | Match |
| {ComponentB} | - | Not implemented |

### 2.4 Match Rate Summary

```
Overall Match Rate: ___%

Match:           __ items (__%)
Missing design:  __ items (__%)
Not implemented: __ items (__%)
```

---

## 3. Code Quality Analysis

### 3.1 Code Smells

| Type | File | Description | Severity |
|------|------|-------------|----------|
| {type} | {file} | {description} | High/Medium/Low |

### 3.2 Security Issues

| Severity | File | Issue | Recommendation |
|----------|------|-------|----------------|
| Critical | {file} | {issue} | {fix} |

---

## 4. Recommended Actions

### 4.1 Immediate

| Priority | Item | File |
|----------|------|------|
| 1 | {action} | {file} |

### 4.2 Short-term

| Priority | Item | Expected Impact |
|----------|------|-----------------|
| 1 | {action} | {impact} |

---

## 5. Next Steps

- [ ] Fix critical issues
- [ ] Update design document if needed
- [ ] Write completion report (`{feature}.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial analysis | {author} |
