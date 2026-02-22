# bkit-codex v1.0.0 Complete Porting - Design Document

> **Summary**: bkit-codex v1.0.0 Critical Gap 4건(C-1~C-4) + P0 항목 해소를 위한 상세 구현 설계서. Plan 문서(bkit-codex-v1.plan.md)와 Analysis 보고서(codex-context-engineering-v1.analysis.md)를 기반으로 작성.
>
> **Project**: bkit-codex (OpenAI Codex CLI Plugin)
> **Version**: v1.0.0 Hotfix
> **Author**: CTO Team (Design Phase)
> **Date**: 2026-02-21
> **Status**: Draft
> **Plan Reference**: `docs/01-plan/features/bkit-codex-v1.plan.md`
> **Analysis Reference**: `docs/03-analysis/codex-context-engineering-v1.analysis.md`
> **Match Rate Target**: 70.2% -> 80%

---

## 1. Design Overview

### 1.1 Design Goals

본 설계서는 Plan 문서의 **v1.0.0 Hotfix** 범위를 구현하기 위한 상세 설계를 정의한다.

| Goal | Description | FR Reference |
|------|-------------|-------------|
| **G-1** | plan-plus Skill 완전 포팅 (Skills 100%) | FR-01, FR-02, FR-03, FR-24, FR-25 |
| **G-2** | Automation Guarantee 69% -> 80% | FR-04, FR-27 |
| **G-3** | Compaction 저항성 확보 | FR-05, FR-06, FR-28, FR-29 |
| **G-4** | Task Chain 자동 생성 | FR-07, FR-08, FR-26 |
| **G-5** | P0 기반 안정화 (테스트 동기화, symlink, platform, Response Format) | FR-09, FR-10, FR-11, FR-12 |
| **G-6** | 기존 424+ 테스트 통과 + 신규 테스트 추가 | FR-30 |

### 1.2 Design Principles

1. **최소 변경 원칙**: 기존 동작하는 코드를 최대한 보존하고, 누락된 기능만 추가한다
2. **역방향 호환성**: .pdca-status.json v2.0 스키마와 완벽한 호환 유지
3. **Zero External Dependencies**: npm 외부 패키지 의존 없음 유지
4. **테스트 우선**: 모든 변경사항에 대응하는 테스트 추가

### 1.3 Scope Boundary

| In Scope | Out of Scope |
|----------|-------------|
| C-1: plan-plus SKILL.md 포팅 | Codex Multi-Agent 통합 (v1.2.0) |
| C-2: agents.global.md 규칙 강화 | 4개 Output Style SKILL.md (v1.1.0) |
| C-3: Compaction 저항성 | gap-detector 에이전트 로직 통합 (v1.1.0) |
| C-4: Task Chain 자동 생성 | Skill Orchestrator (v1.1.0) |
| P0: 테스트 동기화, symlink, platform | Full-Auto Mode (v1.1.0) |
| P0: Response Format 강화 | Codex Native Hooks 마이그레이션 (v1.2.0) |

---

## 2. Architecture

### 2.1 Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Static Context (항상 로드)                            │
│ ┌─────────────────────┐  ┌─────────────────────────────────┐│
│ │ agents.global.md    │  │ AGENTS.md                       ││
│ │ (~3.8KB)            │  │ (~2.0KB)                        ││
│ │ - Session rules     │  │ - Level guidance                ││
│ │ - MCP tool rules    │  │ - Key skills reference          ││
│ │ - Code standards    │  │ - Response format               ││
│ └─────────────────────┘  └─────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Tier 2: Progressive Disclosure (필요시 로드)                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .agents/skills/ (26개 SKILL.md)                         │ │
│ │ - pdca, starter, dynamic, enterprise                    │ │
│ │ - phase-1 ~ phase-9                                     │ │
│ │ - bkend-*, code-review, zero-script-qa                  │ │
│ │ ❌ plan-plus MISSING                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Tier 3: Dynamic State (MCP 도구 접근)                        │
│ ┌───────────────────┐  ┌──────────────────────────────────┐ │
│ │ MCP Server        │  │ State Files                      │ │
│ │ (16 tools)        │  │ - .pdca-status.json              │ │
│ │ - init            │  │ - .bkit-memory.json              │ │
│ │ - pre_write       │  │ - bkit.config.json               │ │
│ │ - post_write      │  │                                  │ │
│ │ - pdca_plan       │  │ ❌ Task Chain 미영속화            │ │
│ │ - pdca_design     │  │ ❌ Compact Summary 미생성         │ │
│ │ - ...             │  │                                  │ │
│ └───────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Target Architecture (v1.0.0 Hotfix 후)

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Static Context (강화됨)                              │
│ ┌─────────────────────┐  ┌─────────────────────────────────┐│
│ │ agents.global.md    │  │ AGENTS.md                       ││
│ │ (~5.5KB) [+1.7KB]   │  │ (~3.0KB) [+1.0KB]              ││
│ │ + CRITICAL init rule│  │ + Response Format MANDATORY     ││
│ │ + Pre-write MUST    │  │ + Level-specific styling        ││
│ │ + Context Recovery  │  │ + code-analyzer absorption      ││
│ │ + Complete phase    │  │ + Team Workflow guide            ││
│ └─────────────────────┘  └─────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Tier 2: Progressive Disclosure (완성됨)                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ .agents/skills/ (27개 SKILL.md) [+1: plan-plus]         │ │
│ │ ✅ plan-plus/ NEW                                       │ │
│ │   ├── SKILL.md (6단계 프로세스 + HARD-GATE)              │ │
│ │   ├── openai.yaml                                       │ │
│ │   └── references/plan-plus-process.md                   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Tier 3: Dynamic State (강화됨)                               │
│ ┌───────────────────┐  ┌──────────────────────────────────┐ │
│ │ MCP Server        │  │ State Files                      │ │
│ │ (16 tools)        │  │ - .pdca-status.json              │ │
│ │ ✅ init 강화      │  │   ✅ + taskChain[] 필드          │ │
│ │   + compact summ. │  │   ✅ + timestamps 강화           │ │
│ │ ✅ get-status 강화│  │ - .bkit-memory.json              │ │
│ │   + recovery mode │  │   ✅ + platform: "codex"         │ │
│ │ ✅ pdca-plan 강화 │  │                                  │ │
│ │   + task chain    │  │                                  │ │
│ └───────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Component Dependency Graph

```
bkit_pdca_plan (수정)
  ├── lib/pdca/template.js (기존)
  ├── lib/pdca/status.js (수정 - taskChain 필드)
  ├── lib/pdca/level.js (기존)
  └── lib/task/creator.js (수정 - createTaskChain 추가)

bkit_init (수정)
  ├── lib/pdca/level.js (기존)
  ├── lib/pdca/status.js (수정 - getCompactSummary)
  ├── lib/core/config.js (기존)
  ├── lib/pdca/automation.js (기존)
  └── lib/core/cache.js (기존)

bkit_get_status (수정)
  ├── lib/pdca/status.js (수정 - getCompactSummary)
  └── lib/pdca/automation.js (기존)

agents.global.md (수정 - 규칙 강화)
AGENTS.md (수정 - Response Format 강화)
```

---

## 3. Data Model

### 3.1 .pdca-status.json Schema Extension (C-4)

**현재 Feature 스키마:**

```javascript
{
  "feature-name": {
    "phase": "plan",
    "matchRate": null,
    "iterationCount": 0,
    "documents": {
      "plan": "docs/01-plan/features/feature-name.plan.md"
    }
  }
}
```

**확장 Feature 스키마 (v1.0.0):**

```javascript
{
  "feature-name": {
    "phase": "plan",
    "matchRate": null,
    "iterationCount": 0,
    "documents": {
      "plan": "docs/01-plan/features/feature-name.plan.md"
    },
    // NEW: Task Chain for PDCA workflow tracking
    "taskChain": [
      { "phase": "plan",   "status": "active",  "createdAt": "2026-02-21T10:00:00Z" },
      { "phase": "design", "status": "pending", "createdAt": "2026-02-21T10:00:00Z" },
      { "phase": "do",     "status": "pending", "createdAt": "2026-02-21T10:00:00Z" },
      { "phase": "check",  "status": "pending", "createdAt": "2026-02-21T10:00:00Z" },
      { "phase": "report", "status": "pending", "createdAt": "2026-02-21T10:00:00Z" }
    ],
    // NEW: Timestamps for lifecycle tracking
    "timestamps": {
      "started": "2026-02-21T10:00:00Z",
      "lastUpdated": "2026-02-21T10:00:00Z"
    }
  }
}
```

**Task Chain Status Values:**
- `pending` - 아직 시작되지 않음
- `active` - 현재 진행 중
- `completed` - 완료됨
- `skipped` - 건너뜀 (act 단계에서 matchRate >= 90%면 act은 skip)

**역방향 호환성:** `taskChain` 필드가 없는 기존 feature도 정상 동작해야 한다. 모든 코드에서 `feature.taskChain`을 Optional로 처리한다.

### 3.2 Compact Summary 구조 (C-3)

`getCompactSummary()` 함수가 반환하는 1줄 요약 문자열:

```
bkit-codex-v1|design|85%|iter:2|tasks:5
```

**Format:** `{feature}|{phase}|{matchRate}%|iter:{count}|tasks:{chainLength}`

**Purpose:** Context compaction 후 bkit_init 응답에 포함되어, AI가 현재 상태를 즉시 파악할 수 있게 함.

### 3.3 .bkit-memory.json Platform 필드 (FR-11)

**수정 전:**
```json
{
  "lastSession": {
    "platform": "claude"
  }
}
```

**수정 후:**
```json
{
  "lastSession": {
    "platform": "codex"
  }
}
```

**구현 위치:** `bkit_init` handler에서 platform 필드를 강제 설정.

---

## 4. API Specification (MCP Tool Changes)

### 4.1 bkit_init 응답 확장 (C-3: FR-05)

**현재 응답:**

```javascript
{
  level: "Dynamic",
  levelEvidence: [...],
  recommendedSkill: "$dynamic",
  pipelinePhases: [1,2,3,4,5,6,7,9],
  pdcaStatus: {
    activeFeatures: ["bkit-codex-v1"],
    primaryFeature: "bkit-codex-v1",
    features: { ... }
  },
  sessionId: "bkit-1740000000000",
  guidance: "Feature 'bkit-codex-v1' is in plan phase..."
}
```

**확장 응답:**

```javascript
{
  level: "Dynamic",
  levelEvidence: [...],
  recommendedSkill: "$dynamic",
  pipelinePhases: [1,2,3,4,5,6,7,9],
  pdcaStatus: {
    activeFeatures: ["bkit-codex-v1"],
    primaryFeature: "bkit-codex-v1",
    features: { ... }
  },
  // NEW: Compact summary for compaction resilience
  compactSummary: "bkit-codex-v1|design|85%|iter:2|tasks:5",
  // NEW: Context recovery hint
  contextRecoveryHint: "If context seems incomplete, call bkit_get_status with mode='recovery'.",
  sessionId: "bkit-1740000000000",
  guidance: "Feature 'bkit-codex-v1' is in plan phase..."
}
```

**변경 파일:** `packages/mcp-server/src/tools/init.js`

**변경 내용:**
```javascript
// init.js handler() 내 추가
const { getCompactSummary } = require('../lib/pdca/status');

// ... 기존 코드 후 ...

// Compact summary for compaction resilience (C-3)
const compactSummary = getCompactSummary(pdcaStatus);

const result = {
  // ... 기존 필드 ...
  compactSummary,
  contextRecoveryHint: 'If context seems incomplete, call bkit_get_status with mode=\'recovery\'.'
};
```

### 4.2 bkit_get_status Context Recovery 모드 (C-3: FR-06)

**새 파라미터:**

```javascript
// definition.inputSchema 확장
{
  type: 'object',
  properties: {
    feature: {
      type: 'string',
      description: 'Feature name. If omitted, returns all active features.'
    },
    mode: {
      type: 'string',
      enum: ['normal', 'recovery'],
      description: 'Use "recovery" after context compaction to get full state reconstruction.'
    }
  }
}
```

**Recovery 모드 응답:**

```javascript
// mode === 'recovery' 일 때
{
  recoveryMode: true,
  // 전체 상태 포함
  fullStatus: { /* .pdca-status.json 전체 내용 */ },
  // 현재 feature 상세
  primaryFeature: {
    name: "bkit-codex-v1",
    phase: "design",
    matchRate: 85,
    iterationCount: 2,
    taskChain: [...],
    documents: {
      plan: "docs/01-plan/features/bkit-codex-v1.plan.md",
      design: "docs/02-design/features/bkit-codex-v1.design.md"
    }
  },
  // 복구 가이드
  recoveryGuidance: [
    "You are working on feature 'bkit-codex-v1' in design phase.",
    "Plan document: docs/01-plan/features/bkit-codex-v1.plan.md",
    "Design document: docs/02-design/features/bkit-codex-v1.design.md",
    "Current match rate: 85%, iteration 2 of 5.",
    "Next action: Complete design and start implementation."
  ],
  compactSummary: "bkit-codex-v1|design|85%|iter:2|tasks:5"
}
```

**변경 파일:** `packages/mcp-server/src/tools/get-status.js`

### 4.3 bkit_pdca_plan Task Chain 생성 (C-4: FR-07, FR-08)

**현재 반환값에 Task Chain 추가:**

```javascript
// pdca-plan.js 응답 확장
{
  template: "...",
  outputPath: "docs/01-plan/features/feature-name.plan.md",
  phase: 'plan',
  level: 'Dynamic',
  guidance: '...',
  // NEW: Auto-generated task chain
  taskChain: {
    created: true,
    tasks: [
      { phase: 'plan',   subject: '[PLAN] feature-name',   status: 'active' },
      { phase: 'design', subject: '[DESIGN] feature-name', status: 'pending' },
      { phase: 'do',     subject: '[DO] feature-name',     status: 'pending' },
      { phase: 'check',  subject: '[CHECK] feature-name',  status: 'pending' },
      { phase: 'report', subject: '[REPORT] feature-name', status: 'pending' }
    ],
    guidance: 'PDCA task chain created. Complete [PLAN] then proceed to [DESIGN].'
  }
}
```

**변경 파일:** `packages/mcp-server/src/tools/pdca-plan.js`, `packages/mcp-server/src/lib/task/creator.js`

---

## 5. Detailed Implementation Design

### 5.1 C-1: plan-plus Skill 포팅

#### 5.1.1 Directory Structure

```
.agents/skills/plan-plus/
├── SKILL.md           # ~7,500B, 6단계 프로세스 + HARD-GATE
├── openai.yaml        # Codex skill 메타데이터
└── references/
    └── plan-plus-process.md  # 상세 프로세스 가이드
```

#### 5.1.2 openai.yaml

```yaml
name: plan-plus
description: |
  Brainstorming-enhanced PDCA planning methodology.
  6-phase process: Context -> Intent -> Alternatives -> YAGNI -> Validation -> Generation.
  HARD GATE: No code generation until plan is approved.
triggers:
  - plan-plus
  - "brainstorming plan"
  - "enhanced planning"
  - "plan plus"
  - "detailed planning"
  - "deep planning"
allow_implicit_invocation: true
user_invocable: true
```

#### 5.1.3 SKILL.md Structure

```markdown
---
name: plan-plus
description: |
  Brainstorming-enhanced PDCA planning.
  6-phase process with HARD GATE rule.
triggers:
  - plan-plus
  - "brainstorming plan"
  - "enhanced planning"
allow_implicit_invocation: true
user_invocable: true
---

# Plan Plus - Brainstorming-Enhanced PDCA Planning

## HARD GATE RULE (CRITICAL)

CRITICAL: Do NOT generate any code until ALL brainstorming phases are complete
and the user has approved the final plan document. This is a HARD GATE -
no exceptions. If the user asks for code during planning, respond:
"We're still in the planning phase. Let's complete the plan first to ensure
we build the right thing."

## Overview

Plan Plus combines intent discovery from brainstorming methodology with
bkit PDCA's structured planning. It produces higher-quality Plan documents
by exploring user intent, comparing alternatives, and applying YAGNI review.

## Process

### Phase 0: Context Exploration (Automatic)

1. Call `bkit_get_status` to load current PDCA state
2. Read AGENTS.md for project context
3. Check git log for recent history (last 10 commits)
4. Scan `docs/01-plan/` for existing plans
5. Read `bkit.config.json` for project configuration

Output: Internal context understanding (not shown to user)

### Phase 1: Intent Discovery

Ask ONE question at a time. Wait for user response before next question.

Questions (in order):
1. "What is the core problem this feature solves?"
2. "Who are the target users and their key needs?"
3. "What does success look like? (measurable criteria)"
4. "What constraints exist? (time, tech, team, budget)"

Rules:
- Ask exactly ONE question per turn
- Wait for user response before proceeding
- Summarize each answer before asking the next
- If user provides vague answer, ask a follow-up clarification

### Phase 2: Alternatives Exploration

Based on Phase 1 answers, present 2-3 implementation approaches:

For each approach:
- **Summary**: 1-2 sentence overview
- **Pros**: 3-5 advantages
- **Cons**: 3-5 disadvantages
- **Effort**: Low / Medium / High / Very High
- **Best For**: When this approach is optimal

Ask user to select preferred approach or combine elements.

### Phase 3: YAGNI Review

Present a checklist of features from the selected approach:

- Mark each as: [Must Have] / [Nice to Have] / [Won't Do]
- Apply YAGNI principle: "You Aren't Gonna Need It"
- Remove speculative features
- Focus on MVP that delivers core value

Ask user to confirm the trimmed scope.

### Phase 4: Incremental Design Validation

Present the plan document section by section for approval:

1. User Intent (from Phase 1)
2. Alternatives Explored (from Phase 2)
3. YAGNI Review Results (from Phase 3)
4. Scope Definition
5. Requirements (Functional + Non-Functional)
6. Success Criteria
7. Risks and Mitigations
8. Architecture Considerations

For each section:
- Present draft content
- Ask: "Does this accurately capture your intent?"
- Revise if needed before proceeding

### Phase 5: Plan Document Generation

1. Use `bkit_select_template` with phase='plan' to get template
2. Fill template with validated content from Phases 1-4
3. Write to `docs/01-plan/features/{feature}.plan.md`
4. Call `bkit_complete_phase(feature, 'plan')` to record completion
5. Present final document for user review

Output path: `docs/01-plan/features/{feature}.plan.md`

## References

For detailed process patterns and examples, see:
`references/plan-plus-process.md`
```

#### 5.1.4 references/plan-plus-process.md

```markdown
# Plan Plus Process Guide

## Question Templates by Language

### Intent Discovery Questions

| Phase | EN | KO |
|-------|----|----|
| Problem | "What is the core problem this feature solves?" | "이 기능이 해결하는 핵심 문제는 무엇인가요?" |
| Users | "Who are the target users?" | "대상 사용자는 누구인가요?" |
| Success | "What does success look like?" | "성공의 기준은 무엇인가요?" |
| Constraints | "What constraints exist?" | "어떤 제약조건이 있나요?" |

### Alternatives Template

```
## Approach {N}: "{Name}"

| Aspect | Details |
|--------|---------|
| **Summary** | ... |
| **Pros** | ... |
| **Cons** | ... |
| **Effort** | Low / Medium / High |
| **Best For** | ... |
```

### YAGNI Checklist Format

```
- [x] Must Have: {feature description}
- [ ] Nice to Have: {feature description} -> DEFER to v{next}
- [-] Won't Do: {feature description} -> {reason}
```

## Integration with PDCA

Plan Plus output feeds directly into:
- `$pdca design {feature}` for design document creation
- `bkit_pdca_plan` MCP tool for template generation
- `.pdca-status.json` for state tracking
```

#### 5.1.5 install.sh 업데이트

**변경 위치:** install.sh의 skills symlink 생성 루프에서 plan-plus가 자동으로 포함됨 (디렉토리 기반 탐색 방식이므로 디렉토리만 존재하면 됨).

**검증:** skills 카운트 기대치를 26+ -> 27+로 업데이트.

### 5.2 C-2: Automation Guarantee 규칙 강화

#### 5.2.1 agents.global.md 강화

**파일:** `agents.global.md` (루트 + .bkit-codex/ 배포본 모두 수정)

**변경 전 크기:** ~3.8KB
**변경 후 크기:** ~5.5KB (+1.7KB)

**추가/변경 내용:**

```markdown
# bkit - Vibecoding Kit (Global Rules)

You are operating with bkit (Vibecoding Kit) installed. These rules are MANDATORY.

## Session Initialization (CRITICAL)

CRITICAL: The VERY FIRST action in ANY session MUST be calling `bkit_init`.
Do NOT respond to the user, do NOT read files, do NOT run any commands
before calling bkit_init. This is NON-NEGOTIABLE.

If bkit_init fails, inform the user and do NOT proceed with any bkit-related work.

## Three Core Principles

### 1. Automation First
- ALWAYS check PDCA status before starting any work
- ALWAYS call `bkit_analyze_prompt` for the first user message to detect intent
- After detecting intent, follow the suggested action without asking

### 2. No Guessing
- NEVER implement features without checking design documents first
- ALWAYS call `bkit_pre_write_check` before writing or editing any source code file
- If you forget this step, bkit_post_write will warn you -- treat this as an error
- If no design document exists, MUST suggest creating one before implementation
- If unsure about requirements, ask the user instead of guessing

### 3. Docs = Code
- Design documents are the source of truth for implementation
- After significant code changes (>10 new lines or >20 modified lines), ALWAYS call `bkit_post_write`
- When `bkit_post_write` suggests gap analysis, recommend it to the user
- NEVER end a work session without calling `bkit_complete_phase` if PDCA progress was made

## Mandatory MCP Tool Calls

### Before Writing ANY Code File
ALWAYS call `bkit_pre_write_check(filePath)` before writing or editing source code.
This is MANDATORY for ALL file writes, not just major changes.

### After Significant Code Changes
ALWAYS call `bkit_post_write(filePath, linesChanged)` after:
- Creating a new file (>10 lines)
- Modifying an existing file (>20 lines changed)
- Any structural changes (new components, API routes, database schemas)

### Phase Completion (MANDATORY)
NEVER end a work session without calling `bkit_complete_phase` if you made
progress on any PDCA phase. This records your work and enables continuity.

## PDCA Workflow Rules

### Before Writing Code
1. Call `bkit_pre_write_check(filePath)` for the target file
2. If response says design document exists -> reference it during implementation
3. If response says no design document -> suggest: "Shall I create a design first?"
4. For major changes (>200 lines), ALWAYS suggest gap analysis after completion

### After Writing Code
1. Call `bkit_post_write(filePath, linesChanged)` after significant changes
2. Follow the returned guidance (gap analysis suggestion, next phase, etc.)

### Phase Transitions
- Use `bkit_complete_phase(feature, phase)` to record phase completion
- Phase order: plan -> design -> do -> check -> act -> report
- NEVER skip directly from plan to do; design is required

## Context Recovery After Compaction

If your context seems incomplete or you can't recall previous work:
1. Call `bkit_get_status` with `mode: "recovery"` to load full PDCA state
2. The response includes recovery guidance with current feature, phase, and documents
3. Read the referenced documents to reconstruct context
This ensures PDCA continuity even after context compaction.

## Level Detection

Detect project level based on directory structure:
- **Enterprise**: Has `kubernetes/`, `terraform/`, `k8s/`, or `infra/` directories
- **Dynamic**: Has `lib/bkend/`, `supabase/`, `api/`, `.mcp.json`, or `docker-compose.yml`
- **Starter**: Default (none of the above)

Call `bkit_detect_level` for programmatic detection.

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

| Tool | When to Call | Priority |
|------|-------------|----------|
| `bkit_init` | Session start (FIRST action) | CRITICAL |
| `bkit_analyze_prompt` | First user message | HIGH |
| `bkit_pre_write_check` | Before writing/editing source code | MANDATORY |
| `bkit_post_write` | After significant code changes | HIGH |
| `bkit_complete_phase` | When a PDCA phase is done | MANDATORY |
| `bkit_get_status` | Before any PDCA operation / After compaction | HIGH |
| `bkit_detect_level` | When project level is unclear | MEDIUM |
| `bkit_classify_task` | When estimating task size | MEDIUM |

## Response Style

Include bkit feature usage report at the end of responses when PDCA is active:
- Show current PDCA phase and feature
- Suggest next action based on current state
```

#### 5.2.2 AGENTS.md 강화

**파일:** `AGENTS.md` (루트 + .bkit-codex/ 배포본 모두 수정)

**변경 전 크기:** ~2.0KB
**변경 후 크기:** ~3.0KB (+1.0KB)

```markdown
# bkit Project Configuration

## Project Level

This project uses bkit with automatic level detection.
Call `bkit_detect_level` at session start to determine the current level.

### Level-Specific Guidance

**Starter** (beginners, static websites):
- Use simple HTML/CSS/JS or Next.js App Router
- Skip API and database phases
- Pipeline phases: 1 -> 2 -> 3 -> 6 -> 9
- Use `$starter` skill for beginner guidance

**Dynamic** (fullstack with BaaS):
- Use bkend.ai for backend services
- Follow phases: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 9 (phase 8 optional)
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
| `$plan-plus` | Brainstorming-enhanced planning (6 phases, HARD GATE) |
| `$starter` / `$dynamic` / `$enterprise` | Level-specific guidance |
| `$development-pipeline` | 9-phase pipeline overview |
| `$code-review` | Code quality analysis with static analysis patterns |
| `$bkit-templates` | PDCA document template selection |

## Response Format (MANDATORY)

### Starter Level (bkit-learning style)
ALWAYS include at the end of each response:
- **Learning Points**: 3-5 key concepts the user should learn
- **Next Learning Step**: What to study or practice next
- Use simple terms, avoid jargon. Use "Did you know?" callouts.

### Dynamic Level (bkit-pdca-guide style)
ALWAYS include at the end of each response:
- **PDCA Status Badge**: `[Feature: X | Phase: Y | Progress: Z%]`
- **Checklist**: What's done and what remains
- **Next Step**: Specific action with command/tool suggestion

### Enterprise Level (bkit-enterprise style)
ALWAYS include at the end of each response:
- **Tradeoff Analysis**: Pros/Cons of the approach taken
- **Cost Impact**: Development time, infrastructure cost, maintenance burden
- **Deployment Considerations**: Environment-specific notes

## Team Workflow (Single Agent Mode)

When working on complex features:
1. Break the task into PDCA phases (Plan -> Design -> Do -> Check -> Report)
2. For each phase, apply the relevant specialist perspective:
   - Plan: Product Manager + CTO perspective
   - Design: Architect + Security perspective
   - Do: Developer + Frontend/Backend perspective
   - Check: QA + Code Reviewer perspective
   - Report: Documentation perspective
3. Use `bkit_pdca_next` to transition between phases
4. Quality gates: Each phase must be documented before proceeding
```

### 5.3 C-3: Compaction 저항성 설계

#### 5.3.1 lib/pdca/status.js 확장

**추가 함수: `getCompactSummary()`**

```javascript
/**
 * Generate a compact summary string for compaction resilience.
 * Format: "{feature}|{phase}|{matchRate}%|iter:{count}|tasks:{chainLength}"
 * @param {object} pdcaStatus - Full PDCA status object
 * @returns {string} Compact summary string
 */
function getCompactSummary(pdcaStatus) {
  const primary = pdcaStatus.primaryFeature;
  if (!primary) return 'no-feature|none|0%|iter:0|tasks:0';

  const feature = pdcaStatus.features[primary];
  if (!feature) return `${primary}|unknown|0%|iter:0|tasks:0`;

  const phase = feature.phase || 'unknown';
  const matchRate = feature.matchRate !== null ? feature.matchRate : 0;
  const iterationCount = feature.iterationCount || 0;
  const taskChainLength = feature.taskChain ? feature.taskChain.length : 0;

  return `${primary}|${phase}|${matchRate}%|iter:${iterationCount}|tasks:${taskChainLength}`;
}
```

**추가 함수: `parseCompactSummary()`**

```javascript
/**
 * Parse a compact summary string back into structured data.
 * @param {string} summary - Compact summary string
 * @returns {{ feature: string, phase: string, matchRate: number, iterationCount: number, taskCount: number }}
 */
function parseCompactSummary(summary) {
  if (!summary) return null;
  const parts = summary.split('|');
  if (parts.length < 5) return null;

  return {
    feature: parts[0],
    phase: parts[1],
    matchRate: parseInt(parts[2]) || 0,
    iterationCount: parseInt((parts[3] || '').replace('iter:', '')) || 0,
    taskCount: parseInt((parts[4] || '').replace('tasks:', '')) || 0
  };
}
```

#### 5.3.2 bkit_init 수정

**파일:** `packages/mcp-server/src/tools/init.js`

```javascript
// 기존 handler 내 추가 (const result = { ... } 앞에)
const { getCompactSummary } = require('../lib/pdca/status');
const compactSummary = getCompactSummary(pdcaStatus);

// result 객체에 필드 추가
const result = {
  // ... 기존 필드 유지 ...
  compactSummary,
  contextRecoveryHint: 'If context seems incomplete, call bkit_get_status with mode: "recovery".'
};
```

#### 5.3.3 bkit_get_status Recovery 모드 추가

**파일:** `packages/mcp-server/src/tools/get-status.js`

```javascript
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const feature = args.feature;
  const mode = args.mode || 'normal';

  // Recovery mode: full state reconstruction
  if (mode === 'recovery') {
    return handleRecoveryMode(projectDir);
  }

  // ... 기존 로직 유지 ...
}

async function handleRecoveryMode(projectDir) {
  const status = await readPdcaStatus(projectDir);
  const { getCompactSummary } = require('../lib/pdca/status');
  const compactSummary = getCompactSummary(status);

  const primary = status.primaryFeature;
  const primaryStatus = primary ? status.features[primary] : null;

  const recoveryGuidance = [];
  if (primary && primaryStatus) {
    recoveryGuidance.push(`You are working on feature '${primary}' in ${primaryStatus.phase} phase.`);

    if (primaryStatus.documents) {
      for (const [docType, docPath] of Object.entries(primaryStatus.documents)) {
        if (docPath) {
          recoveryGuidance.push(`${docType} document: ${docPath}`);
        }
      }
    }

    if (primaryStatus.matchRate !== null) {
      recoveryGuidance.push(`Current match rate: ${primaryStatus.matchRate}%, iteration ${primaryStatus.iterationCount || 0} of 5.`);
    }

    const nextAction = await suggestNextAction(projectDir, primary);
    recoveryGuidance.push(`Next action: ${nextAction.reason}`);
  } else {
    recoveryGuidance.push('No active PDCA feature. Start with: $pdca plan <feature-name>');
  }

  return {
    recoveryMode: true,
    fullStatus: status,
    primaryFeature: primary ? {
      name: primary,
      phase: primaryStatus?.phase,
      matchRate: primaryStatus?.matchRate,
      iterationCount: primaryStatus?.iterationCount || 0,
      taskChain: primaryStatus?.taskChain || [],
      documents: primaryStatus?.documents || {}
    } : null,
    recoveryGuidance,
    compactSummary
  };
}
```

### 5.4 C-4: Task Chain 자동 생성

#### 5.4.1 lib/task/creator.js 확장

**추가 함수: `createTaskChain()`**

```javascript
/**
 * Create a full PDCA task chain for a feature.
 * Generates 5 linked tasks: Plan -> Design -> Do -> Check -> Report
 * @param {string} feature - Feature name
 * @returns {{ tasks: object[], guidance: string }}
 */
function createTaskChain(feature) {
  const phases = ['plan', 'design', 'do', 'check', 'report'];
  const now = new Date().toISOString();

  const tasks = phases.map((phase, index) => ({
    phase,
    subject: formatTaskSubject(feature, phase),
    description: PHASE_TEMPLATES[phase]?.description || `Complete ${phase} phase`,
    status: index === 0 ? 'active' : 'pending',
    createdAt: now
  }));

  return {
    tasks,
    guidance: `PDCA task chain created with ${tasks.length} tasks. Complete [PLAN] then proceed to [DESIGN].`
  };
}
```

#### 5.4.2 lib/pdca/status.js 확장

**추가: Task Chain 업데이트 함수**

```javascript
/**
 * Update task chain status when a phase is completed.
 * Marks current phase as 'completed' and next phase as 'active'.
 * @param {string} projectDir
 * @param {string} feature
 * @param {string} completedPhase
 * @returns {Promise<object>} Updated task chain
 */
async function updateTaskChain(projectDir, feature, completedPhase) {
  const status = await readPdcaStatus(projectDir);
  const featureData = status.features[feature];

  if (!featureData || !featureData.taskChain) return null;

  let foundCurrent = false;
  for (const task of featureData.taskChain) {
    if (task.phase === completedPhase) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      foundCurrent = true;
    } else if (foundCurrent && task.status === 'pending') {
      task.status = 'active';
      foundCurrent = false; // Only activate the next one
    }
  }

  await writePdcaStatus(projectDir, status);
  return featureData.taskChain;
}
```

#### 5.4.3 pdca-plan.js 수정

**파일:** `packages/mcp-server/src/tools/pdca-plan.js`

```javascript
const { createTaskChain } = require('../lib/task/creator');

async function handler(args, context) {
  // ... 기존 코드 유지 ...

  // Register feature in PDCA status (기존)
  await addFeature(projectDir, feature, 'plan');

  // NEW: Create task chain and persist to status
  const chain = createTaskChain(feature);
  const status = await readPdcaStatus(projectDir);
  if (status.features[feature]) {
    status.features[feature].taskChain = chain.tasks.map(t => ({
      phase: t.phase,
      status: t.status,
      createdAt: t.createdAt
    }));
    status.features[feature].timestamps = {
      started: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    await writePdcaStatus(projectDir, status);
  }

  const outputPath = `docs/01-plan/features/${feature}.plan.md`;

  return {
    template: resolved,
    outputPath,
    phase: 'plan',
    level,
    guidance: `Fill in the template sections. When complete, call bkit_complete_phase('${feature}', 'plan').`,
    // NEW: Task chain info
    taskChain: {
      created: true,
      tasks: chain.tasks,
      guidance: chain.guidance
    }
  };
}
```

#### 5.4.4 complete.js 수정 (Task Chain 연동)

**파일:** `packages/mcp-server/src/tools/complete.js`

```javascript
const { updateTaskChain } = require('../lib/pdca/status');

// handler() 내, phase 완료 처리 후 추가:

// Update task chain status (C-4)
const updatedChain = await updateTaskChain(projectDir, feature, phase);
if (updatedChain) {
  const activeTask = updatedChain.find(t => t.status === 'active');
  if (activeTask) {
    recommendation += ` Next task in chain: ${activeTask.phase.toUpperCase()}.`;
  }
}
```

### 5.5 P0: 기타 안정화 항목

#### 5.5.1 FR-09: 테스트 파일 동기화

**문제:** 개발 디렉토리(packages/mcp-server/tests/)의 7개 테스트 파일이 .bkit-codex/packages/mcp-server/tests/에 반영되지 않음.

**해결:** install.sh의 설치 로직이 이미 전체 디렉토리를 복사하므로, 문제는 개발 과정에서 .bkit-codex/가 수동으로 sync되지 않는 것. **build/sync 스크립트** 추가:

```bash
# scripts/sync-deploy.sh (새 파일)
#!/bin/bash
# Sync development files to .bkit-codex/ deployment directory
set -euo pipefail

DEPLOY_DIR=".bkit-codex"
SRC_DIR="."

echo "[SYNC] Syncing to $DEPLOY_DIR..."

# Sync packages
rsync -av --delete \
  "$SRC_DIR/packages/mcp-server/" \
  "$DEPLOY_DIR/packages/mcp-server/" \
  --exclude node_modules

# Sync skills
rsync -av --delete \
  "$SRC_DIR/.agents/skills/" \
  "$DEPLOY_DIR/.agents/skills/"

# Sync root config files
for f in agents.global.md AGENTS.md bkit.config.json; do
  cp "$SRC_DIR/$f" "$DEPLOY_DIR/$f"
done

echo "[SYNC] Done."
```

#### 5.5.2 FR-10: bkit-system symlink 이식성

**문제:** bkit-system/ 디렉토리의 symlink가 절대 경로를 사용하여 다른 머신에서 깨짐.

**현재 상태 확인:**

```
bkit-system/ -> /Users/popup-kay/.claude/plugins/cache/...
```

**해결:** bkit-system은 참조 문서 디렉토리이므로, docs/ 내에 별도 문서로 관리하거나 .gitignore에 추가하여 개별 사용자가 로컬 설정.

**구현:** .gitignore에 `bkit-system` 추가, README에 설정 가이드 추가.

#### 5.5.3 FR-11: platform 필드 수정

**파일:** `packages/mcp-server/src/tools/init.js`

```javascript
// handler() 내 추가
// Fix platform field (FR-11)
pdcaStatus.lastSession = pdcaStatus.lastSession || {};
pdcaStatus.lastSession.platform = 'codex';
```

#### 5.5.4 FR-12: Response Format 강화

AGENTS.md의 Response Format 섹션을 Section 5.2.2에서 정의한 대로 강화. Level별 MANDATORY 출력 규칙 명시.

---

## 6. File Change Summary

### 6.1 New Files

| # | File | Size Est. | Description |
|---|------|-----------|-------------|
| 1 | `.agents/skills/plan-plus/SKILL.md` | ~7,500B | plan-plus 6단계 프로세스 + HARD-GATE |
| 2 | `.agents/skills/plan-plus/openai.yaml` | ~300B | Codex skill 메타데이터 |
| 3 | `.agents/skills/plan-plus/references/plan-plus-process.md` | ~2,000B | 상세 프로세스 가이드 |
| 4 | `scripts/sync-deploy.sh` | ~500B | 개발->배포 동기화 스크립트 |

### 6.2 Modified Files

| # | File | Changes | FR |
|---|------|---------|----|
| 1 | `agents.global.md` | 규칙 강화 (3.8KB -> 5.5KB) | FR-04 |
| 2 | `AGENTS.md` | Response Format 강화 + plan-plus 추가 (2.0KB -> 3.0KB) | FR-12, FR-21 |
| 3 | `packages/mcp-server/src/tools/init.js` | compactSummary + platform fix | FR-05, FR-11 |
| 4 | `packages/mcp-server/src/tools/get-status.js` | Recovery mode 추가 | FR-06 |
| 5 | `packages/mcp-server/src/tools/pdca-plan.js` | Task Chain 생성 추가 | FR-07 |
| 6 | `packages/mcp-server/src/tools/complete.js` | Task Chain 연동 | FR-07 |
| 7 | `packages/mcp-server/src/lib/pdca/status.js` | getCompactSummary, updateTaskChain 추가 | FR-05, FR-08 |
| 8 | `packages/mcp-server/src/lib/task/creator.js` | createTaskChain 추가 | FR-07 |
| 9 | `.bkit-codex/` (배포본 전체) | 모든 수정사항 동기화 | FR-09 |
| 10 | `.gitignore` | bkit-system 추가 | FR-10 |

### 6.3 Files NOT Changed (의도적)

| File | Reason |
|------|--------|
| packages/mcp-server/src/server.js | MCP 서버 코어 변경 불필요 |
| packages/mcp-server/src/tools/index.js | 16개 도구 등록 변경 불필요 |
| packages/mcp-server/src/lib/pdca/template.js | 28개 템플릿 변경 불필요 |
| packages/mcp-server/src/lib/pdca/phase.js | Phase 로직 변경 불필요 |
| packages/mcp-server/src/lib/intent/*.js | Intent 감지 변경 불필요 |
| install.sh | Skills 디렉토리 자동 탐색 방식이므로 변경 불필요 |

---

## 7. Error Handling

### 7.1 Task Chain Edge Cases

| Scenario | Handling |
|----------|----------|
| `taskChain` 필드 없는 기존 feature | `feature.taskChain || []`로 Optional 처리 |
| 중복 createTaskChain 호출 | `addFeature`에서 이미 존재하면 skip하듯, taskChain도 이미 존재하면 덮어쓰지 않음 |
| Phase 완료 시 taskChain 불일치 | `updateTaskChain`에서 해당 phase가 없으면 null 반환, 경고 없이 진행 |

### 7.2 Recovery Mode Edge Cases

| Scenario | Handling |
|----------|----------|
| .pdca-status.json 파일 없음 | `getDefaultStatus()` 반환, recoveryGuidance에 "새 프로젝트" 안내 |
| primaryFeature가 null | recoveryGuidance에 "시작 안내" 포함 |
| documents 경로가 삭제된 파일 참조 | recoveryGuidance에서 경로만 안내, 파일 존재 검증은 하지 않음 (성능) |

### 7.3 Compact Summary Edge Cases

| Scenario | Handling |
|----------|----------|
| 모든 필드가 null | `no-feature|none|0%|iter:0|tasks:0` 반환 |
| matchRate가 소수점 | 정수로 반올림 (`Math.round`) |
| feature 이름에 `|` 포함 | feature 이름에 `|` 사용 금지 (kebab-case 규칙으로 방지됨) |

---

## 8. Security Considerations

### 8.1 Path Traversal 방지

- `getCompactSummary()`는 상태 파일 데이터만 사용, 파일시스템 접근 없음
- Recovery 모드는 `readPdcaStatus()`만 사용, 이미 검증된 경로
- plan-plus SKILL.md는 정적 파일, 동적 코드 실행 없음

### 8.2 상태 파일 무결성

- `writePdcaStatus()`에서 JSON 직렬화 시 순환 참조 방지 (이미 구현됨)
- taskChain 필드 추가 시 기존 데이터 보존 (덮어쓰기 없음)

### 8.3 MCP 입력 검증

- Recovery mode 파라미터: enum 검증 (`['normal', 'recovery']`)
- Task chain: feature 이름 kebab-case 검증 (기존 로직 활용)

---

## 9. Test Plan

### 9.1 Unit Tests (신규)

| # | Test File | Test Cases | Target |
|---|-----------|------------|--------|
| 1 | `tests/task-chain.test.js` | createTaskChain 생성, formatTaskSubject, 5개 phase 확인 | creator.js |
| 2 | `tests/compact-summary.test.js` | getCompactSummary, parseCompactSummary, edge cases | status.js |
| 3 | `tests/recovery-mode.test.js` | recovery mode 응답, 빈 상태, 진행 중 상태 | get-status.js |
| 4 | `tests/task-chain-update.test.js` | updateTaskChain, phase 전환, 기존 feature 호환 | status.js |

### 9.2 Integration Tests (기존 확장)

| # | Test File | 추가 Cases | Target |
|---|-----------|------------|--------|
| 1 | `tests/tools.test.js` | bkit_init compactSummary 필드 확인 | init.js |
| 2 | `tests/tools.test.js` | bkit_pdca_plan taskChain 응답 확인 | pdca-plan.js |
| 3 | `tests/tools.test.js` | bkit_complete_phase taskChain 업데이트 확인 | complete.js |
| 4 | `tests/tools.test.js` | bkit_get_status recovery mode 확인 | get-status.js |

### 9.3 Regression Tests

- 기존 424+ 테스트 전부 통과 확인
- `npm test` 전체 실행
- .pdca-status.json 기존 스키마 호환 확인 (taskChain 없는 feature 처리)

### 9.4 Manual Validation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | plan-plus skill 호출 | Codex TUI에서 `/plan-plus test-feature` | 6단계 프로세스 시작 |
| 2 | Task chain 생성 | `$pdca plan new-feature` | 5개 task 체인 생성 확인 |
| 3 | Context recovery | Codex compaction 후 `bkit_get_status mode=recovery` | 전체 상태 복구 |
| 4 | Automation rules | 새 세션에서 bkit_init 없이 코드 작성 시도 | AI가 자발적으로 init 호출 |

---

## 10. Implementation Order

### Phase 1: Foundation (C-3, C-4 먼저 -- 코어 로직)

```
1. lib/pdca/status.js     -- getCompactSummary, parseCompactSummary, updateTaskChain 추가
2. lib/task/creator.js     -- createTaskChain 추가
3. tools/init.js           -- compactSummary + platform fix
4. tools/get-status.js     -- recovery mode
5. tools/pdca-plan.js      -- task chain 생성
6. tools/complete.js       -- task chain 연동
7. Unit tests              -- 신규 4개 테스트 파일
```

### Phase 2: Skill Porting (C-1)

```
8.  .agents/skills/plan-plus/openai.yaml
9.  .agents/skills/plan-plus/SKILL.md
10. .agents/skills/plan-plus/references/plan-plus-process.md
```

### Phase 3: Rules Enhancement (C-2)

```
11. agents.global.md 강화
12. AGENTS.md 강화
```

### Phase 4: Stabilization (P0)

```
13. scripts/sync-deploy.sh 생성
14. .gitignore 업데이트 (bkit-system)
15. .bkit-codex/ 배포본 동기화
16. Regression test 실행 (424+ tests)
17. 신규 테스트 추가 (task-chain, compact-summary, recovery-mode)
```

### Phase 5: Validation

```
18. npm test 전체 통과 확인
19. install.sh plan-plus 포함 검증
20. 수동 E2E 검증 (4개 시나리오)
```

---

## 11. Match Rate Impact Projection

| Component | Weight | Before | After | Delta | Change Detail |
|-----------|:------:|:------:|:-----:|:-----:|---------------|
| Skills | 5 | 96.3% | **100%** | +3.7% | plan-plus 포팅 |
| MCP Tools | 5 | 85% | **90%** | +5% | Compact summary, Task chain, Recovery |
| AGENTS.md | 4 | 90% | **95%** | +5% | 규칙 강화 |
| Lib Modules | 3 | 45% | **52%** | +7% | status.js, creator.js 확장 |
| Agents | 4 | 15% | **20%** | +5% | code-review + plan-plus 흡수 |
| Hooks | 4 | 35% | **45%** | +10% | AGENTS.md 규칙 강화 |
| Team | 3 | 0% | **5%** | +5% | AGENTS.md Team Workflow 가이드 |
| Output Styles | 2 | 60% | **75%** | +15% | Response Format MANDATORY |
| Configuration | 3 | 95% | **98%** | +3% | platform fix, symlink fix |
| Templates | 4 | 100% | 100% | 0% | - |
| Install | 4 | 99% | 99% | 0% | - |
| Scripts | 3 | 40% | 40% | 0% | - |
| Commands | 2 | 33% | 33% | 0% | - |
| bkit-system | 1 | 100% | 100% | 0% | - |
| CI/CD | 2 | 100% | 100% | 0% | - |
| Testing | 3 | 100% | 100% | 0% | - |
| Documentation | 2 | 100% | 100% | 0% | - |

**Weighted Score**: 70.2% -> **~76.8%** (v1.0.0 Hotfix 단독)

> Note: 80% 달성을 위해서는 v1.1.0 초기 항목(Gap Analysis 강화, Output Style SKILL.md)이 추가로 필요함.

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-21 | Initial design document (C-1 ~ C-4, P0 items) |
