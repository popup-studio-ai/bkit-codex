---
name: bkit-templates
description: |
  PDCA document templates for consistent documentation. Provides template
  selection guide based on phase and project level.
  Triggers: template, plan document, design document, analysis, report,
  템플릿, 계획서, 설계서, テンプレート, 模板, plantilla, modèle, Vorlage, modello
  Do NOT use for: executing PDCA actions (use $pdca instead).
---

# bkit Document Templates

> Use these templates when generating PDCA documents for consistent format and structure.

## Available Templates

| Template | File | Purpose |
|----------|------|---------|
| Plan | `references/plan.template.md` | Feature planning document |
| Design | `references/design.template.md` | Technical design (Dynamic level) |
| Design (Starter) | `references/design-starter.template.md` | Simplified design for beginners |
| Design (Enterprise) | `references/design-enterprise.template.md` | Enterprise MSA design |
| Analysis | `references/analysis.template.md` | Gap analysis report |
| Report | `references/report.template.md` | Completion report |
| Do | `references/do.template.md` | Implementation guide |

## Template Selection Matrix

### By PDCA Phase

| Phase | Template | Output Path |
|-------|----------|-------------|
| Plan | plan.template.md | `docs/01-plan/features/{feature}.plan.md` |
| Design | design*.template.md | `docs/02-design/features/{feature}.design.md` |
| Do | do.template.md | Implementation guide (in-session) |
| Check | analysis.template.md | `docs/03-analysis/{feature}.analysis.md` |
| Act | (iterate based on analysis) | Updated source code |
| Report | report.template.md | `docs/04-report/features/{feature}.report.md` |

### By Project Level

| Level | Design Template | Notes |
|-------|----------------|-------|
| Starter | design-starter.template.md | Simplified, pages + components only |
| Dynamic | design.template.md | Full template with API + data model |
| Enterprise | design-enterprise.template.md | MSA, K8s, Terraform, observability |

## Variable Substitution

Templates use `{variable}` syntax. Replace these when generating documents:

| Variable | Description | Example |
|----------|-------------|---------|
| `{feature}` | Feature name (kebab-case) | `user-auth` |
| `{date}` | Creation date | `2026-02-14` |
| `{author}` | Document author | `Team` |
| `{project}` | Project name | `my-saas` |
| `{version}` | Document version | `0.1` |

## Document Output Paths

```
docs/
├── 01-plan/
│   └── features/
│       └── {feature}.plan.md
├── 02-design/
│   └── features/
│       └── {feature}.design.md
├── 03-analysis/
│   └── {feature}.analysis.md
└── 04-report/
    └── features/
        └── {feature}.report.md
```

## Document Standards

### File Naming Rules

```
{feature}.{type}.md             # user-auth.design.md
{number}_{english_name}.md      # 01_system_architecture.md
```

### Common Header

All PDCA documents must include:

```markdown
# {Document Title}

> **Summary**: {One-line description}
>
> **Author**: {Name}
> **Created**: {YYYY-MM-DD}
> **Status**: {Draft | Review | Approved | Deprecated}

---
```

### Version Control

Track changes within documents:

```markdown
## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-01 | Initial draft | Author |
```

### Cross-References

Link related PDCA documents:

```markdown
## Related Documents
- Plan: [feature.plan.md](../01-plan/features/feature.plan.md)
- Design: [feature.design.md](../02-design/features/feature.design.md)
- Analysis: [feature.analysis.md](../03-analysis/feature.analysis.md)
```

### Status Tracking

| Status | Meaning | AI Behavior |
|--------|---------|-------------|
| Approved | Use as reference | Follow as-is |
| In Progress | Being written | Notify of changes |
| On Hold | Temporarily paused | Request confirmation |
| Deprecated | No longer valid | Ignore |

### Conflict Resolution

- **Code vs Design mismatch**: Code is truth, suggest document update
- **Multiple versions**: Reference only the latest version

## Usage

When a PDCA phase requires document creation:

1. Detect project level (Starter/Dynamic/Enterprise)
2. Select appropriate template from this skill's references
3. Replace `{variable}` placeholders with actual values
4. Create document at the correct output path
5. Update `.pdca-status.json` with phase progression

Templates are loaded on-demand from the `references/` directory.
