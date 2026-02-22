# bkit-codex v1.0.0 Complete Porting - Plan Plus Document

> **Summary**: bkit-claude-code v1.5.5에서 bkit-codex v1.0.0으로의 완전 포팅을 위한 종합 계획문서. Platform-Adaptive 접근법으로 Match Rate 70.2% → 90%+ 달성을 목표로 한다.
>
> **Project**: bkit-codex (OpenAI Codex CLI Plugin)
> **Version**: v1.0.0 → v1.2.0 로드맵
> **Author**: Plan-Plus Writer (CTO Team)
> **Date**: 2026-02-21
> **Status**: Approved
> **Method**: Plan Plus (Brainstorming-Enhanced PDCA)
> **Analysis Reference**: `docs/03-analysis/codex-context-engineering-v1.analysis.md` (65KB)

---

## 1. User Intent Discovery

### 1.1 Core Problem

bkit-codex v1.0.0은 현재 bkit-claude-code v1.5.5 대비 **Overall Match Rate 70.2%**이다. 핵심 PDCA 워크플로우(88%)와 Skills(96.3%)는 우수하지만, 다음 4개 Critical Gap이 전체 품질과 사용자 경험을 저해한다:

1. **plan-plus Skill 미포팅** (C-1): 27개 Core Skill 중 유일한 미포팅. 브레인스토밍 기반 계획 수립이라는 bkit의 핵심 차별화 기능 부재
2. **Automation Guarantee 하락** (C-2): Hook-Driven(100%) → Instruction-Driven(69%)로 31% 하락. AI가 MCP 도구 호출을 스킵할 가능성
3. **PreCompact Hook 부재** (C-3): 장기 세션에서 context compaction 시 PDCA 상태 손실 위험. 커뮤니티 #9505, #8365, #11315
4. **Task Chain Auto-Creation 부재** (C-4): PDCA Plan 단계에서 후속 Design→Do→Check→Report 태스크 자동 생성 불가

추가로 **Major Gap 6건**(Agent 15%, Hooks 35%, Team 0%, Lib 31%, Full-Auto 미노출, Skill Orchestrator 부재)이 중장기적으로 해소 필요하다.

**근본적 배경**: bkit-claude-code는 "시스템이 AI를 제어하는" Hook-Driven Architecture이고, bkit-codex는 "AI가 자발적으로 규칙을 따르는" Instruction-Driven Architecture이다. 이 패러다임 차이는 Codex 플랫폼이 네이티브 Hook 시스템(Issue #2109, 418+ thumbs up)을 도입하기 전까지는 구조적으로 완전 해소가 불가능하다.

### 1.2 Target Users

| User Type | Usage Context | Key Need |
|-----------|---------------|----------|
| **bkit 기존 사용자** | Claude Code에서 Codex로 마이그레이션 | 동일한 PDCA 워크플로우, 상태 파일 호환 |
| **Codex 신규 사용자** | 구조화된 개발 방법론 필요 | 문서 주도 개발, 자동 가이드, 레벨별 맞춤 |
| **Codex Plugin 개발자** | bkit을 Skills/MCP 참조 구현으로 활용 | 27개 스킬 패키지, 16개 MCP 도구, 설치 시스템 |
| **AI-Native 개발팀** | 팀 단위 PDCA 워크플로우 | CTO Team, Agent Teams, 오케스트레이션 패턴 |
| **Enterprise 사용자** | 거버넌스, 감사 추적, 정책 강제 | PDCA audit trail, 품질 게이트 |

### 1.3 Success Criteria

- [ ] **Overall Match Rate >= 80%** (현재 70.2%) -- v1.0.0 핫픽스
- [ ] **Overall Match Rate >= 85%** -- v1.1.0
- [ ] **Overall Match Rate >= 90%** -- v1.2.0
- [ ] **Skills Coverage = 100%** (현재 96.3%, plan-plus 포팅 시 달성)
- [ ] **Automation Guarantee >= 80%** (현재 69%)
- [ ] **Critical Gap 4건 전부 해소**
- [ ] **Major Gap 6건 중 4건 이상 해소** (v1.2.0까지)
- [ ] **424+ 테스트 유지, 신규 기능 테스트 추가**
- [ ] **크로스 플랫폼 설치 99%+ 유지** (macOS, Linux, Windows WSL)

### 1.4 Constraints

| Constraint | Details | Impact |
|------------|---------|--------|
| Codex Hook 시스템 부재 | Issue #2109 OPEN, 출시 시기 미정 | Automation Guarantee 100% 달성 불가 (High) |
| Codex Multi-Agent 실험적 | features.multi_agent = true 실험 단계 | Team System 완전 포팅 불가 (High) |
| AGENTS.md 32KB 제한 | 현재 5.8KB 사용 (82% 여유) | 대규모 지시사항 추가 가능 (Low) |
| Node.js 런타임 의존성 | MCP 서버가 Node.js v18+ 필요 | Codex 제로 의존성과 불일치 (Medium) |
| Codex 빠른 릴리스 주기 | 1주일에 5개 릴리스 (v0.99→v0.104) | Breaking Change 리스크 (Medium) |
| bkit-system Symlink 절대 경로 | 다른 머신에서 깨짐 | 이식성 제한 (Medium) |
| config.toml MCP required=true | MCP 실패 시 Codex 자체 사용 불가 | 가용성 리스크 (Medium) |

---

## 2. Alternatives Explored

### 2.1 Approach A: "Full Feature Parity" (완전 1:1 포팅)

| Aspect | Details |
|--------|---------|
| **Summary** | bkit-claude-code의 모든 174+ 파일을 Codex 플랫폼에 1:1로 포팅 |
| **Pros** | Match Rate 100% 달성 가능, 기능 동등성 완전 보장, 사용자 경험 동일 |
| **Cons** | Codex 플랫폼 제약(Hook 부재, Multi-Agent 실험적)으로 기술적 불가능. Hook 13개 이벤트를 Codex에서 재현 불가. Team System(48KB, 9 modules)은 Codex multi-agent 안정화 전 구현 불가. 개발 비용 300+ 시간, 플랫폼 진화에 취약 |
| **Effort** | Very High (300+ hours) |
| **Best For** | Codex 플랫폼이 Claude Code 수준의 확장성을 갖춘 미래 시점 |

### 2.2 Approach B: "Platform-Adaptive" (플랫폼 적응형) -- Selected

| Aspect | Details |
|--------|---------|
| **Summary** | Codex 플랫폼의 고유 특성(Skills, AGENTS.md, config.toml, MCP)을 최대한 활용하여, bkit의 핵심 가치(PDCA + 문서 주도 개발 + 자동화)를 Codex 관용어로 재해석. 불가능한 기능은 Codex 플랫폼 진화를 추적하며 점진적 통합 |
| **Pros** | Codex 에코시스템과 자연스러운 통합, 플랫폼 진화에 탄력적 대응, 커뮤니티 기여 가능(Skills 생태계, Plugin 참조 구현), 합리적 개발 비용, 80-90% Match Rate 현실적 달성 가능 |
| **Cons** | 100% Match Rate 불가(Hook 부재로 ~90% 상한), Team System/Agent 기능 일부 지연, Hook-Driven 자동화의 결정론적 보장 불가 |
| **Effort** | Medium (80-120 hours for v1.0→v1.2.0) |
| **Best For** | **현재 상황에 최적** -- Codex 플랫폼이 활발히 진화 중이며, bkit이 에코시스템 선점 기회를 활용해야 하는 시점 |

### 2.3 Approach C: "Core-Only" (핵심만 포팅)

| Aspect | Details |
|--------|---------|
| **Summary** | PDCA 코어 + Skills 시스템만 포팅하고, 나머지(Agents, Hooks, Team, Output Styles)는 전부 제외 |
| **Pros** | 최소 개발 비용, 빠른 출시, 단순한 유지보수 |
| **Cons** | bkit의 핵심 차별화 요소(자동화, 팀 오케스트레이션) 포기, 경쟁력 약화, 커뮤니티 기여 기회 상실, 사용자 경험 열화, 기존 bkit 사용자 마이그레이션 동기 부족 |
| **Effort** | Low (20-30 hours) |
| **Best For** | 리소스가 극히 제한적이거나, Codex 플랫폼의 미래가 불확실한 경우 |

### 2.4 Decision Rationale

**Selected**: Approach B "Platform-Adaptive"

**Reason**:
1. **기술적 현실성**: Codex의 Hook 부재(C-2), Multi-Agent 실험적 상태(M-1)로 인해 Approach A는 현 시점에서 기술적으로 불가능
2. **시장 기회**: Codex 에코시스템에서 Plugin(#8512), Hooks(#2109), Subagent(#2604) 수요가 높으며, bkit이 선행 구현(先行 구現)으로 포지셔닝 가능
3. **비용 효율**: 80-120시간으로 Match Rate 80→90% 달성 가능 (Approach A 대비 60% 비용 절감)
4. **플랫폼 탄력성**: Codex의 빠른 릴리스 주기(주당 5개 릴리스)에 적응할 수 있는 모듈형 아키텍처
5. **점진적 진화**: Codex Hook 시스템, Plugin API, Multi-Agent 안정화 시점에 즉각 통합 가능한 구조

---

## 3. YAGNI Review

### 3.1 Included (v1.0.0 Must-Have) -- Critical Gap 해소

- [x] **plan-plus SKILL.md 포팅** (C-1): Skills 100% 완성
- [x] **AGENTS.md 자동화 규칙 강화** (C-2): Automation Guarantee 69%→80%
- [x] **PDCA 상태 Compaction 저항성** (C-3): .pdca-status.json 핵심 데이터를 AGENTS.md에 동적 주입
- [x] **Task Chain 기본 구현** (C-4): bkit_pdca_plan에서 자동 태스크 체인 생성
- [x] **Test file 동기화** (P0-3): 개발 copy 7개 테스트 -> .bkit-codex/ 배포본 반영
- [x] **bkit-system symlink 수정** (P0-4): 절대 경로 → 상대 경로 또는 문서 복사
- [x] **Memory file platform 수정** (P0-5): .bkit-memory.json platform: "claude" → "codex"

### 3.2 Included (v1.1.0 Must-Have) -- Major Gap 해소

- [ ] **Gap Analysis 기능 강화** (P1-3): gap-detector 에이전트 로직 → bkit_pdca_analyze MCP 통합
- [ ] **Output Style SKILL.md 추가** (P1-4): 4개 output style을 별도 SKILL.md로 정의
- [ ] **Full-Auto Mode 노출** (P1-5): bkit.config.json 자동화 모드를 bkit_init에 포함
- [ ] **Skill Orchestrator 기본 구현** (M-3): 스킬 간 자동 전환 로직
- [ ] **Agent Memory MCP 강화** (M-4): bkit_memory_read/write 확장

### 3.3 Deferred (v1.2.0 Maybe)

| Feature | Reason for Deferral | Revisit When |
|---------|---------------------|--------------|
| Codex Multi-Agent 통합 (P2-1) | Codex multi_agent 실험적, API 불안정 | Multi-Agent API 안정화 시 (PR #12332, #12327 추적) |
| Codex Native Hooks 마이그레이션 (P2-2) | Hook 시스템 미출시 (#2109 OPEN) | Codex Hook 시스템 공식 출시 시 |
| MCP Resource/Prompt 지원 (P2-3) | 현재 tools만으로 기능 충분 | MCP resource/prompt 수요 발생 시 |
| npm 배포 (P2-4) | curl 설치로 충분, npm 배포는 부가 기능 | 커뮤니티 배포 요구 발생 시 |
| Codex Sandbox 통합 (P2-5) | 현재 보안 모델 충분 | Enterprise 보안 요구 시 |

### 3.4 Removed (Won't Do)

| Feature | Reason for Removal |
|---------|-------------------|
| **Rust 기반 MCP 서버 재작성** (P3-6) | 200+ 시간 소요, Node.js 충분히 안정적, ROI 불충분. Codex wire 프로토콜 직접 통합은 비공식 API 의존성 문제 |
| **완전한 16개 Agent 1:1 포팅** | Codex agent frontmatter와 Claude agent frontmatter가 구조적으로 상이. SKILL.md 흡수 전략이 더 적합 |
| **lib/team/ 9개 파일 직접 포팅** | Codex Multi-Agent 실험적 상태에서 직접 포팅은 폐기 리스크 높음. Codex API 안정화 후 재설계 |
| **Hook 13개 이벤트 완전 재현** | Codex에 Hook 시스템 없음. MCP + AGENTS.md로 ~80% 대체 가능, 나머지 20%는 플랫폼 제약 |
| **/github-stats 명령 포팅** | 부가 기능, 핵심 PDCA 워크플로우와 무관 |
| **bkit-system 전체 복사** | Symlink 참조로 충분, 178KB 문서 복사는 저장소 크기 증가 |

---

## 4. Scope

### 4.1 Skills (27 → 27 Codex Skills)

#### 4.1.1 포팅 완료 Skills (26/27) - 유지보수

| # | Skill | Category | Codex Status | Action Required |
|---|-------|----------|:------------:|-----------------|
| 1 | bkit-rules | Core | COMPLETE | AGENTS.md 규칙 강화 (C-2) |
| 2 | pdca | Core | COMPLETE | Task Chain 로직 추가 (C-4) |
| 3 | bkit-templates | Core | COMPLETE | plan-plus.template.md 참조 추가 |
| 4 | starter | Level | COMPLETE | Output Style 통합 |
| 5 | dynamic | Level | COMPLETE | Output Style 통합 |
| 6 | enterprise | Level | COMPLETE | Output Style 통합 |
| 7 | development-pipeline | Pipeline | COMPLETE | None |
| 8 | phase-1-schema | Pipeline | COMPLETE | None |
| 9 | phase-2-convention | Pipeline | COMPLETE | None |
| 10 | phase-3-mockup | Pipeline | COMPLETE | None |
| 11 | phase-4-api | Pipeline | COMPLETE | None |
| 12 | phase-5-design-system | Pipeline | COMPLETE | None |
| 13 | phase-6-ui-integration | Pipeline | COMPLETE | None |
| 14 | phase-7-seo-security | Pipeline | COMPLETE | None |
| 15 | phase-8-review | Pipeline | COMPLETE | None |
| 16 | phase-9-deployment | Pipeline | COMPLETE | None |
| 17 | code-review | Quality | COMPLETE | code-analyzer 로직 흡수 |
| 18 | zero-script-qa | Quality | COMPLETE | None |
| 19 | desktop-app | Platform | COMPLETE | None |
| 20 | mobile-app | Platform | COMPLETE | None |
| 21 | bkend-quickstart | BaaS | COMPLETE | None |
| 22 | bkend-auth | BaaS | COMPLETE | None |
| 23 | bkend-data | BaaS | COMPLETE | None |
| 24 | bkend-storage | BaaS | COMPLETE | None |
| 25 | bkend-cookbook | BaaS | COMPLETE | None |
| 26 | codex-learning | Learning | COMPLETE (신규) | None |

#### 4.1.2 미포팅 Skill: plan-plus (C-1 Critical)

**현재 상태**: bkit-claude-code에 7,505B SKILL.md로 존재, Codex 미포팅

**포팅 계획**:

```
신규 파일:
  .agents/skills/plan-plus/
  ├── SKILL.md          # 7,500B+ (6단계 프로세스, HARD-GATE 규칙)
  ├── openai.yaml       # 스킬 메타데이터
  └── references/
      └── plan-plus-process.md  # 상세 프로세스 가이드
```

**SKILL.md 핵심 내용**:
- `allow_implicit_invocation: true` (태스크 설명에 "plan-plus" 또는 "브레인스토밍 계획" 포함 시 자동 트리거)
- `user_invocable: true` (사용자가 `/plan-plus feature-name`으로 직접 호출)
- 6단계 프로세스:
  - Phase 0: Context Exploration (자동) -- AGENTS.md 읽기, git 히스토리, 기존 문서 스캔
  - Phase 1: Intent Discovery -- 1개씩 질문 (Core Purpose → Target Users → Success Criteria → Constraints)
  - Phase 2: Alternatives Exploration -- 2-3개 접근법, Tradeoffs 분석
  - Phase 3: YAGNI Review -- 필수 기능 검증, 불필요 기능 제거
  - Phase 4: Incremental Design Validation -- 섹션별 사용자 승인
  - Phase 5: Plan Document Generation -- plan-plus.template.md 사용

**HARD-GATE 규칙**:
```
CRITICAL: Do NOT generate any code until ALL brainstorming phases are complete
and the user has approved the final plan document. This is a HARD GATE -
no exceptions. If the user asks for code during planning, respond:
"We're still in the planning phase. Let's complete the plan first to ensure
we build the right thing."
```

**openai.yaml 예시**:
```yaml
name: plan-plus
description: "Brainstorming-enhanced PDCA planning with 6 phases"
triggers:
  - plan-plus
  - "brainstorming plan"
  - "enhanced planning"
  - "plan plus"
allow_implicit_invocation: true
user_invocable: true
```

**의존성**: plan-plus.template.md (이미 포팅 완료 -- `templates/plan-plus.template.md`)

**예상 작업량**: 2-3시간

#### 4.1.3 Output Style Skills (v1.1.0 신규 4개)

bkit-claude-code의 4개 Output Style을 별도 SKILL.md로 정의하여 레벨별 자동 적용:

| # | Style | 크기 | 대상 Level | 핵심 규칙 |
|---|-------|-----:|-----------|----------|
| 28 | bkit-learning | ~1,700B | Starter | 학습 포인트 포함, 개념 단순 설명, 다음 학습 단계 제안 |
| 29 | bkit-pdca-guide | ~1,600B | Dynamic | PDCA 상태 배지, 체크리스트, 다음 단계 가이드 |
| 30 | bkit-enterprise | ~2,500B | Enterprise | 트레이드오프 분석, 비용 영향, 배포 고려사항 |
| 31 | bkit-pdca-enterprise | ~1,300B | Enterprise | PDCA + Enterprise 결합 스타일 |

**포팅 전략**: AGENTS.md에 분산된 출력 규칙을 전용 SKILL.md로 분리하여 강제력 60% → 85% 향상

```
신규 파일 (v1.1.0):
  .agents/skills/output-learning/
  ├── SKILL.md
  └── openai.yaml

  .agents/skills/output-pdca-guide/
  ├── SKILL.md
  └── openai.yaml

  .agents/skills/output-enterprise/
  ├── SKILL.md
  └── openai.yaml

  .agents/skills/output-pdca-enterprise/
  ├── SKILL.md
  └── openai.yaml
```

**자동 적용 전략**: bkit_init MCP 도구가 프로젝트 레벨 감지 후, 적합한 output style SKILL.md를 응답에 포함하여 AI가 자동으로 해당 스킬을 적용하도록 유도

### 4.2 Agents (16 → SKILL.md + MCP 통합)

#### 4.2.1 아키텍처 패러다임 차이

```
bkit-claude-code Agent Architecture:
  .claude/agents/
  ├── cto-lead.md           (model: opus, allowedTools: [Task, Read, ...])
  ├── gap-detector.md       (model: opus, permission: plan)
  ├── pdca-iterator.md      (model: sonnet, skills: [pdca])
  └── ... (16 agents total)

Codex Multi-Agent Architecture (실험적):
  config.toml:
  [agents.leader]
  model = "gpt-5.3-codex"
  sandbox_mode = "workspace-write"
  developer_instructions = "..."
```

bkit-claude-code의 Agent frontmatter 방식(model, permission, memory, skills 선언)과 Codex의 Multi-Agent 시스템(config.toml [agents.*])은 구조적으로 다르다. 직접 포팅 대신 **기능 흡수 전략**을 채택한다.

#### 4.2.2 Agent별 Codex 적응 전략

| Agent | Model | 전략 | 흡수 대상 | Timeline |
|-------|-------|------|----------|----------|
| **cto-lead** | opus | SKILL.md 팀 오케스트레이션 지시 + Codex multi-agent leader 역할 (안정화 시) | pdca SKILL.md | v1.2.0 |
| **gap-detector** | opus | bkit_pdca_analyze MCP 도구에 핵심 로직 통합. SKILL.md에 갭 분석 지시사항 추가 | pdca SKILL.md + bkit_pdca_analyze | v1.1.0 |
| **code-analyzer** | opus | code-review SKILL.md에 분석 지시사항 강화 | code-review SKILL.md | v1.0.0 |
| **design-validator** | opus | phase-3-mockup, phase-5-design-system SKILL.md에 검증 규칙 추가 | Pipeline SKILL.md | v1.1.0 |
| **enterprise-expert** | opus | enterprise SKILL.md에 아키텍처 지시사항 이미 통합 | enterprise SKILL.md | DONE |
| **infra-architect** | opus | phase-9-deployment SKILL.md에 인프라 지시사항 통합 | phase-9 SKILL.md | DONE |
| **security-architect** | opus | phase-7-seo-security SKILL.md에 보안 지시사항 이미 통합 | phase-7 SKILL.md | DONE |
| **bkend-expert** | sonnet | bkend-* 5개 SKILL.md에 전문 지시사항 이미 분산 | bkend-* SKILL.md | DONE |
| **frontend-architect** | sonnet | phase-3, phase-5, phase-6 SKILL.md에 UI/UX 지시사항 이미 통합 | Pipeline SKILL.md | DONE |
| **pdca-iterator** | sonnet | bkit_pdca_next MCP 도구 + pdca SKILL.md iteration 규칙 | pdca SKILL.md + MCP | v1.1.0 |
| **pipeline-guide** | sonnet | development-pipeline + phase-1~9 SKILL.md에 가이드 지시 이미 통합 | Pipeline SKILL.md | DONE |
| **product-manager** | sonnet | plan-plus SKILL.md에 요구사항 수집 지시 통합 | plan-plus SKILL.md | v1.0.0 |
| **qa-strategist** | sonnet | phase-8-review SKILL.md에 QA 전략 지시 이미 통합 | phase-8 SKILL.md | DONE |
| **starter-guide** | sonnet | starter SKILL.md에 가이드 지시 이미 통합 | starter SKILL.md | DONE |
| **report-generator** | haiku | bkit_complete_phase MCP 도구에 보고서 생성 로직 통합 | MCP + pdca SKILL.md | v1.1.0 |
| **qa-monitor** | haiku | zero-script-qa SKILL.md + phase-4 SKILL.md에 모니터링 지시 통합 | Quality SKILL.md | DONE |

**Agent 기능 흡수 현황 요약**:
- **DONE** (이미 흡수): 9/16 (pipeline-guide, starter-guide, enterprise-expert, infra-architect, security-architect, bkend-expert, frontend-architect, qa-strategist, qa-monitor)
- **v1.0.0**: 2/16 (code-analyzer → code-review SKILL.md, product-manager → plan-plus SKILL.md)
- **v1.1.0**: 3/16 (gap-detector, pdca-iterator, report-generator → MCP 도구 강화)
- **v1.2.0**: 2/16 (cto-lead, design-validator → Codex Multi-Agent 통합)

#### 4.2.3 Codex Multi-Agent 준비 (v1.2.0)

Codex Multi-Agent가 안정화되면 다음 config.toml 설정으로 핵심 에이전트를 정의한다:

```toml
# v1.2.0 예정 -- Codex Multi-Agent 안정화 후
[features]
multi_agent = true

[agents.leader]
model = "gpt-5.3-codex"
sandbox_mode = "workspace-write"
developer_instructions = """
You are the CTO lead agent for bkit PDCA workflow.
Orchestrate team members for Plan→Design→Do→Check→Report cycle.
ALWAYS call bkit_init first. Follow bkit PDCA rules strictly.
"""

[agents.reviewer]
model = "gpt-5.3-codex"
sandbox_mode = "read-only"
developer_instructions = """
You are the code reviewer and gap detector.
Use bkit_pdca_analyze for structured analysis.
Focus on code quality, security, and design compliance.
"""

[agents.architect]
model = "gpt-5.3-codex"
sandbox_mode = "workspace-write"
developer_instructions = """
You are the enterprise architect.
Evaluate architecture decisions, scalability, and infrastructure.
Use enterprise skill guidance for MSA and K8s decisions.
"""
```

### 4.3 Hooks (13 Events → MCP + AGENTS.md 강화)

#### 4.3.1 현재 상태와 전략

Codex에는 현재 Hook 시스템이 없다 (Issue #2109, 418+ thumbs up). bkit-codex는 **3계층 대체 전략**을 사용한다:

```
Layer 1: AGENTS.md 규칙 (강제력 ~70-90%)
  "ALWAYS call bkit_init at session start"
  "ALWAYS call bkit_pre_write_check before writing code"

Layer 2: MCP 도구 (동적 로직)
  bkit_init → SessionStart hook 대체
  bkit_pre_write_check → PreToolUse(Write) 대체
  bkit_complete_phase → Stop hook 대체

Layer 3: SKILL.md 워크플로우 (프로세스 가이드)
  각 SKILL.md에 내장된 step-by-step 워크플로우
```

#### 4.3.2 Hook Event별 강화 계획

**P0 Critical -- v1.0.0 강화**:

| Hook Event | 현재 대체 | 자동화 수준 | v1.0.0 강화 | 목표 수준 |
|-----------|----------|:-----------:|------------|:---------:|
| SessionStart | bkit_init MCP | ~95% | AGENTS.md에 "CRITICAL: FIRST action" 강조. bkit_init 미호출 시 후속 MCP 도구가 경고 반환 | ~98% |
| UserPromptSubmit | bkit_analyze_prompt MCP | ~85% | AGENTS.md에 "MUST call for first user message" 추가. 인텐트 감지 정확도 향상 | ~90% |
| Stop | bkit_complete_phase MCP | ~80% | SKILL.md에 "Phase Completion Checklist" 섹션 추가. "NEVER end without calling bkit_complete_phase" | ~88% |
| PreToolUse(Write) | bkit_pre_write_check MCP | ~80% | AGENTS.md에 "ALWAYS check before ANY file write" 반복 명시. 미호출 시 bkit_post_write에서 경고 | ~88% |
| PostToolUse(Write) | bkit_post_write MCP | ~75% | AGENTS.md에 "After significant changes, ALWAYS call bkit_post_write" 추가 | ~82% |

**P1 Important -- v1.1.0 강화**:

| Hook Event | 현재 대체 | 자동화 수준 | v1.1.0 강화 | 목표 수준 |
|-----------|----------|:-----------:|------------|:---------:|
| PostToolUse(Bash) | AGENTS.md 규칙 | ~70% | Bash 실행 결과 처리 MCP 도구 추가 검토 | ~75% |
| TaskCompleted | AGENTS.md 규칙 | ~50% | Task Chain 자동 생성(C-4) + 완료 시 자동 다음 태스크 제안 | ~70% |
| PostToolUse(Skill) | AGENTS.md 규칙 | ~60% | SKILL.md에 "Post-Skill Checklist" 추가 | ~70% |

**P2 Missing -- PreCompact Hook (C-3 Critical)**:

| Hook Event | 현재 상태 | 대체 전략 |
|-----------|----------|----------|
| **PreCompact** | **없음 (0%)** | **v1.0.0**: .pdca-status.json 핵심 데이터를 bkit_init 응답에 매번 포함하여 compaction 후 재구성 가능하게 함. AGENTS.md에 "If context seems lost, call bkit_get_status to restore PDCA state" 추가. **v1.2.0**: Codex PreCompact hook 출시 시 context-compaction.js 포팅 |
| SubagentStart | 없음 (0%) | v1.2.0: Codex Multi-Agent 안정화 후 구현 |
| SubagentStop | 없음 (0%) | v1.2.0: Codex Multi-Agent 안정화 후 구현 |
| TeammateIdle | 없음 (0%) | v1.2.0: Codex Multi-Agent 안정화 후 구현 |

#### 4.3.3 AGENTS.md 규칙 강화 상세 (C-2)

현재 agents.global.md(~3.8KB)와 AGENTS.md(~2.0KB)의 규칙을 다음과 같이 강화한다:

**agents.global.md 강화 항목**:

```markdown
## Session Initialization (CRITICAL)

CRITICAL: The VERY FIRST action in ANY session MUST be calling `bkit_init`.
Do NOT respond to the user, do NOT read files, do NOT run any commands
before calling bkit_init. This is NON-NEGOTIABLE.

If bkit_init fails, inform the user and do NOT proceed with any bkit-related work.

## Mandatory MCP Tool Calls

### Before Writing ANY Code File
ALWAYS call `bkit_pre_write_check(filePath)` before writing or editing source code.
This is MANDATORY for ALL file writes, not just major changes.
If you forget this step, the bkit_post_write tool will warn you.

### After Significant Code Changes
ALWAYS call `bkit_post_write(filePath, linesChanged)` after:
- Creating a new file (>10 lines)
- Modifying an existing file (>20 lines changed)
- Any structural changes (new components, API routes, database schemas)

### Phase Completion
NEVER end a work session without calling `bkit_complete_phase` if you made
progress on any PDCA phase. This records your work and enables continuity.

## Context Recovery After Compaction
If your context seems incomplete or you can't recall previous work:
1. Call `bkit_get_status` to load current PDCA state
2. Read `docs/.pdca-status.json` for full feature status
3. Check the latest files in `docs/01-plan/` through `docs/04-report/`
This ensures PDCA continuity even after context compaction.
```

**예상 자동화 수준 변동**:

| 동작 | 현재 | v1.0.0 목표 | 변화 |
|------|:----:|:----------:|:----:|
| 세션 초기화 | ~95% | ~98% | +3% |
| 인텐트 감지 | ~85% | ~90% | +5% |
| Pre-write 검사 | ~80% | ~88% | +8% |
| Post-write 가이드 | ~75% | ~82% | +7% |
| 페이즈 전환 | ~80% | ~88% | +8% |
| **평균** | **~69%** | **~80%** | **+11%** |

### 4.4 Commands (3 → Skill 기반 통합)

| Command | bkit-claude-code | bkit-codex 전략 | Status |
|---------|:----------------:|----------------|:------:|
| /bkit (8,277B) | 도움말/디스커버리 | codex-learning SKILL.md + bkit_init MCP 응답에 기능 가이드 포함 | v1.0.0 |
| /output-style-setup (1,867B) | 출력 스타일 설치 | bkit_init에서 레벨 감지 후 자동 적용. 별도 설정 스킬 불필요 | DONE |
| /github-stats (12,404B) | GitHub 통계 수집 | **Won't Do** -- 부가 기능, 핵심 PDCA와 무관 | REMOVED |

### 4.5 Templates (28 → 28, 100% 완료)

bkit-claude-code의 28개 Template은 이미 100% 포팅 완료이다.

| Category | Count | Status | Path |
|----------|:-----:|:------:|------|
| Root Templates (PDCA) | 14 | COMPLETE | `.bkit-codex/templates/` |
| Pipeline Templates | 10 | COMPLETE | `.bkit-codex/templates/pipeline/` |
| Shared Templates | 4 | COMPLETE | `.bkit-codex/templates/shared/` |

**유지보수 항목**:
- plan-plus.template.md: 이미 포팅됨. plan-plus SKILL.md에서 참조 확인 필요
- AGENTS.template.md: CLAUDE.template.md에서 변환 완료

### 4.6 Lib Modules (38 → 14 + 확장)

#### 4.6.1 현재 포팅 상태

| Module Group | cc Files | codex Files | Coverage | v1.0.0 Action |
|-------------|:--------:|:-----------:|:--------:|---------------|
| core/ | 7 | 4 | 44% | 필수 유지 (config, cache, file, path) |
| pdca/ | 6 | 5 | 50% | status.js 강화 (archive, cleanup) |
| intent/ | 4 | 3 | 43% | language.js 8언어 감지 완성 |
| task/ | 5 | 2 | 33% | creator.js 확장 (Task Chain C-4) |
| team/ | 9 | 0 | 0% | v1.2.0 이후 (Codex Multi-Agent 의존) |
| Root modules | 7 | 0 | 0% | 선택적 포팅 |

#### 4.6.2 우선순위별 Lib 모듈 강화

**P0 (v1.0.0)**:

| Module | Action | 상세 |
|--------|--------|------|
| `lib/task/creator.js` | **확장** | Task Chain 자동 생성 로직 추가. bkit_pdca_plan 호출 시 Plan→Design→Do→Check→Report 5개 태스크를 자동 생성하여 PDCA 워크플로우 연속성 보장 |
| `lib/pdca/status.js` | **강화** | compaction 저항성을 위한 핵심 상태 요약 함수 추가. `getCompactSummary()`: 현재 feature, phase, progress를 1줄 문자열로 반환 |

**P1 (v1.1.0)**:

| Module | Action | 상세 |
|--------|--------|------|
| `lib/pdca/status.js` | **확장** | archive 관리, feature limit(50), cleanup 로직 추가 |
| `lib/intent/language.js` | **완성** | 8언어 감지의 누락 패턴 보완 |
| `lib/intent/trigger.js` | **강화** | Output Style 자동 매칭 로직 추가 |
| `lib/pdca/automation.js` | **신규** | Full-Auto Mode 로직: config에서 자동화 레벨 읽기, 모드별 MCP 응답 조정 |

**P2 (v1.2.0)**:

| Module | Action | 상세 |
|--------|--------|------|
| `lib/skill-orchestrator.js` | **신규** | 스킬 간 자동 전환 로직. 현재 phase에 맞는 SKILL.md 추천 |
| `lib/team/` | **신규** (선택) | Codex Multi-Agent 안정화 시 coordinator, orchestrator 기본 구현 |

#### 4.6.3 포팅 제외 Lib 모듈 (Codex 네이티브 대체)

| Module | cc Size | 제외 사유 |
|--------|--------:|----------|
| `lib/context-hierarchy.js` (6.9KB) | 6,948B | AGENTS.md 네이티브 계층 구조로 대체 |
| `lib/memory-store.js` (3.6KB) | 3,649B | bkit_memory_read/write MCP 도구로 대체 |
| `lib/permission-manager.js` (5KB) | 5,070B | Codex 네이티브 보안(sandbox_mode)으로 대체 |
| `lib/context-fork.js` (5.7KB) | 5,723B | Codex Sub-Agent 자동 포크로 대체 (안정화 시) |

### 4.7 CTO Team / Agent Teams

#### 4.7.1 현재 상태

bkit-claude-code의 CTO Team은 가장 복잡한 기능이다:
- **규모**: lib/team/ 9 files, 48,599B + 16 agents + 3 hooks + 12 scripts = 40 components, ~190KB
- **오케스트레이션 패턴**: Leader, Council, Swarm, Pipeline, Watchdog
- **Codex 상태**: 완전 미포팅 (0%)

#### 4.7.2 점진적 통합 전략

**Phase 1 (v1.0.0~v1.1.0): SKILL.md 기반 가이드**

CTO Team의 핵심 워크플로우를 SKILL.md 지시사항으로 가이드:

```markdown
# pdca SKILL.md 내 Team 가이드 섹션 추가

## Team Workflow (Single Agent Mode)
When working on complex features that would normally require a team:
1. Break the task into PDCA phases (Plan → Design → Do → Check → Report)
2. For each phase, apply the relevant specialist perspective:
   - Plan: Product Manager + CTO perspective
   - Design: Architect + Security perspective
   - Do: Developer + Frontend/Backend perspective
   - Check: QA + Code Reviewer perspective
   - Report: Documentation perspective
3. Use bkit_pdca_next to transition between phases
4. Quality gates: Each phase must be documented before proceeding
```

**Phase 2 (v1.2.0): Codex Multi-Agent 통합**

Codex multi-agent 안정화 시:

```toml
# config.toml 예시
[features]
multi_agent = true

[agents.cto]
model = "gpt-5.3-codex"
sandbox_mode = "workspace-write"
developer_instructions = """
You are the CTO team lead. Orchestrate PDCA workflow:
1. Assign Plan to product-manager perspective
2. Assign Design to architect perspective
3. Assign Do to developer agents
4. Assign Check to reviewer agent
5. Generate Report from all phases
Quality gate: 90% coverage before proceeding.
"""
```

**Phase 3 (v2.0.0+): 완전한 Team 시스템**

Codex Agent API 안정화 + Hook 시스템 출시 후:
- lib/team/ 핵심 모듈 포팅 (coordinator, orchestrator, cto-logic)
- 5 오케스트레이션 패턴 구현
- SubagentStart/Stop/Idle hook 핸들러

### 4.8 Plan-Plus Skill (상세 설계)

#### 4.8.1 6단계 프로세스 Codex 적응

| Phase | bkit-claude-code | bkit-codex 적응 | 차이 |
|-------|:----------------:|:---------------:|:----:|
| Phase 0: Context Exploration | 자동 (Hook에서 트리거) | SKILL.md에서 "First, explore context" 지시. bkit_get_status 호출 | Hook→MCP |
| Phase 1: Intent Discovery | AskUserQuestion tool | Codex에서 사용자에게 직접 질문 (Codex 기본 기능) | 동일 |
| Phase 2: Alternatives | 2-3개 대안 제시 | 동일 (모델 능력 의존) | 동일 |
| Phase 3: YAGNI Review | multiSelect widget | 텍스트 기반 검증 (Codex TUI 위젯 미지원) | UI 단순화 |
| Phase 4: Incremental Validation | 섹션별 승인 | 동일 (텍스트 기반) | 동일 |
| Phase 5: Document Generation | plan-plus.template.md | 동일 (template 이미 포팅) | 동일 |

#### 4.8.2 SKILL.md 상세 구조

```yaml
---
name: plan-plus
description: |
  Brainstorming-enhanced PDCA planning.
  6-phase process: Context → Intent → Alternatives → YAGNI → Validation → Generation.
  HARD GATE: No code generation until plan is approved.
triggers:
  - plan-plus
  - "brainstorming plan"
  - "enhanced planning"
  - "plan plus"
  - "detailed planning"
allow_implicit_invocation: true
user_invocable: true
---

# Plan Plus Skill

## Overview
Plan Plus is a brainstorming-enhanced PDCA planning methodology...

## HARD GATE RULE
CRITICAL: Do NOT generate any code until ALL brainstorming phases are complete...

## Process
### Phase 0: Context Exploration (Automatic)
1. Call bkit_get_status to load current PDCA state
2. Read AGENTS.md for project context
3. Check git log for recent history
4. Scan docs/01-plan/ for existing plans
...

### Phase 1: Intent Discovery
Ask ONE question at a time. Wait for user response before next question.
Questions (in order):
1. "What is the core problem this feature solves?"
2. "Who are the target users and their key needs?"
...
```

### 4.9 Output Styles (4 → AGENTS.md + SKILL.md)

#### 4.9.1 현재 상태

Output Styles의 핵심 규칙은 AGENTS.md와 각 Level SKILL.md에 분산 통합되어 있다. 그러나 전용 파일의 엄격한 형식 강제력(100%)에 비해 AGENTS.md 분산 규칙의 강제력(~60%)은 낮다.

#### 4.9.2 강화 전략

**v1.0.0**: AGENTS.md 내 "Response Style" 섹션 강화

현재:
```markdown
## Response Format
Follow level-appropriate response formatting:
- Starter: Include learning points, explain concepts simply
- Dynamic: Include PDCA status badges, checklists, next-step guidance
- Enterprise: Include tradeoff analysis, cost impact, deployment considerations
```

강화:
```markdown
## Response Format (MANDATORY)

### Starter Level (bkit-learning style)
ALWAYS include at the end of each response:
- **Learning Points**: 3-5 key concepts the user should learn
- **Next Learning Step**: What to study or practice next
- **Explanation Level**: Use simple terms, avoid jargon
- Format: Use "Did you know?" callouts for educational content

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
- **Architecture Decision Record**: Brief ADR for significant decisions
```

**v1.1.0**: 별도 Output Style SKILL.md 생성 (Section 4.1.3 참조)

---

## 5. Requirements

### 5.1 Functional Requirements

| ID | Requirement | Priority | Status | Source | Version |
|----|-------------|:--------:|:------:|--------|---------|
| **FR-01** | plan-plus SKILL.md를 Codex Skills 디렉토리에 추가하여 `/plan-plus` 명령과 암시적 트리거 모두 동작 | Critical | Pending | Analysis C-1 | v1.0.0 |
| **FR-02** | plan-plus 6단계 프로세스(Context→Intent→Alternatives→YAGNI→Validation→Generation)가 Codex TUI에서 정상 동작 | Critical | Pending | Analysis C-1 | v1.0.0 |
| **FR-03** | plan-plus HARD-GATE 규칙이 적용되어 계획 승인 전 코드 생성 차단 | Critical | Pending | Analysis C-1 | v1.0.0 |
| **FR-04** | agents.global.md의 자동화 규칙 강화로 bkit_init/pre_write/complete_phase 호출율 +10% 향상 | Critical | Pending | Analysis C-2 | v1.0.0 |
| **FR-05** | bkit_init MCP 도구가 .pdca-status.json 핵심 요약을 응답에 포함하여 compaction 후 상태 복구 가능 | Critical | Pending | Analysis C-3 | v1.0.0 |
| **FR-06** | bkit_get_status MCP 도구가 "Context Recovery" 모드 지원 -- compaction 후 전체 상태 재구성 | Critical | Pending | Analysis C-3 | v1.0.0 |
| **FR-07** | bkit_pdca_plan 호출 시 Plan→Design→Do→Check→Report 5개 태스크 체인 자동 생성 | Critical | Pending | Analysis C-4 | v1.0.0 |
| **FR-08** | 태스크 체인이 .pdca-status.json에 영속화되어 세션 간 유지 | Critical | Pending | Analysis C-4 | v1.0.0 |
| **FR-09** | 개발 copy의 7개 테스트 파일이 .bkit-codex/ 배포본에 동기화 | High | Pending | Analysis P0-3 | v1.0.0 |
| **FR-10** | bkit-system symlink를 상대 경로 또는 문서 참조로 전환하여 다른 머신에서도 동작 | High | Pending | Analysis P0-4 | v1.0.0 |
| **FR-11** | .bkit-memory.json의 platform 필드가 "codex"로 정확히 설정 | High | Pending | Analysis P0-5 | v1.0.0 |
| **FR-12** | AGENTS.md "Response Format" 섹션 강화로 Level별 출력 스타일 강제력 60%→75% 향상 | High | Pending | Analysis m-1 | v1.0.0 |
| **FR-13** | bkit_pdca_analyze MCP 도구에 gap-detector 에이전트의 핵심 분석 로직 통합 | High | Pending | Analysis P1-3 | v1.1.0 |
| **FR-14** | 4개 Output Style을 별도 SKILL.md로 정의하여 레벨별 자동 적용 | High | Pending | Analysis P1-4 | v1.1.0 |
| **FR-15** | bkit.config.json의 자동화 모드(manual/semi-auto/full-auto)가 bkit_init 응답에 포함 | Medium | Pending | Analysis P1-5 | v1.1.0 |
| **FR-16** | Full-Auto Mode에서 bkit_complete_phase가 자동으로 다음 phase를 시작하도록 응답 | Medium | Pending | Analysis M-2 | v1.1.0 |
| **FR-17** | Skill Orchestrator 기본 구현 -- 현재 PDCA phase에 맞는 SKILL.md를 bkit_get_status 응답에 추천 | Medium | Pending | Analysis M-3 | v1.1.0 |
| **FR-18** | bkit_memory_read/write가 에이전트별 메모리 스코프 지원 (project/feature/session) | Medium | Pending | Analysis M-4 | v1.1.0 |
| **FR-19** | Task ID가 .pdca-status.json에 영속화되어 세션 간 태스크 추적 가능 | Medium | Pending | Analysis M-5 | v1.1.0 |
| **FR-20** | code-review SKILL.md에 code-analyzer 에이전트의 정적 분석 지시사항 통합 | Medium | Pending | Agent M-1 | v1.0.0 |
| **FR-21** | pdca SKILL.md에 Team Workflow (Single Agent Mode) 가이드 섹션 추가 | Medium | Pending | Team 4.7.2 | v1.0.0 |
| **FR-22** | Codex Multi-Agent config.toml 예시 문서화 (leader/reviewer/architect 3개 역할) | Low | Pending | Agent 4.2.3 | v1.2.0 |
| **FR-23** | Codex Native Hooks 출시 시 MCP→Hook 마이그레이션 가이드 문서 작성 | Low | Pending | Hooks 4.3.3 | v1.2.0 |
| **FR-24** | install.sh에 plan-plus skill 디렉토리 포함 확인 | Critical | Pending | FR-01 의존 | v1.0.0 |
| **FR-25** | openai.yaml 검증 -- plan-plus skill의 triggers, allow_implicit_invocation 정상 동작 확인 | Critical | Pending | FR-01 의존 | v1.0.0 |
| **FR-26** | bkit_pdca_plan MCP 도구의 Task Chain 생성 후 .pdca-status.json 무결성 검증 | Critical | Pending | FR-07 의존 | v1.0.0 |
| **FR-27** | agents.global.md 강화 후 기존 26개 스킬과의 호환성 검증 | High | Pending | FR-04 의존 | v1.0.0 |
| **FR-28** | PDCA 상태 요약이 bkit_init 응답에 정확히 포함되는지 검증 (빈 상태, 진행 중, 완료 케이스) | High | Pending | FR-05 의존 | v1.0.0 |
| **FR-29** | Context Recovery 시나리오 테스트 -- compaction 시뮬레이션 후 bkit_get_status로 상태 복구 확인 | High | Pending | FR-06 의존 | v1.0.0 |
| **FR-30** | 전체 424+ 테스트 통과 유지 + 신규 기능(plan-plus, task chain, compaction 저항성) 테스트 추가 | Critical | Pending | All | v1.0.0 |

### 5.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| **Performance** | MCP 서버 초기화 10초 이내 (startup_timeout_sec = 10) | config.toml timeout 설정 + CI 테스트 |
| **Performance** | MCP 도구 응답 60초 이내 (tool_timeout_sec = 60) | 각 도구별 부하 테스트 |
| **Performance** | bkit_init 응답 시간 3초 이내 (일반적 세션 시작) | 타이머 계측 |
| **Reliability** | MCP 서버 가용성 99.9% (세션 내 연결 유지) | 장기 세션 테스트 (2시간+) |
| **Security** | OWASP Top 10 준수 -- MCP 도구에서 path traversal, injection 방지 | 보안 코드 리뷰 + 테스트 |
| **Security** | 비밀 정보(.env, credentials) 커밋 방지 규칙 유지 | AGENTS.md 규칙 + bkit_pre_write_check |
| **Compatibility** | Codex CLI v0.104.0+ 호환 | CI 테스트 (최신 Codex 버전) |
| **Compatibility** | Node.js v18+ 호환 (LTS) | CI 매트릭스 (18, 20, 22) |
| **Compatibility** | macOS (Apple Silicon + Intel), Linux (x86_64 + ARM64), Windows WSL | install 테스트 CI |
| **Maintainability** | 코드 베이스 zero external npm dependencies 유지 | package.json 감사 |
| **Maintainability** | 테스트 커버리지 85%+ (현재 100% pass rate, 커버리지 미측정) | jest --coverage |
| **Scalability** | .pdca-status.json 50개 feature limit (archive 자동 정리) | lib/pdca/status.js |
| **Usability** | install.sh 1-command 설치 경험 유지 (`curl ... \| bash`) | 설치 테스트 |
| **Documentation** | 모든 MCP 도구에 JSON Schema 기반 파라미터 문서 포함 | tools/list 응답 검증 |

---

## 6. Success Criteria

### 6.1 Definition of Done

#### v1.0.0 Hotfix (Critical Gap 해소)

- [ ] plan-plus SKILL.md + openai.yaml + references/ 생성 완료
- [ ] plan-plus 스킬이 Codex TUI에서 `/plan-plus feature-name`으로 정상 호출됨
- [ ] plan-plus 스킬이 암시적 트리거("brainstorming plan" 등)로 정상 동작
- [ ] agents.global.md 자동화 규칙 강화 완료
- [ ] bkit_init 응답에 PDCA 상태 요약 포함
- [ ] bkit_get_status에 Context Recovery 모드 추가
- [ ] bkit_pdca_plan에 Task Chain 자동 생성 로직 추가
- [ ] Task Chain이 .pdca-status.json에 영속화됨
- [ ] 테스트 파일 동기화 (개발 → 배포)
- [ ] bkit-system symlink 이식성 수정
- [ ] .bkit-memory.json platform 수정
- [ ] AGENTS.md Response Format 강화
- [ ] 424+ 기존 테스트 통과 + 신규 테스트 추가
- [ ] install.sh에 plan-plus 포함 확인

#### v1.1.0 (Major Gap 해소)

- [ ] gap-detector 로직 → bkit_pdca_analyze 통합
- [ ] 4개 Output Style SKILL.md 생성
- [ ] Full-Auto Mode 노출
- [ ] Skill Orchestrator 기본 구현
- [ ] Agent Memory 스코프 확장
- [ ] Task ID Persistence 구현

#### v1.2.0 (플랫폼 통합)

- [ ] Codex Multi-Agent 통합 (안정화 조건부)
- [ ] Codex Native Hooks 마이그레이션 (출시 조건부)
- [ ] MCP Resource/Prompt 지원 추가 (수요 조건부)

### 6.2 Quality Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| Overall Match Rate | v1.0.0: 80%, v1.1.0: 85%, v1.2.0: 90% | Analysis 산출 공식 적용 |
| Test Pass Rate | 100% (모든 테스트 통과) | `npm test` |
| Test Count | 424+ (기존) + 30+ (신규) = 454+ | 테스트 파일 합산 |
| Lint Errors | 0 | ESLint 실행 |
| Security Vulnerabilities | 0 (npm audit) | `npm audit` |
| Install Success Rate | 99%+ (macOS, Linux, Windows WSL) | CI install-test workflow |
| MCP Server Startup | < 10s | config.toml timeout |
| Zero External Dependencies | 0 npm packages | package.json |
| AGENTS.md Budget Usage | < 50% (16KB / 32KB) | 파일 크기 측정 |

### 6.3 Match Rate Targets (상세 산출)

#### v1.0.0 Hotfix 후 예상 Match Rate

| Component | Weight | Current | v1.0.0 Target | Delta | Action |
|-----------|:------:|:-------:|:------------:|:-----:|--------|
| Skills | 5 | 96.3% | **100%** | +3.7% | plan-plus 포팅 |
| Templates | 4 | 100% | 100% | 0% | 유지 |
| MCP Tools | 5 | 85% | **90%** | +5% | Compaction 저항성, Task Chain |
| AGENTS.md | 4 | 90% | **95%** | +5% | 규칙 강화 |
| Lib Modules | 3 | 45% | **52%** | +7% | task/creator.js, pdca/status.js |
| Install | 4 | 99% | 99% | 0% | plan-plus 포함 확인 |
| Agents | 4 | 15% | **20%** | +5% | code-review, plan-plus 흡수 |
| Hooks | 4 | 35% | **45%** | +10% | AGENTS.md 규칙 강화 |
| Team | 3 | 0% | **5%** | +5% | pdca SKILL.md Team 가이드 |
| Output Styles | 2 | 60% | **75%** | +15% | Response Format 강화 |
| Scripts | 3 | 40% | 40% | 0% | 유지 |
| Commands | 2 | 33% | 33% | 0% | 유지 |
| bkit-system | 1 | 100% | 100% | 0% | symlink 수정 |
| Configuration | 3 | 95% | **98%** | +3% | memory, symlink 수정 |
| CI/CD | 2 | 100% | 100% | 0% | 유지 |
| Testing | 3 | 100% | 100% | 0% | 테스트 추가 |
| Documentation | 2 | 100% | 100% | 0% | Plan-Plus 문서 |

**예상 v1.0.0 Weighted Score**: 41.47 / 54 = **76.8%** (현재 70.2%에서 +6.6%)

> 참고: 80% 달성을 위해서는 v1.0.0 hotfix + v1.1.0 초기 항목(Gap Analysis 강화, Output Style)이 함께 필요하다.

---

## 7. Risks and Mitigation

### 7.1 Platform Architecture Risks

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| **R-01**: AI가 bkit_init 호출을 스킵하여 PDCA 미초기화 | Medium | 5% | AGENTS.md "CRITICAL: FIRST action" 강조 + 후속 MCP 도구에서 미초기화 경고 반환 |
| **R-02**: AI가 bkit_pre_write_check을 스킵하여 안전 검사 우회 | Medium | 20% | AGENTS.md 반복 명시 + bkit_post_write에서 pre_write 미호출 감지 시 경고 |
| **R-03**: AI가 bkit_complete_phase를 스킵하여 페이즈 전환 미기록 | High | 20% | SKILL.md "Phase Completion Checklist" + "NEVER end without calling" 규칙 |
| **R-04**: Context compaction에서 PDCA 상태 손실 | High | 15% | .pdca-status.json 파일 영속화 + bkit_init에 상태 요약 포함 + AGENTS.md 복구 가이드 |
| **R-05**: AI가 AGENTS.md 규칙을 전반적으로 무시 | Low | 10% | 핵심 규칙에 "CRITICAL", "MANDATORY", "NON-NEGOTIABLE" 수식어 사용 |

### 7.2 MCP Server Risks

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| **R-06**: MCP 서버 초기화 실패로 Codex 사용 불가 (required=true) | High | 5% | install.sh에서 health check 실행. Node.js 최소 버전 검사. 실패 시 `required = false` 안내 |
| **R-07**: MCP 도구 호출 타임아웃 | Medium | 10% | tool_timeout_sec = 60 유지. 복잡한 연산은 비동기 처리 |
| **R-08**: MCP 서버 연결 끊김 (장기 세션) | Medium | 5% | Codex 자동 재연결 의존. 연결 끊김 시 에러 메시지에 복구 가이드 포함 |
| **R-09**: Node.js 미설치 환경에서 bkit 사용 불가 | Medium | 10% | install.sh에서 Node.js 검사 + 설치 안내. 향후 Rust 기반 대안 검토 (P3-6 판단) |

### 7.3 Platform Evolution Risks

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| **R-10**: Codex Skills API 변경 (codex-skills crate 업데이트) | High | High (40%) | SKILL.md 형식 변경 모니터링. install.sh에 버전 호환성 검사 추가 |
| **R-11**: Codex Multi-Agent API 대규모 변경 | Medium | High (50%) | v1.2.0까지 Multi-Agent 의존 최소화. SKILL.md 기반 가이드 유지 |
| **R-12**: Codex config.toml MCP 설정 변경 | Medium | Low (15%) | config 마이그레이션 로직 준비. install.sh 업데이트 대응 |
| **R-13**: 공식 Plugin 시스템 출시로 install.sh 아키텍처 재설계 필요 | Medium | High (60%) | Plugin API 호환 어댑터 설계. install.sh → plugin 변환 경로 준비 |
| **R-14**: 공식 Hooks 시스템 출시 시 MCP→Hook 전환 작업 | Low | High (70%) | bkit-claude-code hooks 코드 재활용. 마이그레이션 가이드 사전 준비 |
| **R-15**: Codex 빠른 릴리스 주기 (주당 5개)로 Breaking Change | Medium | Medium (30%) | CI에서 최신 Codex 버전 테스트. Changelog 자동 모니터링 |

### 7.4 Migration Risks

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| **R-16**: bkit-claude-code → bkit-codex 마이그레이션 시 상태 손실 | Low | 5% | .pdca-status.json v2.0 스키마 100% 호환 확인. 마이그레이션 가이드 제공 |
| **R-17**: bkit-system symlink 절대 경로로 다른 머신 배포 실패 | High | 80% | 상대 경로 전환 또는 문서 복사. install.sh에서 symlink 검증 |

---

## 8. Architecture Considerations

### 8.1 Codex 3-Tier Context Strategy

bkit-codex는 Codex의 3-Tier 아키텍처에 맞춰 컨텍스트를 계층적으로 관리한다:

```
Tier 1: Static Context (항상 로드됨)
  ├── agents.global.md (~3.8KB → ~5.5KB after 강화)
  │   - Session initialization rules
  │   - Mandatory MCP tool call rules
  │   - Code quality standards
  │   - Context recovery guide
  │   - MCP tools quick reference
  │   - Response style rules
  ├── AGENTS.md (~2.0KB → ~3.0KB after 강화)
  │   - Project-specific level guidance
  │   - Key skills reference
  │   - PDCA status check reminder
  │   - Level-specific response format
  └── Total: ~5.8KB → ~8.5KB (32KB 버짓의 27%)

Tier 2: Progressive Disclosure (필요시 로드)
  ├── SKILL.md × 27 (평균 ~9KB each)
  │   - 태스크 매칭 시 자동 로드
  │   - Codex Skills Progressive Disclosure 패턴
  │   - openai.yaml 메타데이터로 매칭 결정
  ├── references/ (상세 가이드)
  │   - SKILL.md에서 참조 시 로드
  └── templates/ (PDCA 문서 템플릿)
      - bkit_select_template MCP 도구로 선택

Tier 3: Dynamic State (MCP 도구로 접근)
  ├── .pdca-status.json (PDCA 상태)
  ├── .bkit-memory.json (에이전트 메모리)
  ├── bkit.config.json (설정)
  └── MCP Server (16 도구)
      - bkit_init, bkit_get_status, bkit_pre_write_check, ...
```

### 8.2 MCP Server Architecture

```
packages/mcp-server/
├── index.js                    # Entry point (STDIO transport)
├── package.json                # @popup-studio/bkit-codex-mcp v1.0.0
├── src/
│   ├── server.js               # JSON-RPC 2.0 dispatcher
│   ├── tools/                  # 16 tool handlers
│   │   ├── index.js            # Tool registry
│   │   ├── init.js             # bkit_init (SessionStart 대체)
│   │   ├── get-status.js       # bkit_get_status
│   │   ├── pre-write.js        # bkit_pre_write_check (PreToolUse 대체)
│   │   ├── post-write.js       # bkit_post_write (PostToolUse 대체)
│   │   ├── complete.js         # bkit_complete_phase (Stop 대체)
│   │   ├── pdca-plan.js        # bkit_pdca_plan (+Task Chain v1.0.0)
│   │   ├── pdca-design.js      # bkit_pdca_design
│   │   ├── pdca-analyze.js     # bkit_pdca_analyze (+gap-detector v1.1.0)
│   │   ├── pdca-next.js        # bkit_pdca_next
│   │   ├── analyze-prompt.js   # bkit_analyze_prompt (UserPromptSubmit 대체)
│   │   ├── classify.js         # bkit_classify_task
│   │   ├── detect-level.js     # bkit_detect_level
│   │   ├── template.js         # bkit_select_template
│   │   ├── deliverables.js     # bkit_check_deliverables
│   │   ├── memory-read.js      # bkit_memory_read
│   │   └── memory-write.js     # bkit_memory_write
│   └── lib/                    # 14 library modules
│       ├── core/               # config, cache, file, path
│       ├── pdca/               # status, level, phase, template, automation
│       ├── intent/             # language, trigger, ambiguity
│       └── task/               # classification, creator (+Task Chain v1.0.0)
├── tests/                      # 7 test files, 424+ tests
└── docs/                       # MCP server documentation
```

### 8.3 AGENTS.md Hierarchy

```
Codex AGENTS.md Discovery Order (R-1 Section 4):

1. ~/.codex/agents.global.md          (Global, 모든 프로젝트)
   → bkit: agents.global.md symlink

2. PROJECT_ROOT/AGENTS.md             (Project level)
   → bkit: AGENTS.md (레벨별 가이드)

3. SUBDIRECTORY/AGENTS.md             (Sub-directory level)
   → bkit: 미사용 (필요시 추가 가능)

Total Budget: 32KB (현재 사용: ~5.8KB, 강화 후: ~8.5KB)
여유: ~23.5KB (73%)
```

### 8.4 Skill Loading Pattern

```
User Input → Codex Core
  ├── AGENTS.md 로드 (Tier 1, 항상)
  ├── Skill Matching (openai.yaml triggers)
  │   ├── Explicit: /plan-plus feature-name
  │   │   → plan-plus/SKILL.md 로드
  │   └── Implicit: "brainstorming 계획 세워줘"
  │       → triggers 매칭 → plan-plus/SKILL.md 로드
  ├── MCP Tool Calls
  │   ├── bkit_init → SessionStart 로직
  │   ├── bkit_analyze_prompt → Intent Detection
  │   └── ... (16 tools)
  └── Response Generation
      ├── SKILL.md workflow 따르기
      ├── AGENTS.md 규칙 적용
      └── Output Style 적용
```

### 8.5 Key Architecture Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Agent 포팅 전략 | 1:1 포팅 vs SKILL.md 흡수 vs Codex Multi-Agent | **SKILL.md 흡수** + 향후 Multi-Agent | Codex Multi-Agent 실험적, SKILL.md 흡수가 즉시 가능하고 안정적 |
| Hook 대체 전략 | MCP only vs AGENTS.md only vs 하이브리드 | **하이브리드** (MCP + AGENTS.md) | MCP로 동적 로직, AGENTS.md로 규칙 강제, 이중 보장 |
| Output Style 구현 | AGENTS.md 분산 vs 전용 SKILL.md vs config.toml | **v1.0.0 AGENTS.md 강화 → v1.1.0 SKILL.md** | 즉시 적용 + 점진적 분리 |
| Task Chain 구현 | MCP 도구 내장 vs 별도 lib vs SKILL.md 지시 | **MCP 도구(bkit_pdca_plan) 내장** | 자동화 보장, 파일 영속화 |
| Compaction 저항성 | AGENTS.md 동적 주입 vs MCP 상태 요약 vs 파일 영속화 | **파일 영속화 + MCP 상태 요약** | .pdca-status.json은 compaction에 영향 없음 |
| Team 시스템 구현 시기 | 즉시 vs Codex Multi-Agent 안정화 후 | **안정화 후** (v1.2.0) | 폐기 리스크 최소화 |

### 8.6 Data Flow

```
[User] → [Codex TUI] → [AGENTS.md Rules]
                     → [Skill Matching] → [SKILL.md Workflow]
                     → [MCP Server] → [Tool Handler]
                                    → [Lib Modules]
                                    → [.pdca-status.json]
                                    → [.bkit-memory.json]
                                    → [bkit.config.json]
                     → [Response] → [Output Style Applied]
                                 → [PDCA Status Badge]
                                 → [Next Step Guidance]
```

---

## 9. Implementation Milestones

### 9.1 Phase 1: Critical Gap 해소 (Week 1)

**목표**: Overall Match Rate 70.2% → ~77%

| # | Task | Priority | 예상 시간 | 의존성 | 담당 |
|---|------|:--------:|:---------:|--------|------|
| T1-1 | plan-plus SKILL.md + openai.yaml + references/ 생성 | Critical | 2-3h | None | Skills Dev |
| T1-2 | plan-plus를 .bkit-codex/.agents/skills/에 추가 | Critical | 30m | T1-1 | Install Dev |
| T1-3 | install.sh에 plan-plus symlink 추가 확인 | Critical | 30m | T1-2 | Install Dev |
| T1-4 | agents.global.md 자동화 규칙 강화 | Critical | 2h | None | Context Dev |
| T1-5 | AGENTS.md Response Format 강화 | High | 1h | None | Context Dev |
| T1-6 | bkit_init MCP에 PDCA 상태 요약 추가 | Critical | 2h | None | MCP Dev |
| T1-7 | bkit_get_status에 Context Recovery 모드 추가 | Critical | 2h | T1-6 | MCP Dev |
| T1-8 | bkit_pdca_plan에 Task Chain 자동 생성 로직 추가 | Critical | 3-4h | None | MCP Dev |
| T1-9 | lib/task/creator.js Task Chain 함수 구현 | Critical | 2h | T1-8 | Lib Dev |
| T1-10 | lib/pdca/status.js getCompactSummary() 함수 추가 | Critical | 1h | T1-6 | Lib Dev |
| T1-11 | 테스트 파일 동기화 (dev → .bkit-codex/) | High | 1h | None | QA |
| T1-12 | bkit-system symlink 이식성 수정 | High | 1h | None | Install Dev |
| T1-13 | .bkit-memory.json platform 수정 | High | 30m | None | Config Dev |
| T1-14 | plan-plus 스킬 E2E 테스트 | Critical | 1-2h | T1-1~T1-3 | QA |
| T1-15 | Task Chain E2E 테스트 | Critical | 1-2h | T1-8~T1-9 | QA |
| T1-16 | 전체 회귀 테스트 (424+ tests) | Critical | 30m | All T1-* | QA |

**예상 총 소요**: 20-24 시간
**예상 Match Rate**: 70.2% → ~77%

### 9.2 Phase 2: Agent 흡수 + Hook 강화 (Week 2)

**목표**: Overall Match Rate ~77% → ~82%

| # | Task | Priority | 예상 시간 | 의존성 | 담당 |
|---|------|:--------:|:---------:|--------|------|
| T2-1 | code-review SKILL.md에 code-analyzer 지시사항 통합 | Medium | 2h | None | Skills Dev |
| T2-2 | pdca SKILL.md에 Team Workflow 가이드 섹션 추가 | Medium | 2h | None | Skills Dev |
| T2-3 | bkit_pdca_analyze MCP에 gap-detector 핵심 로직 통합 | High | 4-6h | None | MCP Dev |
| T2-4 | bkit_pdca_next MCP에 pdca-iterator 로직 통합 | Medium | 3-4h | None | MCP Dev |
| T2-5 | bkit_complete_phase에 report-generator 로직 통합 | Medium | 2-3h | None | MCP Dev |
| T2-6 | Skill Orchestrator 기본 구현 (bkit_get_status 응답에 추천 스킬 포함) | Medium | 3h | None | MCP Dev |
| T2-7 | bkit_post_write에 pre_write 미호출 감지 경고 추가 | Medium | 1h | None | MCP Dev |
| T2-8 | 신규 기능 테스트 추가 (30+ tests) | High | 3-4h | T2-1~T2-7 | QA |

**예상 총 소요**: 20-28 시간
**예상 Match Rate**: ~77% → ~82%

### 9.3 Phase 3: Output Styles + Team 준비 (Week 3)

**목표**: Overall Match Rate ~82% → ~85%

| # | Task | Priority | 예상 시간 | 의존성 | 담당 |
|---|------|:--------:|:---------:|--------|------|
| T3-1 | Output Style SKILL.md 4개 생성 (learning, pdca-guide, enterprise, pdca-enterprise) | High | 4-6h | None | Skills Dev |
| T3-2 | bkit_init에서 레벨별 Output Style SKILL.md 자동 추천 | Medium | 2h | T3-1 | MCP Dev |
| T3-3 | Full-Auto Mode 노출 (bkit.config.json → bkit_init 응답) | Medium | 2h | None | MCP Dev |
| T3-4 | lib/pdca/automation.js Full-Auto 로직 구현 | Medium | 3h | T3-3 | Lib Dev |
| T3-5 | bkit_memory_read/write 스코프 확장 (project/feature/session) | Medium | 3h | None | MCP Dev |
| T3-6 | Task ID Persistence 구현 (.pdca-status.json) | Medium | 2h | None | Lib Dev |
| T3-7 | Codex Multi-Agent config.toml 예시 문서 작성 | Low | 2h | None | Docs Dev |
| T3-8 | 신규 기능 테스트 추가 | High | 2-3h | T3-1~T3-6 | QA |

**예상 총 소요**: 20-26 시간
**예상 Match Rate**: ~82% → ~85%

### 9.4 Phase 4: 통합 테스트 + 문서 + 릴리스 (Week 4)

**목표**: Overall Match Rate ~85% → ~87%, v1.1.0 릴리스

| # | Task | Priority | 예상 시간 | 의존성 | 담당 |
|---|------|:--------:|:---------:|--------|------|
| T4-1 | 전체 통합 테스트 (27 skills × MCP 16 tools) | Critical | 4-6h | All | QA |
| T4-2 | 크로스 플랫폼 설치 테스트 (macOS, Linux, WSL) | High | 2-3h | T4-1 | QA |
| T4-3 | 장기 세션 테스트 (2시간+ compaction 시나리오) | High | 2h | T4-1 | QA |
| T4-4 | CHANGELOG.md 업데이트 | Medium | 1h | T4-1 | Docs |
| T4-5 | README.md 업데이트 (plan-plus, Task Chain, Output Styles 등) | Medium | 2h | T4-1 | Docs |
| T4-6 | Match Rate 재산출 및 검증 | High | 2h | T4-1 | Analysis |
| T4-7 | v1.1.0 릴리스 준비 (태그, release workflow) | Medium | 1h | T4-1~T4-6 | Release |
| T4-8 | v1.2.0 로드맵 문서 작성 | Low | 2h | T4-6 | Planning |

**예상 총 소요**: 16-22 시간
**최종 예상 Match Rate**: ~87% (v1.1.0)

### 9.5 Phase 5: 플랫폼 통합 (v1.2.0, 조건부)

**조건**: Codex Multi-Agent 안정화 또는 Codex Hook 시스템 출시

| # | Task | Priority | 예상 시간 | 조건 |
|---|------|:--------:|:---------:|------|
| T5-1 | Codex Multi-Agent 통합 (leader/reviewer/architect) | Medium | 8-12h | Multi-Agent API 안정화 |
| T5-2 | Codex Native Hooks 마이그레이션 (5-8개 핸들러) | High | 6-10h | Hook 시스템 출시 |
| T5-3 | MCP Resource/Prompt 지원 추가 | Low | 4-6h | 수요 발생 |
| T5-4 | npm 배포 (@popup-studio/bkit-codex-mcp) | Low | 2-3h | 커뮤니티 요구 |
| T5-5 | 통합 테스트 + 릴리스 | High | 4-6h | T5-1~T5-4 |

**예상 총 소요**: 24-37 시간 (조건부)
**예상 Match Rate**: ~87% → ~92% (v1.2.0)

---

## 10. Convention Prerequisites

### 10.1 Applicable Conventions

- [x] **PDCA 워크플로우 규칙**: Plan → Design → Do → Check → Act → Report
- [x] **Naming Conventions**: PascalCase(Components), camelCase(Functions), UPPER_SNAKE_CASE(Constants), kebab-case(Files)
- [x] **SKILL.md 구조**: YAML frontmatter (name, description, triggers, allow_implicit_invocation, user_invocable) + body
- [x] **openai.yaml 구조**: Codex Skills 메타데이터 표준
- [x] **MCP Tool 규칙**: JSON-RPC 2.0, JSON Schema input, 구조화된 응답
- [x] **Zero External Dependencies**: npm packages 0개 유지
- [x] **Test 규칙**: 모든 변경 시 테스트 추가, 100% pass rate 유지

### 10.2 File Path Conventions

| Component | Path Pattern | Example |
|-----------|-------------|---------|
| Skill | `.agents/skills/{skill-name}/SKILL.md` | `.agents/skills/plan-plus/SKILL.md` |
| Skill Meta | `.agents/skills/{skill-name}/openai.yaml` | `.agents/skills/plan-plus/openai.yaml` |
| Skill Ref | `.agents/skills/{skill-name}/references/*.md` | `.agents/skills/plan-plus/references/plan-plus-process.md` |
| MCP Tool | `packages/mcp-server/src/tools/{tool-name}.js` | `packages/mcp-server/src/tools/pdca-plan.js` |
| Lib Module | `packages/mcp-server/src/lib/{group}/{module}.js` | `packages/mcp-server/src/lib/task/creator.js` |
| Template | `.bkit-codex/templates/{template-name}.template.md` | `.bkit-codex/templates/plan-plus.template.md` |
| Test | `packages/mcp-server/tests/{test-name}.test.js` | `packages/mcp-server/tests/task-chain.test.js` |
| Global Rules | `agents.global.md` | root level |
| Project Rules | `AGENTS.md` | root level |
| PDCA Status | `docs/.pdca-status.json` | root level |
| Config | `.codex/config.toml` | root level |
| bkit Config | `bkit.config.json` | root level |

---

## 11. Next Steps

### 11.1 Immediate (v1.0.0 Hotfix)

1. [ ] Phase 1 실행: plan-plus 포팅 + Critical Gap 해소
2. [ ] 전체 회귀 테스트
3. [ ] v1.0.0 hotfix 릴리스

### 11.2 Short-term (v1.1.0)

1. [ ] Phase 2-3 실행: Agent 흡수 + Hook 강화 + Output Styles
2. [ ] Phase 4 실행: 통합 테스트 + 릴리스
3. [ ] Match Rate 재산출 및 85% 목표 검증

### 11.3 Medium-term (v1.2.0)

1. [ ] Codex Multi-Agent API 추적 (PR #12332, #12327, #12320)
2. [ ] Codex Hook 시스템 추적 (Issue #2109)
3. [ ] 조건 충족 시 Phase 5 실행
4. [ ] Match Rate 90% 목표 검증

### 11.4 Design Document 작성

1. [ ] `/pdca design bkit-codex-v1` -- 상세 설계 문서 작성
2. [ ] 팀 리뷰 및 승인
3. [ ] `/pdca do bkit-codex-v1` -- 구현 시작

---

## Appendix A: Brainstorming Log

> Key decisions from Plan Plus Phases 1-4.

| Phase | Question/Topic | Decision | Rationale |
|-------|---------------|----------|-----------|
| Intent | Core Problem | Match Rate 70.2% → 90%+ 달성 | 4개 Critical Gap + 6개 Major Gap 해소 필요 |
| Intent | Target Users | 5개 사용자 유형 (기존 bkit, Codex 신규, Plugin 개발자, AI팀, Enterprise) | Codex 에코시스템 다각화 |
| Intent | Success Criteria | v1.0.0: 80%, v1.1.0: 85%, v1.2.0: 90% | 단계별 현실적 목표 |
| Alternatives | 3개 접근법 비교 | Approach B "Platform-Adaptive" 선택 | 기술적 현실성 + 시장 기회 + 비용 효율 |
| Alternatives | Agent 포팅 전략 | SKILL.md 흡수 (즉시) + Codex Multi-Agent (향후) | 안정성 + 플랫폼 탄력성 |
| Alternatives | Hook 대체 전략 | 하이브리드 (MCP + AGENTS.md) | 이중 보장으로 자동화 수준 최대화 |
| Alternatives | Team 시스템 시기 | Codex Multi-Agent 안정화 후 (v1.2.0+) | 폐기 리스크 최소화 |
| YAGNI | Rust MCP 서버 | Won't Do | 200+ 시간 대비 ROI 불충분 |
| YAGNI | 16개 Agent 1:1 포팅 | Won't Do | 구조적 불일치, SKILL.md 흡수가 더 적합 |
| YAGNI | /github-stats 명령 | Won't Do | 핵심 PDCA와 무관 |
| YAGNI | Output Style v1.0.0 전용 SKILL.md | Deferred to v1.1.0 | AGENTS.md 강화로 즉시 효과, 분리는 점진적 |
| YAGNI | npm 배포 | Deferred to v1.2.0 | curl 설치로 충분 |
| Validation | AGENTS.md 버짓 | 32KB 중 ~8.5KB 사용 (27%) 확인 | 충분한 여유 |
| Validation | MCP 도구 16개 유지 | v1.0.0에서 도구 수 변경 없음 (기존 도구 강화) | 호환성 유지 |
| Validation | 테스트 전략 | 424+ 유지 + 30+ 신규 = 454+ | 품질 게이트 |

---

## Appendix B: Codex config.toml Complete Example

```toml
# .codex/config.toml -- bkit-codex v1.0.0+ 설정

# MCP 서버 설정
[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 60
required = true

# v1.2.0 예정: Multi-Agent 설정 (Codex Multi-Agent 안정화 후)
# [features]
# multi_agent = true
#
# [agents.cto]
# model = "gpt-5.3-codex"
# sandbox_mode = "workspace-write"
# developer_instructions = "CTO lead for bkit PDCA workflow..."
#
# [agents.reviewer]
# model = "gpt-5.3-codex"
# sandbox_mode = "read-only"
# developer_instructions = "Code reviewer and gap detector..."
```

---

## Appendix C: openai.yaml Examples

### plan-plus openai.yaml

```yaml
name: plan-plus
description: "Brainstorming-enhanced PDCA planning with 6-phase methodology"
triggers:
  - plan-plus
  - "brainstorming plan"
  - "enhanced planning"
  - "plan plus"
  - "detailed planning"
  - "계획 수립"
  - "상세 계획"
allow_implicit_invocation: true
user_invocable: true
```

### Output Style openai.yaml (v1.1.0)

```yaml
# output-learning/openai.yaml
name: output-learning
description: "Starter level learning-oriented response style"
triggers:
  - "learning mode"
  - "beginner style"
allow_implicit_invocation: true
user_invocable: false
```

```yaml
# output-pdca-guide/openai.yaml
name: output-pdca-guide
description: "Dynamic level PDCA-guided response style"
triggers:
  - "pdca guide mode"
  - "dynamic style"
allow_implicit_invocation: true
user_invocable: false
```

---

## Appendix D: File Change Summary

### v1.0.0 Hotfix -- 신규/변경 파일 목록

**신규 파일**:
| # | Path | Size (est.) | Purpose |
|---|------|:-----------:|---------|
| 1 | `.agents/skills/plan-plus/SKILL.md` | ~7.5KB | plan-plus 스킬 정의 |
| 2 | `.agents/skills/plan-plus/openai.yaml` | ~300B | 스킬 메타데이터 |
| 3 | `.agents/skills/plan-plus/references/plan-plus-process.md` | ~3KB | 프로세스 상세 가이드 |
| 4 | `packages/mcp-server/tests/task-chain.test.js` | ~2KB | Task Chain 테스트 |
| 5 | `packages/mcp-server/tests/compaction-resilience.test.js` | ~2KB | Compaction 저항성 테스트 |

**변경 파일**:
| # | Path | Change Type | Description |
|---|------|------------|-------------|
| 1 | `agents.global.md` | MODIFY | 자동화 규칙 강화 (~3.8KB → ~5.5KB) |
| 2 | `AGENTS.md` | MODIFY | Response Format 강화 (~2.0KB → ~3.0KB) |
| 3 | `packages/mcp-server/src/tools/init.js` | MODIFY | PDCA 상태 요약 추가 |
| 4 | `packages/mcp-server/src/tools/get-status.js` | MODIFY | Context Recovery 모드 |
| 5 | `packages/mcp-server/src/tools/pdca-plan.js` | MODIFY | Task Chain 자동 생성 |
| 6 | `packages/mcp-server/src/lib/task/creator.js` | MODIFY | Task Chain 함수 |
| 7 | `packages/mcp-server/src/lib/pdca/status.js` | MODIFY | getCompactSummary() |
| 8 | `.bkit-memory.json` | MODIFY | platform: "codex" |
| 9 | `install.sh` | MODIFY | plan-plus symlink 포함 확인 |

### v1.1.0 -- 추가 변경 파일

**신규 파일**:
| # | Path | Purpose |
|---|------|---------|
| 1-4 | `.agents/skills/output-*/SKILL.md` | 4개 Output Style 스킬 |
| 5-8 | `.agents/skills/output-*/openai.yaml` | 4개 스킬 메타데이터 |
| 9 | `packages/mcp-server/src/lib/pdca/automation.js` | Full-Auto Mode 로직 |

**변경 파일**:
| # | Path | Description |
|---|------|-------------|
| 1 | `packages/mcp-server/src/tools/pdca-analyze.js` | gap-detector 로직 통합 |
| 2 | `packages/mcp-server/src/tools/pdca-next.js` | pdca-iterator 로직 통합 |
| 3 | `packages/mcp-server/src/tools/complete.js` | report-generator 로직 통합 |
| 4 | `packages/mcp-server/src/tools/init.js` | Output Style 추천, Full-Auto Mode |
| 5 | `packages/mcp-server/src/tools/get-status.js` | Skill Orchestrator 추천 |
| 6 | `packages/mcp-server/src/tools/memory-read.js` | 스코프 확장 |
| 7 | `packages/mcp-server/src/tools/memory-write.js` | 스코프 확장 |
| 8 | `code-review/SKILL.md` | code-analyzer 지시사항 통합 |
| 9 | `pdca/SKILL.md` | Team Workflow 가이드 추가 |

---

## Appendix E: Codex Community Alignment

### bkit 기능과 커뮤니티 요구의 매핑 검증

| 커뮤니티 이슈 | Reactions | bkit 대응 | v1.0.0 | v1.1.0 | v1.2.0 |
|-------------|:---------:|----------|:------:|:------:|:------:|
| #2109 Event Hooks (418+) | 418+ | MCP+AGENTS.md 하이브리드 → Native Hooks 전환 | Partial | Enhanced | Migration |
| #2604 Subagent Support (315+) | 315+ | SKILL.md 흡수 → Multi-Agent 통합 | Guide | Partial | Integration |
| #8512 Plugin System (47) | 47 | install.sh 시스템이 Plugin 선행 구현 | Active | Active | Adapter |
| #9505 Compaction Info Loss | - | .pdca-status.json + Context Recovery | Fix | Enhanced | Hook |
| #8368 Long-term Memory (12) | 12 | bkit_memory_read/write MCP | Active | Scope Ext | Active |
| #12115 Dynamic AGENTS.md | - | bkit context hierarchy | Partial | Active | Active |
| #10067 AGENTS.md Variants | - | bkit level detection (S/D/E) | Active | Active | Active |
| #12190 Governance Hooks | - | PDCA audit trail | Partial | Enhanced | Hook |
| #11912 Custom Compaction | - | PreCompact 대체 전략 | Workaround | Enhanced | Hook |
| #6038 Include Files | 6 | bkit context rules | Partial | Active | Active |

---

## Appendix F: Risk Tracking Matrix

| Risk ID | Description | Status | Owner | Review Date |
|---------|------------|:------:|-------|-------------|
| R-01 | AI가 bkit_init 스킵 | Open | Context Dev | Weekly |
| R-02 | AI가 pre_write_check 스킵 | Open | Context Dev | Weekly |
| R-03 | AI가 complete_phase 스킵 | Open | Context Dev | Weekly |
| R-04 | Compaction PDCA 상태 손실 | Open | MCP Dev | Weekly |
| R-05 | AGENTS.md 규칙 무시 | Open | Context Dev | Weekly |
| R-06 | MCP 서버 초기화 실패 | Open | MCP Dev | Weekly |
| R-10 | Skills API 변경 | Open | All | Release-based |
| R-11 | Multi-Agent API 변경 | Open | All | Release-based |
| R-13 | Plugin 시스템 출시 | Open | Install Dev | Release-based |
| R-14 | Hooks 시스템 출시 | Open | MCP Dev | Release-based |
| R-17 | Symlink 이식성 | Open | Install Dev | v1.0.0 Hotfix |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-21 | Initial draft (Plan Plus methodology) | Plan-Plus Writer (CTO Team) |
| 1.0 | 2026-02-21 | Complete plan with all sections, brainstorming log, appendices | Plan-Plus Writer (CTO Team) |

---

> **Plan Conclusion**: bkit-codex v1.0.0의 Complete Porting을 위해 Platform-Adaptive 접근법을 채택한다. 4개 Critical Gap(plan-plus, Automation, PreCompact, Task Chain)을 v1.0.0 hotfix로 즉시 해소하고, 6개 Major Gap을 v1.1.0에서 해소하여 Match Rate 85%를 달성한다. Codex 플랫폼의 Hook 시스템과 Multi-Agent 안정화를 추적하며 v1.2.0에서 90%+ Match Rate를 목표로 점진적 진화를 수행한다. 이 계획은 총 80-120시간의 개발 투자로 bkit-codex를 Codex 에코시스템의 핵심 Plugin/Skills 참조 구현으로 포지셔닝한다.

---

*Plan generated: 2026-02-21*
*Author: Plan-Plus Writer (CTO Team, Task #7)*
*Method: Plan Plus (Brainstorming-Enhanced PDCA)*
*Analysis Source: codex-context-engineering-v1.analysis.md (65KB, 5 research reports)*
*Word count: ~20,000+ words*
