# {feature} Implementation Guide

> **Summary**: {One-line description}
>
> **Project**: {project}
> **Author**: {author}
> **Date**: {date}
> **Status**: In Progress
> **Design Doc**: [{feature}.design.md](../02-design/features/{feature}.design.md)

---

## 1. Pre-Implementation Checklist

- [ ] Plan document reviewed
- [ ] Design document reviewed
- [ ] Conventions understood
- [ ] Dependencies installed
- [ ] Development server running
- [ ] Environment variables set

---

## 2. Implementation Order

### 2.1 Phase 1: Data Layer

| Priority | Task | File/Location | Status |
|:--------:|------|---------------|:------:|
| 1 | Define types/interfaces | `src/types/{feature}.ts` | - |
| 2 | Create data models | `src/domain/{feature}/` | - |
| 3 | Set up API client | `src/lib/api/{feature}.ts` | - |

### 2.2 Phase 2: Business Logic

| Priority | Task | File/Location | Status |
|:--------:|------|---------------|:------:|
| 4 | Implement services | `src/services/{feature}.ts` | - |
| 5 | Create custom hooks | `src/hooks/use{Feature}.ts` | - |
| 6 | Add state management | `src/stores/{feature}.ts` | - |

### 2.3 Phase 3: UI Components

| Priority | Task | File/Location | Status |
|:--------:|------|---------------|:------:|
| 7 | Create base components | `src/components/{feature}/` | - |
| 8 | Implement pages/routes | `src/app/{feature}/` | - |
| 9 | Add error handling UI | `src/components/error/` | - |

### 2.4 Phase 4: Integration

| Priority | Task | File/Location | Status |
|:--------:|------|---------------|:------:|
| 10 | Connect API to UI | Component integration | - |
| 11 | Add loading states | All async components | - |
| 12 | Implement error handling | Try-catch, error boundaries | - |

---

## 3. Key Files

### 3.1 New Files

| File Path | Purpose |
|-----------|---------|
| `src/types/{feature}.ts` | Type definitions |
| `src/services/{feature}.ts` | Business logic |
| `src/components/{feature}/index.tsx` | Main component |

### 3.2 Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/app/layout.tsx` | Add provider/context |
| `src/types/index.ts` | Export new types |

---

## 4. Dependencies

```bash
# Add any new dependencies
npm install {package1} {package2}
```

---

## 5. Post-Implementation

### 5.1 Self-Review Checklist

- [ ] All design requirements implemented
- [ ] Code follows naming conventions
- [ ] No hardcoded values
- [ ] Error handling complete
- [ ] Types properly defined

### 5.2 Ready for Check Phase

When all items above are complete, run gap analysis:

```
$pdca analyze {feature}
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Implementation started | {author} |
