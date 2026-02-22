# bkit-claude-code Complete Feature Inventory

> **Summary**: Comprehensive inventory of all components in the bkit-claude-code plugin (v1.5.5)
>
> **Author**: bkit-inventory-analyst
> **Created**: 2026-02-21
> **Status**: Complete
> **Source**: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/`

---

## Executive Summary

| Category | Count | Total Size |
|----------|------:|------------|
| Skills | 27 | ~245 KB |
| Agents | 16 | ~94 KB |
| Hooks | 2 files (hooks.json + session-start.js) | ~30 KB |
| Commands | 3 | ~23 KB |
| Templates | 28 (16 root + 10 pipeline + 4 shared) | ~92 KB |
| Lib Modules | 35 files across 6 dirs | ~203 KB |
| Scripts | 45 files | ~155 KB |
| Output Styles | 4 | ~8 KB |
| bkit-system docs | 14 files | ~178 KB |
| **Total** | **174+ files** | **~1 MB** |

---

## 1. Skills (27 Skills in `/skills/`)

### 1.1 Skill Summary Table

| # | Skill | Size | User-Invocable | Agent | PDCA Phase | Category |
|---|-------|-----:|:--------------:|-------|:----------:|----------|
| 1 | bkend-auth | 4,359B | No | bkend-expert | - | Backend/BaaS |
| 2 | bkend-cookbook | 4,164B | No | bkend-expert | - | Backend/BaaS |
| 3 | bkend-data | 5,458B | No | bkend-expert | - | Backend/BaaS |
| 4 | bkend-quickstart | 5,446B | No | bkend-expert | - | Backend/BaaS |
| 5 | bkend-storage | 4,077B | No | bkend-expert | - | Backend/BaaS |
| 6 | bkit-rules | 8,863B | No | - (auto-applied) | - | Core |
| 7 | bkit-templates | 4,763B | No | - | - | Core |
| 8 | claude-code-learning | 6,331B | Yes | claude-code-guide | - | Learning |
| 9 | code-review | 3,373B | Yes | code-analyzer | check | Quality |
| 10 | desktop-app | 14,322B | No | pipeline-guide | - | Platform |
| 11 | development-pipeline | 4,770B | Yes | pipeline-guide | - | Pipeline |
| 12 | dynamic | 11,466B | Yes | bkend-expert | plan | Level |
| 13 | enterprise | 13,166B | Yes | enterprise-expert + 4 more | plan | Level |
| 14 | mobile-app | 12,348B | No | pipeline-guide | - | Platform |
| 15 | pdca | 16,406B | Yes | gap-detector, pdca-iterator, report-generator, cto-lead | - | Core |
| 16 | phase-1-schema | 4,531B | No | pipeline-guide | plan | Pipeline |
| 17 | phase-2-convention | 15,835B | No | pipeline-guide | plan | Pipeline |
| 18 | phase-3-mockup | 8,398B | No | pipeline-guide + frontend-architect | design | Pipeline |
| 19 | phase-4-api | 7,698B | No | qa-monitor | do | Pipeline |
| 20 | phase-5-design-system | 13,789B | No | pipeline-guide + frontend-architect | do | Pipeline |
| 21 | phase-6-ui-integration | 18,453B | No | pipeline-guide + frontend-architect | do | Pipeline |
| 22 | phase-7-seo-security | 10,449B | No | code-analyzer + security-architect | do | Pipeline |
| 23 | phase-8-review | 16,856B | No | code-analyzer + design-validator + gap-detector + qa-strategist + cto-lead | check | Pipeline |
| 24 | phase-9-deployment | 12,182B | No | infra-architect | act | Pipeline |
| 25 | plan-plus | 7,505B | Yes | - | plan | Core |
| 26 | starter | 7,507B | Yes | starter-guide | plan | Level |
| 27 | zero-script-qa | 17,601B | No | qa-monitor | - | Quality |

### 1.2 Skill Categories

#### Core Skills (4)
- **bkit-rules**: Auto-applied rules for PDCA, level detection, agent triggering, code quality, task classification, output style selection, agent teams suggestion, agent memory awareness
- **bkit-templates**: PDCA document template management (Plan, Design, Analysis, Report, Index, CLAUDE templates)
- **pdca**: Unified PDCA lifecycle management (plan/design/do/analyze/iterate/report/archive/cleanup/team/status/next)
- **plan-plus**: Brainstorming-enhanced PDCA planning with 6 phases (Context Exploration, Intent Discovery, Alternatives Exploration, YAGNI Review, Incremental Validation, Document Generation)

#### Level Skills (3)
- **starter**: Static web development for beginners (HTML/CSS/JS, Next.js basics, GitHub Pages/Vercel deployment)
- **dynamic**: Fullstack development with bkend.ai BaaS (Next.js + bkend.ai, Auth/Data/Storage, MCP integration)
- **enterprise**: Enterprise-grade systems (Turborepo monorepo, microservices, K8s/Terraform, AI Native 10-day development)

#### Backend/BaaS Skills (5)
- **bkend-quickstart**: Platform onboarding, MCP setup, resource hierarchy (Org->Project->Environment)
- **bkend-auth**: Authentication (email/social/magic link), JWT tokens, RBAC, RLS, session management
- **bkend-data**: Database operations (7 column types, CRUD, filtering, relations, indexing, schema management)
- **bkend-storage**: File storage (presigned URL upload, CDN, 4 visibility levels, multipart upload)
- **bkend-cookbook**: 10 tutorial projects + 4 full-guide projects + troubleshooting

#### Pipeline Skills (9)
- **phase-1-schema**: Terminology and data structure definition
- **phase-2-convention**: Coding rules and conventions
- **phase-3-mockup**: UI/UX prototyping (HTML/CSS/JS to Next.js)
- **phase-4-api**: Backend API design with Zero Script QA
- **phase-5-design-system**: Component library and design tokens
- **phase-6-ui-integration**: Frontend-backend integration, state management
- **phase-7-seo-security**: SEO and security hardening (OWASP Top 10)
- **phase-8-review**: Architecture review, gap analysis, quality verification
- **phase-9-deployment**: CI/CD, environment config, deployment strategies

#### Platform Skills (2)
- **desktop-app**: Cross-platform desktop apps (Electron, Tauri guides with code examples)
- **mobile-app**: Cross-platform mobile apps (React Native/Expo, Flutter guides with code examples)

#### Quality Skills (2)
- **code-review**: Code quality analysis, bug detection, security checks, performance analysis
- **zero-script-qa**: Log-based testing methodology using Docker monitoring (no test scripts)

#### Learning Skill (1)
- **claude-code-learning**: 6-level learning guide for Claude Code configuration (CLAUDE.md, hooks, commands, agents, skills, MCP)

### 1.3 User-Invocable Skills (10)

| Skill | Command Example | Argument Hint |
|-------|----------------|---------------|
| pdca | `/pdca plan user-auth` | `[action] [feature]` |
| plan-plus | `/plan-plus user-auth` | `[feature]` |
| starter | `/starter init my-site` | `[init\|guide\|help]` |
| dynamic | `/dynamic init my-saas` | `[init\|guide\|help]` |
| enterprise | `/enterprise init my-platform` | `[init\|guide\|help]` |
| development-pipeline | `/development-pipeline start` | - |
| code-review | `/code-review src/lib/auth.ts` | `[file\|directory\|pr]` |
| claude-code-learning | `/claude-code-learning learn 1` | `[learn\|setup\|upgrade] [level]` |
| bkit (command) | `/bkit` | - |
| output-style-setup (command) | `/output-style-setup` | - |

### 1.4 Skill Multilingual Triggers

All 27 skills support triggers in **8 languages**: English, Korean, Japanese, Chinese, Spanish, French, German, Italian.

### 1.5 Skill Dependency Graph

```
starter ──────────────┐
dynamic ──────────────┤──> phase-1-schema -> phase-2-convention -> phase-3-mockup
enterprise ───────────┘        -> phase-4-api -> phase-5-design-system
                                   -> phase-6-ui-integration -> phase-7-seo-security
                                       -> phase-8-review -> phase-9-deployment

plan-plus ──> pdca design ──> pdca do ──> pdca analyze ──> pdca iterate ──> pdca report ──> pdca archive

bkend-quickstart ──> bkend-data
                 ──> bkend-auth
                 ──> bkend-storage
                 ──> bkend-cookbook
```

---

## 2. Agents (16 Agents in `/agents/`)

### 2.1 Agent Summary Table

| # | Agent | Size | Model | Permission Mode | Memory | Role |
|---|-------|-----:|-------|:---------------:|:------:|------|
| 1 | cto-lead | 4,021B | opus | acceptEdits | project | Team orchestrator, PDCA coordinator |
| 2 | code-analyzer | 10,244B | opus | plan (read-only) | project | Code quality, security, performance analysis |
| 3 | gap-detector | 9,122B | opus | plan (read-only) | project | Design vs implementation comparison |
| 4 | design-validator | 5,518B | opus | plan (read-only) | project | Design document completeness check |
| 5 | enterprise-expert | 8,520B | opus | acceptEdits | project | CTO-level architecture strategy |
| 6 | infra-architect | 5,012B | opus | acceptEdits | project | AWS, K8s, Terraform infrastructure |
| 7 | security-architect | 3,151B | opus | plan (read-only) | project | Security, OWASP, vulnerability analysis |
| 8 | bkend-expert | 9,466B | sonnet | acceptEdits | project | bkend.ai BaaS platform expert |
| 9 | frontend-architect | 2,879B | sonnet | acceptEdits | project | UI/UX, React, Next.js, Design System |
| 10 | pdca-iterator | 9,073B | sonnet | acceptEdits | project | Auto-improvement iteration cycles |
| 11 | pipeline-guide | 4,345B | sonnet | plan (read-only) | user | 9-phase pipeline guidance |
| 12 | product-manager | 2,724B | sonnet | plan (read-only) | project | Requirements analysis, scope definition |
| 13 | qa-strategist | 3,247B | sonnet | plan (read-only) | project | Test strategy coordination |
| 14 | starter-guide | 3,523B | sonnet | acceptEdits | user | Beginner-friendly guidance |
| 15 | report-generator | 5,366B | haiku | acceptEdits | project | PDCA completion reports |
| 16 | qa-monitor | 7,895B | haiku | acceptEdits | project | Docker log monitoring, Zero Script QA |

### 2.2 Agent Model Distribution

| Model | Count | Agents |
|-------|------:|--------|
| opus | 6 | cto-lead, code-analyzer, gap-detector, design-validator, enterprise-expert, infra-architect, security-architect |
| sonnet | 7 | bkend-expert, frontend-architect, pdca-iterator, pipeline-guide, product-manager, qa-strategist, starter-guide |
| haiku | 2 | report-generator, qa-monitor |

### 2.3 Agent Memory Scopes

| Scope | Count | Agents |
|-------|------:|--------|
| project | 14 | All agents except pipeline-guide and starter-guide |
| user | 2 | pipeline-guide, starter-guide (cross-project persistence) |

### 2.4 Agent Permission Modes

| Mode | Count | Agents |
|------|------:|--------|
| acceptEdits (can write) | 9 | cto-lead, enterprise-expert, infra-architect, bkend-expert, frontend-architect, pdca-iterator, starter-guide, report-generator, qa-monitor |
| plan (read-only) | 7 | code-analyzer, gap-detector, design-validator, security-architect, pipeline-guide, product-manager, qa-strategist |

### 2.5 CTO Lead Agent (Detailed)

The cto-lead agent is the central orchestrator:
- **Model**: opus (highest capability)
- **Can delegate to**: 10 other agents via Task tool
- **Skills**: pdca, enterprise, bkit-rules
- **Orchestration Patterns**: Leader, Council, Swarm, Pipeline, Watchdog
- **Team Composition**:
  - Dynamic: 3 teammates (developer, frontend, qa)
  - Enterprise: 5 teammates (architect, developer, qa, reviewer, security)
- **Quality Gates**: Plan -> Design -> Do -> Check (90% Match Rate) -> Report

---

## 3. Hooks (`/hooks/`)

### 3.1 hooks.json Structure

**File**: `hooks/hooks.json` (3,352 bytes)

| Hook Event | Count | Scripts | Timeout |
|------------|------:|---------|--------:|
| SessionStart | 1 | session-start.js | 5000ms |
| PreToolUse (Write\|Edit) | 1 | pre-write.js | 5000ms |
| PreToolUse (Bash) | 1 | unified-bash-pre.js | 5000ms |
| PostToolUse (Write) | 1 | unified-write-post.js | 5000ms |
| PostToolUse (Bash) | 1 | unified-bash-post.js | 5000ms |
| PostToolUse (Skill) | 1 | skill-post.js | 5000ms |
| Stop | 1 | unified-stop.js | 10000ms |
| UserPromptSubmit | 1 | user-prompt-handler.js | 3000ms |
| PreCompact | 1 | context-compaction.js | 5000ms |
| TaskCompleted | 1 | pdca-task-completed.js | 5000ms |
| SubagentStart | 1 | subagent-start-handler.js | 5000ms |
| SubagentStop | 1 | subagent-stop-handler.js | 5000ms |
| TeammateIdle | 1 | team-idle-handler.js | 5000ms |
| **Total** | **13 hooks** | | |

### 3.2 session-start.js Analysis

**File**: `hooks/session-start.js` (26,353 bytes) -- the most critical hook

**Key Functions**:
1. Platform detection (Windows/macOS/Linux)
2. Project level detection (Starter/Dynamic/Enterprise)
3. PDCA status initialization
4. Context hierarchy setup
5. Memory store initialization
6. Import preloading
7. Agent Teams availability check
8. bkend MCP connection detection
9. Ambiguity detection initialization
10. User prompt emission setup
11. Output style recommendation
12. Skill fork configuration scanning

**Dependencies**: common.js, context-hierarchy.js, memory-store.js

### 3.3 Hook Integration with PDCA

```
SessionStart ─────> Level detect, PDCA status init, context setup
UserPromptSubmit ──> Intent detection, skill/agent trigger matching
PreToolUse ────────> Write validation (pre-write.js), bash safety checks
PostToolUse ───────> PDCA status updates, file tracking, skill completion
TaskCompleted ─────> PDCA phase auto-advance
Stop ──────────────> PDCA status save, feature usage report generation
PreCompact ────────> Context snapshot for compaction safety
SubagentStart ─────> Team coordination setup
SubagentStop ──────> Team cleanup
TeammateIdle ──────> Team idle state handling
```

---

## 4. Commands (`/commands/`)

### 4.1 Command Files

| # | Command | Size | User-Invocable | Description |
|---|---------|-----:|:--------------:|-------------|
| 1 | bkit.md | 8,277B | Yes | Plugin help, lists all 10+ user-invocable functions |
| 2 | github-stats.md | 12,404B | Yes | GitHub repo statistics collector (traffic, clones, stars, forks) with Confluence integration |
| 3 | output-style-setup.md | 1,867B | Yes | Install bkit output styles to project or user directory |

### 4.2 bkit Command Details

The `/bkit` command serves as a help/discovery command that lists all available functions:
- PDCA commands (12 sub-commands)
- Project initialization (3 levels)
- Development pipeline commands
- Quality management commands
- Learning commands
- Output style commands

---

## 5. Templates (28 files in `/templates/`)

### 5.1 Root Templates (16)

| # | Template | Size | Purpose |
|---|----------|-----:|---------|
| 1 | _INDEX.template.md | 2,392B | Document index template |
| 2 | analysis.template.md | 11,245B | Gap analysis report (Check phase) |
| 3 | CLAUDE.template.md | 4,950B | CLAUDE.md project configuration |
| 4 | convention.template.md | 2,295B | Coding convention document |
| 5 | design-enterprise.template.md | 10,168B | Enterprise-level design document |
| 6 | design-starter.template.md | 1,399B | Starter-level design document |
| 7 | design.template.md | 11,136B | Standard design document |
| 8 | do.template.md | 7,086B | Implementation guide (Do phase) |
| 9 | iteration-report.template.md | 6,000B | Iteration cycle report |
| 10 | plan-plus.template.md | 5,281B | Brainstorming-enhanced plan |
| 11 | plan.template.md | 6,726B | Standard plan document |
| 12 | report.template.md | 5,316B | Completion report (Act phase) |
| 13 | schema.template.md | 2,488B | Schema/terminology definition |
| 14 | TEMPLATE-GUIDE.md | 5,224B | Template usage documentation |

### 5.2 Pipeline Templates (10 in `/templates/pipeline/`)

| # | Template | Size | Pipeline Phase |
|---|----------|-----:|:--------------:|
| 1 | phase-1-schema.template.md | 1,043B | Phase 1 |
| 2 | phase-2-convention.template.md | 4,693B | Phase 2 |
| 3 | phase-3-mockup.template.md | 2,022B | Phase 3 |
| 4 | phase-4-api.template.md | 2,617B | Phase 4 |
| 5 | phase-5-design-system.template.md | 2,288B | Phase 5 |
| 6 | phase-6-ui.template.md | 5,007B | Phase 6 |
| 7 | phase-7-seo-security.template.md | 2,667B | Phase 7 |
| 8 | phase-8-review.template.md | 5,230B | Phase 8 |
| 9 | phase-9-deployment.template.md | 4,137B | Phase 9 |
| 10 | zero-script-qa.template.md | 6,241B | QA (cross-phase) |

### 5.3 Shared Templates (4 in `/templates/shared/`)

| # | Template | Size | Purpose |
|---|----------|-----:|---------|
| 1 | api-patterns.md | 1,632B | API design patterns |
| 2 | bkend-patterns.md | 3,594B | bkend.ai integration patterns |
| 3 | error-handling-patterns.md | 1,523B | Error handling standards |
| 4 | naming-conventions.md | 1,944B | Naming convention rules |

### 5.4 Template Hierarchy

```
PDCA Templates:
  plan.template.md / plan-plus.template.md  (Plan phase)
  design.template.md / design-starter / design-enterprise  (Design phase)
  do.template.md  (Do phase)
  analysis.template.md  (Check phase)
  report.template.md / iteration-report.template.md  (Act phase)

Pipeline Templates:
  phase-1 through phase-9  (each pipeline phase)
  zero-script-qa  (cross-phase QA methodology)

Shared Templates:
  Used as imports by skills (api-patterns, bkend-patterns, error-handling, naming-conventions)

Meta Templates:
  _INDEX.template.md  (document index)
  CLAUDE.template.md  (project config)
  TEMPLATE-GUIDE.md  (documentation)
```

---

## 6. Lib Modules (`/lib/`)

### 6.1 Module Structure Overview

```
lib/
├── common.js               (10,244B) - Facade re-exporting all modules
├── context-fork.js          (5,723B) - Context forking for parallel agent execution
├── context-hierarchy.js     (6,948B) - Multi-level CLAUDE.md hierarchy
├── import-resolver.js       (6,831B) - Template/skill import resolution
├── memory-store.js          (3,649B) - Agent memory persistence
├── permission-manager.js    (5,070B) - Tool permission management
├── skill-orchestrator.js   (14,353B) - Skill lifecycle orchestration
├── adapters/                          - Platform adapters (claude/local)
├── core/                    (17,686B) - Core utilities
│   ├── cache.js            - Caching
│   ├── config.js           - Configuration loading
│   ├── debug.js            - Debug logging
│   ├── file.js             - File operations
│   ├── index.js            - Module exports
│   ├── io.js               - I/O utilities
│   └── platform.js         - Platform detection
├── intent/                  (22,066B) - Intent detection
│   ├── ambiguity.js        - Ambiguity scoring
│   ├── index.js            - Module exports
│   ├── language.js         - 8-language trigger matching
│   └── trigger.js          - Skill/agent trigger resolution
├── pdca/                    (45,069B) - PDCA management (LARGEST module)
│   ├── automation.js       - Full-auto/semi-auto mode
│   ├── index.js            - Module exports
│   ├── level.js            - Level detection (Starter/Dynamic/Enterprise)
│   ├── phase.js            - Phase management (Plan/Design/Do/Check/Act)
│   ├── status.js           - PDCA status tracking (19,663B - largest single file)
│   └── tier.js             - Language tier classification
├── task/                    (16,713B) - Task management
│   ├── classification.js   - Task size classification
│   ├── context.js          - Task context
│   ├── creator.js          - PDCA task chain creation
│   ├── index.js            - Module exports
│   └── tracker.js          - Task status tracking
└── team/                    (48,599B) - Team coordination (2nd LARGEST)
    ├── communication.js    - Agent messaging
    ├── coordinator.js      - Team lifecycle
    ├── cto-logic.js        - CTO decision logic
    ├── hooks.js            - Team hook handlers
    ├── index.js            - Module exports
    ├── orchestrator.js     - Orchestration patterns
    ├── state-writer.js     - Team state persistence
    ├── strategy.js         - Team strategy generation
    └── task-queue.js       - Task queue management
```

### 6.2 Module Size Ranking

| Module Group | Size | File Count | Description |
|-------------|-----:|----------:|-------------|
| team/ | 48,599B | 9 | Agent Teams coordination |
| pdca/ | 45,069B | 6 | PDCA lifecycle management |
| intent/ | 22,066B | 4 | 8-language intent detection |
| core/ | 17,686B | 7 | Foundational utilities |
| task/ | 16,713B | 5 | Task management |
| Root modules | 52,818B | 7 | Orchestration, context, memory |
| **Total** | **202,951B** | **38** | |

### 6.3 Key Module Details

#### lib/pdca/status.js (19,663B) -- Largest Single Module
- PDCA status file management (`.pdca-status.json`)
- Feature lifecycle tracking (plan -> design -> do -> check -> act -> report -> archived)
- Match rate tracking and iteration counting
- Archive management with summary preservation (FR-04)
- Cleanup utilities for archived features (FR-06)
- Feature limit enforcement (max 50)

#### lib/skill-orchestrator.js (14,353B)
- Skill lifecycle management (load, execute, complete)
- Import resolution and preloading
- Next-skill chaining
- Skill fork configuration
- Agent delegation

#### lib/team/state-writer.js (10,144B)
- Team state persistence
- Teammate status tracking
- Task assignment recording
- Session management

#### lib/team/orchestrator.js (8,213B)
- Orchestration pattern implementation (Leader, Council, Swarm, Pipeline, Watchdog)
- Pattern selection by PDCA phase
- Teammate coordination

#### lib/intent/language.js (9,233B)
- 8-language trigger matching
- Keyword extraction and normalization
- Multi-language intent classification

---

## 7. Scripts (`/scripts/`)

### 7.1 Scripts by Category (45 files, 154,984B total)

#### Unified Hooks (5 scripts, core event handlers)
| Script | Size | Hook Event |
|--------|-----:|------------|
| unified-stop.js | 6,743B | Stop |
| unified-write-post.js | 4,770B | PostToolUse (Write) |
| unified-bash-pre.js | 4,116B | PreToolUse (Bash) |
| unified-bash-post.js | 2,001B | PostToolUse (Bash) |
| user-prompt-handler.js | 6,512B | UserPromptSubmit |

#### PDCA Scripts (5)
| Script | Size | Purpose |
|--------|-----:|---------|
| pdca-skill-stop.js | 11,805B | PDCA skill completion handler |
| pdca-post-write.js | 2,690B | PDCA document write tracking |
| pdca-task-completed.js | 4,884B | PDCA task chain auto-advance |
| archive-feature.js | 5,742B | PDCA archive operations |
| phase-transition.js | 5,196B | Phase transition management |

#### Agent-Specific Scripts (12)
| Script | Size | Agent |
|--------|-----:|-------|
| gap-detector-stop.js | 12,497B | gap-detector completion |
| iterator-stop.js | 11,954B | pdca-iterator completion |
| code-review-stop.js | 3,073B | code-review completion |
| code-analyzer-pre.js | 509B | code-analyzer pre-hook |
| design-validator-pre.js | 993B | design-validator pre-hook |
| gap-detector-post.js | 791B | gap-detector post-hook |
| qa-monitor-post.js | 1,231B | qa-monitor post-hook |
| qa-pre-bash.js | 1,136B | qa-monitor bash pre-hook |
| qa-stop.js | 597B | qa-monitor stop |
| analysis-stop.js | 713B | analysis stop handler |
| cto-stop.js | 1,550B | cto-lead stop handler |
| learning-stop.js | 1,769B | learning skill stop |

#### Pipeline Phase Scripts (12)
| Script | Size | Phase |
|--------|-----:|:-----:|
| phase1-schema-stop.js | 1,139B | 1 |
| phase2-convention-pre.js | 1,317B | 2 |
| phase2-convention-stop.js | 1,179B | 2 |
| phase3-mockup-stop.js | 1,503B | 3 |
| phase4-api-stop.js | 645B | 4 |
| phase5-design-post.js | 1,488B | 5 |
| phase5-design-stop.js | 2,523B | 5 |
| phase6-ui-post.js | 1,258B | 6 |
| phase6-ui-stop.js | 2,917B | 6 |
| phase7-seo-stop.js | 1,293B | 7 |
| phase8-review-stop.js | 687B | 8 |
| phase9-deploy-pre.js | 1,488B | 9 |
| phase9-deploy-stop.js | 3,466B | 9 |

#### Team Scripts (4)
| Script | Size | Purpose |
|--------|-----:|---------|
| subagent-start-handler.js | 3,118B | Subagent initialization |
| subagent-stop-handler.js | 2,157B | Subagent cleanup |
| team-idle-handler.js | 2,415B | Teammate idle detection |
| team-stop.js | 1,205B | Team session cleanup |

#### Utility Scripts (5)
| Script | Size | Purpose |
|--------|-----:|---------|
| validate-plugin.js | 10,456B | Plugin structure validation |
| pre-write.js | 6,398B | Write validation (safety checks) |
| context-compaction.js | 2,556B | Context compaction snapshot |
| skill-post.js | 5,215B | Post-skill execution handler |
| sync-folders.js | 6,271B | Folder synchronization |
| select-template.js | 3,018B | Template selection logic |

---

## 8. Output Styles (`/output-styles/`)

### 8.1 Available Styles

| # | Style | Size | Recommended For | Key Features |
|---|-------|-----:|----------------|-------------|
| 1 | bkit-learning | 1,709B | Starter | Learning points, TODO(learner) markers, concept explanations |
| 2 | bkit-pdca-guide | 1,637B | Dynamic | PDCA status badges, checklists, gap analysis suggestions |
| 3 | bkit-enterprise | 2,511B | Enterprise | Tradeoff analysis, cost impact, deployment strategy, SOLID compliance |
| 4 | bkit-pdca-enterprise | 1,346B | Enterprise | Combined PDCA + CTO (most detailed) |

### 8.2 Level-Default Mapping

| Level | Default Style |
|-------|---------------|
| Starter | bkit-learning |
| Dynamic | bkit-pdca-guide |
| Enterprise | bkit-enterprise |

---

## 9. bkit-system (`/bkit-system/`)

### 9.1 Structure

```
bkit-system/
├── README.md                    (16,985B) - System overview
├── _GRAPH-INDEX.md              (17,315B) - Knowledge graph index
├── components/
│   ├── agents/_agents-overview.md     (10,987B)
│   ├── hooks/_hooks-overview.md       (18,485B)
│   ├── scripts/_scripts-overview.md   (32,791B)
│   └── skills/_skills-overview.md     (11,852B)
├── philosophy/
│   ├── ai-native-principles.md         (7,410B)
│   ├── context-engineering.md         (41,558B) - largest
│   ├── core-mission.md                 (6,909B)
│   └── pdca-methodology.md            (10,437B)
├── scenarios/
│   ├── scenario-discover-features.md   (2,503B)
│   ├── scenario-new-feature.md        (10,217B)
│   ├── scenario-qa.md                 (11,831B)
│   └── scenario-write-code.md         (11,719B)
├── testing/
│   └── test-checklist.md              (15,154B)
└── triggers/
    ├── priority-rules.md               (5,211B)
    └── trigger-matrix.md              (13,716B)
```

### 9.2 Key Documents

- **context-engineering.md** (41,558B): Comprehensive context engineering philosophy and implementation guide
- **_scripts-overview.md** (32,791B): Complete scripts documentation
- **_hooks-overview.md** (18,485B): Hook system documentation
- **_GRAPH-INDEX.md** (17,315B): Knowledge graph linking all components
- **test-checklist.md** (15,154B): QA testing checklist
- **trigger-matrix.md** (13,716B): Complete trigger mapping across all components

---

## 10. Configuration (`bkit.config.json`)

### 10.1 Configuration Sections

| Section | Description |
|---------|-------------|
| `version` | v1.5.5 |
| `sourceDirectories` | 7 recognized source dirs (src, lib, app, components, pages, features, services) |
| `codeExtensions` | 8 extensions (.ts, .tsx, .js, .jsx, .py, .go, .rs, .java) |
| `pdca` | Match rate threshold (90%), max iterations (5), auto-iterate enabled |
| `taskClassification` | Size thresholds: Quick Fix (<50), Minor Change (50-200), Feature (200-1000), Major Feature (>1000) |
| `levelDetection` | Enterprise/Dynamic/Starter detection rules |
| `templates` | Template directory and type mappings |
| `conventions` | Naming conventions (PascalCase, camelCase, UPPER_SNAKE, kebab-case) |
| `agents` | Level-based and task-based agent mapping |
| `permissions` | Tool permission rules (deny rm -rf, deny force push) |
| `context` | Fork behavior, cache TTL settings |
| `automation` | 8-language support, ambiguity threshold (50) |
| `hooks` | Hook enable/disable and timeout settings |
| `team` | Agent Teams config (max 5 teammates, CTO agent, orchestration patterns) |
| `outputStyles` | 4 available styles with level defaults |

### 10.2 Supported Languages (8)

English (en), Korean (ko), Japanese (ja), Chinese (zh), Spanish (es), French (fr), German (de), Italian (it)

---

## 11. CTO Team Functionality

### 11.1 Team Architecture

```
cto-lead (opus) ──> Orchestrates
  ├── enterprise-expert (opus) ──> Architecture decisions
  ├── infra-architect (opus) ──> Infrastructure
  ├── security-architect (opus) ──> Security
  ├── bkend-expert (sonnet) ──> Backend/BaaS
  ├── frontend-architect (sonnet) ──> Frontend
  ├── code-analyzer (opus) ──> Code quality
  ├── gap-detector (opus) ──> Gap analysis
  ├── qa-strategist (sonnet) ──> Test strategy
  ├── product-manager (sonnet) ──> Requirements
  └── report-generator (haiku) ──> Reports
```

### 11.2 Orchestration Patterns

| Pattern | When | Dynamic | Enterprise |
|---------|------|:-------:|:----------:|
| Leader | CTO distributes, teammates execute | Plan, Act | Plan, Act |
| Council | Multiple perspectives needed | - | Design, Check |
| Swarm | Large parallel implementation | Do | Do |
| Pipeline | Sequential dependency chain | - | - |
| Watchdog | Continuous monitoring | Check | - |

### 11.3 Team Lib Modules

Total: 9 modules, 48,599 bytes
- coordinator.js: Team lifecycle management
- orchestrator.js: Pattern implementation
- cto-logic.js: CTO decision logic
- strategy.js: Team strategy generation
- communication.js: Agent messaging
- state-writer.js: State persistence
- task-queue.js: Task queue management
- hooks.js: Team hook handlers
- index.js: Module exports

---

## 12. Plan-Plus Feature

### 12.1 Process Flow (6 Phases)

1. **Phase 0**: Context Exploration (automatic) -- Read CLAUDE.md, git commits, existing docs
2. **Phase 1**: Intent Discovery -- One question at a time via AskUserQuestion (Core Purpose, Target Users, Success Criteria, Constraints)
3. **Phase 2**: Alternatives Exploration -- 2-3 approaches with tradeoffs
4. **Phase 3**: YAGNI Review -- multiSelect verification of essential features
5. **Phase 4**: Incremental Design Validation -- Section-by-section approval
6. **Phase 5**: Plan Document Generation -- Using plan-plus.template.md

### 12.2 Key Principles

- **HARD-GATE**: No code until plan is approved
- One question at a time (prefer multiple choice)
- Mandatory 2-3 alternatives comparison
- YAGNI-first approach
- Incremental validation

### 12.3 Integration

```
/plan-plus {feature} -> docs/01-plan/features/{feature}.plan.md
    ↓
/pdca design {feature} -> Standard PDCA continues
```

---

## 13. Cross-Reference Matrix

### 13.1 Skill-Agent Mapping

| Agent | Primary Skills | Linked From |
|-------|---------------|-------------|
| cto-lead | pdca, enterprise, bkit-rules | pdca (team), phase-8-review (team), enterprise (team) |
| code-analyzer | phase-2-convention, phase-8-review, code-review | code-review, phase-7-seo-security, phase-8-review |
| gap-detector | bkit-templates, phase-2-convention, pdca | pdca (analyze), phase-8-review (gap) |
| design-validator | - | phase-8-review (validate) |
| enterprise-expert | enterprise | enterprise (default, architecture) |
| infra-architect | enterprise | enterprise (infra) |
| security-architect | phase-7-seo-security, code-review | enterprise (security), phase-7-seo-security |
| bkend-expert | dynamic, bkend-* | bkend-auth/data/storage/cookbook, dynamic |
| frontend-architect | phase-3-mockup, phase-5-design-system | phase-3/5/6 (frontend) |
| pdca-iterator | pdca, bkit-rules | pdca (iterate) |
| pipeline-guide | - | phase-1 through phase-5, development-pipeline, desktop-app, mobile-app |
| product-manager | - | - (delegated by cto-lead) |
| qa-strategist | - | phase-8-review (qa) |
| qa-monitor | zero-script-qa | phase-4-api |
| starter-guide | starter | starter |
| report-generator | bkit-templates, pdca | pdca (report) |

### 13.2 Template Usage by Skills

| Template | Used By Skills |
|----------|---------------|
| plan.template.md | pdca, bkit-rules |
| design.template.md | pdca, dynamic, bkit-rules |
| design-enterprise.template.md | enterprise |
| design-starter.template.md | starter |
| analysis.template.md | pdca, bkit-rules |
| report.template.md | pdca, bkit-rules |
| do.template.md | pdca |
| plan-plus.template.md | plan-plus |
| iteration-report.template.md | pdca |
| pipeline/phase-*.template.md | phase-1 through phase-9 |
| shared/bkend-patterns.md | bkend-auth, bkend-data, bkend-storage, bkend-quickstart, bkend-cookbook |
| shared/naming-conventions.md | bkit-rules, claude-code-learning, phase-1/2 |
| shared/api-patterns.md | phase-4-api, gap-detector, design-validator |
| shared/error-handling-patterns.md | phase-4-api, code-analyzer, qa-monitor |

---

## 14. Complexity Assessment

### 14.1 Complexity by Component

| Component | Complexity | Reason |
|-----------|:----------:|--------|
| PDCA System (pdca skill + lib/pdca/) | **HIGH** | 16KB skill + 45KB lib, full lifecycle management with archiving, cleanup, iteration, team mode |
| Team System (cto-lead + lib/team/) | **HIGH** | 4KB agent + 49KB lib, orchestration patterns, multi-agent coordination, state management |
| Hook System (hooks.json + scripts/) | **HIGH** | 13 hook events, 45 scripts (~155KB), deeply integrated with PDCA/team lifecycle |
| Intent Detection (lib/intent/) | **MEDIUM** | 22KB, 8-language support, ambiguity scoring, trigger resolution |
| Skill Orchestration (skill-orchestrator.js) | **MEDIUM** | 14KB, skill lifecycle, import resolution, agent delegation |
| Level Detection (bkit-rules + lib/pdca/level.js) | **MEDIUM** | Multi-criteria detection, level-based behavior adaptation |
| bkend BaaS Skills (5 skills) | **LOW-MEDIUM** | Domain knowledge + MCP tool integration, well-structured |
| Pipeline Skills (9 phases) | **LOW** | Structured templates, sequential execution |
| Output Styles (4 styles) | **LOW** | Markdown-based response formatting rules |

### 14.2 Lines of Code Summary (Approximate)

| Category | Files | Total Bytes | Est. LOC |
|----------|------:|-------------|----------|
| Skills (SKILL.md) | 27 | ~245 KB | ~6,800 |
| Agents (.md) | 16 | ~94 KB | ~2,600 |
| Templates (.md) | 28 | ~92 KB | ~2,600 |
| Lib (JS) | 35 | ~203 KB | ~5,700 |
| Scripts (JS) | 45 | ~155 KB | ~4,400 |
| Hooks + Config | 3 | ~35 KB | ~1,000 |
| bkit-system (docs) | 14 | ~178 KB | ~5,000 |
| **Total** | **168** | **~1,002 KB** | **~28,100** |

---

## 15. Porting Priority for Codex

### 15.1 Priority Tiers

| Priority | Components | Reason |
|:--------:|-----------|--------|
| **P0** (Must Port) | bkit-rules, pdca skill, plan-plus, bkit-templates | Core PDCA methodology -- the foundation |
| **P0** (Must Port) | lib/pdca/, lib/core/ | PDCA status management, level detection, core utilities |
| **P0** (Must Port) | hooks.json + session-start.js | Session initialization and context setup |
| **P1** (Should Port) | starter/dynamic/enterprise skills | Level-based project initialization |
| **P1** (Should Port) | gap-detector, pdca-iterator, code-analyzer agents | Core PDCA Check-Act cycle agents |
| **P1** (Should Port) | Templates (all 28) | Document structure consistency |
| **P1** (Should Port) | lib/intent/ | 8-language trigger detection |
| **P2** (Can Port) | Pipeline skills (phase-1 through phase-9) | 9-phase development guidance |
| **P2** (Can Port) | Output styles (4) | Response formatting |
| **P2** (Can Port) | lib/task/, lib/team/ | Task and team management |
| **P2** (Can Port) | code-review, zero-script-qa | Quality management tools |
| **P3** (Later) | bkend-* skills (5) | BaaS-specific -- may need Codex adaptation |
| **P3** (Later) | desktop-app, mobile-app | Platform-specific guides |
| **P3** (Later) | cto-lead + team orchestration | Agent Teams (experimental feature) |
| **P3** (Later) | github-stats command | Confluence-specific utility |

### 15.2 Codex Adaptation Notes

1. **Hooks Architecture**: Codex uses `codex.jsonc` + sysPrompt approach vs Claude Code's hooks.json + JS scripts. All hook logic needs translation to Codex's instruction-based architecture.
2. **Agent System**: Claude Code agents (.claude/agents/*.md) map to Codex's instructions/agents pattern. Model specifications (opus/sonnet/haiku) need Codex-equivalent mapping.
3. **Skills System**: Claude Code skills (.claude/skills/*.md) need complete re-architecture for Codex which doesn't have a native skills concept -- likely becomes instruction templates or prompt segments.
4. **MCP Integration**: bkend MCP tools (mcp__bkend__*) need verification for Codex MCP compatibility.
5. **Task Integration**: Claude Code's TaskCreate/TaskUpdate/TaskList tools need Codex equivalents.
6. **Output Styles**: Need translation to Codex's response formatting approach.
7. **Context Engineering**: Many lib modules (context-hierarchy, context-fork, import-resolver) implement context engineering concepts that Codex handles differently.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-21 | Initial complete inventory | bkit-inventory-analyst |
