# bkit Codex Porting - Implementation Plan

> Version: 1.0.0 | Date: 2026-02-14 | Status: Draft
> Source: bkit-claude-code v1.5.4 → bkit-codex v1.0.0

---

## 1. Overview

### 1.1 Purpose

bkit-claude-code (v1.5.4)의 모든 기능을 OpenAI Codex 플랫폼으로 이식하여, Codex 사용자에게도 동일한 **PDCA 기반 문서 주도 개발** 경험을 제공하는 것.

### 1.2 Core Mission (Preserved)

```
"명령어를 몰라도 문서 기반 개발과 지속적 개선을
 자연스럽게 실천할 수 있게 한다"
```

### 1.3 Three Philosophies → Codex Adaptation

| Philosophy | bkit (Claude Code) | bkit-codex (Codex) |
|------------|--------------------|--------------------|
| **Automation First** | 10 Hook Events로 자동 개입 | AGENTS.md 지시문 + MCP Tool 호출 유도 |
| **No Guessing** | PreToolUse에서 디자인 문서 자동 체크 | AGENTS.md "NEVER guess" 규칙 + MCP `bkit_check_pdca` |
| **Docs = Code** | PostToolUse에서 Gap Analysis 자동 제안 | SKILL.md 워크플로우에 Gap Analysis 단계 내장 |

### 1.4 Architecture Paradigm Shift

```
bkit-claude-code (Hook-Driven Dynamic Context)
  Hook(10 events) → Script(45) → Lib(241 functions) → State Files
  = 100% 자동화, AI 개입 없이 시스템이 제어

bkit-codex (Instruction-Driven Semi-Dynamic Context)
  AGENTS.md(Static Rules) + SKILL.md(Workflow) + MCP(Dynamic State)
  = ~70% 자동화, AI가 지시를 따라 자발적으로 수행
```

---

## 2. Scope

### 2.1 In Scope (이식 대상)

| Category | Items | Count |
|----------|-------|:-----:|
| Agent Skills | 26 bkit Skills → 26 Codex Skills | 26 |
| MCP Server | Hook 대체 + lib/ 핵심 로직 이식 | 16 tools |
| AGENTS.md | Global + Project 계층 설계 | 2 |
| Templates | PDCA + Pipeline 문서 템플릿 | 27 |
| Shared References | API patterns, naming conventions 등 | 4 |
| Public Repository | 설치 스크립트, CI/CD, 문서 | 1 |
| Config | bkit.config.json → config.toml 매핑 | 1 |

### 2.2 Out of Scope (이식 제외)

| Feature | Reason |
|---------|--------|
| Agent Teams (CTO-Led) | Codex에 SubagentStart/Stop/TeammateIdle 없음 |
| lib/team/ (40 functions) | Agent Teams 전용 모듈 |
| Output Styles (독립 시스템) | Codex 미지원 → AGENTS.md에 핵심 규칙만 통합 |
| Hook-based Auto-Block | PreToolUse `decision: "block"` 불가 → 가이던스로 대체 |
| Context Fork/Merge | fork→merge back 패턴 불가 → 파일 기반 데이터 전달로 대체 |
| claude-code-learning Skill | Claude Code 전용 → codex-learning으로 재작성 필요 |

### 2.3 Priority Groups

```
P0 (Core PDCA) ━━━━━━━━━━━━━━━━━━━━━━━
 ├── AGENTS.md (Global + Project)
 ├── MCP Server (6 core tools)
 ├── pdca Skill (unified)
 ├── bkit-rules Skill (→ AGENTS.md + Skill)
 └── bkit-templates Skill

P1 (Level & Pipeline) ━━━━━━━━━━━━━━━━
 ├── starter, dynamic, enterprise Skills
 ├── development-pipeline Skill
 ├── phase-1 ~ phase-9 Skills (9개)
 └── MCP Server (4 automation tools)

P2 (Specialized) ━━━━━━━━━━━━━━━━━━━━━
 ├── code-review, zero-script-qa Skills
 ├── mobile-app, desktop-app Skills
 ├── codex-learning Skill (신규)
 └── MCP Server (6 utility tools)

P3 (bkend Ecosystem) ━━━━━━━━━━━━━━━━━
 ├── bkend-quickstart ~ bkend-cookbook (5개)
 └── bkend MCP patterns integration
```

---

## 3. Requirements

### 3.1 Functional Requirements

#### FR-01: Codex Agent Skills (26개)
- 26개 bkit SKILL.md를 Codex SKILL.md 형식으로 변환
- YAML frontmatter: `name`, `description` 필수 + `allowed-tools`, `metadata` 선택
- bkit 전용 필드(agent, agents, hooks, user-invocable, imports) 제거 → description 통합 또는 references/ 활용
- Multi-binding Skills(7개)은 단일 Skill 내 description 통합 (Option A 채택)
- Pipeline Chaining은 description 말미에 "Next: phase-N" 텍스트로 구현
- 8개 언어 트리거 키워드를 description에 유지 (Codex semantic matching 활용)

#### FR-02: MCP Server (16 tools)
- Node.js STDIO transport 기반 MCP 서버
- bkit lib/ 241개 함수 중 ~80개를 포팅 (team/ 전체 제외)
- 외부 의존성 0개 (순수 Node.js)
- 16개 MCP Tool 구현:

| Priority | Tool | Purpose | 대체 대상 |
|:--------:|------|---------|-----------|
| P0 | `bkit_init` | 세션 초기화, 레벨 감지 | SessionStart |
| P0 | `bkit_get_status` | PDCA 상태 조회 | PDCA status |
| P0 | `bkit_pre_write_check` | 파일 쓰기 전 PDCA 가드 | PreToolUse(Write) |
| P0 | `bkit_complete_phase` | PDCA 단계 완료/전이 | Stop |
| P0 | `bkit_pdca_plan` | Plan 문서 생성 | /pdca plan |
| P0 | `bkit_pdca_design` | Design 문서 생성 | /pdca design |
| P1 | `bkit_analyze_prompt` | 의도 감지, 트리거 매칭 | UserPromptSubmit |
| P1 | `bkit_post_write` | 사후 가이던스 | PostToolUse(Write) |
| P1 | `bkit_pdca_analyze` | Gap Analysis | /pdca analyze |
| P1 | `bkit_pdca_next` | 다음 단계 제안 | /pdca next |
| P1 | `bkit_classify_task` | 태스크 크기 분류 | task classification |
| P1 | `bkit_detect_level` | 프로젝트 레벨 감지 | level detection |
| P2 | `bkit_select_template` | 템플릿 선택 | select-template.js |
| P2 | `bkit_check_deliverables` | 단계 산출물 확인 | phase check |
| P2 | `bkit_memory_read` | 세션 메모리 읽기 | FR-08 |
| P2 | `bkit_memory_write` | 세션 메모리 쓰기 | FR-08 |

#### FR-03: AGENTS.md 계층 구조
- Global AGENTS.md (~/.codex/AGENTS.md): ~4KB
  - bkit 3대 철학 + PDCA Auto-Apply 규칙
  - 레벨 감지 규칙 (디렉토리/파일 기반)
  - Pre-Write Check / Post-Write Guidance 규칙
  - 코드 품질 표준 + 네이밍 컨벤션
  - MCP Tool 호출 가이드
- Project AGENTS.md (프로젝트 루트): ~2.5KB
  - 레벨 오버라이드 (Starter/Dynamic/Enterprise)
  - PDCA 상태 파일 참조 규칙
  - 프로젝트 특화 설정 + Output Style 규칙 (1개만)
- 총 합산: ~6.7KB / 32KB 제한 (21%) → 79% 여유

#### FR-04: Public Repository
- GitHub public repository 구조
- 3가지 설치 시나리오 (프로젝트/글로벌/$skill-installer)
- install.sh / install.ps1 자동 설치 스크립트
- MCP 서버 npm 패키지 배포 (@popup-studio/bkit-codex-mcp)
- CI/CD (GitHub Actions: validate, test, release)

#### FR-05: 상태 호환성
- docs/.pdca-status.json (v2.0 스키마) 완전 호환
- docs/.bkit-memory.json 완전 호환
- bkit-claude-code 프로젝트에서 bkit-codex로 전환 시 상태 유실 없음

### 3.2 Non-Functional Requirements

| NFR | Target | Measurement |
|-----|--------|-------------|
| Codex 호환성 | Codex CLI 최신 + IDE Extension | 최소 gpt-5.2-codex 이상 |
| 설치 시간 | < 60초 | install.sh 실행 시간 |
| MCP 응답 시간 | < 100ms (P95) | 각 tool 응답 시간 |
| SKILL.md 크기 | < 500줄 / 스킬 | wc -l 검증 |
| Node.js 의존성 | 0개 외부 패키지 | package.json dependencies |
| 다국어 지원 | 8개 언어 (en,ko,ja,zh,es,fr,de,it) | description 트리거 키워드 |
| PDCA 자동화 충실도 | ≥ 70% | 철학 분석 기반 |
| 라이선스 | Apache-2.0 | LICENSE 파일 |

---

## 4. Architecture

### 4.1 System Architecture

```
+======================================================================+
|                    bkit-codex v1.0.0 Architecture                     |
+======================================================================+
|                                                                      |
|  [User Input]                                                        |
|       |                                                              |
|       v                                                              |
|  +----------------------------------------------------------------+  |
|  | AGENTS.md Layer (Static Rules)                                 |  |
|  |                                                                |  |
|  |  Global (~/.codex/AGENTS.md)          ~4KB                     |  |
|  |    +-- 3 Philosophies                                          |  |
|  |    +-- PDCA Auto-Apply Rules                                   |  |
|  |    +-- Level Detection Rules                                   |  |
|  |    +-- Pre-Write / Post-Write Rules                            |  |
|  |    +-- Code Quality + Naming Conventions                       |  |
|  |    +-- MCP Tool Usage Guide                                    |  |
|  |                                                                |  |
|  |  Project (./AGENTS.md)                ~2.5KB                   |  |
|  |    +-- Level Override (Starter/Dynamic/Enterprise)             |  |
|  |    +-- PDCA Status Reference                                   |  |
|  |    +-- Project-Specific Settings                               |  |
|  |    +-- Output Style Rules (Level-specific)                     |  |
|  +----------------------------------------------------------------+  |
|       |                                                              |
|       v                                                              |
|  +----------------------------------------------------------------+  |
|  | Skills Layer (26 Agent Skills)                                 |  |
|  |                                                                |  |
|  |  .agents/skills/                                               |  |
|  |    ├── bkit-rules/      Core PDCA rules                       |  |
|  |    ├── pdca/             Unified PDCA (plan/design/do/...)     |  |
|  |    ├── bkit-templates/   Template selection guide              |  |
|  |    ├── starter/          Beginner guide                        |  |
|  |    ├── dynamic/          BaaS fullstack                        |  |
|  |    ├── enterprise/       MSA/K8s/Terraform                     |  |
|  |    ├── development-pipeline/  9-phase overview                 |  |
|  |    ├── phase-1 ~ phase-9/    Pipeline phases                   |  |
|  |    ├── code-review/      Code quality analysis                 |  |
|  |    ├── zero-script-qa/   Log-based QA                          |  |
|  |    ├── mobile-app/       React Native, Flutter                 |  |
|  |    ├── desktop-app/      Electron, Tauri                       |  |
|  |    ├── codex-learning/   Codex usage guide (NEW)               |  |
|  |    └── bkend-*/          BaaS specialist (5)                   |  |
|  +----------------------------------------------------------------+  |
|       |                                                              |
|       v                                                              |
|  +----------------------------------------------------------------+  |
|  | MCP Server Layer (16 Tools)                                    |  |
|  |                                                                |  |
|  |  packages/mcp-server/                                          |  |
|  |    ├── Core: bkit_init, bkit_get_status, bkit_pre_write_check  |  |
|  |    ├── PDCA: bkit_pdca_plan, _design, _analyze, _next          |  |
|  |    ├── Phase: bkit_complete_phase, bkit_post_write              |  |
|  |    ├── Intent: bkit_analyze_prompt, bkit_classify_task          |  |
|  |    ├── Level: bkit_detect_level                                 |  |
|  |    ├── Template: bkit_select_template, bkit_check_deliverables  |  |
|  |    └── Memory: bkit_memory_read, bkit_memory_write              |  |
|  |                                                                |  |
|  |  Portable lib/ (~80 functions from bkit lib/241)               |  |
|  |    ├── core/ (25)   config, cache, file detection              |  |
|  |    ├── pdca/ (40)   status, level, phase, automation           |  |
|  |    ├── intent/ (15) language, trigger, ambiguity               |  |
|  |    └── task/ (20)   classification, creator                    |  |
|  +----------------------------------------------------------------+  |
|       |                                                              |
|       v                                                              |
|  +----------------------------------------------------------------+  |
|  | State Layer (File-based, bkit-compatible)                      |  |
|  |                                                                |  |
|  |  docs/.pdca-status.json    PDCA status (v2.0 schema)           |  |
|  |  docs/.bkit-memory.json    Session persistence (FR-08)         |  |
|  |  docs/.pdca-snapshots/     Compaction snapshots (manual)       |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+======================================================================+
```

### 4.2 Context Engineering Mapping (FR-01 ~ FR-08)

| FR | bkit Implementation | Codex Implementation | Fidelity |
|:--:|---------------------|----------------------|:--------:|
| FR-01 | context-hierarchy.js (4-level) | AGENTS.md hierarchy (Global→Project→Dir) | 85% |
| FR-02 | import-resolver.js (@import) | SKILL.md references/ directory | 75% |
| FR-03 | context-fork.js (deep clone) | File-based data passing + sandbox | 60% |
| FR-04 | user-prompt-handler.js | SKILL.md description semantic matching | 70% |
| FR-05 | permission-manager.js (deny/ask/allow) | Codex approval_policy + sandbox + AGENTS.md | 80% |
| FR-06 | task/creator.js (blockedBy chain) | .pdca-status.json + AGENTS.md rules | 65% |
| FR-07 | context-compaction.js (snapshot) | File-based state (.pdca-status.json always) | 70% |
| FR-08 | memory-store.js (session KV) | MCP bkit_memory_read/write | 85% |

**Average Fidelity: 74%**

### 4.3 3-Tier Context Strategy

```
Tier 1: AGENTS.md (Static Rules)
        "항상 적용되는 불변 규칙"
        → 3대 철학, PDCA 규칙, 레벨 감지, 컨벤션
        → 변경 빈도: 거의 없음

Tier 2: SKILL.md (Workflow Knowledge)
        "활성화 시 주입되는 도메인 지식"
        → PDCA 템플릿, Pipeline 가이드, 전문 지식
        → Progressive Disclosure: metadata → body → references

Tier 3: MCP Tools (Dynamic State)
        "실시간 상태 조회 및 변경"
        → PDCA 상태, 메모리, 의도 감지, 태스크 분류
        → AI가 AGENTS.md 지시에 따라 호출
```

---

## 5. Implementation Phases

### Phase 1: Foundation (P0 - Core PDCA)

**목표**: PDCA 핵심 워크플로우가 Codex에서 동작

**산출물**:
1. Repository 기본 구조 생성
2. Global AGENTS.md 작성 (~4KB)
3. Project AGENTS.md 작성 (~2.5KB)
4. MCP Server 기본 프레임워크 (server.js + STDIO protocol handler)
5. P0 MCP Tools 6개 구현:
   - `bkit_init`, `bkit_get_status`, `bkit_pre_write_check`
   - `bkit_complete_phase`, `bkit_pdca_plan`, `bkit_pdca_design`
6. P0 Skills 3개 변환:
   - `bkit-rules`, `pdca`, `bkit-templates`
7. Templates 이식 (plan, design, design-starter, design-enterprise, analysis, report)
8. install.sh / config.toml 자동 설정

**완료 기준**: `/pdca plan feature` → `/pdca design feature` → 구현 → PDCA 상태 추적 동작

### Phase 2: Level & Pipeline (P1)

**목표**: Starter/Dynamic/Enterprise 레벨별 경험 + 9단계 Pipeline 제공

**산출물**:
1. Level Skills 3개 변환: `starter`, `dynamic`, `enterprise`
2. Pipeline Skills 10개 변환: `development-pipeline`, `phase-1` ~ `phase-9`
3. P1 MCP Tools 6개 구현:
   - `bkit_analyze_prompt`, `bkit_post_write`, `bkit_pdca_analyze`
   - `bkit_pdca_next`, `bkit_classify_task`, `bkit_detect_level`
4. Pipeline Chaining (description 기반 next phase 안내)
5. Level-specific Template 자동 선택

**완료 기준**: 레벨 감지 → 레벨별 가이드 → 9-phase Pipeline 순차 진행

### Phase 3: Specialized Skills (P2)

**목표**: 전문 스킬 및 유틸리티 기능 완성

**산출물**:
1. Specialized Skills 5개 변환: `code-review`, `zero-script-qa`, `mobile-app`, `desktop-app`, `codex-learning` (신규)
2. P2 MCP Tools 4개 구현:
   - `bkit_select_template`, `bkit_check_deliverables`
   - `bkit_memory_read`, `bkit_memory_write`
3. Shared references 4개 이식: api-patterns, bkend-patterns, error-handling, naming-conventions
4. Check-Act Iteration Loop (pdca-analyze → pdca-iterate → 재검증, max 5)

**완료 기준**: 모든 전문 스킬 동작 + 메모리 영속성 + 반복 개선 루프

### Phase 4: bkend Ecosystem (P3)

**목표**: bkend.ai BaaS 전문 스킬 완성

**산출물**:
1. bkend Skills 5개 변환: `bkend-quickstart`, `bkend-data`, `bkend-auth`, `bkend-storage`, `bkend-cookbook`
2. bkend MCP 패턴 통합 (references/bkend-patterns.md)

**완료 기준**: 모든 bkend 스킬 동작

### Phase 5: Polish & Release (v1.0.0)

**목표**: 품질 보증 + 공개 배포

**산출물**:
1. CI/CD 파이프라인 (GitHub Actions: validate, test, release)
2. 문서 완성 (README, installation, architecture, migration-guide, API reference)
3. npm 패키지 배포 (@popup-studio/bkit-codex-mcp)
4. CONTRIBUTING.md, CHANGELOG.md, LICENSE
5. 26개 SKILL.md 로딩 테스트
6. MCP Server 16개 tool 기능 테스트
7. 3가지 설치 시나리오 검증

**완료 기준**: v1.0.0 태그 + GitHub Release + npm publish

---

## 6. Skills Mapping (26 Skills)

### 6.1 Portability Matrix

| # | Skill | Portability | Complexity | Key Changes |
|:-:|-------|:-----------:|:----------:|-------------|
| 1 | bkit-rules | ❌→⚠️ | High | hooks→AGENTS.md + SKILL.md 병행 |
| 2 | pdca | ⚠️ | High | agents multi-binding→description 통합 |
| 3 | bkit-templates | ✅ | Low | imports→references/ |
| 4 | starter | ✅ | Low | agent→description |
| 5 | dynamic | ✅ | Low | agent→description |
| 6 | enterprise | ⚠️ | Medium | 5 agents→description 통합 |
| 7 | development-pipeline | ✅ | Low | 순수 가이드 |
| 8 | phase-1-schema | ✅ | Low | next-skill→description text |
| 9 | phase-2-convention | ✅ | Low | next-skill→description text |
| 10 | phase-3-mockup | ⚠️ | Low | agents 2개→description |
| 11 | phase-4-api | ⚠️ | Low | hooks 제거 |
| 12 | phase-5-design-system | ⚠️ | Low | agents+hooks→description |
| 13 | phase-6-ui-integration | ⚠️ | Low | agents+hooks→description |
| 14 | phase-7-seo-security | ⚠️ | Low | agents 2개→description |
| 15 | phase-8-review | ⚠️ | Medium | 5 agents+LSP→description |
| 16 | phase-9-deployment | ⚠️ | Low | hooks 제거 |
| 17 | code-review | ⚠️ | Low | LSP 제거→Read/Grep |
| 18 | zero-script-qa | ⚠️ | Low | fork 제거 |
| 19 | mobile-app | ✅ | Low | 순수 가이드 |
| 20 | desktop-app | ✅ | Low | 순수 가이드 |
| 21 | claude-code-learning | ✅→✅ | Medium | codex-learning으로 재작성 |
| 22 | bkend-quickstart | ✅ | Low | 순수 가이드 |
| 23 | bkend-data | ✅ | Low | 순수 가이드 |
| 24 | bkend-auth | ✅ | Low | 순수 가이드 |
| 25 | bkend-storage | ✅ | Low | 순수 가이드 |
| 26 | bkend-cookbook | ✅ | Low | 순수 가이드 |

**Summary**: 14 ✅ (54%) / 11 ⚠️ (42%) / 1 ❌→⚠️ (4%)

### 6.2 SKILL.md Conversion Rules

```
bkit Frontmatter           → Codex Frontmatter
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
name                       → name (동일, 64자 제한, 디렉토리명 일치)
description                → description (1024자 제한, Triggers/Do NOT use 유지)
agent: X                   → description에 "Expert: X역할" 추가
agents: { a:X, b:Y }       → description에 "Actions: a→X역할, b→Y역할" 통합
allowed-tools              → allowed-tools (Codex도 지원, experimental)
user-invocable             → 제거 (Codex는 implicit/explicit 모두 기본 지원)
hooks                      → 제거 (MCP Server로 대체)
imports                    → references/ 디렉토리에 파일 배치
next-skill                 → description 말미 "Next: phase-N-xxx" 텍스트
pdca-phase                 → description에 "PDCA Phase: xxx" 메타 정보
task-template              → description에 Task 명명 규칙 포함
argument-hint              → description에 사용법 예시 포함
context: fork              → 제거 (Codex sandbox로 대체)
```

### 6.3 Skill Directory Structure (Codex Standard)

```
skill-name/
├── SKILL.md              # Required: YAML frontmatter + markdown body
├── agents/
│   └── openai.yaml       # Optional: UI, policy, dependencies
├── scripts/              # Optional: deterministic scripts
├── references/           # Optional: on-demand loaded docs
│   ├── template.md       # bkit templates → references
│   └── patterns.md       # bkit shared → references
└── assets/               # Optional: icons, schemas (not loaded to context)
```

---

## 7. MCP Server Design

### 7.1 Architecture

```
packages/mcp-server/
├── package.json           # name: @popup-studio/bkit-codex-mcp, deps: 0
├── index.js               # Entry point (STDIO transport)
├── src/
│   ├── server.js          # JSON-RPC 2.0 protocol handler (~100 lines)
│   ├── tools/             # 16 tool implementations
│   │   ├── index.js       # Tool registry
│   │   ├── init.js        # bkit_init
│   │   ├── get-status.js  # bkit_get_status
│   │   ├── pre-write.js   # bkit_pre_write_check
│   │   ├── post-write.js  # bkit_post_write
│   │   ├── complete.js    # bkit_complete_phase
│   │   ├── pdca-plan.js   # bkit_pdca_plan
│   │   ├── pdca-design.js # bkit_pdca_design
│   │   ├── pdca-analyze.js # bkit_pdca_analyze
│   │   ├── pdca-next.js   # bkit_pdca_next
│   │   ├── analyze-prompt.js # bkit_analyze_prompt
│   │   ├── classify.js    # bkit_classify_task
│   │   ├── detect-level.js # bkit_detect_level
│   │   ├── template.js    # bkit_select_template
│   │   ├── deliverables.js # bkit_check_deliverables
│   │   ├── memory-read.js # bkit_memory_read
│   │   └── memory-write.js # bkit_memory_write
│   └── lib/               # Ported from bkit-claude-code/lib/ (~80 functions)
│       ├── core/          # 25 functions (config, cache, file)
│       ├── pdca/          # 40 functions (status, level, phase, automation)
│       ├── intent/        # 15 functions (language, trigger, ambiguity)
│       └── task/          # 20 functions (classification, creator)
└── tests/
    └── tools.test.js
```

### 7.2 AGENTS.md ↔ MCP Tool Invocation Flow

```
AGENTS.md 지시문 (Static)          MCP Tool 호출 (Dynamic)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"세션 시작 시 초기화하세요"     →  bkit_init(projectDir)
"요청 분석 후 의도를 파악"     →  bkit_analyze_prompt(prompt)
"파일 작성 전 PDCA 확인"       →  bkit_pre_write_check(filePath)
"작성 후 다음 단계 제안"       →  bkit_post_write(filePath)
"단계 완료 시 상태 전이"       →  bkit_complete_phase(feature, phase)
```

### 7.3 Automation Guarantee Levels

| Behavior | Claude Code (Hook) | Codex (AGENTS.md + MCP) | Level |
|----------|:------------------:|:-----------------------:|:-----:|
| Session init | 100% auto | AGENTS.md guided | 95% |
| Intent detection | 100% auto | AGENTS.md guided | 85% |
| Pre-write check | 100% auto | AGENTS.md guided | 80% |
| Post-write guide | 100% auto | AGENTS.md guided | 75% |
| Phase transition | 100% auto | AGENTS.md guided | 80% |
| Team orchestration | 100% auto | **Not available** | 0% |
| **Average** | **100%** | **~69%** | |

### 7.4 config.toml Integration

```toml
# Project-level: .codex/config.toml
[mcp_servers.bkit]
transport = "stdio"
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]

# Or via npm (after publish):
[mcp_servers.bkit]
transport = "stdio"
command = "npx"
args = ["-y", "@popup-studio/bkit-codex-mcp"]
```

---

## 8. Repository & Distribution

### 8.1 Repository Structure

```
bkit-codex/                            # Public GitHub Repository
├── .agents/
│   └── skills/                        # 26 Codex Agent Skills
│       ├── bkit-rules/SKILL.md
│       ├── pdca/
│       │   ├── SKILL.md
│       │   └── references/
│       │       ├── plan.template.md
│       │       ├── design.template.md
│       │       ├── analysis.template.md
│       │       └── report.template.md
│       ├── starter/SKILL.md
│       ├── dynamic/SKILL.md
│       ├── enterprise/SKILL.md
│       ├── development-pipeline/SKILL.md
│       ├── phase-1-schema/ ~ phase-9-deployment/
│       ├── code-review/SKILL.md
│       ├── zero-script-qa/SKILL.md
│       ├── mobile-app/SKILL.md
│       ├── desktop-app/SKILL.md
│       ├── codex-learning/SKILL.md
│       └── bkend-{quickstart,data,auth,storage,cookbook}/SKILL.md
├── packages/
│   └── mcp-server/                    # MCP Server (npm package)
│       ├── package.json
│       ├── index.js
│       ├── src/
│       │   ├── server.js
│       │   ├── tools/
│       │   └── lib/
│       └── tests/
├── templates/                         # Reference templates (27)
├── shared/                            # Shared patterns (4)
├── AGENTS.md                          # Project AGENTS.md (sample)
├── agents.global.md                   # Global AGENTS.md (to install)
├── install.sh                         # Auto-install (Unix/Mac)
├── install.ps1                        # Auto-install (Windows)
├── bkit.config.json                   # Reference config
├── README.md
├── LICENSE                            # Apache-2.0
├── CONTRIBUTING.md
├── CHANGELOG.md
├── .github/
│   └── workflows/
│       ├── validate.yml               # SKILL.md format validation
│       ├── test.yml                    # MCP server tests
│       └── release.yml                # Tag → npm publish + GitHub release
└── docs/
    ├── installation.md
    ├── architecture.md
    ├── migration-guide.md
    └── api/
        ├── skills-api.md
        └── mcp-api.md
```

### 8.2 Installation Scenarios

**Scenario A: Project-level (권장)**
```bash
curl -fsSL https://raw.githubusercontent.com/popup-studio-ai/bkit-codex/main/install.sh | bash
# → .bkit-codex/ clone, .agents/ symlink, AGENTS.md symlink, config.toml 자동 추가
```

**Scenario B: Global (모든 프로젝트)**
```bash
git clone https://github.com/popup-studio-ai/bkit-codex.git ~/.codex/bkit-codex
ln -s ~/.codex/bkit-codex/.agents/skills ~/.agents/skills/bkit
cp ~/.codex/bkit-codex/agents.global.md ~/.codex/AGENTS.md
```

**Scenario C: $skill-installer (미래)**
```
$skill-installer bkit-codex
```

### 8.3 Version Strategy

| bkit-claude-code | bkit-codex | Milestone |
|:----------------:|:----------:|-----------|
| v1.5.4 | v1.0.0 | Initial Codex porting (26 skills, MCP server) |
| - | v1.1.0 | Enhanced automation, community feedback |
| - | v1.2.0 | Enterprise skills expansion |
| - | v2.0.0 | SKILL.md v2 format (official spec alignment) |

---

## 9. Success Criteria

### 9.1 Functional Criteria

| # | Criterion | Verification |
|:-:|-----------|:------------:|
| 1 | 26개 SKILL.md가 Codex에서 로드됨 | `/skills` 명령으로 확인 |
| 2 | `$pdca` 호출로 PDCA 워크플로우 실행 | Plan→Design→Do 순차 동작 |
| 3 | MCP 16개 tool이 모두 응답 | tools/list로 확인 |
| 4 | .pdca-status.json 상태 추적 동작 | Phase 전이 확인 |
| 5 | install.sh로 60초 내 설치 완료 | 3가지 시나리오 테스트 |
| 6 | 8개 언어 트리거 키워드 인식 | 한국어/일본어/중국어 등 테스트 |
| 7 | bkit-claude-code 프로젝트 상태 호환 | 기존 .pdca-status.json 읽기 |

### 9.2 Quality Metrics

| Metric | Target |
|--------|:------:|
| SKILL.md 총 개수 | 26 |
| MCP Tool 총 개수 | 16 |
| AGENTS.md 총 크기 | < 10KB / 32KB |
| MCP 응답 시간 P95 | < 100ms |
| 외부 의존성 | 0 |
| PDCA 자동화 충실도 | ≥ 70% |
| 테스트 커버리지 | ≥ 80% |

---

## 10. Risks & Mitigations

| # | Risk | Impact | Probability | Mitigation |
|:-:|------|:------:|:-----------:|------------|
| 1 | Codex Hook 시스템 미출시 | PDCA 자동화 충실도 70%에 고정 | High | AGENTS.md 강화 + MCP 보완으로 최대 효과 |
| 2 | AGENTS.md 지시 무시 | AI가 규칙을 따르지 않을 수 있음 | Medium | 핵심 규칙을 "MUST", "ALWAYS", "NEVER"로 강조 |
| 3 | SKILL.md description 1024자 제한 | 8개 언어 트리거 + 상세 설명 불가 | Medium | 핵심 언어(en, ko)만 description, 나머지는 references/ |
| 4 | MCP Server 성능 이슈 | 느린 응답으로 UX 저하 | Low | 인메모리 캐시 (TTL 5초) + 비동기 I/O |
| 5 | Codex SKILL.md 스펙 변경 | Breaking change 발생 | Medium | Agent Skills 표준(agentskills.io) 모니터링 |
| 6 | npm 패키지 보안 | 공급망 공격 가능성 | Low | 의존성 0개 전략 + GitHub Actions 보안 스캔 |
| 7 | 사용자 온보딩 어려움 | 복잡한 설치로 이탈 | Medium | install.sh 원클릭 설치 + README 간소화 |

---

## 11. Key Design Decisions

| # | Decision | Choice | Rationale |
|:-:|----------|--------|-----------|
| 1 | Multi-binding 처리 | 단일 SKILL.md + description 통합 | Codex semantic matching이 action 키워드를 자연스럽게 구분 |
| 2 | MCP Transport | STDIO | Codex config.toml 표준, 장기 실행 프로세스 |
| 3 | 외부 의존성 | 0개 | bkit lib가 순수 Node.js, MCP protocol도 자체 구현 |
| 4 | MCP Tool 수 | 16개 | Too many→AI 혼란, Too few→기능 부족 |
| 5 | lib 포팅 범위 | 80/241 함수 | team/ 전체 제외, Hook I/O 전용 함수 제외 |
| 6 | AGENTS.md 전략 | Static Rules + MCP Dynamic | Hook 자동화의 최선의 근사치 |
| 7 | 상태 파일 형식 | bkit v2.0 호환 | 플랫폼 간 프로젝트 이동 지원 |
| 8 | bkit-rules 처리 | AGENTS.md 인라인 + SKILL.md 병행 | 자동 적용(AGENTS.md) + 상세 규칙(SKILL.md) 이중 보장 |
| 9 | Output Styles | Project AGENTS.md에 레벨별 1개만 | 32KB 제한 내 효율 + 불필요한 컨텍스트 방지 |
| 10 | claude-code-learning | codex-learning으로 재작성 | 플랫폼 전용 학습 가이드 필요 |

---

## 12. Lib Porting Strategy

### 12.1 Module Selection (241 → ~80 functions)

| Module | Total | Ported | Excluded | Reason |
|--------|:-----:|:------:|:--------:|--------|
| core/ | 41 | 25 | 16 | platform.js (Claude Code 전용), io.js (Hook stdin/stdout) 제외 |
| pdca/ | 54 | 40 | 14 | automation.js의 Hook I/O 함수, AskUserQuestion 전용 함수 제외 |
| intent/ | 19 | 15 | 4 | 상수/패턴은 포함, Hook 전용 래퍼 제외 |
| task/ | 26 | 20 | 6 | context.js의 세션 상태 함수 → MCP 서버 내부로 전환 |
| team/ | 40 | 0 | 40 | **전체 제외** (Codex에 팀 에이전트 없음) |

### 12.2 Porting Modifications

| Pattern | bkit Original | Codex Adaptation |
|---------|---------------|------------------|
| PROJECT_DIR 참조 | `process.env.CLAUDE_PROJECT_DIR` | MCP Tool argument로 전달 |
| Hook I/O | `readStdinSync()`, `outputAllow()` | 제거, MCP response로 대체 |
| globalCache | 메모리 내 싱글턴 | MCP 서버 프로세스 내 유지 (STDIO = 장기 실행) |
| debugLog | stdout/stderr 혼재 | stderr 전용 (MCP는 stdout 사용) |
| Lazy require | `getCore()` 패턴 유지 | 그대로 유지 (순환 참조 방지) |

---

## 13. Component Dependency Summary

```
AGENTS.md ───────→ References MCP Tool names
    │                    │
    v                    v
SKILL.md ←──────→ MCP Server
    │                    │
    │  references/       │  lib/ (ported)
    v                    v
Templates ←──────→ State Files (.pdca-status.json)
```

---

## Appendix A: File Count Comparison

| Component | bkit-claude-code | bkit-codex |
|-----------|:----------------:|:----------:|
| Skills (SKILL.md) | 26 | 26 |
| Agents (*.md) | 16 | 0 (SKILL.md에 통합) |
| Scripts (*.js) | 45 | 0 (MCP Server로 통합) |
| Lib modules | 38 files, 241 fn | ~20 files, ~80 fn |
| Templates | 27 | 27 |
| Hooks config | hooks.json + YAML | 0 (없음) |
| AGENTS/CLAUDE.md | 0 (동적 주입) | 2 (Global + Project) |
| MCP Tools | 0 | 16 |
| Config | bkit.config.json | config.toml |
| Output Styles | 4 | 0 (AGENTS.md에 통합) |

## Appendix B: Terminology Mapping

| bkit-claude-code | bkit-codex | Notes |
|------------------|------------|-------|
| Plugin | Agent Skills | 플랫폼 커스터마이징 단위 |
| CLAUDE.md | AGENTS.md | 프로젝트 지침 파일 |
| Hooks (10 events) | MCP Tools (16) | 이벤트 기반 → 요청 기반 |
| Scripts (45) | MCP Server src/ | Node.js 로직 |
| Agents (16) | SKILL.md description | 역할 분담 → 지식 통합 |
| skills_preload | references/ | 사전 로드 → 온디맨드 로드 |
| context: fork | Codex sandbox | 컨텍스트 격리 |
| user-invocable | $ prefix | 명시적 호출 |
| Output Styles | AGENTS.md rules | 응답 스타일 제어 |
| Plugin Root | .agents/skills/ | 스킬 루트 디렉토리 |

---

*This plan was generated by CTO-Led Agent Team with 6 specialized analysts.*
*Analysis coverage: bkit-system philosophy (4 docs), Codex Skills spec (9 sources), 26 Skills mapping, MCP architecture (16 tools), Repository structure, AGENTS.md workflow design.*
