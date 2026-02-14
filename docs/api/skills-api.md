# Skills API Reference

bkit-codex includes 26 Agent Skills organized into 4 priority tiers.

## P0: Core PDCA (3 Skills)

### bkit-rules

**Name**: `bkit-rules`
**Invocation**: `$bkit-rules`
**Implicit**: No (explicit invocation only)

Core rules for bkit PDCA methodology. Detailed reference for document-driven development, level detection, task classification, and code quality standards.

**Triggers**: bkit rules, PDCA rules, development rules, coding standards

**References**:
- `naming-conventions.md` - PascalCase, camelCase, UPPER_SNAKE_CASE, kebab-case rules
- `code-quality-standards.md` - OWASP, security, error handling standards

---

### pdca

**Name**: `pdca`
**Invocation**: `$pdca [action] [feature]`
**Implicit**: Yes

Unified PDCA cycle management with 10 actions.

**Actions**:
| Action | Description | MCP Tool Called |
|--------|-------------|----------------|
| `plan {feature}` | Create plan document | `bkit_pdca_plan` |
| `design {feature}` | Create design document | `bkit_pdca_design` |
| `do {feature}` | Implementation guide | `bkit_pre_write_check` |
| `analyze {feature}` | Gap analysis | `bkit_pdca_analyze` |
| `iterate {feature}` | Auto-fix gaps | `bkit_pdca_analyze` (repeated) |
| `report {feature}` | Completion report | `bkit_get_status` |
| `status` | Show PDCA progress | `bkit_get_status` |
| `next` | Suggest next phase | `bkit_pdca_next` |
| `archive {feature}` | Archive completed feature | `bkit_complete_phase` |
| `cleanup` | Clean archived features | N/A |

**Triggers**: pdca, plan, design, analyze, iterate, report, status, gap analysis

**References**:
- `plan.template.md` - Plan document template
- `design.template.md` - Design document template (Dynamic)
- `design-starter.template.md` - Design template for Starter level
- `design-enterprise.template.md` - Design template for Enterprise level
- `analysis.template.md` - Gap analysis template
- `report.template.md` - Completion report template
- `do.template.md` - Implementation guide template

---

### bkit-templates

**Name**: `bkit-templates`
**Invocation**: `$bkit-templates`
**Implicit**: Yes

PDCA document template selection guide. Provides template matrix based on phase and project level.

**Triggers**: template, plan document, design document, analysis, report

**References**: Same template files as `pdca` skill (shared).

---

## P1: Level & Pipeline (13 Skills)

### starter

**Name**: `starter`
**Invocation**: `$starter`
**Implicit**: Yes

Static web development guide for beginners. Covers HTML/CSS/JavaScript and Next.js App Router basics. Project initialization with "init starter".

**Pipeline Phases**: 1 → 2 → 3 → 6 → 9
**Triggers**: static website, portfolio, landing page, HTML CSS, beginner

---

### dynamic

**Name**: `dynamic`
**Invocation**: `$dynamic`
**Implicit**: Yes

Fullstack development with bkend.ai BaaS. Covers authentication, data storage, API integration. Project initialization with "init dynamic".

**Pipeline Phases**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 9 (phase 8 optional)
**Triggers**: fullstack, BaaS, bkend, authentication, login, signup, database

---

### enterprise

**Name**: `enterprise`
**Invocation**: `$enterprise`
**Implicit**: Yes

Enterprise-grade system development with microservices, Kubernetes, Terraform. Includes AI Native methodology and Monorepo patterns.

**Actions**: init (system setup), strategy (architecture decisions), infra (infrastructure design), review (architecture review)
**Pipeline Phases**: All 9 phases required
**Triggers**: microservices, kubernetes, terraform, k8s, AWS, monorepo

---

### development-pipeline

**Name**: `development-pipeline`
**Invocation**: `$development-pipeline`
**Implicit**: Yes

9-phase Development Pipeline overview. Use when starting a new project or unsure about development order.

**Triggers**: development pipeline, phase, development order, where to start

---

### phase-1-schema

**Name**: `phase-1-schema`
**Invocation**: `$phase-1-schema`
**Implicit**: Yes

Phase 1: Schema & Terminology. Define data models, entities, relationships, and domain terminology.

**Next**: `$phase-2-convention`
**Triggers**: schema, terminology, data model, entity
**References**: `schema-patterns.md`

---

### phase-2-convention

**Name**: `phase-2-convention`
**Invocation**: `$phase-2-convention`
**Implicit**: Yes

Phase 2: Coding Conventions. Establish naming rules, style guide, and project conventions.

**Next**: `$phase-3-mockup`
**Triggers**: convention, naming, style guide, coding standard
**References**: `naming-conventions.md`

---

### phase-3-mockup

**Name**: `phase-3-mockup`
**Invocation**: `$phase-3-mockup`
**Implicit**: Yes

Phase 3: UI/UX Mockups. Create wireframes, prototypes, and visual designs.

**Next**: `$phase-4-api`
**Triggers**: mockup, wireframe, prototype, UI design
**References**: `mockup-patterns.md`

---

### phase-4-api

**Name**: `phase-4-api`
**Invocation**: `$phase-4-api`
**Implicit**: Yes

Phase 4: API Design. Define REST endpoints, request/response schemas, Zero Script QA methodology.

**Next**: `$phase-5-design-system`
**Triggers**: API, REST, endpoint, request, response
**References**: `api-patterns.md`

---

### phase-5-design-system

**Name**: `phase-5-design-system`
**Invocation**: `$phase-5-design-system`
**Implicit**: Yes

Phase 5: Design System. Build component library, design tokens, theming.

**Next**: `$phase-6-ui-integration`
**Triggers**: design system, component library, design tokens, theming
**References**: `design-system-guide.md`

---

### phase-6-ui-integration

**Name**: `phase-6-ui-integration`
**Invocation**: `$phase-6-ui-integration`
**Implicit**: Yes

Phase 6: UI Integration. Connect frontend to backend, state management, data flow.

**Next**: `$phase-7-seo-security`
**Triggers**: integration, frontend backend, state management, data binding
**References**: `integration-patterns.md`

---

### phase-7-seo-security

**Name**: `phase-7-seo-security`
**Invocation**: `$phase-7-seo-security`
**Implicit**: Yes

Phase 7: SEO & Security. SEO optimization, security hardening, OWASP compliance.

**Next**: `$phase-8-review`
**Triggers**: SEO, security, OWASP, meta tags, CSP
**References**: `security-checklist.md`

---

### phase-8-review

**Name**: `phase-8-review`
**Invocation**: `$phase-8-review`
**Implicit**: Yes

Phase 8: Code Review. Comprehensive code review, architecture review, gap analysis.

**Next**: `$phase-9-deployment`
**Triggers**: code review, architecture review, quality check
**References**: `review-checklist.md`

---

### phase-9-deployment

**Name**: `phase-9-deployment`
**Invocation**: `$phase-9-deployment`
**Implicit**: Yes

Phase 9: Deployment. CI/CD setup, production deployment, monitoring configuration.

**Triggers**: deployment, CI/CD, production, monitoring, Docker
**References**: `deployment-guide.md`

---

## P2: Specialized (5 Skills)

### code-review

**Name**: `code-review`
**Invocation**: `$code-review`
**Implicit**: Yes

Code review for quality analysis, bug detection, and best practices. Provides comprehensive review with actionable feedback.

**Triggers**: code review, review code, check code, analyze code, bug detection
**References**: `review-checklist.md`

---

### zero-script-qa

**Name**: `zero-script-qa`
**Invocation**: `$zero-script-qa`
**Implicit**: Yes

Zero Script QA - Testing without test scripts. Uses structured JSON logging and real-time Docker log monitoring for verification.

**Triggers**: zero script qa, log-based testing, docker logs, QA
**References**: `qa-methodology.md`

---

### mobile-app

**Name**: `mobile-app`
**Invocation**: `$mobile-app`
**Implicit**: Yes

Mobile app development guide for React Native, Flutter, and Expo.

**Triggers**: mobile app, React Native, Flutter, Expo, iOS, Android

---

### desktop-app

**Name**: `desktop-app`
**Invocation**: `$desktop-app`
**Implicit**: Yes

Desktop app development guide for Electron and Tauri frameworks.

**Triggers**: desktop app, Electron, Tauri, mac app, windows app

---

### codex-learning

**Name**: `codex-learning`
**Invocation**: `$codex-learning`
**Implicit**: Yes

Codex CLI learning and optimization guide. Teaches configuration, AGENTS.md setup, MCP servers, skills management, and best practices.

**Triggers**: learn codex, codex setup, AGENTS.md, MCP, skills, configuration
**References**: `codex-guide.md`

---

## P3: bkend Ecosystem (5 Skills)

### bkend-quickstart

**Name**: `bkend-quickstart`
**Invocation**: `$bkend-quickstart`
**Implicit**: Yes

bkend.ai quickstart guide. Project setup, MCP connection, first API call.

**Triggers**: bkend setup, first project, MCP connect
**References**: `bkend-patterns.md`

---

### bkend-data

**Name**: `bkend-data`
**Invocation**: `$bkend-data`
**Implicit**: Yes

bkend.ai data management. Table creation, columns, CRUD operations, indexing, filtering.

**Triggers**: table, column, CRUD, schema, index, filter
**References**: `bkend-patterns.md`

---

### bkend-auth

**Name**: `bkend-auth`
**Invocation**: `$bkend-auth`
**Implicit**: Yes

bkend.ai authentication. Signup, login, JWT, sessions, RBAC, password management.

**Triggers**: signup, login, JWT, session, RBAC, password
**References**: `bkend-patterns.md`

---

### bkend-storage

**Name**: `bkend-storage`
**Invocation**: `$bkend-storage`
**Implicit**: Yes

bkend.ai file storage. Upload, download, presigned URLs, buckets, CDN.

**Triggers**: file upload, download, presigned, bucket, CDN
**References**: `bkend-patterns.md`

---

### bkend-cookbook

**Name**: `bkend-cookbook`
**Invocation**: `$bkend-cookbook`
**Implicit**: Yes

bkend.ai cookbook with tutorials and example projects.

**Triggers**: cookbook, tutorial, example project, todo app
**References**: `bkend-patterns.md`
