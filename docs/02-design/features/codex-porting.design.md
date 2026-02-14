# bkit Codex Porting - Implementation Design Document

> Version: 1.0.0 | Date: 2026-02-14 | Status: Draft
> Source: bkit-claude-code v1.5.4 → bkit-codex v1.0.0
> Plan: docs/01-plan/features/codex-porting.plan.md
> Reference: docs/02-design/features/bkit-plugin-reverse-engineering.design.md

---

## 1. Overview

### 1.1 Purpose

bkit-claude-code v1.5.4의 PDCA 기반 문서 주도 개발 경험을 OpenAI Codex 플랫폼으로 완전 이식하기 위한 상세 구현 설계서.

### 1.2 Philosophy Preservation

| Philosophy | bkit-claude-code | bkit-codex | Preservation Strategy |
|------------|-----------------|------------|----------------------|
| **Automation First** | 10 Hook Events가 자동 개입 | AGENTS.md MUST/ALWAYS 규칙 + MCP Tool 호출 유도 | AI가 규칙을 읽고 자발적으로 MCP 호출 |
| **No Guessing** | PreToolUse가 설계 문서 자동 체크 | AGENTS.md "NEVER guess" + `bkit_pre_write_check` MCP | 코드 작성 전 반드시 MCP 호출하도록 지시 |
| **Docs = Code** | PostToolUse가 Gap Analysis 자동 제안 | AGENTS.md post-write 규칙 + `bkit_post_write` MCP | 코드 작성 후 MCP가 가이던스 반환 |

### 1.3 Architecture Paradigm

```
bkit-claude-code (Hook-Driven, 100% Auto)
  Hook Event → Script (stdin/stdout) → decision: allow/block
  = 시스템이 AI를 제어

bkit-codex (Instruction-Driven, ~70% Auto)
  AGENTS.md Rule → AI reads → AI calls MCP Tool → MCP returns guidance
  = AI가 규칙을 따라 자발적으로 수행
```

### 1.4 Codex Platform Reference (Official Documentation)

Sources:
- [Agent Skills](https://developers.openai.com/codex/skills)
- [AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/)
- [MCP Configuration](https://developers.openai.com/codex/mcp/)
- [Config Reference](https://developers.openai.com/codex/config-reference/)
- [CLI Features](https://developers.openai.com/codex/cli/features/)
- [Codex Changelog](https://developers.openai.com/codex/changelog/)
- [GitHub: Hook Discussion #2150](https://github.com/openai/codex/discussions/2150)
- [GitHub: Extensibility RFC #2582](https://github.com/openai/codex/issues/2582)

**Key Platform Constraints**:

| Constraint | Value | Impact |
|------------|-------|--------|
| AGENTS.md size limit | 32 KiB (`project_doc_max_bytes`) | Global + Project 합산 제한 |
| SKILL.md name | max 64 chars | 간결한 이름 필요 |
| SKILL.md description | max 1024 chars | 핵심 트리거만 포함 |
| MCP transport | STDIO or Streaming HTTP | STDIO 채택 (로컬 프로세스) |
| Hook system | `agent-turn-complete` only | AGENTS.md + MCP로 대체 |
| Skill paths | `.agents/skills/` (repo), `~/.agents/skills/` (user) | 심볼릭 링크 지원 |
| Progressive Disclosure | metadata → body → references | 컨텍스트 효율화 |
| config.toml | `[[skills.config]]`, `[mcp_servers.*]` | 스킬/MCP 설정 |
| Codex CLI v0.100.0 | JS REPL, /m_update, /m_drop | 최신 기능 활용 |

---

## 2. AGENTS.md Detailed Design

### 2.1 Global AGENTS.md (`~/.codex/AGENTS.md`)

**Size**: ~3.8 KB | **Purpose**: 모든 프로젝트에 적용되는 bkit 핵심 규칙

```markdown
# bkit - Vibecoding Kit (Global Rules)

You are operating with bkit (Vibecoding Kit) installed. These rules are MANDATORY.

## Session Initialization

ALWAYS call `bkit_init` MCP tool at the start of each session before doing any work.
This initializes PDCA state, detects project level, and returns session context.

## Three Core Principles

### 1. Automation First
- ALWAYS check PDCA status before starting any work
- ALWAYS call `bkit_analyze_prompt` for the first user message to detect intent
- After detecting intent, follow the suggested action without asking

### 2. No Guessing
- NEVER implement features without checking design documents first
- ALWAYS call `bkit_pre_write_check` before writing or editing any source code file
- If no design document exists, MUST suggest creating one before implementation
- If unsure about requirements, ask the user instead of guessing

### 3. Docs = Code
- Design documents are the source of truth for implementation
- After significant code changes, call `bkit_post_write` for next-step guidance
- When `bkit_post_write` suggests gap analysis, recommend it to the user

## PDCA Workflow Rules

### Before Writing Code
1. Call `bkit_pre_write_check(filePath)` for the target file
2. If response says design document exists → reference it during implementation
3. If response says no design document → suggest: "Shall I create a design first?"
4. For major changes (>200 lines), ALWAYS suggest gap analysis after completion

### After Writing Code
1. Call `bkit_post_write(filePath, linesChanged)` after significant changes
2. Follow the returned guidance (gap analysis suggestion, next phase, etc.)

### Phase Transitions
- Use `bkit_complete_phase(feature, phase)` to record phase completion
- Phase order: plan → design → do → check → act → report
- NEVER skip directly from plan to do; design is required

## Level Detection

Detect project level based on directory structure:
- **Enterprise**: Has `kubernetes/`, `terraform/`, `k8s/`, or `infra/` directories
- **Dynamic**: Has `lib/bkend/`, `supabase/`, `api/`, `.mcp.json`, or `docker-compose.yml`
- **Starter**: Default (none of the above)

Call `bkit_detect_level` for programmatic detection. Use detected level to select
appropriate skills and templates.

## Code Quality Standards

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile`)
- Functions: camelCase (e.g., `getUserData`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Files: kebab-case (e.g., `user-profile.tsx`)

### Safety Rules
- NEVER commit .env, credentials, or secret files
- ALWAYS validate user input at system boundaries
- Prefer explicit error handling over silent failures
- Follow OWASP Top 10 guidelines for security

## MCP Tools Quick Reference

| Tool | When to Call |
|------|-------------|
| `bkit_init` | Session start |
| `bkit_analyze_prompt` | First user message |
| `bkit_get_status` | Before any PDCA operation |
| `bkit_pre_write_check` | Before writing/editing source code |
| `bkit_post_write` | After significant code changes |
| `bkit_complete_phase` | When a PDCA phase is done |
| `bkit_detect_level` | When project level is unclear |
| `bkit_classify_task` | When estimating task size |

## Response Style

Include bkit feature usage report at the end of responses when PDCA is active:
- Show current PDCA phase and feature
- Suggest next action based on current state
```

### 2.2 Project AGENTS.md (`./AGENTS.md`)

**Size**: ~2.0 KB | **Purpose**: 프로젝트별 bkit 설정 (설치 시 자동 생성)

```markdown
# bkit Project Configuration

## Project Level

This project uses bkit with automatic level detection.
Call `bkit_detect_level` at session start to determine the current level.

### Level-Specific Guidance

**Starter** (beginners, static websites):
- Use simple HTML/CSS/JS or Next.js App Router
- Skip API and database phases
- Pipeline phases: 1 → 2 → 3 → 6 → 9
- Use `$starter` skill for beginner guidance

**Dynamic** (fullstack with BaaS):
- Use bkend.ai for backend services
- Follow phases: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 9 (phase 8 optional)
- Use `$dynamic` skill for fullstack guidance

**Enterprise** (microservices, K8s):
- All 9 phases required
- Use `$enterprise` skill for MSA guidance

## PDCA Status

ALWAYS check `docs/.pdca-status.json` for current feature status.
Use `bkit_get_status` MCP tool for parsed status with recommendations.

## Key Skills

| Skill | Purpose |
|-------|---------|
| `$pdca` | Unified PDCA workflow (plan, design, do, analyze, iterate, report) |
| `$starter` / `$dynamic` / `$enterprise` | Level-specific guidance |
| `$development-pipeline` | 9-phase pipeline overview |
| `$code-review` | Code quality analysis |
| `$bkit-templates` | PDCA document template selection |

## Response Format

Follow level-appropriate response formatting:
- **Starter**: Include learning points, explain concepts simply
- **Dynamic**: Include PDCA status badges, checklists, next-step guidance
- **Enterprise**: Include tradeoff analysis, cost impact, deployment considerations
```

### 2.3 Override Strategy

| Scenario | File | Location |
|----------|------|----------|
| 임시 글로벌 오버라이드 | `AGENTS.override.md` | `~/.codex/` |
| 프로젝트별 커스텀 | `AGENTS.md` 직접 편집 | `./` |
| 하위 디렉토리 특화 | `AGENTS.md` | `./src/`, `./api/` 등 |

### 2.4 Size Budget

| Component | Size | Percentage |
|-----------|------|:----------:|
| Global AGENTS.md | ~3.8 KB | 12% |
| Project AGENTS.md | ~2.0 KB | 6% |
| **Total** | **~5.8 KB** | **18%** |
| Remaining | ~26.2 KB | 82% |

---

## 3. Agent Skills Design (26 Skills)

### 3.1 Skill Directory Convention

```
skill-name/
├── SKILL.md              # Required: YAML frontmatter + instructions
├── agents/
│   └── openai.yaml       # Optional: UI metadata, policy, dependencies
├── scripts/              # Optional: deterministic executable code
├── references/           # Optional: on-demand loaded documentation
│   ├── template.md       # bkit templates → references
│   └── patterns.md       # bkit shared → references
└── assets/               # Optional: icons, schemas (not loaded to context)
    └── icon.svg
```

**Codex Skill Loading (Progressive Disclosure)**:
1. **Phase 1**: Load `name` + `description` + `agents/openai.yaml` metadata
2. **Phase 2**: When activated, load full `SKILL.md` body
3. **Phase 3**: On-demand load `references/` files when AI requests them

### 3.2 Conversion Rules (bkit → Codex)

| bkit Field | Codex Equivalent | Conversion |
|------------|-----------------|------------|
| `name` | `name` | 동일 (64자 제한, 디렉토리명 일치) |
| `description` | `description` | 1024자 제한, Triggers/Do NOT use 유지 |
| `agent: X` | description 내 역할 | `"Expert: X역할"` 추가 |
| `agents: { a:X, b:Y }` | description 내 통합 | `"Actions: a→X, b→Y"` |
| `allowed-tools` | `allowed-tools` | Codex도 지원 (experimental) |
| `user-invocable` | 제거 | Codex 기본: implicit + explicit 모두 지원 |
| `hooks` | 제거 | MCP Server로 대체 |
| `imports` | `references/` | 디렉토리에 파일 배치 |
| `next-skill` | description 텍스트 | `"Next: $phase-N-xxx"` |
| `pdca-phase` | description 텍스트 | `"PDCA Phase: xxx"` |
| `context: fork` | 제거 | Codex sandbox로 대체 |
| `skills_preload` | `references/` | Agent의 preload → Skill의 references |

### 3.3 openai.yaml Convention

모든 bkit 스킬에 공통 적용:

```yaml
# agents/openai.yaml
interface:
  brand_color: "#3B82F6"    # bkit 브랜드 컬러

policy:
  allow_implicit_invocation: true    # 기본: 암시적 호출 허용
```

`bkit-rules` 스킬만 예외:
```yaml
policy:
  allow_implicit_invocation: false   # 명시적 호출만 허용
```

### 3.4 P0 Skills (Core PDCA) - 3 Skills

#### 3.4.1 bkit-rules

**Original**: `skills/bkit-rules/SKILL.md` (hooks-dependent, auto-apply)
**Portability**: ❌→⚠️ (AGENTS.md 인라인 + SKILL.md 병행)

```yaml
---
name: bkit-rules
description: |
  Core rules for bkit PDCA methodology. Detailed reference for document-driven
  development, level detection, task classification, and code quality standards.
  Use when you need detailed bkit rules beyond what AGENTS.md provides.
  Triggers: bkit rules, PDCA rules, development rules, coding standards,
  개발 규칙, 코딩 표준, ルール, 规则, reglas, règles, Regeln, regole
  Do NOT use for: specific PDCA actions (use $pdca instead).
---
```

**Body Structure**:
```
# bkit Core Rules (Detailed Reference)

## 1. PDCA Auto-Apply Rules
### Task Classification
- Quick Fix (< 10 lines): PDCA optional
- Minor Change (< 50 lines): PDCA recommended
- Feature (< 200 lines): PDCA required
- Major Feature (>= 200 lines): PDCA + split recommended

### Design Document Check Flow
1. Extract feature name from file path or user request
2. Check: docs/01-plan/features/{feature}.plan.md
3. Check: docs/02-design/features/{feature}.design.md
4. If neither exists → suggest plan first
5. If plan exists, no design → suggest design
6. If both exist → reference design during implementation

### Post-Write Guidance
- After Write/Edit: suggest gap analysis for features with design docs
- For major changes: ALWAYS suggest gap analysis
- Format: "Consider running gap analysis: $pdca analyze {feature}"

## 2. Level Detection Rules
[Enterprise/Dynamic/Starter detection criteria]

## 3. 8-Language Trigger Keywords
[EN, KO, JA, ZH, ES, FR, DE, IT trigger patterns]

## 4. Naming Conventions
[PascalCase, camelCase, UPPER_SNAKE_CASE, kebab-case rules]

## 5. Code Quality Standards
[OWASP, security, error handling rules]
```

**Directory**:
```
bkit-rules/
├── SKILL.md
├── agents/
│   └── openai.yaml        # allow_implicit_invocation: false
└── references/
    ├── naming-conventions.md
    └── code-quality-standards.md
```

#### 3.4.2 pdca

**Original**: `skills/pdca/SKILL.md` (multi-binding: analyze→gap-detector, iterate→pdca-iterator, report→report-generator)
**Portability**: ⚠️ (multi-binding → description 통합)

```yaml
---
name: pdca
description: |
  Unified PDCA cycle management. Supports: plan, design, do, analyze, iterate,
  report, status, next, archive, cleanup.
  Actions: plan→create plan doc, design→create design doc, do→implementation guide,
  analyze→gap analysis (design vs code), iterate→auto-fix gaps,
  report→completion report, status→show progress, next→suggest next phase.
  Triggers: pdca, plan, design, analyze, iterate, report, status, gap analysis,
  계획, 설계, 분석, 검증, 보고서, 計画, 設計, 分析, 计划, 设计,
  planificar, diseño, analizar, planifier, conception, Planung, pianificare
  Do NOT use for: bkit rules reference (use $bkit-rules), template details
  (use $bkit-templates), level-specific guidance (use $starter/$dynamic/$enterprise).
---
```

**Body Structure**:
```
# PDCA Unified Skill

## Usage
$pdca plan {feature} - Create plan document
$pdca design {feature} - Create design document
$pdca do {feature} - Implementation guide
$pdca analyze {feature} - Gap analysis
$pdca iterate {feature} - Auto-improvement
$pdca report {feature} - Completion report
$pdca status - Current status
$pdca next - Next phase suggestion
$pdca archive {feature} - Archive completed PDCA
$pdca cleanup - Clean archived features

## Phase Flow
Plan → Design → Do → Check(analyze) → Act(iterate) → Report → Archive

## Plan Phase
1. Call bkit_pdca_plan(feature, level) MCP tool
2. Write template to docs/01-plan/features/{feature}.plan.md
3. Fill in: Goals, Scope, Success Criteria, Schedule
4. Call bkit_complete_phase(feature, "plan")

## Design Phase
1. Verify plan exists (required prerequisite)
2. Call bkit_pdca_design(feature, level) MCP tool
3. Write template to docs/02-design/features/{feature}.design.md
4. Fill in: Architecture, Data Model, API Spec, Test Plan
5. Call bkit_complete_phase(feature, "design")

## Do Phase
1. Verify design exists (required prerequisite)
2. Reference design document during implementation
3. Follow implementation order from design
4. Call bkit_pre_write_check before each file write
5. Call bkit_post_write after significant changes
6. Call bkit_complete_phase(feature, "do") when done

## Analyze Phase (Check)
1. Call bkit_pdca_analyze(feature) MCP tool
2. Compare design document vs implementation code
3. Calculate Match Rate and generate gap list
4. Write analysis to docs/03-analysis/{feature}.analysis.md
5. If matchRate >= 90%: suggest report
6. If matchRate < 90%: suggest iterate

## Iterate Phase (Act)
1. Read gap list from analysis
2. Fix identified gaps in code
3. Re-run analysis: call bkit_pdca_analyze(feature)
4. Repeat until matchRate >= 90% or max 5 iterations
5. Call bkit_complete_phase(feature, "act")

## Report Phase
1. Verify matchRate >= 90%
2. Generate completion report
3. Write to docs/04-report/{feature}.report.md
4. Include: completed items, learnings, metrics

## Status
1. Call bkit_get_status(feature) MCP tool
2. Display: feature, phase, matchRate, iteration count
3. Show progress: [Plan]✅ → [Design]✅ → [Do]🔄 → [Check]⏳

## Next
1. Call bkit_pdca_next(feature) MCP tool
2. Display recommended next action with command

## Template References
See references/ directory for PDCA document templates.
```

**Directory**:
```
pdca/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    ├── plan.template.md
    ├── design.template.md
    ├── design-starter.template.md
    ├── design-enterprise.template.md
    ├── analysis.template.md
    └── report.template.md
```

#### 3.4.3 bkit-templates

**Original**: `skills/bkit-templates/SKILL.md` (template selection guide)
**Portability**: ✅

```yaml
---
name: bkit-templates
description: |
  PDCA document templates for consistent documentation. Provides template
  selection guide based on phase and project level.
  Triggers: template, plan document, design document, analysis, report,
  템플릿, 계획서, 설계서, テンプレート, 模板, plantilla, modèle, Vorlage, modello
  Do NOT use for: executing PDCA actions (use $pdca instead).
---
```

**Body**: Template selection matrix (phase × level) + template structure overview.

**Directory**:
```
bkit-templates/
├── SKILL.md
└── references/
    ├── plan.template.md
    ├── design.template.md
    ├── design-starter.template.md
    ├── design-enterprise.template.md
    ├── analysis.template.md
    ├── report.template.md
    └── do.template.md
```

### 3.5 P1 Skills (Level & Pipeline) - 13 Skills

#### 3.5.1 starter

```yaml
---
name: starter
description: |
  Static web development guide for beginners. Covers HTML/CSS/JavaScript
  and Next.js App Router basics. Project initialization with "init starter".
  Triggers: static website, portfolio, landing page, HTML CSS, beginner,
  정적 웹, 포트폴리오, 초보자, 静的サイト, 初心者, 静态网站, 初学者,
  sitio web estático, site statique, statische Website, sito web statico
  Do NOT use for: fullstack apps (use $dynamic), enterprise (use $enterprise).
---
```

#### 3.5.2 dynamic

```yaml
---
name: dynamic
description: |
  Fullstack development with bkend.ai BaaS. Covers authentication,
  data storage, API integration. Project initialization with "init dynamic".
  Triggers: fullstack, BaaS, bkend, authentication, login, signup, database,
  풀스택, 인증, 로그인, フルスタック, 認証, 全栈, 身份验证,
  autenticación, authentification, Authentifizierung, autenticazione
  Do NOT use for: static sites (use $starter), enterprise MSA (use $enterprise).
---
```

#### 3.5.3 enterprise

```yaml
---
name: enterprise
description: |
  Enterprise-grade system development with microservices, Kubernetes, Terraform.
  Includes AI Native methodology and Monorepo patterns.
  Project initialization with "init enterprise".
  Actions: init→system setup, strategy→architecture decisions,
  infra→infrastructure design, review→architecture review.
  Triggers: microservices, kubernetes, terraform, k8s, AWS, monorepo,
  마이크로서비스, 쿠버네티스, マイクロサービス, 微服务,
  microservicios, microservices, Microservices, microservizi
  Do NOT use for: simple websites (use $starter), BaaS apps (use $dynamic).
---
```

#### 3.5.4 development-pipeline

```yaml
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
```

**Body**: 9-phase overview + level-specific flow (Starter: 1→2→3→6→9, Dynamic: 1→2→3→4→5→6→7→9, Enterprise: All).

#### 3.5.5~3.5.13 Phase Skills (phase-1 through phase-9)

**Common Pattern**:

```yaml
---
name: phase-{N}-{name}
description: |
  Phase {N}: {Title}. {Brief description of what this phase covers}.
  Triggers: {phase-specific keywords in 8 languages}
  Do NOT use for: {exclusions}
  Next: $phase-{N+1}-{next-name}
---
```

| # | Skill Name | Description | Key References |
|:-:|-----------|-------------|----------------|
| 1 | `phase-1-schema` | Data modeling, terminology, entity design | schema-patterns.md |
| 2 | `phase-2-convention` | Coding conventions, naming rules, style guide | naming-conventions.md |
| 3 | `phase-3-mockup` | UI/UX mockups, wireframes, prototypes | mockup-patterns.md |
| 4 | `phase-4-api` | API design, REST endpoints, Zero Script QA | api-patterns.md |
| 5 | `phase-5-design-system` | Component library, design tokens, theming | design-system-guide.md |
| 6 | `phase-6-ui-integration` | Frontend-backend integration, state management | integration-patterns.md |
| 7 | `phase-7-seo-security` | SEO optimization, security hardening, OWASP | security-checklist.md |
| 8 | `phase-8-review` | Code review, architecture review, gap analysis | review-checklist.md |
| 9 | `phase-9-deployment` | CI/CD, production deployment, monitoring | deployment-guide.md |

**Phase Chaining** (description 말미):
```
phase-1: "Next: $phase-2-convention"
phase-2: "Next: $phase-3-mockup"
...
phase-8: "Next: $phase-9-deployment"
phase-9: (no next)
```

**Example: phase-1-schema SKILL.md**:

```yaml
---
name: phase-1-schema
description: |
  Phase 1: Schema & Terminology. Define data models, entities, relationships,
  and domain terminology used throughout the project.
  Triggers: schema, terminology, data model, entity, 스키마, 용어,
  データモデル, 数据模型, esquema, schéma, Schema, schema
  Do NOT use for: UI design (use $phase-3-mockup), API design (use $phase-4-api).
  Next: $phase-2-convention
---
```

### 3.6 P2 Skills (Specialized) - 5 Skills

#### 3.6.1 code-review

```yaml
---
name: code-review
description: |
  Code review for quality analysis, bug detection, and best practices.
  Provides comprehensive review with actionable feedback.
  Triggers: code review, review code, check code, analyze code, bug detection,
  코드 리뷰, 코드 검토, コードレビュー, 代码审查, revisión de código,
  revue de code, Code-Review, revisione del codice
  Do NOT use for: PDCA workflow (use $pdca), security-specific review (use $phase-7).
---
```

#### 3.6.2 zero-script-qa

```yaml
---
name: zero-script-qa
description: |
  Zero Script QA - Testing without test scripts. Uses structured JSON logging
  and real-time Docker log monitoring for verification.
  Triggers: zero script qa, log-based testing, docker logs, QA,
  제로 스크립트 QA, ゼロスクリプトQA, 零脚本QA,
  QA sin scripts, QA sans script, skriptloses QA, QA senza script
  Do NOT use for: unit testing with scripts, frontend-only testing.
---
```

#### 3.6.3 mobile-app

```yaml
---
name: mobile-app
description: |
  Mobile app development guide for React Native, Flutter, and Expo.
  Triggers: mobile app, React Native, Flutter, Expo, iOS, Android,
  모바일 앱, モバイルアプリ, 移动应用, aplicación móvil,
  application mobile, mobile App, applicazione mobile
  Do NOT use for: web-only projects, desktop apps (use $desktop-app).
---
```

#### 3.6.4 desktop-app

```yaml
---
name: desktop-app
description: |
  Desktop app development guide for Electron and Tauri frameworks.
  Triggers: desktop app, Electron, Tauri, mac app, windows app,
  데스크톱 앱, デスクトップアプリ, 桌面应用, aplicación de escritorio,
  application de bureau, Desktop-App, applicazione desktop
  Do NOT use for: web-only projects, mobile apps (use $mobile-app).
---
```

#### 3.6.5 codex-learning (NEW)

```yaml
---
name: codex-learning
description: |
  Codex CLI learning and optimization guide. Teaches configuration,
  AGENTS.md setup, MCP servers, skills management, and best practices.
  Start learning with "learn codex" or "setup codex".
  Triggers: learn codex, codex setup, AGENTS.md, MCP, skills, configuration,
  코덱스 배우기, 설정 방법, コーデックス学習, 学习Codex,
  aprender codex, apprendre codex, Codex lernen, imparare codex
  Do NOT use for: bkit-specific PDCA workflow (use $pdca).
---
```

**Body**: Codex CLI commands, config.toml setup, AGENTS.md writing, skill management, MCP configuration guide.

### 3.7 P3 Skills (bkend Ecosystem) - 5 Skills

#### 3.7.1~3.7.5 bkend Skills

| # | Skill | Description Trigger Keywords |
|:-:|-------|------------------------------|
| 1 | `bkend-quickstart` | bkend setup, first project, MCP connect |
| 2 | `bkend-data` | table, column, CRUD, schema, index, filter |
| 3 | `bkend-auth` | signup, login, JWT, session, RBAC, password |
| 4 | `bkend-storage` | file upload, download, presigned, bucket, CDN |
| 5 | `bkend-cookbook` | cookbook, tutorial, example project, todo app |

**Common Pattern**:

```yaml
---
name: bkend-{topic}
description: |
  bkend.ai {topic} expert. {Brief description}.
  Triggers: {topic-specific keywords in 8 languages}
  Do NOT use for: {exclusions}
---
```

**Directory** (공통):
```
bkend-{topic}/
├── SKILL.md
└── references/
    └── bkend-patterns.md    # 공유 bkend API 패턴
```

### 3.8 Skills Summary Table

| # | Skill | Priority | Portability | references/ | scripts/ | openai.yaml |
|:-:|-------|:--------:|:-----------:|:-----------:|:--------:|:-----------:|
| 1 | bkit-rules | P0 | ⚠️ | 2 files | - | ✅ (no implicit) |
| 2 | pdca | P0 | ⚠️ | 6 files | - | ✅ |
| 3 | bkit-templates | P0 | ✅ | 7 files | - | ✅ |
| 4 | starter | P1 | ✅ | - | - | ✅ |
| 5 | dynamic | P1 | ✅ | - | - | ✅ |
| 6 | enterprise | P1 | ⚠️ | - | - | ✅ |
| 7 | development-pipeline | P1 | ✅ | - | - | ✅ |
| 8-16 | phase-1~9 | P1 | ✅/⚠️ | 1 each | - | ✅ |
| 17 | code-review | P2 | ⚠️ | 1 file | - | ✅ |
| 18 | zero-script-qa | P2 | ⚠️ | 1 file | - | ✅ |
| 19 | mobile-app | P2 | ✅ | - | - | ✅ |
| 20 | desktop-app | P2 | ✅ | - | - | ✅ |
| 21 | codex-learning | P2 | ✅ (NEW) | 1 file | - | ✅ |
| 22-26 | bkend-* | P3 | ✅ | 1 shared | - | ✅ |

**Total references files**: ~30 files across all skills

---

## 4. MCP Server Design (16 Tools)

### 4.1 Architecture

```
packages/mcp-server/
├── package.json              # @popup-studio/bkit-codex-mcp, dependencies: {}
├── index.js                  # Entry point: STDIO transport initialization
├── src/
│   ├── server.js             # JSON-RPC 2.0 protocol handler
│   ├── tools/
│   │   ├── index.js          # Tool registry (name → handler mapping)
│   │   ├── init.js           # bkit_init
│   │   ├── get-status.js     # bkit_get_status
│   │   ├── pre-write.js      # bkit_pre_write_check
│   │   ├── post-write.js     # bkit_post_write
│   │   ├── complete.js       # bkit_complete_phase
│   │   ├── pdca-plan.js      # bkit_pdca_plan
│   │   ├── pdca-design.js    # bkit_pdca_design
│   │   ├── pdca-analyze.js   # bkit_pdca_analyze
│   │   ├── pdca-next.js      # bkit_pdca_next
│   │   ├── analyze-prompt.js # bkit_analyze_prompt
│   │   ├── classify.js       # bkit_classify_task
│   │   ├── detect-level.js   # bkit_detect_level
│   │   ├── template.js       # bkit_select_template
│   │   ├── deliverables.js   # bkit_check_deliverables
│   │   ├── memory-read.js    # bkit_memory_read
│   │   └── memory-write.js   # bkit_memory_write
│   └── lib/                  # Ported from bkit-claude-code/lib/ (~75 functions)
│       ├── core/             # 20 functions
│       │   ├── config.js     # loadConfig, getConfig, mergeConfig, validateConfig
│       │   ├── cache.js      # getCache, setCache, invalidateCache, clearCache
│       │   ├── file.js       # readJsonFile, writeJsonFile, fileExists, ensureDir
│       │   └── path.js       # resolveProjectPath, getDocsPath, getFeaturePath
│       ├── pdca/             # 35 functions
│       │   ├── status.js     # readPdcaStatus, writePdcaStatus, getFeatureStatus, setFeaturePhase, addFeature, removeFeature, getActiveFeatures, getPrimaryFeature
│       │   ├── level.js      # detectLevel, getLevelConfig, isLevelMatch
│       │   ├── phase.js      # getCurrentPhase, setPhase, getNextPhase, validatePhaseTransition, getPhaseDeliverables, checkDeliverables
│       │   ├── automation.js # classifyTask, shouldApplyPdca, checkDesignExists, checkPlanExists, suggestNextAction, formatPdcaProgress
│       │   └── template.js   # selectTemplate, getTemplateContent, resolveTemplateVariables
│       ├── intent/           # 12 functions
│       │   ├── language.js   # detectLanguage, getSupportedLanguages
│       │   ├── trigger.js    # matchSkillTrigger, matchAgentTrigger, getImplicitTriggers
│       │   └── ambiguity.js  # calculateAmbiguityScore, needsClarification, generateClarifyingQuestions
│       └── task/             # 8 functions
│           ├── classification.js  # classifyByLines, classifyByDescription, getClassificationLabel
│           └── creator.js    # createPdcaTask, formatTaskSubject
├── tests/
│   ├── server.test.js        # Protocol handler tests
│   ├── tools.test.js         # Tool integration tests
│   └── lib.test.js           # Library function tests
└── README.md
```

### 4.2 Protocol Handler (`src/server.js`)

```javascript
// JSON-RPC 2.0 over STDIO
// Reads from stdin, writes to stdout, logs to stderr

const PROTOCOL_VERSION = "2024-11-05";

// Supported methods:
// - initialize: Return server capabilities
// - tools/list: Return all 16 tool definitions
// - tools/call: Execute a tool and return result
// - notifications/initialized: Client confirmation

// Server state:
// - projectDir: Set via bkit_init or tools/call context
// - cache: In-memory TTL cache (5s default)
// - pdcaStatus: Cached .pdca-status.json
// - memory: Cached .bkit-memory.json
```

**Server Capabilities Response**:
```json
{
  "protocolVersion": "2024-11-05",
  "serverInfo": {
    "name": "bkit-codex-mcp",
    "version": "1.0.0"
  },
  "capabilities": {
    "tools": {}
  }
}
```

### 4.3 Tool Specifications

#### 4.3.1 bkit_init (P0)

**Purpose**: Session initialization. Detects project level, reads PDCA status.
**Replaces**: SessionStart hook

```json
{
  "name": "bkit_init",
  "description": "Initialize bkit session. Call at the start of each session. Detects project level, reads PDCA status, and returns session context.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectDir": {
        "type": "string",
        "description": "Absolute path to the project root directory"
      }
    },
    "required": ["projectDir"]
  }
}
```

**Output**:
```json
{
  "level": "Dynamic",
  "pdcaStatus": {
    "activeFeatures": ["user-auth"],
    "primaryFeature": "user-auth",
    "features": { "user-auth": { "phase": "design", "matchRate": null } }
  },
  "sessionId": "bkit-1708000000",
  "guidance": "Feature 'user-auth' is in design phase. Continue with design or start implementation."
}
```

**Implementation Notes**:
- Call `detectLevel(projectDir)` from `lib/pdca/level.js`
- Call `readPdcaStatus(projectDir)` from `lib/pdca/status.js`
- Set `projectDir` in server state for subsequent tool calls
- Cache result with 5s TTL

#### 4.3.2 bkit_get_status (P0)

**Purpose**: PDCA status retrieval
**Replaces**: PDCA status check in hooks

```json
{
  "name": "bkit_get_status",
  "description": "Get current PDCA status for the project or a specific feature. Returns phase, match rate, and recommendations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "feature": {
        "type": "string",
        "description": "Feature name. If omitted, returns all active features."
      }
    }
  }
}
```

**Output** (feature specified):
```json
{
  "feature": "user-auth",
  "phase": "design",
  "matchRate": null,
  "iterationCount": 0,
  "documents": {
    "plan": "docs/01-plan/features/user-auth.plan.md",
    "design": "docs/02-design/features/user-auth.design.md"
  },
  "progress": "[Plan]✅ → [Design]🔄 → [Do]⏳ → [Check]⏳ → [Act]⏳",
  "nextAction": "Complete design document, then start implementation"
}
```

#### 4.3.3 bkit_pre_write_check (P0)

**Purpose**: Pre-write PDCA compliance check
**Replaces**: PreToolUse(Write|Edit) hook

```json
{
  "name": "bkit_pre_write_check",
  "description": "Check PDCA compliance before writing/editing source code. Returns whether design documents exist and provides guidance.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": {
        "type": "string",
        "description": "Path of the file being written or edited"
      },
      "feature": {
        "type": "string",
        "description": "Feature name if known (auto-detected from path if omitted)"
      }
    },
    "required": ["filePath"]
  }
}
```

**Output**:
```json
{
  "allowed": true,
  "feature": "user-auth",
  "hasDesign": true,
  "designPath": "docs/02-design/features/user-auth.design.md",
  "guidance": "Design document exists. Reference sections: Architecture (3.1), Data Model (3.2), API Spec (4.1).",
  "taskClassification": "feature",
  "conventionHints": ["Components: PascalCase", "Files: kebab-case"]
}
```

**Logic**:
1. Extract feature name from `filePath` (directory name or file prefix)
2. Check `docs/02-design/features/{feature}.design.md` existence
3. Check `docs/01-plan/features/{feature}.plan.md` existence
4. Classify task size via `classifyByLines()`
5. Return guidance based on PDCA state

#### 4.3.4 bkit_complete_phase (P0)

**Purpose**: PDCA phase completion and transition
**Replaces**: Stop hook state transition

```json
{
  "name": "bkit_complete_phase",
  "description": "Mark a PDCA phase as complete. Updates .pdca-status.json and returns next phase recommendation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "feature": {
        "type": "string",
        "description": "Feature name"
      },
      "phase": {
        "type": "string",
        "enum": ["plan", "design", "do", "check", "act", "report"],
        "description": "Phase being completed"
      }
    },
    "required": ["feature", "phase"]
  }
}
```

**Output**:
```json
{
  "completed": "design",
  "nextPhase": "do",
  "recommendation": "Start implementation. Reference design at docs/02-design/features/user-auth.design.md",
  "progress": "[Plan]✅ → [Design]✅ → [Do]⏳ → [Check]⏳ → [Act]⏳"
}
```

#### 4.3.5 bkit_pdca_plan (P0)

**Purpose**: Plan document template generation
**Replaces**: /pdca plan skill action

```json
{
  "name": "bkit_pdca_plan",
  "description": "Generate a plan document template for a feature. Returns template content to write to docs/01-plan/features/{feature}.plan.md",
  "inputSchema": {
    "type": "object",
    "properties": {
      "feature": {
        "type": "string",
        "description": "Feature name in kebab-case"
      },
      "level": {
        "type": "string",
        "enum": ["Starter", "Dynamic", "Enterprise"],
        "description": "Project level for template selection (auto-detected if omitted)"
      }
    },
    "required": ["feature"]
  }
}
```

**Output**:
```json
{
  "template": "# {Feature} - Plan Document\n\n> Date: ...\n\n## 1. Overview\n...",
  "outputPath": "docs/01-plan/features/{feature}.plan.md",
  "phase": "plan",
  "guidance": "Fill in the template sections. When complete, call bkit_complete_phase(feature, 'plan')."
}
```

#### 4.3.6 bkit_pdca_design (P0)

**Purpose**: Design document template generation
**Replaces**: /pdca design skill action

```json
{
  "name": "bkit_pdca_design",
  "description": "Generate a design document template. Requires plan document to exist. Returns template content.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "feature": {
        "type": "string",
        "description": "Feature name in kebab-case"
      },
      "level": {
        "type": "string",
        "enum": ["Starter", "Dynamic", "Enterprise"],
        "description": "Project level for template selection"
      }
    },
    "required": ["feature"]
  }
}
```

**Output**:
```json
{
  "template": "# {Feature} - Design Document\n\n> Date: ...\n\n## 1. Architecture\n...",
  "outputPath": "docs/02-design/features/{feature}.design.md",
  "phase": "design",
  "planReference": "docs/01-plan/features/{feature}.plan.md",
  "guidance": "Reference plan document for requirements. Fill in architecture, data model, and API sections."
}
```

**Prerequisite**: Plan document must exist. Returns error with guidance if missing.

#### 4.3.7 bkit_analyze_prompt (P1)

**Purpose**: User intent detection and trigger matching
**Replaces**: UserPromptSubmit hook

```json
{
  "name": "bkit_analyze_prompt",
  "description": "Analyze user prompt to detect intent, match skill/agent triggers, and check ambiguity. Supports 8 languages (en, ko, ja, zh, es, fr, de, it).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "description": "User's input text to analyze"
      }
    },
    "required": ["prompt"]
  }
}
```

**Output**:
```json
{
  "language": "ko",
  "intent": {
    "type": "feature_request",
    "feature": "user-auth",
    "confidence": 0.9
  },
  "triggers": {
    "skills": ["dynamic"],
    "keywords": ["로그인", "인증"]
  },
  "ambiguity": {
    "score": 25,
    "needsClarification": false
  },
  "suggestedAction": "Check PDCA status for user-auth feature",
  "pdcaRecommendation": "No plan document found. Suggest: $pdca plan user-auth"
}
```

**Implementation**:
1. `detectLanguage(prompt)` → 8 languages
2. `detectNewFeatureIntent(prompt)` → feature name + confidence
3. `matchSkillTrigger(prompt)` → matching skills
4. `calculateAmbiguityScore(prompt)` → 0-100 score
5. Check PDCA status for detected feature
6. Generate combined recommendation

#### 4.3.8 bkit_post_write (P1)

**Purpose**: Post-write guidance
**Replaces**: PostToolUse(Write) hook

```json
{
  "name": "bkit_post_write",
  "description": "Provide guidance after code changes. Suggests gap analysis and reports next steps.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": {
        "type": "string",
        "description": "Path of the file that was modified"
      },
      "linesChanged": {
        "type": "number",
        "description": "Number of lines changed"
      },
      "feature": {
        "type": "string",
        "description": "Feature name if known"
      }
    },
    "required": ["filePath"]
  }
}
```

**Output**:
```json
{
  "feature": "user-auth",
  "taskClassification": "feature",
  "hasDesign": true,
  "suggestGapAnalysis": true,
  "guidance": "Significant changes detected. Consider running gap analysis: $pdca analyze user-auth",
  "nextSteps": ["Complete remaining implementation", "Run gap analysis when ready"]
}
```

#### 4.3.9 bkit_pdca_analyze (P1)

**Purpose**: Gap analysis between design and implementation
**Replaces**: /pdca analyze → gap-detector agent

```json
{
  "name": "bkit_pdca_analyze",
  "description": "Analyze gaps between design document and implementation code. Returns match rate and gap list.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "feature": {
        "type": "string",
        "description": "Feature name to analyze"
      }
    },
    "required": ["feature"]
  }
}
```

**Output**:
```json
{
  "feature": "user-auth",
  "designPath": "docs/02-design/features/user-auth.design.md",
  "analysisPath": "docs/03-analysis/user-auth.analysis.md",
  "matchRate": null,
  "guidance": "Read the design document and compare with implementation code. Write analysis results to the analysis path. Calculate match rate based on: implemented items / total design items * 100.",
  "template": "# Gap Analysis: user-auth\n\n## Match Rate: __%\n\n## Implemented\n- [ ] ...\n\n## Missing\n- [ ] ...\n\n## Changed\n- [ ] ..."
}
```

**Note**: Unlike bkit-claude-code (where gap-detector agent does the analysis), in Codex the AI itself performs the analysis guided by the MCP tool's returned template and design document reference.

#### 4.3.10 bkit_pdca_next (P1)

**Purpose**: Next phase recommendation
**Replaces**: /pdca next

```json
{
  "name": "bkit_pdca_next",
  "description": "Get recommendation for the next PDCA phase based on current status.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "feature": {
        "type": "string",
        "description": "Feature name"
      }
    },
    "required": ["feature"]
  }
}
```

**Output**:
```json
{
  "currentPhase": "do",
  "nextPhase": "check",
  "recommendation": "Implementation appears complete. Run gap analysis to verify design compliance.",
  "command": "$pdca analyze user-auth",
  "progress": "[Plan]✅ → [Design]✅ → [Do]✅ → [Check]⏳ → [Act]⏳"
}
```

#### 4.3.11 bkit_classify_task (P1)

**Purpose**: Task size classification
**Replaces**: PreToolUse task classification

```json
{
  "name": "bkit_classify_task",
  "description": "Classify task size based on estimated lines of code change.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "estimatedLines": {
        "type": "number",
        "description": "Estimated lines of code to be changed"
      },
      "description": {
        "type": "string",
        "description": "Brief task description"
      }
    },
    "required": ["estimatedLines"]
  }
}
```

**Output**:
```json
{
  "classification": "feature",
  "label": "Feature",
  "estimatedLines": 150,
  "pdcaRequired": true,
  "recommendation": "Create plan and design documents before implementation."
}
```

**Thresholds** (from bkit.config.json):
- `quick_fix`: < 10 lines → PDCA: None
- `minor_change`: < 50 lines → PDCA: Recommended
- `feature`: < 200 lines → PDCA: Required
- `major_feature`: >= 200 lines → PDCA: Required + Split

#### 4.3.12 bkit_detect_level (P1)

**Purpose**: Project level detection
**Replaces**: SessionStart level detection

```json
{
  "name": "bkit_detect_level",
  "description": "Detect project level (Starter/Dynamic/Enterprise) based on directory structure and config files.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectDir": {
        "type": "string",
        "description": "Project root directory path"
      }
    },
    "required": ["projectDir"]
  }
}
```

**Output**:
```json
{
  "level": "Dynamic",
  "evidence": ["Found .mcp.json", "Found api/ directory"],
  "confidence": "high",
  "recommendedSkill": "$dynamic",
  "pipelinePhases": [1, 2, 3, 4, 5, 6, 7, 9]
}
```

**Detection Logic**:
1. Check Enterprise indicators: `kubernetes/`, `terraform/`, `k8s/`, `infra/`
2. Check Dynamic indicators: `lib/bkend/`, `supabase/`, `api/`, `.mcp.json`, `docker-compose.yml`
3. Check package.json for BaaS patterns: `bkend`, `@supabase`, `firebase`
4. Default: Starter

#### 4.3.13 bkit_select_template (P2)

**Purpose**: Template selection for PDCA documents
**Replaces**: Template selection logic in skills

```json
{
  "name": "bkit_select_template",
  "description": "Select appropriate PDCA template based on phase and project level.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "phase": {
        "type": "string",
        "enum": ["plan", "design", "analysis", "report", "do"],
        "description": "PDCA phase"
      },
      "level": {
        "type": "string",
        "enum": ["Starter", "Dynamic", "Enterprise"],
        "description": "Project level (auto-detected if omitted)"
      }
    },
    "required": ["phase"]
  }
}
```

**Template Selection Matrix**:

| Phase | Starter | Dynamic | Enterprise |
|-------|---------|---------|------------|
| plan | plan.template.md | plan.template.md | plan.template.md |
| design | design-starter.template.md | design.template.md | design-enterprise.template.md |
| analysis | analysis.template.md | analysis.template.md | analysis.template.md |
| report | report.template.md | report.template.md | report.template.md |
| do | do.template.md | do.template.md | do.template.md |

#### 4.3.14 bkit_check_deliverables (P2)

**Purpose**: Pipeline phase deliverable verification
**Replaces**: Phase completion check in hooks

```json
{
  "name": "bkit_check_deliverables",
  "description": "Check if required deliverables for a pipeline phase are complete.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "phase": {
        "type": "number",
        "minimum": 1,
        "maximum": 9,
        "description": "Pipeline phase number (1-9)"
      },
      "feature": {
        "type": "string",
        "description": "Feature name"
      }
    },
    "required": ["phase"]
  }
}
```

#### 4.3.15 bkit_memory_read (P2)

**Purpose**: Session memory retrieval
**Replaces**: FR-08 memory-store.js

```json
{
  "name": "bkit_memory_read",
  "description": "Read from bkit session memory (docs/.bkit-memory.json). Read a specific key or get all memory.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "key": {
        "type": "string",
        "description": "Memory key to read. Omit to get all memory."
      }
    }
  }
}
```

#### 4.3.16 bkit_memory_write (P2)

**Purpose**: Session memory storage
**Replaces**: FR-08 memory-store.js

```json
{
  "name": "bkit_memory_write",
  "description": "Write to bkit session memory (docs/.bkit-memory.json). Persists across sessions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "key": {
        "type": "string",
        "description": "Memory key"
      },
      "value": {
        "description": "Value to store (any JSON-serializable type)"
      }
    },
    "required": ["key", "value"]
  }
}
```

### 4.4 Tool Priority & AGENTS.md Integration

```
AGENTS.md 지시문 (Static Rule)            → MCP Tool 호출 (Dynamic)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"세션 시작 시 bkit_init 호출하세요"          → bkit_init(projectDir)
"첫 사용자 메시지에 bkit_analyze_prompt"    → bkit_analyze_prompt(prompt)
"코드 작성 전 bkit_pre_write_check 호출"    → bkit_pre_write_check(filePath)
"코드 작성 후 bkit_post_write 호출"         → bkit_post_write(filePath)
"단계 완료 시 bkit_complete_phase"          → bkit_complete_phase(feature, phase)
```

### 4.5 Automation Guarantee Levels

| Behavior | Claude Code (Hook) | Codex (AGENTS.md + MCP) | Level |
|----------|:------------------:|:-----------------------:|:-----:|
| Session init | 100% (SessionStart) | AGENTS.md → bkit_init | 95% |
| Intent detection | 100% (UserPromptSubmit) | AGENTS.md → bkit_analyze_prompt | 85% |
| Pre-write check | 100% (PreToolUse) | AGENTS.md → bkit_pre_write_check | 80% |
| Post-write guide | 100% (PostToolUse) | AGENTS.md → bkit_post_write | 75% |
| Phase transition | 100% (Stop) | AGENTS.md → bkit_complete_phase | 80% |
| Team orchestration | 100% (SubagentStart/Stop) | **Not available** | 0% |
| **Average** | **100%** | **~69%** | |

---

## 5. Lib Module Porting Design

### 5.1 Module Selection (241 → ~75 functions)

| Module | bkit Total | Ported | Excluded | Exclusion Reason |
|--------|:---------:|:------:|:--------:|------------------|
| core/ | 41 | 20 | 21 | platform.js (Claude Code 전용), io.js (Hook stdin/stdout), debug.js (일부) |
| pdca/ | 54 | 35 | 19 | automation.js Hook I/O, AskUserQuestion 래퍼 |
| intent/ | 19 | 12 | 7 | Hook 전용 래퍼, session context 함수 |
| task/ | 26 | 8 | 18 | context.js (세션 상태 → MCP 서버 내부), tracker.js (Claude Code Task API) |
| team/ | 40 | 0 | 40 | **전체 제외** (Codex에 팀 에이전트 없음) |
| **Total** | **241** | **75** | **166** | |

### 5.2 Porting Modifications

| Pattern | bkit Original | Codex Adaptation |
|---------|---------------|------------------|
| `PROJECT_DIR` | `process.env.CLAUDE_PROJECT_DIR` | MCP Tool `projectDir` argument |
| Hook I/O | `readStdinSync()`, `outputAllow()` | 제거, MCP response로 대체 |
| `globalCache` | 메모리 내 싱글턴 | MCP 서버 프로세스 내 유지 (STDIO = 장기 실행) |
| `debugLog` | stdout/stderr 혼재 | stderr 전용 (`console.error`) |
| Lazy require | `getCore()` 패턴 | 유지 (순환 참조 방지) |
| `fs.existsSync` | 동기 I/O | 비동기 `fs.promises` 권장, 동기 허용 |

### 5.3 Core Functions Detail

#### core/config.js

```javascript
// loadConfig(projectDir) → merged config object
// - Reads: .bkit-codex/bkit.config.json (if exists)
// - Fallback: embedded default config
// - Merges: defaults < project config

// getConfig(keyPath) → value
// - Dot-notation access: "pdca.matchRateThreshold" → 90

// mergeConfig(base, override) → merged
// - Deep merge with array replacement

// validateConfig(config) → { valid, errors }
// - Schema validation for required fields
```

#### pdca/status.js

```javascript
// readPdcaStatus(projectDir) → status object (v2.0 schema)
// - Reads: docs/.pdca-status.json
// - Returns default if file doesn't exist

// writePdcaStatus(projectDir, status) → void
// - Writes: docs/.pdca-status.json with pretty formatting

// getFeatureStatus(projectDir, feature) → feature status
// - Returns specific feature from status

// setFeaturePhase(projectDir, feature, phase) → updated status
// - Updates phase, lastUpdated timestamp

// addFeature(projectDir, feature, initialPhase) → updated status
// - Adds new feature with initial phase

// getActiveFeatures(projectDir) → string[]
// - Returns list of active (non-archived) features
```

#### intent/language.js

```javascript
// detectLanguage(text) → language code
// - Unicode range detection:
//   Korean: /[\uAC00-\uD7AF]/ → "ko"
//   Japanese: /[\u3040-\u30FF]/ → "ja"
//   Chinese: /[\u4E00-\u9FFF]/ (without Japanese) → "zh"
//   Default: "en"
// - Also detects: es, fr, de, it via keyword patterns
```

#### intent/trigger.js

```javascript
// matchSkillTrigger(text) → { skill, confidence, language }
// - 4 skills × 8 languages trigger matrix
// - Patterns: "static site" → starter, "login" → dynamic,
//   "microservices" → enterprise, "mobile app" → mobile-app

// matchAgentTrigger(text) → { agent, confidence, language }
// - 7 agents × 8 languages trigger matrix
// - Patterns: "verify" → gap-detector, "improve" → pdca-iterator,
//   "analyze" → code-analyzer, "report" → report-generator
```

#### intent/ambiguity.js

```javascript
// calculateAmbiguityScore(text) → number (0-100)
// - Scoring factors:
//   +20: no specific nouns
//   +20: undefined scope
//   +30: multiple interpretations
//   +30: context conflict
//   -30: contains file path
//   -20: contains technical terms
// - Magic word bypass: !hotfix, !prototype, !bypass → score = 0

// needsClarification(score) → boolean
// - Returns true if score >= 50
```

---

## 6. State Management Design

### 6.1 docs/.pdca-status.json (v2.0 Schema)

```json
{
  "version": "2.0",
  "lastUpdated": "2026-02-14T09:00:00.000Z",
  "activeFeatures": ["user-auth"],
  "primaryFeature": "user-auth",
  "features": {
    "user-auth": {
      "phase": "design",
      "matchRate": null,
      "iterationCount": 0,
      "documents": {
        "plan": "docs/01-plan/features/user-auth.plan.md",
        "design": "docs/02-design/features/user-auth.design.md"
      }
    }
  },
  "pipeline": {
    "currentPhase": 1,
    "level": "Dynamic",
    "phaseHistory": []
  },
  "session": {
    "startedAt": "2026-02-14T07:00:00.000Z",
    "onboardingCompleted": true,
    "lastActivity": "2026-02-14T09:00:00.000Z"
  },
  "history": []
}
```

**Compatibility**: bkit-claude-code 프로젝트에서 bkit-codex로 전환 시 동일 스키마 사용. 상태 유실 없음.

### 6.2 docs/.bkit-memory.json

```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-14T09:00:00.000Z",
  "data": {
    "lastFeature": "user-auth",
    "sessionCount": 5,
    "userPreferences": {
      "language": "ko",
      "level": "Dynamic"
    }
  }
}
```

### 6.3 State Lifecycle

```
Session Start
    │
    ├── bkit_init → reads .pdca-status.json + .bkit-memory.json
    │                caches in MCP server memory
    │
    ├── During Session
    │   ├── bkit_get_status → reads from cache (5s TTL)
    │   ├── bkit_complete_phase → updates .pdca-status.json + cache
    │   ├── bkit_memory_write → updates .bkit-memory.json + cache
    │   └── bkit_memory_read → reads from cache
    │
    └── Session End
        └── MCP server process terminates, cache cleared
            State persisted in JSON files
```

---

## 7. Template Porting Design

### 7.1 Template Inventory (27 Templates)

| # | Template | Location in bkit-codex | Used By |
|:-:|----------|----------------------|---------|
| 1 | plan.template.md | pdca/references/ | $pdca plan |
| 2 | design.template.md | pdca/references/ | $pdca design |
| 3 | design-starter.template.md | pdca/references/ | $pdca design (Starter) |
| 4 | design-enterprise.template.md | pdca/references/ | $pdca design (Enterprise) |
| 5 | analysis.template.md | pdca/references/ | $pdca analyze |
| 6 | report.template.md | pdca/references/ | $pdca report |
| 7 | do.template.md | bkit-templates/references/ | $pdca do |
| 8-16 | phase-1~9 templates | phase-N/references/ | $phase-N skills |
| 17-27 | shared patterns | shared references | Multiple skills |

### 7.2 Template Variable System

**bkit Variables → Codex Equivalents**:

| Variable | bkit | Codex |
|----------|------|-------|
| `${FEATURE}` | Script-injected | MCP tool argument |
| `${DATE}` | Script-injected | MCP tool runtime |
| `${LEVEL}` | Script-injected | MCP tool argument |
| `${PROJECT}` | `process.env.CLAUDE_PROJECT_DIR` | MCP `projectDir` |
| `${PLUGIN_ROOT}` | Claude Code plugin path | Skill directory path |

### 7.3 Template Sharing Strategy

Templates used by multiple skills are stored in one canonical location and referenced:

```
pdca/references/          # Canonical location for PDCA templates
bkit-templates/references/ # Canonical location for all template copies

# Phase skills reference the same templates via symlink or copy
phase-4-api/references/api-patterns.md → shared/api-patterns.md
```

---

## 8. Configuration Design

### 8.1 bkit.config.json → config.toml Mapping

**bkit.config.json** (bkit-claude-code):
```json
{
  "pdca": {
    "matchRateThreshold": 90,
    "maxIterations": 5
  },
  "taskClassification": {
    "thresholds": { "quickFix": 10, "minorChange": 50, "feature": 200 }
  },
  "conventions": {
    "naming": { "components": "PascalCase", "functions": "camelCase" }
  }
}
```

**config.toml** (bkit-codex, project-level `.codex/config.toml`):
```toml
# MCP Server Configuration
[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 30
required = true

# Or via npm (after publish):
# [mcp_servers.bkit]
# command = "npx"
# args = ["-y", "@popup-studio/bkit-codex-mcp"]
```

**Global config (`~/.codex/config.toml`)**:
```toml
# bkit skills are loaded automatically from ~/.agents/skills/
# No additional skills.config needed for global installation

# For project-specific skill override:
# [[skills.config]]
# path = ".bkit-codex/.agents/skills/pdca"
# enabled = true
```

### 8.2 bkit Internal Config (bkit.config.json retained)

bkit의 내부 설정은 `.bkit-codex/bkit.config.json`에 유지하고 MCP 서버가 읽음:

```json
{
  "version": "1.0.0",
  "pdca": {
    "matchRateThreshold": 90,
    "maxIterations": 5,
    "statusFile": "docs/.pdca-status.json",
    "memoryFile": "docs/.bkit-memory.json"
  },
  "taskClassification": {
    "thresholds": {
      "quickFix": 10,
      "minorChange": 50,
      "feature": 200
    }
  },
  "levelDetection": {
    "enterprise": {
      "directories": ["kubernetes", "terraform", "k8s", "infra"]
    },
    "dynamic": {
      "directories": ["lib/bkend", "supabase", "api", "backend"],
      "files": [".mcp.json", "docker-compose.yml"],
      "packagePatterns": ["bkend", "@supabase", "firebase"]
    }
  },
  "conventions": {
    "naming": {
      "components": "PascalCase",
      "functions": "camelCase",
      "constants": "UPPER_SNAKE_CASE",
      "files": "kebab-case"
    }
  },
  "supportedLanguages": ["en", "ko", "ja", "zh", "es", "fr", "de", "it"]
}
```

---

## 9. Repository Structure

```
bkit-codex/                                    # Public GitHub Repository
│
├── .agents/
│   └── skills/                                # 26 Codex Agent Skills
│       ├── bkit-rules/
│       │   ├── SKILL.md
│       │   ├── agents/openai.yaml
│       │   └── references/
│       │       ├── naming-conventions.md
│       │       └── code-quality-standards.md
│       ├── pdca/
│       │   ├── SKILL.md
│       │   ├── agents/openai.yaml
│       │   └── references/
│       │       ├── plan.template.md
│       │       ├── design.template.md
│       │       ├── design-starter.template.md
│       │       ├── design-enterprise.template.md
│       │       ├── analysis.template.md
│       │       ├── report.template.md
│       │       └── do.template.md
│       ├── bkit-templates/
│       │   ├── SKILL.md
│       │   └── references/ (symlinks to pdca/references/)
│       ├── starter/SKILL.md
│       ├── dynamic/SKILL.md
│       ├── enterprise/SKILL.md
│       ├── development-pipeline/SKILL.md
│       ├── phase-1-schema/
│       │   ├── SKILL.md
│       │   └── references/schema-patterns.md
│       ├── phase-2-convention/ ... phase-9-deployment/
│       ├── code-review/
│       │   ├── SKILL.md
│       │   └── references/review-checklist.md
│       ├── zero-script-qa/
│       │   ├── SKILL.md
│       │   └── references/qa-methodology.md
│       ├── mobile-app/SKILL.md
│       ├── desktop-app/SKILL.md
│       ├── codex-learning/
│       │   ├── SKILL.md
│       │   └── references/codex-guide.md
│       └── bkend-{quickstart,data,auth,storage,cookbook}/
│           ├── SKILL.md
│           └── references/bkend-patterns.md
│
├── packages/
│   └── mcp-server/                            # MCP Server (npm package)
│       ├── package.json
│       ├── index.js
│       ├── src/
│       │   ├── server.js
│       │   ├── tools/ (16 files)
│       │   └── lib/ (4 directories, ~75 functions)
│       ├── tests/
│       └── README.md
│
├── AGENTS.md                                  # Sample Project AGENTS.md
├── agents.global.md                           # Global AGENTS.md (to install)
├── bkit.config.json                           # bkit internal config
│
├── install.sh                                 # Unix/Mac auto-installer
├── install.ps1                                # Windows auto-installer
│
├── README.md
├── LICENSE                                    # Apache-2.0
├── CONTRIBUTING.md
├── CHANGELOG.md
│
├── .github/
│   └── workflows/
│       ├── validate.yml                       # SKILL.md format validation
│       ├── test.yml                            # MCP server tests
│       └── release.yml                        # npm publish + GitHub release
│
└── docs/
    ├── installation.md
    ├── architecture.md
    ├── migration-guide.md                     # bkit-claude-code → bkit-codex
    └── api/
        ├── skills-api.md                      # 26 skills reference
        └── mcp-api.md                         # 16 tools reference
```

---

## 10. Installation & Setup Design

### 10.1 Project-Level Installation (Recommended)

```bash
#!/bin/bash
# install.sh - bkit-codex project installer

set -e

REPO="popup-studio-ai/bkit-codex"
INSTALL_DIR=".bkit-codex"

echo "Installing bkit-codex..."

# 1. Clone repository
if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation..."
  cd "$INSTALL_DIR" && git pull && cd ..
else
  git clone --depth 1 "https://github.com/$REPO.git" "$INSTALL_DIR"
fi

# 2. Create skill symlinks
mkdir -p .agents/skills
for skill_dir in "$INSTALL_DIR/.agents/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  if [ ! -L ".agents/skills/$skill_name" ]; then
    ln -sf "../../$INSTALL_DIR/.agents/skills/$skill_name" ".agents/skills/$skill_name"
    echo "  Linked: $skill_name"
  fi
done

# 3. Create/update AGENTS.md (append if exists)
if [ ! -f "AGENTS.md" ]; then
  cp "$INSTALL_DIR/AGENTS.md" "AGENTS.md"
  echo "  Created: AGENTS.md"
else
  echo "  AGENTS.md already exists (skipped)"
fi

# 4. Configure MCP server in config.toml
CONFIG_DIR=".codex"
mkdir -p "$CONFIG_DIR"
CONFIG_FILE="$CONFIG_DIR/config.toml"

if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" << 'EOF'
[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 30
required = true
EOF
  echo "  Created: $CONFIG_FILE"
elif ! grep -q "mcp_servers.bkit" "$CONFIG_FILE" 2>/dev/null; then
  cat >> "$CONFIG_FILE" << 'EOF'

[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 30
required = true
EOF
  echo "  Updated: $CONFIG_FILE"
fi

# 5. Initialize PDCA directories
mkdir -p docs/01-plan/features
mkdir -p docs/02-design/features
mkdir -p docs/03-analysis
mkdir -p docs/04-report

# 6. Add to .gitignore
if [ -f ".gitignore" ]; then
  if ! grep -q ".bkit-codex/" ".gitignore" 2>/dev/null; then
    echo -e "\n# bkit-codex\n.bkit-codex/" >> ".gitignore"
  fi
fi

echo ""
echo "bkit-codex installed successfully!"
echo "  Skills: $(ls .agents/skills/ | wc -l | tr -d ' ') linked"
echo "  MCP Server: configured in $CONFIG_FILE"
echo "  PDCA Docs: docs/ directory ready"
echo ""
echo "Start Codex and type \$pdca to begin!"
```

### 10.2 Global Installation

```bash
#!/bin/bash
# install-global.sh

INSTALL_DIR="$HOME/.bkit-codex"

git clone --depth 1 "https://github.com/popup-studio-ai/bkit-codex.git" "$INSTALL_DIR"

# Link skills globally
mkdir -p "$HOME/.agents/skills"
for skill_dir in "$INSTALL_DIR/.agents/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  ln -sf "$INSTALL_DIR/.agents/skills/$skill_name" "$HOME/.agents/skills/$skill_name"
done

# Install Global AGENTS.md
if [ ! -f "$HOME/.codex/AGENTS.md" ]; then
  mkdir -p "$HOME/.codex"
  cp "$INSTALL_DIR/agents.global.md" "$HOME/.codex/AGENTS.md"
fi

# Configure MCP globally
CONFIG_FILE="$HOME/.codex/config.toml"
if ! grep -q "mcp_servers.bkit" "$CONFIG_FILE" 2>/dev/null; then
  cat >> "$CONFIG_FILE" << EOF

[mcp_servers.bkit]
command = "node"
args = ["$INSTALL_DIR/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 30
EOF
fi
```

### 10.3 $skill-installer (Future)

```
# When Codex supports $skill-installer:
$skill-installer bkit-codex
```

### 10.4 Uninstallation

```bash
# Project-level
rm -rf .bkit-codex
# Remove skill symlinks
for link in .agents/skills/*; do
  [ -L "$link" ] && readlink "$link" | grep -q ".bkit-codex" && rm "$link"
done
# Remove MCP config from .codex/config.toml (manual)
```

---

## 11. Testing Strategy

### 11.1 MCP Server Tests

| Category | Tests | Tool |
|----------|:-----:|------|
| Protocol handler | 8 | Node.js assert |
| Tool schemas | 16 | JSON Schema validation |
| Tool logic | 32 | Integration tests |
| Lib functions | 40 | Unit tests |
| **Total** | **96** | |

**Test Structure**:
```
packages/mcp-server/tests/
├── server.test.js         # JSON-RPC protocol tests
├── tools/
│   ├── init.test.js       # bkit_init tests
│   ├── status.test.js     # bkit_get_status tests
│   ├── pre-write.test.js  # bkit_pre_write_check tests
│   └── ...                # (16 tool test files)
├── lib/
│   ├── config.test.js     # Config management tests
│   ├── status.test.js     # PDCA status tests
│   ├── level.test.js      # Level detection tests
│   ├── language.test.js   # Language detection tests
│   ├── trigger.test.js    # Trigger matching tests
│   └── ambiguity.test.js  # Ambiguity scoring tests
└── integration/
    ├── pdca-flow.test.js  # Full PDCA cycle test
    └── install.test.js    # Installation script test
```

### 11.2 Skill Validation Tests

| Category | Tests | Method |
|----------|:-----:|--------|
| SKILL.md YAML parsing | 26 | CI validation script |
| name/description presence | 26 | CI validation script |
| references/ file existence | ~30 | CI validation script |
| openai.yaml parsing | 26 | CI validation script |
| Skill directory naming | 26 | CI validation script |
| **Total** | **134** | |

**CI Validation Script** (`.github/workflows/validate.yml`):
```yaml
name: Validate Skills
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Validate SKILL.md files
        run: |
          node scripts/validate-skills.js
      - name: Validate MCP server
        run: |
          cd packages/mcp-server
          node --test tests/
```

### 11.3 E2E Testing (Manual)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Fresh install | Run install.sh → Start Codex | Skills loaded, MCP connected |
| PDCA cycle | $pdca plan → design → do → analyze → report | Full cycle completes |
| Level detection | Open Starter/Dynamic/Enterprise project | Correct level detected |
| 8-language triggers | Input in ko/ja/zh/etc | Correct skill triggered |
| State persistence | Close and reopen session | PDCA status preserved |

---

## 12. Implementation Dependencies

### 12.1 Build Order (Critical Path)

```
Phase 1: Foundation (P0)
━━━━━━━━━━━━━━━━━━━━━━━
  1.1 MCP Server scaffold (server.js, index.js, protocol handler)
       ↓
  1.2 lib/core/ porting (config, cache, file, path)
       ↓
  1.3 lib/pdca/status.js porting (PDCA state management)
       ↓
  1.4 P0 MCP Tools (bkit_init, bkit_get_status, bkit_pre_write_check,
                     bkit_complete_phase, bkit_pdca_plan, bkit_pdca_design)
       ↓
  1.5 Global AGENTS.md (agents.global.md)
       ↓
  1.6 Project AGENTS.md (AGENTS.md)
       ↓
  1.7 P0 Skills (bkit-rules, pdca, bkit-templates)
       ↓
  1.8 PDCA Templates (plan, design, analysis, report, do)
       ↓
  1.9 install.sh (basic installation)
       ↓
  1.10 config.toml MCP configuration

Phase 2: Level & Pipeline (P1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2.1 lib/pdca/level.js porting
       ↓
  2.2 lib/intent/ porting (language, trigger, ambiguity)
       ↓
  2.3 P1 MCP Tools (6 tools)
       ↓
  2.4 Level Skills (starter, dynamic, enterprise)
       ↓
  2.5 Pipeline Skills (development-pipeline, phase-1 ~ phase-9)

Phase 3: Specialized (P2)
━━━━━━━━━━━━━━━━━━━━━━━━━
  3.1 P2 MCP Tools (4 tools)
       ↓
  3.2 Specialized Skills (code-review, zero-script-qa, mobile-app, desktop-app)
       ↓
  3.3 codex-learning Skill (NEW - Codex specific)
       ↓
  3.4 lib/task/ porting

Phase 4: bkend (P3)
━━━━━━━━━━━━━━━━━━━━
  4.1 bkend Skills (5 skills)
       ↓
  4.2 bkend-patterns.md references

Phase 5: Polish & Release
━━━━━━━━━━━━━━━━━━━━━━━━━
  5.1 CI/CD (validate, test, release workflows)
       ↓
  5.2 Documentation (README, installation, architecture, migration)
       ↓
  5.3 npm publish (@popup-studio/bkit-codex-mcp)
       ↓
  5.4 E2E testing
       ↓
  5.5 v1.0.0 release
```

### 12.2 File Count Summary

| Component | bkit-claude-code | bkit-codex |
|-----------|:----------------:|:----------:|
| Skills (SKILL.md) | 26 | 26 |
| Agents (*.md) | 16 | 0 (description 통합) |
| Scripts (*.js) | 45 | 0 (MCP Server) |
| Lib modules | 38 files, 241 fn | ~15 files, ~75 fn |
| Templates | 27 | 27 (references/) |
| Hooks config | hooks.json + YAML | 0 |
| AGENTS.md | 0 (동적 주입) | 2 (Global + Project) |
| MCP Tools | 0 | 16 tool files |
| Config | bkit.config.json | bkit.config.json + config.toml |
| Output Styles | 4 | 0 (AGENTS.md 통합) |
| openai.yaml | 0 | 26 |
| Install scripts | 0 | 2 (sh + ps1) |
| CI/CD | 0 | 3 workflows |
| **Total files** | **~160** | **~120** |

---

## 13. Migration Guide

### 13.1 bkit-claude-code → bkit-codex 전환

기존 bkit-claude-code 사용자가 Codex로 전환할 때:

| Item | Action | Compatibility |
|------|--------|:-------------:|
| .pdca-status.json | 그대로 사용 | ✅ 100% |
| .bkit-memory.json | 그대로 사용 | ✅ 100% |
| docs/01-plan/ | 그대로 사용 | ✅ 100% |
| docs/02-design/ | 그대로 사용 | ✅ 100% |
| docs/03-analysis/ | 그대로 사용 | ✅ 100% |
| CLAUDE.md | → AGENTS.md 전환 필요 | ⚠️ 수동 |
| .claude-plugin/ | → .bkit-codex/ 교체 | ⚠️ 수동 |
| Agent Teams | 사용 불가 | ❌ |
| Output Styles | AGENTS.md에 통합 | ⚠️ 부분 |

### 13.2 Terminology Mapping

| bkit-claude-code | bkit-codex | Notes |
|------------------|------------|-------|
| Plugin | Agent Skills | 플랫폼 확장 단위 |
| CLAUDE.md | AGENTS.md | 프로젝트 지침 파일 |
| Hooks (10 events) | MCP Tools (16) | 이벤트 → 요청 기반 |
| Scripts (45) | MCP Server src/ | Node.js 로직 |
| Agents (16) | SKILL.md description | 역할 분담 → 지식 통합 |
| skills_preload | references/ | 사전 로드 → 온디맨드 |
| context: fork | Codex sandbox | 컨텍스트 격리 |
| user-invocable | $ prefix | 명시적 호출 |
| Output Styles | AGENTS.md rules | 응답 스타일 |
| Plugin Root | .agents/skills/ | 스킬 루트 |

---

## Appendix A: AGENTS.md Instruction Chain

```
Codex Session Start
    │
    ├── 1. Read ~/.codex/AGENTS.md (Global) ─── ~3.8 KB
    │       bkit 3 philosophies, PDCA rules, MCP guide
    │
    ├── 2. Read ./AGENTS.md (Project) ─────── ~2.0 KB
    │       Level-specific guidance, skills reference
    │
    ├── 3. Concatenate (root-to-CWD) ──────── ~5.8 KB / 32 KB
    │
    ├── 4. Load skill metadata (Progressive Disclosure Phase 1)
    │       26 skills: name + description only
    │
    ├── 5. MCP Server starts (via config.toml)
    │       bkit-codex-mcp: 16 tools available
    │
    └── 6. AI reads AGENTS.md rules → calls bkit_init
            Session initialized, ready for user input
```

## Appendix B: Codex CLI Quick Reference

| Command | Purpose |
|---------|---------|
| `$pdca plan {feature}` | Create plan document |
| `$pdca design {feature}` | Create design document |
| `$pdca do {feature}` | Implementation guide |
| `$pdca analyze {feature}` | Gap analysis |
| `$pdca iterate {feature}` | Auto-improvement |
| `$pdca report {feature}` | Completion report |
| `$pdca status` | Show PDCA status |
| `$pdca next` | Next phase suggestion |
| `$starter` | Beginner guide |
| `$dynamic` | Fullstack guide |
| `$enterprise` | Enterprise guide |
| `$development-pipeline` | 9-phase overview |
| `$code-review` | Code review |
| `$codex-learning` | Codex learning guide |
| `/skills` | List all available skills |

## Appendix C: Key Design Decisions

| # | Decision | Choice | Rationale |
|:-:|----------|--------|-----------|
| 1 | Skill path | `.agents/skills/` | Open Agent Skills 표준 (cross-platform) |
| 2 | MCP transport | STDIO | Codex config.toml 표준, 장기 실행 프로세스 |
| 3 | Dependencies | 0 external | bkit lib가 순수 Node.js, 보안 + 속도 |
| 4 | Multi-binding | description 통합 | Codex semantic matching이 action 키워드 구분 |
| 5 | AGENTS.md 크기 | ~5.8 KB / 32 KB | 18% 사용, 82% 여유 → 확장 가능 |
| 6 | Hook 대체 | AGENTS.md MUST/ALWAYS + MCP | 자동화 ~70% 달성 (최선의 근사치) |
| 7 | 상태 파일 | bkit v2.0 호환 | 플랫폼 간 프로젝트 이동 지원 |
| 8 | bkit-rules 처리 | AGENTS.md 인라인 + SKILL.md | 자동 적용(Global) + 상세 규칙(Skill) |
| 9 | Output Styles | AGENTS.md에 레벨별 규칙 통합 | 32KB 내 효율 |
| 10 | codex-learning | 신규 작성 | Codex 전용 학습 가이드 필요 |

---

*This design document was created based on:*
*- bkit-claude-code v1.5.4 reverse engineering (175+ files, 241 functions)*
*- OpenAI Codex official documentation (Agent Skills, AGENTS.md, MCP, config reference)*
*- Codex CLI v0.100.0 changelog and GitHub issues (#2150, #2582)*
*- bkit-system philosophy documents (core-mission, context-engineering, pdca-methodology, ai-native-principles)*
*- Implementation plan: docs/01-plan/features/codex-porting.plan.md*
