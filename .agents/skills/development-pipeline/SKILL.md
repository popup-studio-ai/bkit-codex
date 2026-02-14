---
name: development-pipeline
description: |
  9-phase Development Pipeline overview. Use when starting a new project
  or unsure about development order.
  Triggers: development pipeline, phase, development order, where to start,
  개발 파이프라인, 뭐부터, 어디서부터, 開発パイプライン, 何から,
  开发流程, 从哪里开始, pipeline de desarrollo, pipeline de développement
  Do NOT use for: specific phase details (use $phase-N-xxx).
---

# Development Pipeline Skill

> 9-phase Development Pipeline overview and navigation guide.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `overview` | Show all 9 phases | `$development-pipeline overview` |
| `recommend` | Recommend pipeline for level | `$development-pipeline recommend starter` |
| `status` | Check current phase progress | `$development-pipeline status` |

## The 9 Phases

| Phase | Name | Skill | Purpose |
|-------|------|-------|---------|
| 1 | Schema | $phase-1-schema | Data modeling, terminology definition |
| 2 | Convention | $phase-2-convention | Coding standards, naming rules |
| 3 | Mockup | $phase-3-mockup | UI/UX wireframes, screen design |
| 4 | API | $phase-4-api | API design, REST endpoints |
| 5 | Design System | $phase-5-design-system | Component library, design tokens |
| 6 | UI Integration | $phase-6-ui-integration | Frontend-backend connection |
| 7 | SEO & Security | $phase-7-seo-security | SEO optimization, security hardening |
| 8 | Review | $phase-8-review | Code review, architecture review |
| 9 | Deployment | $phase-9-deployment | CI/CD, production deployment |

## Pipeline by Level

### Starter (Beginner)

```
Phase 1 -> 2 -> 3 -> 6 -> 9
```

- Skip: Phase 4 (no API), Phase 5 (optional), Phase 7 (basic SEO only), Phase 8 (simple review)
- Focus: Get a static site live quickly
- Time: 1-3 days

### Dynamic (Intermediate)

```
Phase 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 9
```

- Skip: Phase 8 (simplified review integrated into Phase 7)
- Focus: Fullstack app with BaaS backend
- Time: 3-7 days

### Enterprise (Advanced)

```
Phase 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
```

- All 9 phases required
- Each phase uses PDCA cycle
- Focus: Production-grade scalable systems
- Time: 7-14 days (AI Native 10-Day pattern)

## Phase Dependencies

```
Phase 1 (Schema)
  └── Phase 2 (Convention) - needs terminology from Phase 1
        └── Phase 3 (Mockup) - needs naming rules from Phase 2
              ├── Phase 4 (API) - needs UI understanding from Phase 3
              │     └── Phase 5 (Design System) - needs API contracts from Phase 4
              │           └── Phase 6 (UI Integration) - needs components + API
              │                 └── Phase 7 (SEO & Security) - needs working app
              │                       └── Phase 8 (Review) - needs complete app
              │                             └── Phase 9 (Deployment) - needs reviewed code
              └── Phase 6 (Starter shortcut) - static sites skip API/Design System
```

## PDCA Integration

Each phase follows the PDCA cycle:

1. **Plan**: Define goals and deliverables for the phase
2. **Design**: Create detailed specifications
3. **Check/Act**: Review output, iterate if needed

Use `$pdca` skill for PDCA workflow management within each phase.

## How to Start

1. Determine your project level: `$starter`, `$dynamic`, or `$enterprise`
2. Follow the pipeline for your level
3. Use `$phase-N-xxx` skills for detailed guidance in each phase
4. Track progress with `$pdca status`

## Common Questions

| Question | Answer |
|----------|--------|
| Can I skip phases? | Yes, for Starter/Dynamic levels. See pipeline above. |
| Can I go back to a previous phase? | Yes, PDCA allows iteration. Update docs accordingly. |
| Which phase am I in? | Run `$pdca status` or check .pdca-status.json |
| Do I need all phases for MVP? | Starter pipeline (5 phases) is sufficient for MVP. |
