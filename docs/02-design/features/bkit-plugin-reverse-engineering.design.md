# bkit Plugin Reverse Engineering Design Document

> Version: 1.5.4 | Date: 2026-02-14 | Status: Complete

## 1. System Overview

### 1.1 What is bkit?

bkit (Vibecoding Kit) is a Claude Code plugin that implements **Context Engineering** -- the practice of optimally curating context tokens for LLM inference. It provides a systematic framework for document-driven development using the PDCA (Plan-Design-Do-Check-Act) methodology.

### 1.2 Core Mission

```
"Enable all developers using Claude Code to naturally adopt
 'document-driven development' and 'continuous improvement'
 even without knowing commands or PDCA methodology"
```

### 1.3 Three Core Philosophies

| Philosophy | Description | Implementation |
|------------|-------------|----------------|
| Automation First | PDCA applied automatically without user knowledge | `bkit-rules` skill + PreToolUse hooks |
| No Guessing | If unsure, check docs; if not in docs, ask user | Design-first workflow, gap-detector agent |
| Docs = Code | Design first, implement later; maintain design-implementation sync | PDCA workflow + `/pdca analyze` |

### 1.4 Component Summary (v1.5.4)

| Component | Count | Location |
|-----------|:-----:|----------|
| Skills | 26 | `skills/*/SKILL.md` |
| Agents | 16 | `agents/*.md` |
| Scripts | 45 | `scripts/*.js` |
| Templates | 27 | `templates/*.md` |
| Lib Modules | 5 directories (241 functions) | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`, `lib/team/` |
| Hook Events | 10 | `hooks/hooks.json` + YAML frontmatter |
| Output Styles | 4 | `output-styles/*.md` |
| Config | 1 | `bkit.config.json` |

### 1.5 Architecture Diagram

```
+=====================================================================+
|                     bkit v1.5.4 Architecture                        |
+=====================================================================+
|                                                                     |
|  [User Input]                                                       |
|       |                                                             |
|       v                                                             |
|  +-----------------------------------------------------------------+
|  | Hook Layer (10 events)                                          |
|  |                                                                 |
|  |  SessionStart --> session-start.js (init, level detect, guide)  |
|  |  UserPromptSubmit --> user-prompt-handler.js (intent, triggers) |
|  |  PreToolUse --> pre-write.js (PDCA check, classify, convention) |
|  |  PostToolUse --> pdca-post-write.js (next step guidance)        |
|  |  PreCompact --> context-compaction.js (PDCA state snapshot)     |
|  |  Stop --> unified-stop.js + agent-specific stop scripts         |
|  |  SubagentStart/Stop --> team visibility handlers                |
|  |  TaskCompleted --> pdca-task-completed.js (auto-advance)        |
|  |  TeammateIdle --> team-idle-handler.js (work assignment)        |
|  +-----------------------------------------------------------------+
|       |                                                             |
|       v                                                             |
|  +-----------------------------------------------------------------+
|  | Skill Layer (26 skills)           | Agent Layer (16 agents)     |
|  |                                   |                             |
|  |  Core: bkit-rules, bkit-templates | Level: starter-guide,      |
|  |  Level: starter, dynamic,        |   bkend-expert,             |
|  |    enterprise                     |   enterprise-expert,        |
|  |  Pipeline: phase-1 ~ phase-9,    |   infra-architect           |
|  |    development-pipeline           | CTO Team: cto-lead,        |
|  |  Specialized: zero-script-qa,    |   frontend-architect,       |
|  |    mobile-app, desktop-app        |   product-manager,          |
|  |  PDCA: pdca, code-review,        |   qa-strategist,            |
|  |    claude-code-learning           |   security-architect        |
|  |  bkend: quickstart, data,        | Task: pipeline-guide,       |
|  |    auth, storage, cookbook         |   gap-detector,             |
|  |                                   |   design-validator,         |
|  |                                   |   code-analyzer,            |
|  |                                   |   qa-monitor,               |
|  |                                   |   pdca-iterator,            |
|  |                                   |   report-generator          |
|  +-----------------------------------------------------------------+
|       |                                                             |
|       v                                                             |
|  +-----------------------------------------------------------------+
|  | Lib Layer (241 functions)                                       |
|  |                                                                 |
|  |  core/ (41)  pdca/ (54)  intent/ (19)  task/ (26)  team/ (40)  |
|  |                                                                 |
|  |  common.js = Migration Bridge (re-exports all 180)              |
|  +-----------------------------------------------------------------+
|       |                                                             |
|       v                                                             |
|  +-----------------------------------------------------------------+
|  | State Layer                                                     |
|  |                                                                 |
|  |  docs/.pdca-status.json    (PDCA status v2.0)                  |
|  |  docs/.bkit-memory.json    (session persistence)               |
|  |  docs/.pdca-snapshots/     (compaction snapshots)              |
|  |  .bkit/agent-state.json    (team state)                        |
|  |  .claude/agent-memory/     (agent memory, project scope)       |
|  |  ~/.claude/agent-memory/   (agent memory, user scope)          |
|  +-----------------------------------------------------------------+
|                                                                     |
+=====================================================================+
```

---

## 2. Skills System (26 Skills)

### 2.1 Skill Classification

```
Skills (26)
|
+-- Core Skills (2)
|   +-- bkit-rules ......... PDCA rules, auto-triggering, code quality
|   +-- bkit-templates ..... Document templates for PDCA
|
+-- Level Skills (3)
|   +-- starter ............ Static web, beginners (agent: starter-guide)
|   +-- dynamic ............ BaaS fullstack (agent: bkend-expert)
|   +-- enterprise ......... MSA/K8s/Terraform (agents: enterprise-expert, infra-architect)
|
+-- Pipeline Phase Skills (10)
|   +-- development-pipeline .. 9-stage overview
|   +-- phase-1-schema ....... Data modeling, terminology
|   +-- phase-2-convention ... Coding conventions
|   +-- phase-3-mockup ....... UI/UX mockups
|   +-- phase-4-api .......... API design/implementation
|   +-- phase-5-design-system  Design system/tokens
|   +-- phase-6-ui-integration UI + API integration
|   +-- phase-7-seo-security . SEO and security
|   +-- phase-8-review ....... Code review + gap analysis
|   +-- phase-9-deployment ... Production deployment
|
+-- Specialized Skills (3)
|   +-- zero-script-qa ...... Log-based testing
|   +-- mobile-app .......... React Native, Flutter, Expo
|   +-- desktop-app ......... Electron, Tauri
|
+-- PDCA/Utility Skills (3)
|   +-- pdca ................ Unified PDCA management (8 actions)
|   +-- code-review ......... Code quality analysis
|   +-- claude-code-learning  Claude Code learning guide
|
+-- bkend Specialist Skills (5)
    +-- bkend-quickstart .... MCP setup, resource hierarchy
    +-- bkend-data .......... Database CRUD, filtering, relations
    +-- bkend-auth .......... Authentication, JWT, RBAC, RLS
    +-- bkend-storage ....... File upload, Presigned URL, CDN
    +-- bkend-cookbook ....... Practical tutorials, troubleshooting
```

### 2.2 Skill Frontmatter Structure

Skills are defined as SKILL.md files with YAML frontmatter:

```yaml
---
name: skill-name
description: |
  Skill description for semantic matching.
  Use proactively when user...
  Triggers: keyword1, keyword2, keyword3
  Do NOT use for: exclusion conditions
agent: connected-agent-name          # Single agent binding
agents:                               # Multi-agent binding (v1.4.4)
  analyze: gap-detector
  iterate: pdca-iterator
allowed-tools:
  - Read
  - Write
  - Edit
user-invocable: true|false
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
  PostToolUse:
    - matcher: "Write"
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
  Stop:
    - command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
---
```

### 2.3 Skill Activation Mechanisms

| Mechanism | Priority | Example |
|-----------|:--------:|---------|
| Explicit invocation | 1 (highest) | `/pdca plan feature` |
| Keyword matching | 2 | User says "login" -> `dynamic` skill |
| File context | 3 (lowest) | Working on `.tsx` -> UI-related skills |

### 2.4 Multi-Binding Architecture (v1.4.4)

Skills can route to different agents based on the action:

| Skill | Actions | Agents |
|-------|---------|--------|
| `pdca` | analyze, iterate, report | gap-detector, pdca-iterator, report-generator |
| `enterprise` | init, strategy, infra | enterprise-expert, infra-architect |
| `phase-8-review` | design, code | design-validator, code-analyzer |

### 2.5 Output Style Integration

Level skills auto-suggest output styles:

| Skill | Suggested Style | Focus |
|-------|----------------|-------|
| `/starter` | `bkit-learning` | Learning points, concept explanations |
| `/dynamic` | `bkit-pdca-guide` | PDCA status badges, checklists |
| `/enterprise` | `bkit-enterprise` | Tradeoff analysis, cost impact |

---

## 3. Agents System (16 Agents)

### 3.1 Agent Classification

```
Agents (16)
|
+-- Level-Based (4)
|   +-- starter-guide ........ Beginner guide (sonnet, acceptEdits)
|   +-- bkend-expert ......... BaaS/fullstack expert (sonnet, acceptEdits)
|   +-- enterprise-expert .... CTO-level advisor (opus, acceptEdits)
|   +-- infra-architect ...... AWS/K8s/Terraform (opus, acceptEdits)
|
+-- CTO Team (5) [v1.5.3]
|   +-- cto-lead ............. Team orchestration (opus, acceptEdits)
|   +-- frontend-architect ... UI/UX design (sonnet, plan)
|   +-- product-manager ...... Requirements/scope (sonnet, plan)
|   +-- qa-strategist ........ Test strategy (sonnet, plan)
|   +-- security-architect ... Vulnerability analysis (opus, plan)
|
+-- Task-Based (7)
    +-- pipeline-guide ....... 9-stage guidance (sonnet, acceptEdits)
    +-- gap-detector ......... Design vs implementation gap (opus, plan)
    +-- design-validator ..... Design document validation (opus, plan)
    +-- code-analyzer ........ Code quality/security (opus, plan)
    +-- qa-monitor ........... Zero Script QA execution (haiku, acceptEdits)
    +-- pdca-iterator ........ Auto iterative improvement (sonnet, acceptEdits)
    +-- report-generator ..... PDCA report generation (haiku, acceptEdits)
```

### 3.2 Model Selection Strategy

| Model | Count | Agents | Characteristics |
|-------|:-----:|--------|-----------------|
| opus | 7 | cto-lead, code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect, security-architect | Complex analysis, strategic decisions |
| sonnet | 7 | bkend-expert, pdca-iterator, pipeline-guide, starter-guide, product-manager, frontend-architect, qa-strategist | Execution, guidance, iteration |
| haiku | 2 | qa-monitor, report-generator | Fast monitoring, document generation |

**Permission Mode Distribution**: 9 acceptEdits / 7 plan

### 3.3 Agent Frontmatter Structure

```yaml
---
name: agent-name
model: opus|sonnet|haiku
description: |
  Role description with expertise and responsibilities.
  Triggers: keyword1, keyword2
  Do NOT use for: exclusion conditions
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
permission-mode: acceptEdits|plan
context: fork|shared               # Context isolation (FR-03)
mergeResult: true|false            # Merge results back
memory: project|user               # Agent memory scope
skills_preload:
  - skill-name
hooks:
  Stop:
    - command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/stop-script.js"
---
```

### 3.4 Agent Memory Configuration

| Scope | Agents | Persistence |
|-------|--------|-------------|
| `project` | code-analyzer, gap-detector, pdca-iterator, report-generator, bkend-expert, enterprise-expert, infra-architect, design-validator, qa-monitor | Per-project, `.claude/agent-memory/` |
| `user` | starter-guide, pipeline-guide | Global, `~/.claude/agent-memory/` |

### 3.5 Agent Auto-Invoke Rules

| Condition | Agent |
|-----------|-------|
| Level = Starter + coding task | starter-guide |
| Level = Dynamic + backend task | bkend-expert |
| Level = Enterprise + architecture | enterprise-expert |
| Keywords "code review", "security scan" | code-analyzer |
| Keyword "gap analysis" | gap-detector |
| Keywords "QA", "test" | qa-monitor |
| Keywords "report", "summary" | report-generator |

### 3.6 Check-Act Iteration Loop

```
gap-detector Agent (Check)
    | (Stop hook: gap-detector-stop.js)
    |
    +-- Match Rate >= 90% --> report-generator (Complete)
    +-- Match Rate 70-89% --> AskUserQuestion (manual/auto choice)
    +-- Match Rate < 70%  --> Recommend pdca-iterator
                                  |
                             pdca-iterator Agent (Act)
                                  | (Stop hook: iterator-stop.js)
                                  |
                                  +-- Complete --> report-generator
                                  +-- In progress --> Re-run gap-detector
                                  (max 5 iterations)
```

---

## 4. Hooks and Scripts System

### 4.1 Hook Events (10)

| Hook Event | Description | Script | Added |
|------------|-------------|--------|:-----:|
| SessionStart | Session initialization | `session-start.js` | v1.0 |
| UserPromptSubmit | User input preprocessing | `user-prompt-handler.js` | v1.4.2 |
| PreToolUse (Write\|Edit) | Before file write/edit | `pre-write.js` | v1.0 |
| PreToolUse (Bash) | Before bash execution | `unified-bash-pre.js` | v1.4.4 |
| PostToolUse (Write) | After file write | `unified-write-post.js` | v1.0 |
| PostToolUse (Bash) | After bash execution | `unified-bash-post.js` | v1.4.4 |
| PostToolUse (Skill) | After skill invocation | `skill-post.js` | v1.4.4 |
| PreCompact | Before context compaction | `context-compaction.js` | v1.4.2 |
| Stop | Agent/session completion | `unified-stop.js` | v1.0 |
| SubagentStart | Subagent spawned | `subagent-start-handler.js` | v1.5.3 |
| SubagentStop | Subagent completed | `subagent-stop-handler.js` | v1.5.3 |
| TaskCompleted | Task completion | `pdca-task-completed.js` | v1.5.1 |
| TeammateIdle | Teammate idle detection | `team-idle-handler.js` | v1.5.1 |

### 4.2 5-Layer Hook System

```
Layer 1: hooks.json (Global)
         +-- SessionStart, UserPromptSubmit, PreCompact
         +-- PreToolUse (Write|Edit, Bash)
         +-- PostToolUse (Write, Bash, Skill)
         +-- Stop, SubagentStart, SubagentStop
         +-- TaskCompleted, TeammateIdle

Layer 2: Skill Frontmatter
         +-- hooks: { PreToolUse, PostToolUse, Stop }

Layer 3: Agent Frontmatter
         +-- hooks: { PreToolUse, PostToolUse, Stop }

Layer 4: Description Triggers
         +-- "Triggers:" keyword matching (8 languages)

Layer 5: Scripts (45 modules)
         +-- Actual Node.js logic execution
```

### 4.3 Script Categories (45 Scripts)

| Category | Count | Scripts |
|----------|:-----:|---------|
| Core | 3 | pre-write.js, pdca-post-write.js, select-template.js |
| Phase | 11 | phase-transition.js, phase1~9 stop/pre/post scripts |
| QA | 3 | qa-pre-bash.js, qa-monitor-post.js, qa-stop.js |
| Agent | 7 | gap-detector-stop.js, iterator-stop.js, analysis-stop.js, etc. |
| Global Hook | 2 | user-prompt-handler.js, context-compaction.js |
| Utility | 3 | archive-feature.js, sync-folders.js, validate-plugin.js |
| Unified Handlers | 5 | unified-stop.js, unified-bash-pre/post.js, unified-write-post.js, skill-post.js |
| Team | 5 | cto-stop.js, team-stop.js, pdca-task-completed.js, subagent-start/stop-handler.js, team-idle-handler.js |
| PDCA | 3 | pdca-skill-stop.js, learning-stop.js, code-review-stop.js |
| Phase Stop (Design) | 3 | phase5-design-stop.js, phase6-ui-stop.js, phase9-deploy-stop.js |

### 4.4 Hook Flow Diagram

```
SessionStart (once)
    |
    +-- session-start.js
    |   +-- Context hierarchy loading (FR-01)
    |   +-- Import resolution (FR-02)
    |   +-- Stale fork cleanup (FR-03)
    |   +-- Memory initialization (FR-08)
    |   +-- Level detection
    |   +-- PDCA status recovery
    |   +-- AskUserQuestion (4 options)
    |
    v
[User Message]
    |
    v
UserPromptSubmit
    +-- user-prompt-handler.js
    |   +-- Feature intent detection
    |   +-- Agent/Skill trigger matching (8 languages)
    |   +-- bkend MCP check
    |   +-- Ambiguity scoring
    |
    v
PreToolUse (Write|Edit)
    +-- pre-write.js
    |   +-- Permission check (FR-05)
    |   +-- Task classification (quick_fix/minor/feature/major)
    |   +-- PDCA phase detection
    |   +-- Convention hints
    |
    v
[Tool Execution]
    |
    v
PostToolUse (Write)
    +-- unified-write-post.js / pdca-post-write.js
    |   +-- Extract feature name
    |   +-- Suggest gap analysis
    |
    v
Stop (Agent completion)
    +-- unified-stop.js + agent-specific scripts
        +-- State transition
        +-- User choice prompt (AskUserQuestion)
        +-- Next action trigger
```

### 4.5 Script I/O Protocol

**Input** (stdin JSON):
```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "..."
  }
}
```

**Output** (stdout JSON):
```json
{
  "decision": "allow|block",
  "reason": "Block reason (when blocked)",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "Context injected to Claude"
  }
}
```

---

## 5. Lib Module Architecture (241 Functions)

### 5.1 Module Structure

```
lib/
|
+-- common.js .............. Migration Bridge (re-exports 180 functions)
|
+-- core/ (7 files, 41 exports)
|   +-- index.js ........... Entry point
|   +-- platform.js ........ Platform detection (Claude Code)
|   +-- cache.js ........... In-memory TTL cache (5s default)
|   +-- debug.js ........... Debug logging (~/.claude/bkit-debug.log)
|   +-- config.js ........... Configuration management
|   +-- io.js .............. I/O utilities (stdin, JSON output)
|   +-- file.js ............ File type detection (30+ extensions)
|
+-- pdca/ (6 files, 54 exports)
|   +-- index.js ........... Entry point
|   +-- tier.js ............ Language tier system (1-4, experimental)
|   +-- level.js ........... Project level detection (Starter/Dynamic/Enterprise)
|   +-- phase.js ........... PDCA phase management
|   +-- status.js .......... Status file operations (v2.0 schema)
|   +-- automation.js ...... Full-auto mode (v1.4.7)
|
+-- intent/ (4 files, 19 exports)
|   +-- index.js ........... Entry point
|   +-- language.js ........ Multi-language detection (8 languages)
|   +-- trigger.js ......... Agent/Skill trigger matching
|   +-- ambiguity.js ....... Ambiguity scoring (7 factors)
|
+-- task/ (5 files, 26 exports)
|   +-- index.js ........... Entry point
|   +-- classification.js .. Task size classification
|   +-- context.js ......... Context tracking
|   +-- creator.js ......... Task chain creation (v1.4.7)
|   +-- tracker.js ......... Task ID persistence
|
+-- team/ (9 files, 40 exports)
    +-- index.js ........... Entry point
    +-- coordinator.js ..... Team availability, config
    +-- strategy.js ........ Level-based team composition
    +-- hooks.js ........... TaskCompleted, TeammateIdle handlers
    +-- orchestrator.js .... Pattern selection, phase context
    +-- communication.js ... Structured messages (7 types)
    +-- task-queue.js ...... Team task assignment, progress
    +-- cto-logic.js ....... PDCA decisions, agent selection
    +-- state-writer.js .... Team state persistence (v1.5.3)
```

### 5.2 Context Engineering Library Modules (FR-01 ~ FR-08)

| Module | FR | Purpose | Key Functions |
|--------|:--:|---------|---------------|
| `context-hierarchy.js` | FR-01 | 4-level context hierarchy | `getContextHierarchy()`, `mergeContextLevels()`, `setSessionContext()` |
| `import-resolver.js` | FR-02 | @import directive processing | `resolveImports()`, `resolveVariables()`, `detectCircularImport()` |
| `context-fork.js` | FR-03 | Context isolation | `forkContext()`, `mergeForkedContext()`, `discardFork()` |
| `permission-manager.js` | FR-05 | Permission hierarchy | `checkPermission()`, `getToolPermission()` |
| `memory-store.js` | FR-08 | Session persistence | `setMemory()`, `getMemory()`, `deleteMemory()` |
| `skill-orchestrator.js` | All | Skill/agent orchestration | `orchestrateSkillPre()`, `orchestrateSkillPost()`, `parseAgentsField()` |

### 5.3 Migration Bridge Pattern

`lib/common.js` serves as a backward compatibility bridge:

```javascript
// common.js re-exports all modules
const core = require('./core');     // 41 exports
const pdca = require('./pdca');     // 54 exports
const intent = require('./intent'); // 19 exports
const task = require('./task');     // 26 exports
const team = require('./team');     // 40 exports

module.exports = { ...core, ...pdca, ...intent, ...task, ...team };
// Total: 180 unique exports (some overlap)
```

**Recommended import pattern** (new code):
```javascript
const { debugLog, getConfig } = require('./lib/core');
const { getPdcaStatusFull } = require('./lib/pdca');
```

**Legacy import** (still works):
```javascript
const common = require('./lib/common');
common.debugLog('message');
```

### 5.4 Key Library Functions

#### Intent Detection Pipeline
```
detectLanguage(text)
    -> 8 languages: en, ko, ja, zh, es, fr, de, it
    -> Unicode-based: Korean hangul, Japanese hiragana/katakana, Chinese CJK

detectNewFeatureIntent(message)
    -> Returns { feature, confidence }

matchImplicitAgentTrigger(message)
    -> Matches against 7 agents x 8 languages
    -> Returns agent name with confidence 0.8

matchImplicitSkillTrigger(message)
    -> Matches against 4 skills x 8 languages
    -> Returns skill name with level mapping

calculateAmbiguityScore(message)
    -> 7 scoring factors (0.0 - 1.0):
       no_file_path(+0.15), no_technical_terms(+0.1),
       no_specific_nouns(+0.15), no_scope(+0.1),
       multiple_interpretations(+0.2), context_conflict(+0.15),
       short_request(+0.15)
    -> Score >= 0.5 triggers AskUserQuestion
    -> Magic Word Bypass: !hotfix, !prototype, !bypass -> Score = 0
```

#### Task Classification
```
classifyTaskByLines(lines):
    quick_fix:      lines < 10    -> PDCA: None
    minor_change:   lines < 50    -> PDCA: Light mention
    feature:        lines < 200   -> PDCA: Recommended
    major_feature:  lines >= 200  -> PDCA: Required
```

#### Language Tier System
```
Tier 1 (AI-Native Essential):  Python, TypeScript, JavaScript
Tier 2 (Mainstream):           Go, Rust, Dart, Vue, Svelte, Astro
Tier 3 (Domain Specific):      Java, Kotlin, Swift, C/C++
Tier 4 (Legacy/Niche):         PHP, Ruby, C#, Scala, Elixir
Experimental:                   Mojo, Zig, V
```

---

## 6. Templates, Commands, and Config

### 6.1 Templates (27)

| Category | Templates | Purpose |
|----------|-----------|---------|
| PDCA | plan, design, design-starter, design-enterprise, analysis, report, iteration-report, do | PDCA phase documents |
| Pipeline | phase-1 through phase-9, zero-script-qa | 9-stage pipeline templates |
| Infrastructure | CLAUDE.template.md, _INDEX.template.md | Project conventions, doc index |
| Shared | api-patterns.md, bkend-patterns.md, error-handling-patterns.md, naming-conventions.md | Reusable reference content |

**Level-specific template variants**:
```
design.template.md         -> Default (Dynamic level)
design-starter.template.md -> Simplified for beginners
design-enterprise.template.md -> Detailed for enterprise
```

### 6.2 Template Variable Systems (3 Types)

| System | Syntax | Example | Used In |
|--------|--------|---------|---------|
| Mustache | `{{variable}}`, `{{#if}}...{{/if}}` | `{{feature}}`, `{{#if TIER_1}}` | CLAUDE.template.md, iteration-report.template.md |
| Simple | `{variable}` | `{feature}`, `{type}` | bkit.config.json `designDocPaths`, `levelVariants` |
| Level Variants | `{type}-{level}.template.md` | `design-starter.template.md` | bkit.config.json `templates.levelVariants` |

### 6.3 PDCA Template Structures (Detail)

| Template | Version | Core Sections | Key Feature |
|----------|:-------:|---------------|-------------|
| plan.template.md | v1.2 | Overview → Scope → Requirements(FR/NFR) → Success Criteria → Risks → Architecture(3-Level) → Convention → Pipeline Integration | 3-Level architecture selection table |
| design.template.md | v1.2 | Pipeline Refs → Architecture(BaaS/Standard) → Data Model(TS+SQL+MongoDB) → API → UI/UX → Error → Security → Test → Clean Architecture(4-Layer) → Convention | Clean Architecture 4-layer + dependency rules |
| design-starter.template.md | v1.0 | Goal → How It Works → Files → Layout → Checklist | Minimized for beginners |
| design-enterprise.template.md | v1.0 | NFRs(P95, SLA 99.9%) → MSA → Event Schema → Rate Limiting → K8s(YAML) → Security(JWT/RBAC) → Monitoring → CI/CD → Rollback → Load Test | K8s YAML, SLA metrics |
| analysis.template.md | v1.2 | Gap Analysis(Match Rate) → Code Quality → Security → Performance → Test Coverage → Clean Architecture Compliance → Convention Compliance → Overall Score(x/100) | Auto match rate calculation, 90% threshold |
| report.template.md | v1.1 | Results(%) → Related Docs → Completed/Incomplete → Quality(Before/After) → Lessons(KPT) → Improvements → Changelog | KPT retrospective format |
| iteration-report.template.md | - | Score Progression → Issues Fixed(Severity) → Iteration Details → Tool Usage → Performance | Mustache `{{#ITERATIONS}}` loop |

### 6.4 Template Selection Algorithm

```
Input: PDCA Phase + Project Level
    |
    v
[1] Phase -> Base Template
    plan   -> plan.template.md
    design -> design.template.md
    do     -> do.template.md
    check  -> analysis.template.md
    act    -> report.template.md
    |
    v
[2] Level -> Variant Override (design only)
    Starter    -> design-starter.template.md
    Dynamic    -> design.template.md (default)
    Enterprise -> design-enterprise.template.md
    |
    v
[3] select-template.js resolves final template path
```

### 6.5 Commands (3 files)

| Command File | Invocation | Purpose |
|-------------|------------|---------|
| `commands/bkit.md` | `/bkit` | Master help: 12 user-invocable skills, 16 agents with triggers, 4 output styles |
| `commands/github-stats.md` | `/github-stats` | GitHub stats collection via `gh` CLI + Atlassian MCP → Confluence update |
| `commands/output-style-setup.md` | `/output-style-setup` | Install output styles to `.claude/output-styles/` (project or user level) |

**Key insight from bkit.md**: "bkit does NOT provide a CLAUDE.md - uses dynamic context via Hooks/Skills/Agents instead"

### 6.6 PDCA Skill Commands (Unified)

| Command | Action | Agent (via multi-binding) |
|---------|--------|--------------------------|
| `/pdca plan {feature}` | Create plan document | - |
| `/pdca design {feature}` | Create design document | - |
| `/pdca do {feature}` | Implementation guide | - |
| `/pdca analyze {feature}` | Gap analysis | gap-detector |
| `/pdca iterate {feature}` | Auto-improvement | pdca-iterator |
| `/pdca report {feature}` | Completion report | report-generator |
| `/pdca status` | PDCA dashboard | - |
| `/pdca next` | Next PDCA step | - |
| `/pdca team {feature}` | Start CTO-Led Agent Team | cto-lead |

### 6.3 Central Configuration (`bkit.config.json`)

```json
{
  "version": "1.5.4",
  "sourceDirectories": ["src", "lib", "app", "components", "pages", "features", "services"],
  "codeExtensions": [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"],

  "pdca": {
    "matchRateThreshold": 90,
    "autoIterate": true,
    "maxIterations": 5,
    "statusFile": "docs/.pdca-status.json"
  },

  "taskClassification": {
    "thresholds": { "quickFix": 50, "minorChange": 200, "feature": 1000 }
  },

  "levelDetection": {
    "enterprise": { "directories": ["kubernetes", "terraform", "k8s", "infra"] },
    "dynamic": { "directories": ["lib/bkend", "supabase", "api", "backend"],
                 "files": [".mcp.json", "docker-compose.yml"] },
    "default": "Starter"
  },

  "permissions": {
    "Write": "allow", "Edit": "allow", "Read": "allow", "Bash": "allow",
    "Bash(rm -rf*)": "deny",
    "Bash(git push --force*)": "deny",
    "Bash(git reset --hard*)": "ask"
  },

  "automation": {
    "intentDetection": true,
    "ambiguityThreshold": 50,
    "supportedLanguages": ["en", "ko", "ja", "zh", "es", "fr", "de", "it"]
  },

  "team": {
    "enabled": true,
    "displayMode": "in-process",
    "maxTeammates": 5,
    "ctoAgent": "cto-lead",
    "orchestrationPatterns": {
      "Dynamic":    { "plan": "leader", "design": "leader", "do": "swarm", "check": "council", "act": "leader" },
      "Enterprise": { "plan": "leader", "design": "council", "do": "swarm", "check": "council", "act": "watchdog" }
    }
  },

  "outputStyles": {
    "available": ["bkit-pdca-guide", "bkit-learning", "bkit-enterprise", "bkit-pdca-enterprise"],
    "levelDefaults": { "Starter": "bkit-learning", "Dynamic": "bkit-pdca-guide", "Enterprise": "bkit-enterprise" }
  }
}
```

### 6.4 PDCA Status v2.0 Schema

```json
{
  "version": "2.0",
  "lastUpdated": "2026-02-14T07:07:23.898Z",
  "activeFeatures": ["auth-system"],
  "primaryFeature": "auth-system",
  "features": {
    "auth-system": {
      "phase": "design",
      "matchRate": null,
      "iterationCount": 0,
      "documents": {
        "plan": "docs/01-plan/features/auth-system.plan.md",
        "design": "docs/02-design/features/auth-system.design.md"
      }
    }
  },
  "pipeline": { "currentPhase": 4, "level": "Dynamic" },
  "session": { "startedAt": "...", "onboardingCompleted": true }
}
```

---

## 7. Agent Teams and Task Management System

### 7.1 CTO-Led Agent Teams Architecture

```
CTO Lead (opus)
    |
    +-- Plan Phase ---- leader pattern --> CTO decides alone
    +-- Design Phase -- council pattern (Enterprise) --> CTO + architect + security
    +-- Do Phase ------ swarm pattern --> All teammates work in parallel
    +-- Check Phase --- council pattern --> CTO + QA + reviewer
    +-- Act Phase ----- watchdog (Enterprise) / leader (Dynamic)
```

### 7.2 Team Composition by Level

| Role | Dynamic (3+CTO) | Enterprise (5+CTO) |
|------|:---------------:|:------------------:|
| CTO Lead | cto-lead (opus) | cto-lead (opus) |
| Developer | bkend-expert | bkend-expert |
| Frontend | frontend-architect | frontend-architect |
| QA | qa-strategist | qa-strategist |
| Architect | - | enterprise-expert / infra-architect |
| Reviewer | - | code-analyzer / design-validator |
| Security | - | security-architect |

### 7.3 Orchestration Patterns (5)

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Leader | CTO decides, delegates | Plan phase, simple decisions |
| Council | CTO + experts discuss | Design review, quality checks |
| Swarm | All work in parallel | Implementation phase |
| Pipeline | Sequential handoffs | Phase transitions |
| Watchdog | Continuous monitoring | Act phase (Enterprise) |

### 7.4 Team Module (lib/team/)

| File | Exports | Purpose |
|------|:-------:|---------|
| coordinator.js | 5 | Team availability, config, status |
| strategy.js | 2 | Level-based team composition (TEAM_STRATEGIES) |
| hooks.js | 2 | TaskCompleted, TeammateIdle handlers |
| orchestrator.js | 6 | Pattern selection, phase context, team composition |
| communication.js | 6 | Structured messages (7 types: directive, question, status, broadcast, etc.) |
| task-queue.js | 5 | Team task creation, assignment, progress tracking |
| cto-logic.js | 5 | PDCA phase decisions, agent selection, team recommendations |
| state-writer.js | 9 | Team state persistence to `.bkit/agent-state.json` |

### 7.5 Task Chain Auto-Creation

When `/pdca plan` is invoked, the system creates a full task chain:

```
[Plan] feature -----> [Design] feature -----> [Do] feature
   blockedBy: []        blockedBy: [Plan]       blockedBy: [Design]
                                                     |
                                                     v
[Check] feature <----- [Act] feature <----- [Report] feature
   blockedBy: [Do]       blockedBy: [Check]    blockedBy: [Act]
```

---

## 8. Context Engineering Techniques

### 8.1 8 Functional Requirements (FR-01 ~ FR-08)

| FR | Name | Module | Description |
|:--:|------|--------|-------------|
| FR-01 | Multi-Level Context Hierarchy | `context-hierarchy.js` | 4-level priority merge: Plugin(1) < User(2) < Project(3) < Session(4) |
| FR-02 | @import Directive | `import-resolver.js` | External context loading with variable substitution, circular detection |
| FR-03 | Context Fork Isolation | `context-fork.js` | Deep clone PDCA state for isolated skill/agent execution |
| FR-04 | UserPromptSubmit Hook | `user-prompt-handler.js` | Pre-process every user input for intent/trigger/ambiguity |
| FR-05 | Permission Hierarchy | `permission-manager.js` | 3-level: deny(0) < ask(1) < allow(2), glob pattern matching |
| FR-06 | Task Dependency Chain | `task/creator.js` | PDCA phase-based blockedBy metadata for task ordering |
| FR-07 | Context Compaction | `context-compaction.js` | PDCA state snapshot before compression, keep last 10 |
| FR-08 | MEMORY Variable | `memory-store.js` | Session-persistent key-value storage at `docs/.bkit-memory.json` |

### 8.2 4-Level Context Hierarchy (FR-01)

```
L1: Plugin Policy  (${PLUGIN_ROOT}/bkit.config.json)   Priority: 1
    |
    v  (override)
L2: User Config    (~/.claude/bkit/user-config.json)    Priority: 2
    |
    v  (override)
L3: Project Config (${PROJECT_DIR}/bkit.config.json)    Priority: 3
    |
    v  (override)
L4: Session Context (in-memory runtime state)           Priority: 4 (highest)
```

- 5-second TTL cache for merged config
- Conflict detection array tracks overridden keys
- Dot-notation access: `getHierarchicalConfig('pdca.matchThreshold')` returns 90

### 8.3 Dynamic Context Injection Patterns

| Pattern | Input Signal | Output Action | Implementation |
|---------|-------------|---------------|----------------|
| Task Size -> PDCA Level | Line count | Skip/Recommend/Require PDCA | `classifyTaskByLines()` |
| User Intent -> Agent Trigger | Natural language | Auto-invoke agent | `matchImplicitAgentTrigger()` |
| Ambiguity Score -> Questions | Score >= 0.5 | Generate AskUserQuestion | `calculateAmbiguityScore()` |
| Match Rate -> Iteration | < 90% | Check-Act loop (max 5) | gap-detector-stop.js |

### 8.4 Context Injection by Hook Event

| Hook Event | Injected Context | Purpose |
|------------|-----------------|---------|
| SessionStart | PDCA status, trigger tables, feature report rules | Full session initialization |
| UserPromptSubmit | Intent detection, agent/skill suggestions, ambiguity score | User input preprocessing |
| PreToolUse | Permission check, task classification, convention hints | Guard and guide before action |
| PostToolUse | Next step suggestion, gap analysis prompt | Guide after action |
| PreCompact | PDCA state snapshot | Preserve state during compression |
| Stop | State transition, user choice prompt | Clean exit with next action |

### 8.5 @import Directive (FR-02)

```yaml
# In SKILL.md frontmatter
imports:
  - ./shared/api-patterns.md
  - ${PLUGIN_ROOT}/templates/error-handling.md
  - ${PROJECT}/conventions.md
```

- Variables: `${PLUGIN_ROOT}`, `${PROJECT}`, `${USER_CONFIG}`
- Circular dependency detection via `_importStack` Set
- 30-second TTL cache for resolved imports

### 8.6 Context Fork Isolation (FR-03)

```
Main Context (PDCA state)
    |
    +-- forkContext('gap-detector')
    |   |
    |   +-- Deep clone via JSON.parse(JSON.stringify())
    |   +-- Isolated analysis operations
    |   |
    |   +-- mergeForkedContext(forkId)
    |       +-- Arrays: Set-based deduplication
    |       +-- Objects: Spread merge
    |       +-- Primitives: Replace
    |
    +-- OR: discardFork(forkId)
            +-- Discard without merging
```

Agents using fork: gap-detector (fork, no merge), design-validator (fork, no merge)

---

## 9. Comprehensive Architecture Diagrams

### 9.1 Data Flow: New Feature Request

```
User: "Make a login feature"
    |
    v
[1] UserPromptSubmit Hook
    +-- detectNewFeatureIntent("login") -> { feature: "login", confidence: 0.9 }
    +-- matchImplicitSkillTrigger() -> "dynamic" (keyword: "login")
    +-- calculateAmbiguityScore() -> 0.2 (low ambiguity)
    |
    v
[2] Claude processes with injected context
    +-- Checks PDCA status: no plan/design for "login"
    +-- Suggests: "Start with /pdca plan login"
    |
    v
[3] /pdca plan login (Skill invocation)
    +-- skill-orchestrator.js: Load pdca skill
    +-- Template: plan.template.md
    +-- Creates: docs/01-plan/features/login.plan.md
    +-- Task Chain Auto-Creation: Plan -> Design -> Do -> Check -> Report
    |
    v
[4] /pdca design login
    +-- Template: design.template.md (or design-starter/design-enterprise)
    +-- Creates: docs/02-design/features/login.design.md
    |
    v
[5] Implementation (Write/Edit)
    +-- PreToolUse: pre-write.js
    |   +-- Task classification: "feature" (200+ chars)
    |   +-- Design doc found: "Reference design doc"
    |   +-- Convention hints: "Components=PascalCase"
    |
    +-- PostToolUse: pdca-post-write.js
        +-- "Run gap analysis? (/pdca analyze login)"
    |
    v
[6] /pdca analyze login
    +-- Agent: gap-detector (opus, fork context)
    +-- Compare design doc vs implementation
    +-- Result: matchRate = 85%
    |
    +-- Stop hook: gap-detector-stop.js
        +-- matchRate < 90%: "Auto-improve? (pdca-iterator)"
    |
    v
[7] /pdca iterate login
    +-- Agent: pdca-iterator (sonnet)
    +-- Fix identified gaps
    +-- Re-run gap-detector -> matchRate = 95%
    |
    v
[8] /pdca report login
    +-- Agent: report-generator (haiku)
    +-- Generate completion report
    +-- Archive enabled
```

### 9.2 System Component Dependencies

```
bkit.config.json (Central Config)
    |
    +----> lib/core/config.js (loads, caches, provides access)
    |
    +----> hooks/session-start.js (reads level detection, PDCA settings)
    |
    +----> scripts/*.js (reads thresholds, permissions, conventions)

lib/common.js (Migration Bridge)
    |
    +----> lib/core/   (41 exports)
    +----> lib/pdca/   (54 exports)
    +----> lib/intent/  (19 exports)
    +----> lib/task/   (26 exports)
    +----> lib/team/   (40 exports)

hooks/hooks.json (Global Hook Registry)
    |
    +----> hooks/session-start.js
    +----> scripts/user-prompt-handler.js
    +----> scripts/pre-write.js
    +----> scripts/unified-write-post.js
    +----> scripts/unified-bash-pre.js
    +----> scripts/unified-bash-post.js
    +----> scripts/skill-post.js
    +----> scripts/context-compaction.js
    +----> scripts/unified-stop.js
    +----> scripts/pdca-task-completed.js
    +----> scripts/subagent-start-handler.js
    +----> scripts/subagent-stop-handler.js
    +----> scripts/team-idle-handler.js

skills/*/SKILL.md (Skill Definitions)
    |
    +----> agents/*.md (via agent: / agents: field)
    +----> templates/*.md (via content references)
    +----> scripts/*.js (via hooks: frontmatter)

agents/*.md (Agent Definitions)
    |
    +----> skills (via skills_preload: field)
    +----> scripts (via hooks: frontmatter)
    +----> .claude/agent-memory/ (via memory: field)
```

### 9.3 Knowledge Graph Structure (bkit-system/)

```
bkit-system/
|
+-- _GRAPH-INDEX.md .............. Central hub (Obsidian graph view)
+-- README.md .................... System overview
|
+-- philosophy/ (4 documents)
|   +-- core-mission.md ......... 3 philosophies
|   +-- ai-native-principles.md . AI-Native competencies
|   +-- pdca-methodology.md ..... PDCA + 9-stage pipeline
|   +-- context-engineering.md .. Context Engineering principles
|
+-- components/ (4 overview files)
|   +-- skills/_skills-overview.md ..... 26 skills catalog
|   +-- agents/_agents-overview.md ..... 16 agents catalog
|   +-- hooks/_hooks-overview.md ....... 10 hook events
|   +-- scripts/_scripts-overview.md ... 45 scripts + lib/
|
+-- triggers/ (2 documents)
|   +-- trigger-matrix.md ........ Event-component mapping
|   +-- priority-rules.md ........ Conflict resolution rules
|
+-- scenarios/ (4 documents)
|   +-- scenario-write-code.md ... Write/Edit flow
|   +-- scenario-new-feature.md .. New feature request
|   +-- scenario-qa.md ........... QA execution
|   +-- scenario-discover-features.md . Feature discovery
|
+-- testing/ (1 document)
    +-- test-checklist.md ........ Test checklist (764/765 PASS)
```

All documents use Obsidian wikilink syntax `[[relative-path|display-name]]` for cross-referencing.

---

## 10. Key Insights for Codex Porting

### 10.1 Architecture Principles to Preserve

1. **Context Engineering First**: Every component exists to provide optimal context to the LLM. The system's value comes from curating the right information at the right time.

2. **5-Layer Hook System**: The layered approach (hooks.json -> skill frontmatter -> agent frontmatter -> triggers -> scripts) allows both global enforcement and contextual customization.

3. **PDCA as Core Loop**: The Plan-Design-Do-Check-Act cycle is the unifying framework. All skills, agents, and hooks ultimately serve this workflow.

4. **Migration Bridge Pattern**: `lib/common.js` re-exports all 5 module directories, allowing gradual migration from monolithic to modular imports without breaking existing code.

5. **State Persistence Strategy**: Three levels of persistence:
   - Session: in-memory cache (5s TTL)
   - Project: `docs/.pdca-status.json`, `docs/.bkit-memory.json`
   - Agent: `.claude/agent-memory/` (project scope), `~/.claude/agent-memory/` (user scope)

### 10.2 Critical Subsystems

| Subsystem | Files | Why Critical |
|-----------|-------|-------------|
| Intent Detection | `lib/intent/` (4 files, 19 exports) | Enables 8-language natural language understanding |
| PDCA Management | `lib/pdca/` (6 files, 54 exports) | Core workflow engine |
| Task Chain | `lib/task/` (5 files, 26 exports) | Automated task dependency management |
| Team Orchestration | `lib/team/` (9 files, 40 exports) | Multi-agent parallel execution |
| Context Engineering | `context-hierarchy.js`, `context-fork.js`, `import-resolver.js`, `permission-manager.js`, `memory-store.js` | 5 FR implementations for optimal context management |

### 10.3 Portability Considerations

1. **Node.js Dependency**: All 45 scripts are Node.js. Cross-platform since v1.3.1.

2. **File System Dependencies**: PDCA status, memory, snapshots all use the file system. Any port needs equivalent persistence.

3. **Claude Code API Surface**: Hooks (`SessionStart`, `PreToolUse`, etc.), Skills (YAML frontmatter), Agents (YAML frontmatter), Task System (`TaskCreate`, `TaskUpdate`), and `AskUserQuestion` are all Claude Code-specific APIs.

4. **Plugin Manifest**: `.claude-plugin/plugin.json` defines the plugin identity. Output styles reference `outputStyles` directory.

5. **Environment Variables**: `CLAUDE_PLUGIN_ROOT`, `CLAUDE_ENV_FILE`, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` are expected.

### 10.4 Key Metrics (v1.5.4)

| Metric | Value |
|--------|-------|
| Total Skills | 26 |
| Total Agents | 16 |
| Total Scripts | 45 |
| Total Templates | 27 |
| Total Lib Functions | 241 |
| Hook Events | 10 |
| Supported Languages | 8 |
| Language Tiers | 4 + experimental |
| Output Styles | 4 |
| Test Pass Rate | 764/765 (100%) |
| PDCA Max Iterations | 5 |
| Match Rate Threshold | 90% |
| Config Cache TTL | 5s |
| Import Cache TTL | 30s |
| Compaction Snapshots | 10 (max) |

---

## 11. Design Patterns Catalog

### 11.1 Structural Patterns

| Pattern | Location | Description |
|---------|----------|-------------|
| Migration Bridge | `lib/common.js` | Re-exports all 5 module directories (180 functions) for backward compatibility while enabling gradual migration to modular imports |
| Lazy Require | `lib/core/`, `lib/team/` | `require()` inside functions (not at top) to prevent circular dependencies across 30+ modules |
| Cascading Context | `context-hierarchy.js` | CSS-like cascade: Plugin(L1) < User(L2) < Project(L3) < Session(L4), higher priority overrides lower |
| Unified Handler | `scripts/unified-*.js` | Single router script per hook event (bash-pre, bash-post, write-post, stop) dispatches to skill/agent-specific handlers; workaround for GitHub #9354 |

### 11.2 Behavioral Patterns

| Pattern | Location | Description |
|---------|----------|-------------|
| Check-Act Loop | `gap-detector-stop.js` + `iterator-stop.js` | Evaluator-Optimizer cycle: gap-detector evaluates -> pdca-iterator fixes -> re-evaluate, max 5 iterations |
| Non-blocking Guidance | All `PostToolUse` scripts | Inject suggestions as `additionalContext` rather than blocking; always `decision: "allow"` |
| Magic Word Bypass | `lib/intent/ambiguity.js` | `!hotfix`, `!prototype`, `!bypass` prefixes set ambiguity score to 0, skipping AskUserQuestion |
| Pipeline Chaining | Skill YAML `next-skill:` | Each phase skill points to next: phase-1 -> phase-2 -> ... -> phase-9 |

### 11.3 Data Patterns

| Pattern | Location | Description |
|---------|----------|-------------|
| Atomic File Write | `lib/team/state-writer.js` | Write to `.tmp` file then `fs.renameSync()` to prevent corruption on crash |
| TTL Caching | `lib/core/cache.js` | Multi-level: 5s global config, 30s import resolution, 10s context hierarchy |
| Deep Clone Fork | `context-fork.js` | `JSON.parse(JSON.stringify(state))` for complete isolation; no shared references |
| Schema Versioning | `docs/.pdca-status.json` | Version field (`"version": "2.0"`) enables safe schema migration |

### 11.4 Integration Patterns

| Pattern | Location | Description |
|---------|----------|-------------|
| Multi-Binding Dispatch | Skill YAML `agents:` | Single skill routes to different agents by action keyword: `{ analyze: gap-detector, iterate: pdca-iterator }` |
| Context Fork Isolation | Agent YAML `context: fork` | Agents like gap-detector and design-validator run in forked context; `mergeResult: false` discards fork on completion |
| Skills Preload | Agent YAML `skills_preload:` | Agents pre-load skill knowledge before execution for domain expertise |
| Task Chain Auto-Creation | `lib/task/creator.js` | `/pdca plan` creates full PDCA task chain with blockedBy dependencies: Plan -> Design -> Do -> Check -> Report |

### 11.5 Orchestration Patterns (Agent Teams)

| Pattern | When Used | Description |
|---------|-----------|-------------|
| Leader | Plan, Act (Dynamic) | CTO decides alone and delegates tasks |
| Council | Design (Enterprise), Check | CTO + domain experts discuss and decide together |
| Swarm | Do (all levels) | All teammates work in parallel on independent tasks |
| Pipeline | Phase transitions | Sequential handoffs between agents |
| Watchdog | Act (Enterprise) | Continuous monitoring with automatic intervention |

---

## 12. Complete File Inventory

### 12.1 Skills (26 files)

```
skills/
├── bkit-rules/SKILL.md              # Core PDCA rules (auto-trigger)
├── bkit-templates/SKILL.md          # Template selection guide
├── starter/SKILL.md                 # Static web (agent: starter-guide)
├── dynamic/SKILL.md                 # BaaS fullstack (agent: bkend-expert)
├── enterprise/SKILL.md              # MSA/K8s (agents: enterprise-expert, infra-architect)
├── pdca/SKILL.md                    # Unified PDCA (8 actions, multi-binding)
├── code-review/SKILL.md             # Code review (agent: code-analyzer)
├── claude-code-learning/SKILL.md    # Claude Code learning guide
├── zero-script-qa/SKILL.md          # Log-based QA (agent: qa-monitor)
├── mobile-app/SKILL.md              # React Native, Flutter, Expo
├── desktop-app/SKILL.md             # Electron, Tauri
├── development-pipeline/SKILL.md    # 9-phase overview
├── phase-1-schema/SKILL.md          # Data modeling
├── phase-2-convention/SKILL.md      # Coding conventions
├── phase-3-mockup/SKILL.md          # UI/UX prototypes
├── phase-4-api/SKILL.md             # API design
├── phase-5-design-system/SKILL.md   # Design system
├── phase-6-ui-integration/SKILL.md  # UI + API integration
├── phase-7-seo-security/SKILL.md    # SEO and security
├── phase-8-review/SKILL.md          # Review (agents: design-validator, code-analyzer)
├── phase-9-deployment/SKILL.md      # Deployment
├── bkend-quickstart/SKILL.md        # bkend MCP setup
├── bkend-data/SKILL.md              # Database CRUD
├── bkend-auth/SKILL.md              # Authentication/JWT/RBAC
├── bkend-storage/SKILL.md           # File upload/CDN
└── bkend-cookbook/SKILL.md           # Tutorials/troubleshooting
```

### 12.2 Agents (16 files)

```
agents/
├── starter-guide.md          # Beginner guide (sonnet, acceptEdits, user memory)
├── bkend-expert.md           # BaaS expert (sonnet, acceptEdits, project memory)
├── enterprise-expert.md      # CTO advisor (opus, acceptEdits, project memory)
├── infra-architect.md        # AWS/K8s/TF (opus, acceptEdits, project memory)
├── cto-lead.md               # Team orchestrator (opus, acceptEdits)
├── frontend-architect.md     # UI/UX design (sonnet, plan)
├── product-manager.md        # Requirements (sonnet, plan)
├── qa-strategist.md          # Test strategy (sonnet, plan)
├── security-architect.md     # Vulnerability (opus, plan)
├── pipeline-guide.md         # 9-stage guide (sonnet, acceptEdits, user memory)
├── gap-detector.md           # Gap analysis (opus, plan, fork context)
├── design-validator.md       # Design validation (opus, plan, fork context)
├── code-analyzer.md          # Code quality (opus, plan, project memory)
├── qa-monitor.md             # Zero Script QA (haiku, acceptEdits, project memory)
├── pdca-iterator.md          # Auto iteration (sonnet, acceptEdits, project memory)
└── report-generator.md       # Report generation (haiku, acceptEdits, project memory)
```

### 12.3 Scripts (45 files)

```
scripts/
├── Core
│   ├── pre-write.js                   # PreToolUse (Write|Edit) - PDCA check, classify
│   ├── pdca-post-write.js             # PostToolUse (Write) - next step guidance
│   └── select-template.js             # Template selection by level
├── Unified Handlers (GitHub #9354 workaround)
│   ├── unified-stop.js                # Stop event router
│   ├── unified-bash-pre.js            # PreToolUse (Bash) router
│   ├── unified-bash-post.js           # PostToolUse (Bash) router
│   ├── unified-write-post.js          # PostToolUse (Write) router
│   └── skill-post.js                  # PostToolUse (Skill) router
├── Global Hooks
│   ├── user-prompt-handler.js         # UserPromptSubmit - intent detection
│   └── context-compaction.js          # PreCompact - PDCA state snapshot
├── Agent Stop
│   ├── gap-detector-stop.js           # Check phase -> iteration/report
│   ├── iterator-stop.js               # Act phase -> re-check/report
│   ├── analysis-stop.js               # Code analysis completion
│   ├── design-validator-stop.js       # Design validation completion
│   └── code-review-stop.js            # Code review completion
├── Phase Hooks
│   ├── phase-transition.js            # Phase progression logic
│   ├── phase5-design-stop.js          # Design system completion
│   ├── phase6-ui-stop.js              # UI integration completion
│   └── phase9-deploy-stop.js          # Deployment completion
├── QA
│   ├── qa-pre-bash.js                 # QA bash pre-processing
│   ├── qa-monitor-post.js             # QA monitoring post
│   └── qa-stop.js                     # QA session completion
├── Team
│   ├── cto-stop.js                    # CTO team completion
│   ├── team-stop.js                   # Team cleanup
│   ├── pdca-task-completed.js         # TaskCompleted handler
│   ├── subagent-start-handler.js      # SubagentStart handler
│   ├── subagent-stop-handler.js       # SubagentStop handler
│   └── team-idle-handler.js           # TeammateIdle handler
├── PDCA
│   ├── pdca-skill-stop.js             # PDCA skill completion
│   └── learning-stop.js               # Learning mode completion
├── Utility
│   ├── archive-feature.js             # Feature archival
│   ├── sync-folders.js                # Folder synchronization
│   └── validate-plugin.js             # Plugin validation
└── (+ ~10 additional phase-specific pre/post scripts)
```

### 12.4 Hooks (hooks.json)

```
hooks/
├── hooks.json                    # 10 event types, 13 bindings
└── session-start.js              # SessionStart (685 lines, 12-step init)
```

### 12.5 Lib Modules (38 files, 241 functions)

```
lib/
├── common.js                     # Migration Bridge (180 re-exports)
├── context-hierarchy.js          # FR-01: 4-level context hierarchy
├── import-resolver.js            # FR-02: @import directive processing
├── context-fork.js               # FR-03: Context isolation
├── permission-manager.js         # FR-05: Permission hierarchy
├── memory-store.js               # FR-08: Session persistence
├── skill-orchestrator.js         # Skill/agent routing
├── core/ (7 files, 41 exports)
│   ├── index.js                  # Entry point
│   ├── platform.js               # Platform detection
│   ├── cache.js                  # TTL cache (5s default)
│   ├── debug.js                  # Debug logging
│   ├── config.js                 # Config management
│   ├── io.js                     # stdin/stdout JSON I/O
│   └── file.js                   # File type detection
├── pdca/ (6 files, 54 exports)
│   ├── index.js                  # Entry point
│   ├── tier.js                   # Language tier (1-4)
│   ├── level.js                  # Level detection
│   ├── phase.js                  # Phase management
│   ├── status.js                 # Status file (v2.0)
│   └── automation.js             # Full-auto mode
├── intent/ (4 files, 19 exports)
│   ├── index.js                  # Entry point
│   ├── language.js               # 8-language detection
│   ├── trigger.js                # Agent/Skill triggers
│   └── ambiguity.js              # 7-factor ambiguity
├── task/ (5 files, 26 exports)
│   ├── index.js                  # Entry point
│   ├── classification.js         # Task size
│   ├── context.js                # Context tracking
│   ├── creator.js                # Task chain
│   └── tracker.js                # Task persistence
└── team/ (9 files, 40 exports)
    ├── index.js                  # Entry point
    ├── coordinator.js            # Team config
    ├── strategy.js               # Level composition
    ├── hooks.js                  # Team hooks
    ├── orchestrator.js           # Pattern selection
    ├── communication.js          # 7 message types
    ├── task-queue.js             # Task assignment
    ├── cto-logic.js              # PDCA decisions
    └── state-writer.js           # Atomic state write
```

### 12.6 Templates (27 files)

```
templates/
├── TEMPLATE-GUIDE.md                         # Selection flowchart
├── plan.template.md                          # PDCA Plan
├── design.template.md                        # PDCA Design (Dynamic)
├── design-starter.template.md                # PDCA Design (Starter)
├── design-enterprise.template.md             # PDCA Design (Enterprise)
├── analysis.template.md                      # PDCA Check
├── report.template.md                        # PDCA Act
├── iteration-report.template.md              # Evaluator-Optimizer report
├── CLAUDE.template.md                        # Project CLAUDE.md generator
├── _INDEX.template.md                        # Folder document index
├── api-patterns.md                           # Shared API patterns
├── error-handling-patterns.md                # Shared error handling
├── naming-conventions.md                     # Shared naming rules
└── pipeline/ (9 + 1 files)
    ├── phase-1-schema.template.md
    ├── phase-2-convention.template.md
    ├── phase-3-mockup.template.md
    ├── phase-4-api.template.md
    ├── phase-5-design-system.template.md
    ├── phase-6-ui.template.md
    ├── phase-7-seo-security.template.md
    ├── phase-8-review.template.md
    ├── phase-9-deployment.template.md
    └── zero-script-qa.template.md
```

### 12.7 Other Components

```
output-styles/
├── bkit-pdca-guide.md                # Dynamic level (PDCA badges, checklists)
├── bkit-learning.md                  # Starter level (learning points)
├── bkit-enterprise.md                # Enterprise level (tradeoffs, cost)
└── bkit-pdca-enterprise.md           # Enterprise + PDCA combined

bkit-system/ (Knowledge Graph)
├── _GRAPH-INDEX.md                   # Central hub (Obsidian links)
├── README.md                         # System overview
├── philosophy/ (4)                   # Core principles
├── components/ (4 overviews)         # Skills, agents, hooks, scripts
├── triggers/ (2)                     # Trigger matrix, priority rules
├── scenarios/ (4)                    # Usage scenarios
└── testing/ (1)                      # Test checklist (764/765 PASS)

.claude-plugin/
└── plugin.json                       # Plugin manifest

bkit.config.json                      # Central configuration
```

### 12.8 State Files (Runtime)

```
Project-level:
├── docs/.pdca-status.json            # PDCA status (v2.0 schema)
├── docs/.bkit-memory.json            # Session-persistent key-value store
├── docs/.pdca-snapshots/             # Compaction snapshots (max 10)
├── .bkit/agent-state.json            # Team state (atomic writes)
└── .claude/agent-memory/             # Agent memory (project scope)

User-level:
└── ~/.claude/agent-memory/           # Agent memory (user scope, starter-guide + pipeline-guide)
```

---

### 12.9 Output Styles Detail (4 files)

| Style | Target Level | Key Characteristics |
|-------|:------------:|---------------------|
| `bkit-learning` | Starter | Learning points, PDCA explanations, `TODO(learner)` markers, difficulty adjustment |
| `bkit-pdca-guide` | Dynamic | PDCA status badges, auto gap analysis suggestions, next-phase checklists, phase color codes |
| `bkit-enterprise` | Enterprise | Architecture tradeoff tables, performance/security/scalability perspectives, cost impact analysis, deployment strategies (Blue/Green, Canary, Rolling) |
| `bkit-pdca-enterprise` | Enterprise+PDCA | PDCA workflow tracking + Enterprise architecture combined, Feature Usage Report |

---

## Appendix A: Version History

| Version | Milestone |
|---------|-----------|
| v1.0 | Initial release: Skills, Agents, basic hooks |
| v1.2.0 | Skill consolidation, root-level structure |
| v1.2.1 | Multi-language support, language tier system |
| v1.3.0 | Check-Act iteration loop, Stop hooks |
| v1.3.1 | Cross-platform (Bash -> Node.js conversion) |
| v1.4.0 | 80+ lib functions, 8-language intent detection |
| v1.4.1 | Context Engineering perspective, Response Report |
| v1.4.2 | FR-01~FR-08 implementation, UserPromptSubmit, PreCompact |
| v1.4.4 | Multi-binding, unified handlers, hooks-json-integration |
| v1.4.7 | Core modularization (4 lib modules), Task Chain |
| v1.5.0 | Claude Code Exclusive (Gemini CLI removed) |
| v1.5.1 | Output Styles, Agent Teams, Agent Memory |
| v1.5.3 | CTO-Led Teams, Team Visibility, SubagentStart/Stop |
| v1.5.4 | bkend MCP accuracy fix (19->28+ tools) |

---

---

## Appendix B: Test Checklist Summary (114 Cases)

| Category | Count | Coverage |
|----------|:-----:|----------|
| PreToolUse | 26 | Write/Edit guard, task classification, PDCA check, convention hints |
| PostToolUse | 11 | Next step suggestions, gap analysis prompt |
| Stop | 4 | State transition, user choice prompt |
| SessionStart | 2 | Initialization, level detection |
| Skill Activation | 7 | Explicit, keyword, file context triggers |
| Agent Invoke | 8 | Auto-invoke, model selection, permission mode |
| Integration | 12 | Cross-component flows, PDCA lifecycle |
| Compatibility | 11 | Cross-platform, edge cases |
| bkend MCP | 14 | MCP tools, resources, REST API |
| Feature Discovery | 19 | Output styles, agent teams, agent memory |
| **Total** | **114** | **Test pass rate: 764/765 (100%)** |

---

## Appendix C: Dynamic Context Strategy

bkit deliberately does NOT use a static `CLAUDE.md` file. Instead, it injects context dynamically through hooks:

```
Static CLAUDE.md approach:
  - All context loaded at session start
  - Wastes tokens on irrelevant information
  - Cannot adapt to user intent

bkit Dynamic Context approach:
  SessionStart Hook    → Minimal initial context (level, PDCA status, trigger tables)
  UserPromptSubmit Hook → Intent-aware context (detected agent/skill, ambiguity)
  PreToolUse Hook      → Action-specific context (task size, PDCA phase, conventions)
  PostToolUse Hook     → Result-aware context (next step suggestions)
  PreCompact Hook      → Preservation context (PDCA state snapshot)

Benefits:
  - Token optimization: Only relevant context injected
  - Adaptive: Context changes based on user intent and action
  - Layered: 5-layer system allows both global enforcement and local customization
```

---

*This document was generated by CTO-Led Agent Team reverse engineering analysis.*
*7 specialized agents analyzed 175+ source files across skills, agents, hooks, lib, templates, teams, and context engineering perspectives.*
