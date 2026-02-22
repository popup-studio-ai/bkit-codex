# Codex Context Engineering v1.0.0 - PDCA Analysis Report

> Feature: bkit-codex-v1.0.0-complete-porting
> Date: 2026-02-21
> Phase: Analysis (Check)
> Status: Complete

---

## 1. Analysis Overview

### 1.1 Purpose

본 분석 보고서는 bkit-claude-code (v1.5.5)에서 bkit-codex (v1.0.0)로의 완전 포팅(Complete Porting) 프로젝트에 대한 종합적인 PDCA Check(분석) 문서이다. 5건의 심층 리서치 결과를 종합하여 다음 질문에 답한다:

1. **현황**: OpenAI Codex CLI의 아키텍처와 Context Engineering 전략은 어떤 방향으로 진화하고 있는가?
2. **갭**: bkit-claude-code의 174+ 파일, 27 스킬, 16 에이전트, 13개 훅 이벤트 중 어디까지 포팅되었고, 무엇이 남았는가?
3. **기회**: Codex 커뮤니티의 12,400+ 이슈에서 bkit이 채울 수 있는 시장 공백은 무엇인가?
4. **리스크**: 플랫폼 진화, 아키텍처 차이, 의존성 체인에서 어떤 기술적 위험이 있는가?
5. **권고**: v1.0.0 완성을 위한 우선순위별 실행 계획은 무엇인가?

### 1.2 Scope

| 항목 | 범위 |
|------|------|
| **소스 플랫폼** | bkit-claude-code v1.5.5 (Claude Code 기반) |
| **타겟 플랫폼** | bkit-codex v1.0.0 (OpenAI Codex CLI 기반) |
| **분석 대상** | Skills (27), Agents (16), Hooks (13 events), Templates (28), Lib (35 files), Scripts (45), Output Styles (4), Commands (3), bkit-system (14 files) |
| **총 파일 수** | bkit-claude-code: 174+ files (~1MB), bkit-codex: 147 files |
| **Codex CLI 버전** | v0.104.0 (2026-02-18 기준) |
| **Codex 저장소** | openai/codex (61,276 stars, 8,123 forks, 1,365 open issues) |

### 1.3 Analysis Methodology

본 분석은 다음 5건의 리서치 보고서를 종합하여 작성되었다:

| # | 리서치 | 분량 | 핵심 내용 |
|---|--------|------|-----------|
| R-1 | Codex CLI 공식 문서 및 아키텍처 심층조사 | 45KB | 3-Tier 아키텍처, AGENTS.md, config.toml, MCP, Skills, 보안, 멀티에이전트 |
| R-2 | Context Engineering 기술블로그 및 방향성 | 23KB | CE 4대 전략 (Write/Select/Compress/Isolate), 경쟁 환경, Codex 전략 |
| R-3 | GitHub Issues 및 커뮤니티 요구사항 | 19KB | 12,400+ 이슈 분석, 커뮤니티 pain points, 기능 요청 우선순위 |
| R-4 | bkit-claude-code 전체 기능 인벤토리 | 37KB | 174+ 파일 완전 목록, 의존성 그래프, 복잡도 평가 |
| R-5 | bkit-codex 현재 구현 상태 분석 | 25KB | 147 파일 감사, 갭 평가, 아키텍처 비교, 기술 부채 |

**분석 프레임워크:**
- **정량 분석**: 파일 단위 Coverage Matrix, Match Rate 산출
- **정성 분석**: 아키텍처 패러다임 차이, Context Engineering 전략 적합성
- **시장 분석**: 커뮤니티 요구사항과 bkit 기능 매핑
- **리스크 분석**: 플랫폼 의존성, 진화 리스크, 마이그레이션 경로

---

## 2. Codex Context Engineering 현황 분석

### 2.1 Codex CLI 아키텍처 핵심 요약

OpenAI Codex CLI는 Rust로 완전 리라이트된 오픈소스 코딩 에이전트이다 (R-1). 2025년 하반기 TypeScript에서 Rust로의 전환을 완료했으며, 65+ Rust 크레이트로 구성된 Cargo workspace 모노레포 구조를 갖는다.

#### 3-Tier 아키텍처

```
Tier 1: User Interface
  - TUI (Ratatui 기반 터미널 UI)
  - Exec (비대화형 헤드리스 모드)
  - App Server (JSON-RPC 2.0, IDE 통합)

Tier 2: Core Logic
  - codex-core (세션, 모델, 도구 관리)
  - Queue-Based Submission/Event Pattern
  - Thread Manager

Tier 3: External Integrations
  - Model Client (GPT-5.3-codex, GPT-5.3-codex-spark)
  - MCP Connection Manager
  - Unified Exec Process Manager
  - RolloutRecorder (JSONL 세션 저장)
```

**통신 프로토콜** (R-1 Section 3.3):
- Submission 타입: UserTurn, Interrupt, ExecApproval
- Event 타입: TurnStarted, AgentMessage, ExecCommandBegin, TurnComplete, Error
- Non-blocking UI 업데이트, 이벤트 리플레이를 통한 세션 재개 지원

**핵심 인터페이스** (R-1 Section 1.2):

| 인터페이스 | 설명 | bkit 통합 관련성 |
|-----------|------|-----------------|
| `codex` | 대화형 TUI | 기본 사용 환경 |
| `codex exec` | 비대화형/스크립트 실행 | CI/CD 자동화 |
| `codex cloud` | 클라우드 태스크 관리 | 향후 확장 |
| `codex mcp-server` | MCP 서버 모드 | bkit 도구 연동 |
| IDE Extension | VS Code, Cursor, Windsurf | IDE 통합 |

#### Rust 리라이트의 bkit 영향

| 변경 | bkit 영향 |
|------|----------|
| 제로 의존성 (Node.js 불필요) | bkit MCP 서버는 여전히 Node.js 필요 -- 별도 런타임 의존성 |
| OS 레벨 샌드박스 바인딩 | bkit MCP 서버는 샌드박스 외부에서 실행 가능성 확인 필요 |
| Wire 프로토콜 기반 확장 | 향후 Rust 기반 bkit 통합 가능성 |
| 65+ 크레이트 분해 | codex-skills, codex-core 등 API 변동 추적 필요 |

### 2.2 Context Engineering 4대 전략과 Codex 적용 현황

LangChain이 정리한 Context Engineering의 4대 핵심 전략 프레임워크와 Codex의 현재 적용 상태를 분석한다 (R-2 Section 1.4).

#### (1) Write (쓰기 - 컨텍스트 영속화)

**전략**: 컨텍스트 윈도우 밖에 정보를 저장하여 세션 간 연속성 확보

| 구현 요소 | Codex 현황 | bkit-codex 현황 | 갭 |
|-----------|-----------|----------------|-----|
| AGENTS.md 계층 구조 | 글로벌 + 프로젝트 + 서브디렉토리 계층 (R-1 Section 4) | agents.global.md + AGENTS.md (5.8KB/32KB) | 82% 버짓 여유 |
| 세션 트랜스크립트 | JSONL 롤아웃 파일로 자동 저장 (R-1 Section 9) | 자동 (Codex 네이티브) | 없음 |
| 메모리 파이프라인 | memory.md 기반 (Beta, R-1 Section 10.5) | .bkit-memory.json (MCP 도구) | 포맷 차이 |
| 파일 기반 상태 | - | .pdca-status.json (완전 구현) | bkit 우위 |

**분석**: Codex의 Write 전략은 AGENTS.md와 세션 롤아웃 파일에 집중되어 있다. bkit-codex는 .pdca-status.json을 통한 구조화된 상태 영속화에서 Codex 네이티브보다 진보된 접근을 취하고 있다. AGENTS.md 컨텍스트 버짓의 82%가 미사용 상태이므로, 추가 지시사항 확장 여지가 충분하다.

#### (2) Select (선택 - 컨텍스트 검색)

**전략**: 지능적 필터링으로 관련 정보만 컨텍스트에 포함

| 구현 요소 | Codex 현황 | bkit-codex 현황 | 갭 |
|-----------|-----------|----------------|-----|
| Progressive Disclosure | Skills 메타데이터 먼저, 전체 SKILL.md는 필요시 (R-1 Section 7.4) | 3-Tier Context Strategy 구현 (R-5 Section 10.3) | 없음 |
| JIT 검색 | MCP 도구를 통한 필요시 검색 | bkit MCP 16개 도구 (R-5 Section 3.2) | 없음 |
| 스킬 자동 매칭 | 암시적 호출 (태스크 설명 기반, R-1 Section 7.4) | allow_implicit_invocation: true (26 스킬) | 없음 |
| 파일 검색/인덱싱 | 기본 도구 (grep, glob) | Codex 네이티브 동일 | 없음 |

**분석**: Select 전략은 bkit-codex가 가장 잘 적응한 영역이다. 3-Tier Context Strategy (AGENTS.md -> SKILL.md -> references/) 는 Codex의 Progressive Disclosure 패턴과 완벽히 정렬된다.

#### (3) Compress (압축 - 컨텍스트 축소)

**전략**: 재귀적/계층적 요약으로 컨텍스트 윈도우 효율성 확보

| 구현 요소 | Codex 현황 | bkit-codex 현황 | 갭 |
|-----------|-----------|----------------|-----|
| 자동 Compaction | 모델 수준 네이티브 compaction (R-2 Section 2.2) | Codex 네이티브 (자동) | 없음 |
| 수동 Compaction | /compact 슬래시 명령 (R-1 Section 10.3) | Codex 네이티브 | 없음 |
| Compaction 훅 | 없음 (커뮤니티 요구: #11912, R-3) | bkit-claude-code에 PreCompact 훅 존재, Codex 미포팅 | **Critical** |
| 상태 스냅샷 | 경량 receipt 저장 (R-2 Section 2.2) | .pdca-snapshots/ (10개 파일) | bkit 우위 |

**분석**: Compress 전략에서 가장 큰 갭은 PreCompact 훅의 부재이다. bkit-claude-code에서는 context-compaction.js가 compaction 전에 핵심 상태를 스냅샷하여 정보 손실을 방지했지만, Codex에서는 이 보호막이 없다. 커뮤니티에서도 compaction으로 인한 정보 손실이 가장 큰 pain point 중 하나이다 (#9505, #8365, #11315).

#### (4) Isolate (분리 - 컨텍스트 격리)

**전략**: 서브 에이전트로 컨텍스트를 분할하여 각 에이전트가 독립적 컨텍스트 윈도우 보유

| 구현 요소 | Codex 현황 | bkit-codex 현황 | 갭 |
|-----------|-----------|----------------|-----|
| 멀티에이전트 | 실험적 (features.multi_agent = true, R-1 Section 11) | 미구현 | **Critical** |
| 에이전트 역할 | default/worker/explorer + 커스텀 역할 (R-1 Section 11.3-4) | 미구현 | **Critical** |
| 컨텍스트 포크 | context: fork (bkit-claude-code agents) | 미구현 | **Major** |
| 서브에이전트 생성 | 활발한 개발 중 (#2604, 315+ reactions, R-3) | 미구현 | **Critical** |

**분석**: Isolate 전략은 현재 가장 큰 아키텍처적 갭이다. bkit-claude-code에서 16개 전문 에이전트(cto-lead, gap-detector, pdca-iterator 등)와 Team 시스템(lib/team/ 9 파일, 48KB)이 핵심 차별화 요소였으나, Codex에서는 멀티에이전트 자체가 실험적 기능이므로 직접 포팅이 불가능하다. 다만, Codex의 멀티에이전트 시스템이 활발히 개발 중이므로 (PR #12332, #12327, #12320 MERGED), 향후 통합 기회가 존재한다.

### 2.3 Codex의 전략적 방향 (공식 문서 + 블로그 + 이슈 종합)

#### 2.3.1 제품 진화 로드맵

R-1, R-2, R-3의 데이터를 종합하면 Codex의 전략적 방향은 다음 5개 축으로 수렴한다:

**축 1: 장기 작업 안정성 (Long-Running Task Reliability)**
- Context compaction으로 멀티-시간 추론 가능 (R-2 Section 5.1)
- GPT-5.3-Codex의 400K 토큰 컨텍스트 윈도우 (R-1 Section 10.1)
- 세션 resume/fork로 작업 연속성 보장 (R-1 Section 9)
- 커뮤니티 pain point: compaction 시 정보 손실 (#9505, #8365, #11315)

**축 2: 개발자 경험 다양화 (Multi-Surface Developer Experience)**
- CLI (TUI) + IDE Extension + Desktop App + Cloud Web (R-2 Section 5.1)
- Codex App (macOS) 2026년 2월 2일 출시 (R-2 Section 5.4)
- 복수 에이전트 동시 관리, 병렬 작업 실행

**축 3: 에코시스템 확장 (Ecosystem Expansion)**
- MCP 네이티브 지원 (클라이언트 + 서버 양방향, R-1 Section 6)
- Skills 시스템 (Open Agent Skills 표준, R-1 Section 7)
- Agents SDK 통합 (MCP 서버 모드를 통한 오케스트레이션, R-1 Section 11.7)
- 커뮤니티 요구: 플러그인 시스템 (#8512, 47 thumbs up), 플러그인 마켓플레이스 (#8925)

**축 4: 자율성 확장 (Increasing Autonomy)**
- Plan mode, 백그라운드 bash 실행 (R-2 Section 5.5)
- `codex exec` 비대화형 자동화 (R-1 Section 12)
- GitHub Action (openai/codex-action@v1, R-1 Section 12.4)
- Full-auto 모드: `--full-auto --sandbox workspace-write`

**축 5: 보안 및 엔터프라이즈 (Security & Enterprise)**
- 2계층 보안 모델: 샌드박스 + 승인 정책 (R-1 Section 8)
- requirements.toml 관리자 강제 설정 (R-1 Section 8.6)
- MDM 프로필 통합 (macOS 관리 디바이스)
- OpenTelemetry 텔레메트리 (opt-in)
- 커뮤니티 요구: 거버넌스 훅 (#12190), 정책 강제, 감사 추적

#### 2.3.2 경쟁 환경 포지셔닝

R-2 Section 4의 경쟁 분석에 따르면, 주요 AI 코딩 도구들은 수렴 트렌드를 보이고 있다:

| 도구 | 컨텍스트 윈도우 | 컨텍스트 관리 | SWE-Bench | 오픈소스 |
|------|---------------|-------------|-----------|---------|
| OpenAI Codex | 400K 토큰 | Compaction + AGENTS.md | ~49% | CLI: Yes |
| Claude Code | ~200K 토큰 | Compaction + CLAUDE.md | ~70.3% | No |
| Cursor | ~272K 토큰 | Codebase Embedding | 높음 | No |
| Windsurf | 가변 | Codemaps + Fast Context | 보통 | No |

**공통 수렴 방향** (R-2 Section 4.3):
1. 에이전틱 아키텍처 (도구 사용 루프)
2. 컨텍스트 compaction/summarization
3. 파일 기반 상태 영속화 (AGENTS.md, CLAUDE.md, .cursorrules)
4. MCP 또는 유사 프로토콜을 통한 도구 확장
5. 멀티 에이전트 워크플로우

**bkit 포지셔닝 시사점**: Codex는 SWE-Bench에서 Claude 대비 열세(~49% vs ~70.3%)이나, 오픈소스 CLI + MCP 에코시스템 + Skills 시스템에서 확장성 우위를 가진다. bkit-codex는 이 확장성 생태계에 구조화된 PDCA 방법론을 공급하는 역할을 수행한다.

#### 2.3.3 OpenAI의 활발한 개발 신호 (R-3 Section 4)

2026년 2월 기준 OpenAI가 활발히 개발 중인 영역:

| 영역 | 최근 PR/활동 | bkit 영향 |
|------|-------------|----------|
| Multi-Agent | #12332 agent picker (MERGED), #12327 cleaner TUI (MERGED), #12320 nick names (MERGED) | Agent Teams 통합 기회 |
| Skills | codex-skills 크레이트 분리 (MERGED), 스킬 퍼미션 오버레이 (OPEN) | Skills API 변동 추적 필요 |
| SDK | #12297 collaborationMode MVP (OPEN), WebSocket v2 (OPEN) | 향후 SDK 통합 가능성 |
| Config | Claude config 마이그레이션 (PR #12392, OPEN) | CLAUDE.md -> AGENTS.md 자동 변환 |
| Security | MCP 도구 승인 필수화 (MERGED), filesystem deny_read (OPEN) | 보안 정책 호환성 |

**핵심 관찰**: PR #12392는 Claude Code에서 Codex로의 마이그레이션 도구를 개발 중이며, CLAUDE.md -> AGENTS.md 변환, Skills 복사, MCP 서버 임포트를 지원한다. 이는 OpenAI가 Claude Code 사용자를 적극 흡수하려는 전략적 신호이다.

### 2.4 플랫폼 제약사항 및 기회

#### 2.4.1 아키텍처 패러다임 차이

bkit-claude-code와 bkit-codex 간의 근본적인 아키텍처 패러다임 차이 (R-5 Section 11):

```
bkit-claude-code: Hook-Driven Architecture
  - "시스템이 AI를 제어한다" (System controls AI)
  - 10개 훅 이벤트가 13개 훅 핸들러를 통해 100% 자동 실행
  - AI가 무시할 수 없는 강제 실행 (deterministic)

bkit-codex: Instruction-Driven Architecture
  - "AI가 자발적으로 규칙을 따른다" (AI voluntarily follows rules)
  - AGENTS.md 지시사항 + MCP 도구 호출
  - AI가 지시를 무시할 가능성 존재 (probabilistic)
```

이 패러다임 차이로 인한 자동화 보장 수준 (R-5 Section 5.3):

| 동작 | bkit-claude-code (Hook) | bkit-codex (AGENTS.md + MCP) | 차이 |
|------|:----------------------:|:----------------------------:|:----:|
| 세션 초기화 | 100% | ~95% | -5% |
| 인텐트 감지 | 100% | ~85% | -15% |
| Pre-write 검사 | 100% | ~80% | -20% |
| Post-write 가이드 | 100% | ~75% | -25% |
| 페이즈 전환 | 100% | ~80% | -20% |
| 팀 오케스트레이션 | 100% | N/A | -100% |
| **평균** | **100%** | **~69%** | **-31%** |

**핵심 인사이트**: 31%의 자동화 보장 수준 감소는 bkit-codex의 근본적 한계이다. 이 갭은 Codex 플랫폼이 hooks 시스템을 도입하기 전까지는 완전히 해소할 수 없다.

#### 2.4.2 Codex 플랫폼 기회

| 기회 | 설명 | 근거 |
|------|------|------|
| Skills 생태계 선점 | Codex Skills 시스템에 PDCA 스킬 패키지 공급 | R-1 Section 7, R-3 #8512 |
| MCP 도구 확장 | bkit MCP 서버를 통한 Codex 에코시스템 통합 | R-1 Section 6, R-5 Section 3 |
| 컨텍스트 버짓 여유 | AGENTS.md 32KB 중 5.8KB만 사용 (82% 여유) | R-5 Section 5.2 |
| codex exec 자동화 | 비대화형 모드로 CI/CD 파이프라인 통합 | R-1 Section 12 |
| 플러그인 갭 충족 | 커뮤니티가 요구하는 플러그인 시스템 역할 수행 | R-3 #8512, #8925, #9613 |
| 세션 resume/fork | 장기 PDCA 세션의 연속성 보장 | R-1 Section 9 |

---

## 3. bkit-claude-code vs bkit-codex 기능 갭 분석

### 3.1 Feature Coverage Matrix (ALL 174+ files)

bkit-claude-code v1.5.5의 전체 174+ 파일에 대한 포팅 상태 매트릭스 (R-4 전체, R-5 Section 10):

#### 3.1.1 Skills Coverage (27 -> 26)

| # | Skill | Category | bkit-claude-code | bkit-codex | Status |
|---|-------|----------|:----------------:|:----------:|:------:|
| 1 | bkit-rules | Core | 8,863B | Ported | COMPLETE |
| 2 | pdca | Core | 16,406B | Ported | COMPLETE |
| 3 | bkit-templates | Core | 4,763B | Ported | COMPLETE |
| 4 | plan-plus | Core | 7,505B | **NOT PORTED** | **GAP** |
| 5 | starter | Level | 7,507B | Ported | COMPLETE |
| 6 | dynamic | Level | 11,466B | Ported | COMPLETE |
| 7 | enterprise | Level | 13,166B | Ported | COMPLETE |
| 8 | development-pipeline | Pipeline | 4,770B | Ported | COMPLETE |
| 9 | phase-1-schema | Pipeline | 4,531B | Ported | COMPLETE |
| 10 | phase-2-convention | Pipeline | 15,835B | Ported | COMPLETE |
| 11 | phase-3-mockup | Pipeline | 8,398B | Ported | COMPLETE |
| 12 | phase-4-api | Pipeline | 7,698B | Ported | COMPLETE |
| 13 | phase-5-design-system | Pipeline | 13,789B | Ported | COMPLETE |
| 14 | phase-6-ui-integration | Pipeline | 18,453B | Ported | COMPLETE |
| 15 | phase-7-seo-security | Pipeline | 10,449B | Ported | COMPLETE |
| 16 | phase-8-review | Pipeline | 16,856B | Ported | COMPLETE |
| 17 | phase-9-deployment | Pipeline | 12,182B | Ported | COMPLETE |
| 18 | code-review | Quality | 3,373B | Ported | COMPLETE |
| 19 | zero-script-qa | Quality | 17,601B | Ported | COMPLETE |
| 20 | desktop-app | Platform | 14,322B | Ported | COMPLETE |
| 21 | mobile-app | Platform | 12,348B | Ported | COMPLETE |
| 22 | bkend-quickstart | BaaS | 5,446B | Ported | COMPLETE |
| 23 | bkend-auth | BaaS | 4,359B | Ported | COMPLETE |
| 24 | bkend-data | BaaS | 5,458B | Ported | COMPLETE |
| 25 | bkend-storage | BaaS | 4,077B | Ported | COMPLETE |
| 26 | bkend-cookbook | BaaS | 4,164B | Ported | COMPLETE |
| 27 | claude-code-learning | Learning | 6,331B | codex-learning (신규) | REPLACED |

**Skills Coverage**: 26/27 ported (96.3%) + 1 new (codex-learning) = **실효 Coverage 96.3%**

#### 3.1.2 Agent Coverage (16 -> 0)

| # | Agent | Model | Role | bkit-codex Status |
|---|-------|-------|------|:-----------------:|
| 1 | cto-lead | opus | Team orchestrator | **NOT PORTED** |
| 2 | code-analyzer | opus | Code quality | **NOT PORTED** |
| 3 | gap-detector | opus | Gap analysis | **NOT PORTED** |
| 4 | design-validator | opus | Design check | **NOT PORTED** |
| 5 | enterprise-expert | opus | Architecture | **NOT PORTED** |
| 6 | infra-architect | opus | Infrastructure | **NOT PORTED** |
| 7 | security-architect | opus | Security | **NOT PORTED** |
| 8 | bkend-expert | sonnet | BaaS platform | **NOT PORTED** |
| 9 | frontend-architect | sonnet | UI/UX | **NOT PORTED** |
| 10 | pdca-iterator | sonnet | Iteration cycles | **NOT PORTED** |
| 11 | pipeline-guide | sonnet | Pipeline guidance | **NOT PORTED** |
| 12 | product-manager | sonnet | Requirements | **NOT PORTED** |
| 13 | qa-strategist | sonnet | Test strategy | **NOT PORTED** |
| 14 | starter-guide | sonnet | Beginner guidance | **NOT PORTED** |
| 15 | report-generator | haiku | Reports | **NOT PORTED** |
| 16 | qa-monitor | haiku | Docker log QA | **NOT PORTED** |

**Agent Coverage: 0/16 (0.0%)** -- 완전 미포팅

**사유**: Codex CLI에는 bkit-claude-code의 Agent 개념과 1:1 대응하는 기능이 없다. Codex의 멀티에이전트 시스템(features.multi_agent = true)은 실험적 기능이며, 역할 기반 에이전트 구성(agents.reviewer, agents.explorer 등)이 가능하지만 (R-1 Section 11.3), bkit-claude-code의 agent frontmatter 방식(model, permission, memory, skills 선언)과는 구조적으로 다르다.

#### 3.1.3 Hooks Coverage (13 events -> 0)

| # | Hook Event | Scripts | bkit-codex 대체 |
|---|-----------|---------|:--------------:|
| 1 | SessionStart | session-start.js | bkit_init MCP 도구 (~95%) |
| 2 | PreToolUse(Write/Edit) | pre-write.js | bkit_pre_write_check MCP (~80%) |
| 3 | PreToolUse(Bash) | unified-bash-pre.js | AGENTS.md 규칙 (~70%) |
| 4 | PostToolUse(Write) | unified-write-post.js | bkit_post_write MCP (~75%) |
| 5 | PostToolUse(Bash) | unified-bash-post.js | AGENTS.md 규칙 (~70%) |
| 6 | PostToolUse(Skill) | skill-post.js | AGENTS.md 규칙 (~60%) |
| 7 | Stop | unified-stop.js | bkit_complete_phase MCP (~80%) |
| 8 | UserPromptSubmit | user-prompt-handler.js | bkit_analyze_prompt MCP (~85%) |
| 9 | PreCompact | context-compaction.js | **없음** (~0%) |
| 10 | TaskCompleted | pdca-task-completed.js | AGENTS.md 규칙 (~50%) |
| 11 | SubagentStart | subagent-start-handler.js | **없음** (~0%) |
| 12 | SubagentStop | subagent-stop-handler.js | **없음** (~0%) |
| 13 | TeammateIdle | team-idle-handler.js | **없음** (~0%) |

**Hooks Coverage: MCP 도구로 8/13 이벤트 부분 대체 (61.5%), 완전 대체 0/13 (0.0%)**

#### 3.1.4 Templates Coverage (28 -> 27+)

| Category | Count | Ported | Status |
|----------|:-----:|:------:|:------:|
| Root Templates (PDCA) | 14 | 13+ | ~93% |
| Pipeline Templates | 10 | 10 | 100% |
| Shared Templates | 4 | 4 | 100% |
| **Total** | **28** | **27+** | **~96%** |

**Templates Coverage: ~96%** -- CLAUDE.template.md -> AGENTS.template.md 변환 포함

#### 3.1.5 Lib Modules Coverage (35 files -> 14 files)

| Module Group | Files (cc) | Files (codex) | Functions (cc) | Functions (codex) | Coverage |
|-------------|:----------:|:-------------:|:--------------:|:-----------------:|:--------:|
| core/ | 7 | 4 | ~45 | ~20 | 44% |
| pdca/ | 6 | 5 | ~60 | ~30 | 50% |
| intent/ | 4 | 3 | ~35 | ~15 | 43% |
| task/ | 5 | 2 | ~30 | ~10 | 33% |
| team/ | 9 | 0 | ~50 | 0 | 0% |
| Root modules | 7 | 0 | ~21 | 0 | 0% |
| **Total** | **38** | **14** | **~241** | **~75** | **31%** |

**Lib Coverage: 14/38 files (36.8%), ~75/241 functions (31.1%)**

**핵심 미포팅 모듈:**
- `lib/team/` (9 files, 48KB): Team 오케스트레이션 전체
- `lib/skill-orchestrator.js` (14KB): 스킬 라이프사이클 관리
- `lib/context-fork.js` (5.7KB): 컨텍스트 포킹
- `lib/context-hierarchy.js` (6.9KB): CLAUDE.md 계층 관리 -> AGENTS.md로 네이티브 대체
- `lib/memory-store.js` (3.6KB): 에이전트 메모리 -> MCP 도구로 대체
- `lib/permission-manager.js` (5KB): 권한 관리 -> Codex 네이티브 대체

#### 3.1.6 Scripts Coverage (45 -> MCP 서버로 통합)

| Script Category | Count (cc) | MCP Tool Equivalent | Coverage |
|----------------|:----------:|:-------------------:|:--------:|
| Unified Hooks | 5 | 5 MCP 도구 | 80% |
| PDCA Scripts | 5 | 4 MCP 도구 | 75% |
| Agent-Specific | 12 | 0 (에이전트 미포팅) | 0% |
| Pipeline Phase | 13 | SKILL.md 내 규칙 | 60% |
| Team Scripts | 4 | 0 (팀 미포팅) | 0% |
| Utility Scripts | 6 | 2 MCP 도구 | 33% |
| **Total** | **45** | **16 MCP 도구** | **~40%** |

#### 3.1.7 기타 Coverage

| Component | cc Count | codex Count | Coverage |
|-----------|:--------:|:-----------:|:--------:|
| Output Styles | 4 | AGENTS.md 규칙 | ~60% |
| Commands | 3 | Skill 기반 | ~67% |
| bkit-system docs | 14 | Symlink | 100% |
| bkit.config.json | 1 | 1 | 100% |
| **CI/CD Workflows** | 0 | 4 | bkit-codex 추가 |

### 3.2 Skills Gap Analysis (27 Skills)

bkit-claude-code의 27개 Skills에 대한 상세 갭 분석 (R-4 Section 1):

#### 3.2.1 포팅 완료 Skills (25/27)

**Core Skills (3/4):**
- bkit-rules (8,863B): AGENTS.md 규칙 + 26개 SKILL.md에 분산 -> COMPLETE
- pdca (16,406B): PDCA 라이프사이클 전체 -> COMPLETE (MCP 도구 4개로 보강)
- bkit-templates (4,763B): 템플릿 관리 -> COMPLETE

**Level Skills (3/3):**
- starter (7,507B), dynamic (11,466B), enterprise (13,166B) -> ALL COMPLETE

**Pipeline Skills (10/10):**
- phase-1 through phase-9 + development-pipeline -> ALL COMPLETE

**BaaS Skills (5/5):**
- bkend-quickstart/auth/data/storage/cookbook -> ALL COMPLETE

**Quality Skills (2/2):**
- code-review (3,373B), zero-script-qa (17,601B) -> ALL COMPLETE

**Platform Skills (2/2):**
- desktop-app (14,322B), mobile-app (12,348B) -> ALL COMPLETE

**Learning (1/1):**
- claude-code-learning -> codex-learning으로 재작성 -> REPLACED

#### 3.2.2 미포팅 Skills (1/27)

**plan-plus (7,505B)**: Brainstorming-enhanced PDCA 계획 수립 스킬

| 속성 | 값 |
|------|-----|
| 크기 | 7,505B |
| User-Invocable | Yes (`/plan-plus feature-name`) |
| 프로세스 | 6단계 (Context Exploration -> Intent Discovery -> Alternatives -> YAGNI -> Incremental Validation -> Document Generation) |
| 핵심 가치 | HARD-GATE (승인 전 코드 금지), One-Question-at-a-Time, 2-3개 대안 비교, YAGNI 검증 |
| 의존성 | plan-plus.template.md, AskUserQuestion tool |
| 갭 심각도 | **Medium** |

**plan-plus 미포팅 사유**: R-5 Section 10.1에서 "27th skill not ported (possibly plan-plus)"로 확인. 이 스킬은 사용자 대화형 브레인스토밍을 필요로 하며, Codex의 Plan mode와 일부 중복될 수 있어 우선순위가 낮게 책정된 것으로 추정된다.

#### 3.2.3 Codex 신규 Skills (1)

**codex-learning**: Codex CLI 학습 및 최적화 가이드 (bkit-claude-code에는 없음)
- Codex 플랫폼 특화 컨텐츠: AGENTS.md 작성법, config.toml 설정, MCP 서버 관리, Skills 시스템 활용법
- claude-code-learning의 Codex 적응 버전

### 3.3 Agents Gap Analysis (16 Agents)

bkit-claude-code의 16개 Agents는 전부 미포팅 상태이다 (R-5 Section 10.1 #1, #3). 이는 단순한 누락이 아닌 **아키텍처적 불가능성**에 기인한다.

#### 3.3.1 Agent 아키텍처 비교

| 속성 | bkit-claude-code Agent | Codex Multi-Agent |
|------|:---------------------:|:------------------:|
| 정의 방식 | `.claude/agents/*.md` (frontmatter + 지시) | `config.toml [agents.*]` + 별도 .toml |
| 모델 지정 | `model: opus/sonnet/haiku` | `model = "gpt-5.3-codex"` |
| 권한 모드 | `allowedTools` (plan/acceptEdits) | `sandbox_mode` (read-only/workspace-write) |
| 메모리 | `memory: project/user` | 세션 기반 (별도 메모리 없음) |
| 스킬 연결 | `skills: [skill1, skill2]` | 별도 지시사항에서 참조 |
| 컨텍스트 포크 | `context: fork` | 서브에이전트 자동 포크 |
| 호출 방식 | Task tool (다른 에이전트에서 위임) | 자동 생성 (모델이 결정) |
| 성숙도 | Production (v1.5.5) | Experimental |

#### 3.3.2 Agent 역할별 포팅 전략

| Agent | Model | bkit-codex 전략 | 타임라인 |
|-------|-------|----------------|---------|
| cto-lead | opus | Codex multi-agent 안정화 후 leader 역할 매핑 | P3 (장기) |
| gap-detector | opus | SKILL.md + bkit_pdca_analyze MCP 도구로 기능 흡수 | P1 (중기) |
| pdca-iterator | sonnet | bkit_pdca_next MCP 도구로 이터레이션 로직 흡수 | P1 (중기) |
| code-analyzer | opus | code-review SKILL.md로 지시 통합 | P2 (중기) |
| report-generator | haiku | bkit_complete_phase MCP 도구로 흡수 | P2 (중기) |
| pipeline-guide | sonnet | 각 phase SKILL.md에 가이드 지시 통합 | COMPLETE |
| starter-guide | sonnet | starter SKILL.md에 가이드 지시 통합 | COMPLETE |
| 나머지 9개 | 혼합 | Codex multi-agent 안정화 대기 | P3 (장기) |

#### 3.3.3 Agent 기능의 SKILL.md 흡수 현황

bkit-claude-code에서 에이전트가 수행하던 핵심 기능 중 일부는 이미 SKILL.md의 지시사항으로 흡수되었다:

| Agent 기능 | 흡수 대상 | 흡수율 |
|-----------|----------|:------:|
| pipeline-guide의 9단계 가이드 | phase-1~9 SKILL.md | 90% |
| starter-guide의 초보자 가이드 | starter SKILL.md | 85% |
| gap-detector의 갭 분석 | pdca SKILL.md + bkit_pdca_analyze | 60% |
| code-analyzer의 코드 분석 | code-review SKILL.md | 70% |
| report-generator의 보고서 생성 | pdca SKILL.md + bkit_complete_phase | 50% |
| cto-lead의 팀 오케스트레이션 | **미흡수** | 0% |
| pdca-iterator의 자동 이터레이션 | bkit_pdca_next (부분) | 40% |

### 3.4 Hooks System Gap Analysis

bkit-claude-code의 Hooks 시스템은 프로젝트의 핵심 차별화 요소이다 (R-4 Section 3). 13개 훅 이벤트, 45개 Node.js 스크립트, ~155KB의 로직이 PDCA 라이프사이클 전반을 자동화한다.

#### 3.4.1 Hook Event별 대체 분석

**P0 Critical Hooks:**

| Hook | 기능 | bkit-codex 대체 | 자동화 수준 |
|------|------|----------------|:-----------:|
| SessionStart | 레벨 감지, PDCA 초기화, 컨텍스트 설정, 메모리 초기화, bkend MCP 감지 (R-4 Section 3.2) | bkit_init MCP 도구 (AGENTS.md에서 "ALWAYS call bkit_init first" 지시) | ~95% |
| UserPromptSubmit | 인텐트 감지, 스킬/에이전트 트리거 매칭 (R-4 Section 3.3) | bkit_analyze_prompt MCP 도구 | ~85% |
| Stop | PDCA 상태 저장, 피처 사용 보고서 생성 (R-4 Section 3.3) | bkit_complete_phase MCP 도구 | ~80% |

**P1 Important Hooks:**

| Hook | 기능 | bkit-codex 대체 | 자동화 수준 |
|------|------|----------------|:-----------:|
| PreToolUse(Write/Edit) | 쓰기 유효성 검증, 안전 검사 (R-4 Section 3.1) | bkit_pre_write_check MCP 도구 | ~80% |
| PostToolUse(Write) | PDCA 상태 업데이트, 파일 추적 (R-4 Section 3.1) | bkit_post_write MCP 도구 | ~75% |
| PostToolUse(Bash) | Bash 실행 결과 처리 (R-4 Section 3.1) | AGENTS.md 규칙 | ~70% |
| TaskCompleted | PDCA 페이즈 자동 진행 (R-4 Section 3.3) | AGENTS.md 규칙 | ~50% |

**P2 Missing Hooks (대체 불가):**

| Hook | 기능 | bkit-codex 상태 | 영향 |
|------|------|:---------------:|------|
| PreCompact | 컨텍스트 스냅샷, 정보 손실 방지 (R-4 Section 3.3) | **없음** | 장기 세션에서 PDCA 상태 손실 위험 |
| SubagentStart | 팀 코디네이션 설정 (R-4 Section 3.1) | **없음** | 멀티에이전트 워크플로우 불가 |
| SubagentStop | 팀 정리 (R-4 Section 3.1) | **없음** | 멀티에이전트 워크플로우 불가 |
| TeammateIdle | 팀 유휴 상태 처리 (R-4 Section 3.1) | **없음** | 멀티에이전트 워크플로우 불가 |
| PostToolUse(Skill) | 스킬 완료 후처리 (R-4 Section 3.1) | AGENTS.md 규칙 | ~60% |
| PreToolUse(Bash) | Bash 실행 전 안전 검사 (R-4 Section 3.1) | AGENTS.md 규칙 | ~70% |

#### 3.4.2 Codex Hooks 시스템 전망

Codex 커뮤니티에서 Hooks는 가장 많은 반응을 받은 기능 요청이다 (R-3 Section 3.4):

| 이슈 | Reactions | 상태 |
|------|:---------:|:----:|
| #2109 Event Hooks | 418+ thumbs up, 97 rocket | OPEN |
| #11912 Custom compaction hook | - | OPEN |
| #12190 Governance hooks | - | OPEN |
| #12208 PreCompact hook event | - | CLOSED (구현 신호?) |
| #11870 Interception hooks | - | CLOSED |
| #7719 Support Hooks (general) | - | CLOSED |

여러 훅 관련 이슈가 CLOSED 되고 있어 OpenAI가 훅 시스템을 구현 중일 가능성이 높다. 이는 bkit-codex에 중요한 기회이다 -- Codex 네이티브 훅이 출시되면 hook-driven 자동화를 복원할 수 있다.

### 3.5 Commands/Templates/Lib Modules Gap

#### 3.5.1 Commands Gap (3 -> Skill 기반)

| Command | bkit-claude-code | bkit-codex | Status |
|---------|:----------------:|:----------:|:------:|
| /bkit (8,277B) | 도움말/디스커버리 | Skill 기반 | PARTIAL |
| /github-stats (12,404B) | GitHub 통계 수집 | 미구현 | GAP |
| /output-style-setup (1,867B) | 출력 스타일 설치 | AGENTS.md 규칙 | REPLACED |

#### 3.5.2 Templates Gap

| Template Type | cc Count | codex Count | Gap |
|--------------|:--------:|:-----------:|:---:|
| Plan templates | 2 | 2 | None |
| Design templates | 3 | 3 | None |
| Do template | 1 | 1 | None |
| Analysis template | 1 | 1 | None |
| Report templates | 2 | 2 | None |
| Schema/Convention | 2 | 2 | None |
| CLAUDE/AGENTS template | 1 | 1 (변환) | None |
| Index template | 1 | 1 | None |
| Template Guide | 1 | 1 | None |
| Pipeline templates | 10 | 10 | None |
| Shared templates | 4 | 4 | None |
| **Total** | **28** | **28** | **None** |

Templates는 **100% 포팅 완료**이다.

#### 3.5.3 Lib Modules Gap (상세)

| Module | cc Size | codex Size | 핵심 미포팅 함수 |
|--------|--------:|-----------:|----------------|
| **lib/team/** | 48,599B | 0B | coordinator, orchestrator, cto-logic, strategy, communication, state-writer, task-queue, hooks, index |
| **lib/pdca/status.js** | 19,663B | ~8,000B | archive 관리, cleanup, feature limit (50) 일부 |
| **lib/skill-orchestrator.js** | 14,353B | 0B | getAgentForAction, skill lifecycle, fork config |
| **lib/intent/language.js** | 9,233B | ~4,000B | 8언어 일부 단순화 |
| **lib/context-fork.js** | 5,723B | 0B | 컨텍스트 포킹 전체 |
| **lib/context-hierarchy.js** | 6,948B | 0B | AGENTS.md 네이티브로 대체 |
| **lib/memory-store.js** | 3,649B | MCP 도구 | bkit_memory_read/write로 대체 |
| **lib/permission-manager.js** | 5,070B | 0B | Codex 네이티브 보안으로 대체 |

### 3.6 CTO Team & Agent Teams Gap

bkit-claude-code의 CTO Team 기능은 가장 복잡하고 가장 큰 미포팅 영역이다 (R-4 Section 11, R-5 Section 10.1 #1).

#### 3.6.1 Team 아키텍처 비교

```
bkit-claude-code Team System:
  cto-lead (opus) orchestrates 10 agents
  5 Orchestration Patterns: Leader, Council, Swarm, Pipeline, Watchdog
  lib/team/ (48,599B, 9 files)
  Team hooks: SubagentStart, SubagentStop, TeammateIdle
  Dynamic composition: 3 teammates / Enterprise: 5 teammates
  Quality Gates: Plan -> Design -> Do -> Check (90%) -> Report

bkit-codex Team System:
  (NOT IMPLEMENTED)
  Codex multi_agent is experimental
  No orchestration patterns
  No team hooks
  No quality gates
```

#### 3.6.2 Team 기능 의존성 체인

```
CTO Team 기능
  ├── lib/team/coordinator.js (팀 라이프사이클) -- 미포팅
  ├── lib/team/orchestrator.js (패턴 구현) -- 미포팅
  ├── lib/team/cto-logic.js (CTO 의사결정) -- 미포팅
  ├── lib/team/strategy.js (전략 생성) -- 미포팅
  ├── lib/team/communication.js (에이전트 메시징) -- 미포팅
  ├── lib/team/state-writer.js (상태 영속화) -- 미포팅
  ├── lib/team/task-queue.js (태스크 큐) -- 미포팅
  ├── lib/team/hooks.js (팀 훅 핸들러) -- 미포팅
  ├── SubagentStart hook -- 미포팅
  ├── SubagentStop hook -- 미포팅
  ├── TeammateIdle hook -- 미포팅
  ├── 16 Agent definitions -- 미포팅
  └── Agent-specific scripts (12) -- 미포팅
```

**총 미포팅 규모**: 9 lib files + 16 agents + 3 hooks + 12 scripts = 40 components, ~190KB

#### 3.6.3 Codex Multi-Agent 매핑 가능성

Codex의 멀티에이전트 시스템이 안정화되면 다음 매핑이 가능하다 (R-1 Section 11):

| bkit-claude-code | Codex Multi-Agent | 매핑 난이도 |
|-----------------|-------------------|:-----------:|
| cto-lead | `[agents.leader]` + developer_instructions | Medium |
| gap-detector | `[agents.reviewer]` (read-only) | Low |
| code-analyzer | `[agents.reviewer]` | Low |
| pdca-iterator | Custom agent + PDCA 지시 | Medium |
| enterprise-expert | `[agents.architect]` | Medium |
| 나머지 11 agents | Custom agents 또는 SKILL.md 흡수 | High |

### 3.7 Plan-Plus Gap

plan-plus는 bkit-claude-code v1.5.5의 핵심 Core 스킬 중 하나로, 미포팅 상태이다 (R-4 Section 12, R-5 Section 10.1 #6).

#### 3.7.1 Plan-Plus 프로세스 상세

```
Phase 0: Context Exploration (자동)
  - CLAUDE.md(AGENTS.md) 읽기
  - git 커밋 히스토리 확인
  - 기존 문서 스캔
  ↓
Phase 1: Intent Discovery
  - AskUserQuestion으로 1개씩 질문
  - Core Purpose → Target Users → Success Criteria → Constraints
  ↓
Phase 2: Alternatives Exploration
  - 2-3개 접근법 제시
  - Tradeoffs 분석
  ↓
Phase 3: YAGNI Review
  - multiSelect으로 필수 기능 검증
  - 불필요 기능 제거
  ↓
Phase 4: Incremental Design Validation
  - 섹션별 승인
  ↓
Phase 5: Plan Document Generation
  - plan-plus.template.md 사용
```

#### 3.7.2 Plan-Plus 포팅 전략

| 옵션 | 설명 | 난이도 | 권장 |
|------|------|:------:|:----:|
| A: SKILL.md 포팅 | plan-plus SKILL.md + references/ + openai.yaml | Low | **권장** |
| B: MCP 도구 추가 | bkit_plan_plus MCP 도구 추가 | Medium | 선택 |
| C: Codex Plan Mode 통합 | Codex의 /plan 명령과 통합 | Medium | 향후 |

**권장**: 옵션 A (SKILL.md 직접 포팅)가 가장 낮은 비용으로 가장 높은 효과를 제공한다. plan-plus.template.md는 이미 포팅되어 있으므로, SKILL.md만 추가하면 된다.

### 3.8 Output Styles Gap

bkit-claude-code의 4개 Output Styles (R-4 Section 8):

| Style | 크기 | 대상 레벨 | bkit-codex 상태 |
|-------|-----:|----------|:--------------:|
| bkit-learning | 1,709B | Starter | AGENTS.md 규칙으로 대체 |
| bkit-pdca-guide | 1,637B | Dynamic | AGENTS.md 규칙으로 대체 |
| bkit-enterprise | 2,511B | Enterprise | AGENTS.md 규칙으로 대체 |
| bkit-pdca-enterprise | 1,346B | Enterprise | AGENTS.md 규칙으로 대체 |

**현재 상태**: Output Styles의 핵심 규칙(응답 형식, 학습 포인트, PDCA 배지, 트레이드오프 분석 등)은 AGENTS.md 규칙과 각 SKILL.md의 지시사항에 분산 통합되었다. 다만, 전용 스타일 파일의 엄격한 형식 강제력(100%)에 비해 AGENTS.md 규칙의 강제력(~60%)은 낮다.

---

## 4. Codex 커뮤니티 요구사항 vs bkit 기능 매핑

### 4.1 High-Priority Community Requests와 bkit Features 매핑

R-3의 커뮤니티 분석 결과를 bkit-codex/bkit-claude-code의 기능과 직접 매핑한다.

| 커뮤니티 요구 | 이슈 # | Reactions | bkit 기능 | 매핑 강도 |
|-------------|--------|:---------:|----------|:--------:|
| Event Hooks | #2109 | 418+ | bkit-claude-code hooks (13 events) | **Strong** |
| Subagent Support | #2604 | 315+ | bkit-claude-code agents (16 agents) + team (9 modules) | **Strong** |
| Plugin System | #8512 | 47 | bkit install 시스템 | **Strong** |
| Long-term Memory | #8368 | 12 | bkit memory store (.bkit-memory.json) | **Medium** |
| Dynamic AGENTS.md | #12115 | - | bkit context hierarchy | **Medium** |
| AGENTS.md variants | #10067 | - | bkit level detection (Starter/Dynamic/Enterprise) | **Medium** |
| Lazy MCP load | #9266 | 7 | bkit MCP 설정 관리 | **Weak** |
| Governance hooks | #12190 | - | bkit PDCA audit trail | **Strong** |
| Custom compaction | #11912 | - | bkit PreCompact hook (cc only) | **Strong** |
| Include files in AGENTS.md | #6038 | 6 | bkit context rules, import resolver | **Medium** |

**핵심 발견**: bkit-claude-code의 기능 중 Hooks(#2109), Subagent(#2604), Plugin System(#8512)은 Codex 커뮤니티에서 가장 높은 수요를 보이는 기능과 직접 대응한다. 이는 bkit이 Codex 에코시스템에서 유의미한 가치를 제공할 수 있는 강력한 근거이다.

### 4.2 Plugin System (#8512) vs bkit Architecture

#### 4.2.1 커뮤니티 요구사항

#8512 (47 thumbs up): "Implement Codex Plugins same as Claude Plugins"
- 스킬, 규칙, AGENTS.md 설정을 공유 가능한 패키지로 묶어 배포
- `codex plugin install <git-url>`로 설치
- 팀 내 일관된 Codex 설정 공유

#9613: Concrete MVP proposal
- `codex plugin install <git-url>` 형태
- skill/prompt/MCP 서버 자동 설정(materialization)
- 플러그인 간 의존성 관리

#8925 (18 thumbs up): Plugin marketplace request
- Claude Code에서 Codex로 마이그레이션한 사용자들이 확장성 부재를 지적

#### 4.2.2 bkit의 Plugin Architecture

bkit-codex의 설치 시스템은 커뮤니티가 요구하는 플러그인 시스템과 구조적으로 유사하다:

```
bkit install (install.sh/install.ps1):
  1. Git clone -> .bkit-codex/ (core package)
  2. Symlink .agents/skills/ -> .bkit-codex/.agents/skills/ (26 skills)
  3. AGENTS.md 생성/업데이트 (해시 비교 기반)
  4. MCP 서버 설정 (.codex/config.toml)
  5. PDCA 디렉토리 구조 생성 (docs/01-plan ~ 04-report)
  6. .gitignore 업데이트
  7. 유효성 검증 (symlink, MCP, config, AGENTS.md)
```

| 커뮤니티 요구 (Plugin) | bkit 구현 | 매핑 |
|-----------------------|----------|:----:|
| `codex plugin install <url>` | `curl install.sh \| bash` | Direct |
| Skill 배포 | 26 skills via symlink | Direct |
| MCP 서버 설정 | config.toml 자동 생성 | Direct |
| 설정 공유 | AGENTS.md + config | Direct |
| 의존성 관리 | Node.js v18+ 체크, npm 불필요 | Partial |
| 마켓플레이스 | GitHub repository | Partial |
| Uninstall | install.sh --uninstall | Direct |
| Update detection | Hash 비교 기반 | Direct |

**결론**: bkit의 install 시스템은 Codex 커뮤니티가 요구하는 플러그인 시스템의 선행 구현(先行 구현)이다. 공식 플러그인 시스템이 출시되면 호환되도록 적응할 필요가 있다.

### 4.3 Event Hooks (#2109) vs bkit Hooks

#### 4.3.1 커뮤니티 요구 규모

Event Hooks는 Codex 저장소에서 **가장 많은 반응을 받은 기능 요청**이다:
- #2109: 418+ THUMBS_UP, 97 ROCKET, 35 EYES, 45 comments
- 관련 이슈: #11912, #12190, #12208, #11870, #7719

#### 4.3.2 bkit-claude-code의 Hooks 구현 vs 커뮤니티 요구

| 커뮤니티 요구 훅 | bkit-claude-code 구현 | Codex 공식 | 상태 |
|----------------|:--------------------:|:---------:|:----:|
| Pre/Post command execution | PreToolUse, PostToolUse | 없음 | bkit 선행 |
| Custom compaction strategies | PreCompact | 없음 | bkit 선행 |
| Enterprise governance | Stop (감사 보고서) | 없음 | bkit 선행 |
| External system integration | Stop (기능 사용 보고서) | notify (1개만) | bkit 우위 |
| Tool result interception | PostToolUse(Write/Bash) | 없음 | bkit 선행 |
| Subagent lifecycle | SubagentStart/Stop | 없음 | bkit 선행 |
| Task completion | TaskCompleted | 없음 | bkit 선행 |

**전략적 시사점**: bkit-claude-code는 Codex 커뮤니티가 가장 강력히 원하는 기능을 이미 Claude Code 플랫폼에서 구현한 경험이 있다. Codex 네이티브 훅 시스템이 출시되면, 이 경험을 기반으로 빠르게 마이그레이션할 수 있다.

### 4.4 Subagent Support (#2604) vs bkit Agent Teams

#### 4.4.1 커뮤니티 요구 규모

#2604: 315+ THUMBS_UP, 46 HEART, 41 ROCKET, 100+ comments

관련 이슈:
- #12047: Multi-agent TUI overhaul (named agents, per-agent config, @mention)
- #12335: Auto lifecycle cleanup
- #12431: Parent decides full history for sub-agent
- #10204: Different tools per sub-agent
- #9912: Configurable max recursion depth

#### 4.4.2 bkit의 Agent Teams vs Codex Multi-Agent

| 기능 | bkit-claude-code Agent Teams | Codex Multi-Agent (실험적) |
|------|:---------------------------:|:------------------------:|
| 에이전트 수 | 16 전문 에이전트 | 기본 3 (default/worker/explorer) |
| 역할 정의 | agent .md frontmatter | config.toml [agents.*] |
| 오케스트레이션 | 5 패턴 (Leader/Council/Swarm/Pipeline/Watchdog) | 자동 (모델 결정) |
| 모델 차등화 | opus/sonnet/haiku | 커스텀 가능 |
| 권한 차등화 | plan(read-only)/acceptEdits | sandbox_mode per agent |
| 메모리 범위 | project/user | 세션 기반 |
| 라이프사이클 훅 | SubagentStart/Stop/Idle | 없음 |
| 상태 관리 | state-writer.js (10KB) | 기본 |
| 태스크 큐 | task-queue.js | 없음 |

**분석**: bkit-claude-code의 Agent Teams는 Codex 커뮤니티가 요구하는 멀티에이전트 기능보다 훨씬 성숙한 구현이다. 다만, Codex 플랫폼의 멀티에이전트 지원이 실험적이므로, 직접 포팅보다는 Codex의 진화를 추적하면서 점진적으로 통합하는 전략이 적절하다.

### 4.5 Market Positioning Opportunity

#### 4.5.1 Codex 에코시스템에서의 bkit 포지션

```
Codex Ecosystem Gaps:

  [Plugin System]  <---- bkit install 시스템이 이 갭을 채움
       |
  [Event Hooks]    <---- bkit hooks 경험이 Codex 훅 출시 시 활용 가능
       |
  [Context Mgmt]   <---- bkit PDCA + MCP 도구가 구조화된 접근 제공
       |
  [Agent Teams]    <---- bkit Team 시스템이 참조 구현(reference implementation)
       |
  [Governance]     <---- bkit PDCA audit trail이 엔터프라이즈 수요 충족
```

#### 4.5.2 시장 기회 정량화

| 기회 영역 | 커뮤니티 수요 (reactions) | bkit 준비도 | 경쟁 상황 | 시장 기회 |
|----------|:------------------------:|:----------:|:---------:|:--------:|
| Plugin/Install | 65+ (#8512 + #8925) | 높음 (구현 완료) | 공식 없음 | **높음** |
| Hooks | 418+ (#2109) | 높음 (cc 경험) | 개발 중 | **높음** (선점) |
| Context Engineering | 50+ (다수 이슈 합산) | 중간 (MCP 도구) | 기본 | **중간** |
| Multi-Agent | 315+ (#2604) | 높음 (cc 구현) | 실험적 | **중간** (진화 대기) |
| Enterprise/Governance | 18+ (#12190 등) | 중간 (PDCA) | 없음 | **높음** |
| Long-term Memory | 12+ (#8368) | 중간 (MCP 도구) | 없음 | **낮음** |

---

## 5. 기술적 리스크 및 의존성 분석

### 5.1 Platform Architecture Risks

#### 5.1.1 Hook-to-Instruction 패러다임 전환 리스크

| 리스크 | 심각도 | 발생 확률 | 영향 |
|--------|:------:|:---------:|------|
| AI가 bkit_init 호출을 스킵 | Medium | 5% | PDCA 상태 미초기화 |
| AI가 bkit_pre_write_check 스킵 | Medium | 20% | 안전 검사 우회 |
| AI가 bkit_complete_phase 스킵 | High | 20% | 페이즈 전환 미기록 |
| AI가 bkit_post_write 스킵 | Medium | 25% | 파일 변경 미추적 |
| Compaction에서 PDCA 상태 손실 | High | 15% | 장기 세션 중단 |
| AI가 AGENTS.md 규칙 무시 | Low | 10% | 전반적 품질 저하 |

**완화 전략:**
1. AGENTS.md에서 "ALWAYS", "MUST", "NEVER" 등 강한 명령어 사용 (현재 적용 중)
2. 핵심 도구(bkit_init, bkit_complete_phase)에 대한 반복 강조
3. PDCA 상태를 .pdca-status.json에 파일로 영속화하여 compaction 저항성 확보 (현재 적용 중)
4. Codex 네이티브 훅 시스템 출시 시 즉각 마이그레이션

#### 5.1.2 MCP 서버 안정성 리스크

| 리스크 | 심각도 | 발생 확률 | 영향 |
|--------|:------:|:---------:|------|
| MCP 서버 초기화 실패 | High | 5% | 전체 bkit 기능 불가 |
| MCP 도구 호출 타임아웃 | Medium | 10% | 개별 기능 실패 |
| MCP 서버 연결 끊김 | Medium | 5% | 세션 중단 |
| MCP 프로토콜 버전 불일치 | Low | 5% | 호환성 문제 |

현재 config.toml 설정 (R-5 Section 3.4):
```toml
startup_timeout_sec = 10
tool_timeout_sec = 60
required = true
```

`required = true` 설정으로 MCP 서버 초기화 실패 시 Codex 시작이 중단된다. 이는 "silent failure" 리스크를 방지하지만, MCP 서버 문제 시 Codex 자체를 사용할 수 없게 되는 리스크가 있다.

**완화 전략:**
1. MCP 서버의 zero-dependency 아키텍처 유지 (Node.js 표준 라이브러리만 사용)
2. 헬스 체크 (JSON-RPC initialize 요청) 가 설치 시 자동 실행
3. 타임아웃 설정의 적정성 모니터링

#### 5.1.3 Node.js 런타임 의존성 리스크

Codex CLI는 제로 의존성 (Rust 네이티브)이지만, bkit-codex MCP 서버는 Node.js v18+를 필요로 한다 (R-5 Section 3.3).

| 시나리오 | 리스크 수준 |
|---------|:----------:|
| 개발 머신 (Node.js 설치됨) | Low |
| CI/CD 환경 (Node.js 가변) | Medium |
| 엣지 케이스 (Node.js 미설치) | High |

**현재 완화**: install.sh에서 Node.js 존재 여부 검사 + npm install 불필요 (pure Node.js)

### 5.2 Codex Evolution Risks (Breaking Changes)

#### 5.2.1 빠른 릴리스 주기

R-1 Section 15.1에 따르면, 2026년 2월만 해도 CLI 0.99.0 -> 0.104.0 (1주일에 5개 릴리스)의 빠른 진화가 관찰된다.

| 진화 영역 | 변경 빈도 | bkit 영향도 | 추적 필요도 |
|----------|:---------:|:----------:|:----------:|
| Skills API (codex-skills crate) | 높음 | 높음 | **Critical** |
| Multi-Agent API | 매우 높음 | 높음 | **Critical** |
| config.toml 스키마 | 중간 | 중간 | High |
| MCP 프로토콜 | 낮음 | 높음 | Medium |
| AGENTS.md 검색 규칙 | 낮음 | 중간 | Medium |
| 슬래시 명령 | 중간 | 낮음 | Low |

#### 5.2.2 잠재적 Breaking Changes

| 변경 | 가능성 | bkit 영향 | 대응 전략 |
|------|:------:|----------|----------|
| Skills 디렉토리 구조 변경 | 중간 | 26개 skill 디렉토리 재구성 필요 | install.sh 업데이트 |
| config.toml MCP 설정 변경 | 낮음 | MCP 서버 연결 실패 | config 마이그레이션 로직 |
| AGENTS.md 병합 규칙 변경 | 낮음 | 지시사항 로딩 변경 | AGENTS.md 구조 재설계 |
| 공식 Plugin 시스템 출시 | 높음 | install.sh 아키텍처 재설계 | Plugin API 호환 어댑터 |
| 공식 Hooks 시스템 출시 | 높음 | MCP 도구에서 훅으로 전환 | Hook handler 작성 |
| TypeScript Skills 런타임 | 낮음 | SKILL.md 형식 변경 가능 | 형식 적응 |

### 5.3 Dependency Chain Analysis

#### 5.3.1 bkit-codex 의존성 트리

```
bkit-codex v1.0.0
├── OpenAI Codex CLI v0.104.0+
│   ├── Skills System (SKILL.md + openai.yaml)
│   ├── AGENTS.md Discovery
│   ├── config.toml MCP Configuration
│   └── Multi-Agent (experimental)
├── Node.js v18.0.0+
│   └── bkit-codex MCP Server (@popup-studio/bkit-codex-mcp)
│       ├── JSON-RPC 2.0 (자체 구현)
│       ├── STDIO Transport
│       └── 0 external npm dependencies
├── Git (설치 시 clone)
├── bkit-claude-code/bkit-system (심볼릭 링크, 참조용)
└── docs/.pdca-status.json (상태 파일)
```

#### 5.3.2 의존성 리스크 매트릭스

| 의존성 | 버전 | 리스크 | 완화 |
|--------|------|:------:|------|
| Codex CLI | v0.104.0+ | Medium (빠른 진화) | 버전 호환성 테스트 CI |
| Node.js | v18+ | Low (LTS, 안정) | 최소 버전 검사 |
| Git | 최신 | Low (안정) | 설치 시 검사 |
| npm dependencies | 0개 | None | 제로 의존성 유지 |
| bkit-system symlink | 절대 경로 | Medium (이동성) | 상대 경로 또는 복사 전환 |

#### 5.3.3 bkit-system Symlink 문제 (R-5 Section 10.4 #2)

```
bkit-codex/bkit-system -> /Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/bkit-system
```

이 절대 경로 심볼릭 링크는 다른 머신에서 깨진다. 다만, bkit-system은 참조 문서 용도이므로 런타임 기능에는 영향이 없다.

### 5.4 Migration Path Risks

#### 5.4.1 bkit-claude-code -> bkit-codex 마이그레이션

| 마이그레이션 항목 | 난이도 | 상태 호환성 |
|----------------|:------:|:----------:|
| .pdca-status.json | Low | 100% 호환 (v2.0 스키마 동일) |
| docs/01-plan ~ 04-report | Low | 100% 호환 |
| .bkit-memory.json | Low | 100% 호환 |
| bkit.config.json | Low | 100% 호환 |
| CLAUDE.md -> AGENTS.md | Medium | 수동 변환 필요 |
| hooks.json -> MCP tools | High | 패러다임 전환 |
| agents/ -> Skills | High | 재설계 필요 |

**핵심 인사이트**: 상태 파일(.pdca-status.json, PDCA 문서, 메모리)은 100% 호환되므로, 프로젝트의 PDCA 진행 상태를 손실 없이 마이그레이션할 수 있다. 이는 두 플랫폼 간 전환 비용을 크게 낮춘다.

#### 5.4.2 Codex 네이티브 훅 출시 시 마이그레이션

Codex 네이티브 훅 시스템이 출시되면, bkit-codex의 MCP 기반 접근에서 훅 기반 접근으로의 전환이 필요하다:

| 현재 (MCP 기반) | 전환 후 (Hook 기반) | 작업량 |
|----------------|:------------------:|:------:|
| bkit_init MCP 도구 | SessionStart hook handler | Medium |
| bkit_pre_write_check MCP | PreToolUse(Write) hook | Medium |
| bkit_post_write MCP | PostToolUse(Write) hook | Medium |
| bkit_analyze_prompt MCP | UserPromptSubmit hook | Medium |
| bkit_complete_phase MCP | Stop hook handler | Medium |
| AGENTS.md 규칙 | 네이티브 훅으로 강제 | Low |

**예상 작업량**: 약 5-8개 훅 핸들러 스크립트 작성 (bkit-claude-code 코드 재활용 가능)

---

## 6. Match Rate Assessment

### 6.1 Current Match Rate Calculation

bkit-codex v1.0.0의 bkit-claude-code v1.5.5 대비 매치율을 다차원으로 산출한다.

#### 6.1.1 산출 방법론

매치율은 다음 공식으로 산출한다:

```
Match Rate = Σ(Component Weight × Coverage Rate) / Σ(Component Weight)

Component Weight: 해당 컴포넌트의 bkit 아키텍처에서의 중요도 (1-5)
Coverage Rate: 해당 컴포넌트의 기능적 포팅 완성도 (0-100%)
```

#### 6.1.2 컴포넌트별 산출

| Component | Weight | Coverage | Weighted Score | 산출 근거 |
|-----------|:------:|:--------:|:--------------:|----------|
| Skills (26/27) | 5 | 96.3% | 4.815 | 25 ported + 1 replaced + 1 missing (plan-plus) |
| Templates (28/28) | 4 | 100% | 4.000 | 완전 포팅 |
| MCP Tools (16) | 5 | 85% | 4.250 | Hook 대체 기능, ~80-95% 자동화 |
| AGENTS.md | 4 | 90% | 3.600 | 핵심 규칙 포함, 강제력 차이 |
| Lib Modules (14/38) | 3 | 45% | 1.350 | 필수 모듈 포팅, team/ 미포팅 |
| Install System | 4 | 99% | 3.960 | 크로스 플랫폼 완성 |
| Agents (0/16) | 4 | 15% | 0.600 | SKILL.md로 일부 기능 흡수 |
| Hooks (0/13) | 4 | 35% | 1.400 | MCP 도구로 부분 대체 |
| Team System (0/9) | 3 | 0% | 0.000 | 완전 미포팅 |
| Output Styles (0/4) | 2 | 60% | 1.200 | AGENTS.md 규칙으로 대체 |
| Scripts (0/45) | 3 | 40% | 1.200 | MCP 서버로 통합 |
| Commands (0/3) | 2 | 33% | 0.660 | Skill 기반 부분 대체 |
| bkit-system docs | 1 | 100% | 1.000 | Symlink 참조 |
| Configuration | 3 | 95% | 2.850 | bkit.config.json + config.toml |
| CI/CD | 2 | 100% | 2.000 | 4 workflows (bkit-codex 추가) |
| Testing | 3 | 100% | 3.000 | 424 tests, 100% pass |
| Documentation | 2 | 100% | 2.000 | 9 문서 완성 |
| **Total** | **54** | - | **37.885** | |

**Overall Match Rate: 37.885 / 54 = 70.2%**

### 6.2 Category-wise Match Rates

| Category | Match Rate | 상태 |
|----------|:---------:|:----:|
| **Core PDCA Workflow** | 88% | Good |
| **Skills System** | 96% | Excellent |
| **Templates** | 100% | Complete |
| **Installation** | 99% | Excellent |
| **Testing** | 100% | Complete |
| **Documentation** | 100% | Complete |
| **CI/CD** | 100% | Complete |
| **MCP Integration** | 85% | Good |
| **AGENTS.md Rules** | 90% | Good |
| **Automation Guarantee** | 69% | **Needs Improvement** |
| **Agent System** | 15% | **Critical Gap** |
| **Hooks System** | 35% | **Critical Gap** |
| **Team Orchestration** | 0% | **Critical Gap** |
| **Output Styles** | 60% | Acceptable |
| **Lib Modules** | 31% | **Major Gap** |
| **Scripts** | 40% | **Major Gap** |

### 6.3 Gap Severity Classification

#### 6.3.1 Critical Gaps (즉시 대응 필요)

| # | Gap | 현재 | 목표 | 영향 | 근거 |
|---|-----|:----:|:----:|------|------|
| C-1 | Plan-Plus 미포팅 | 0% | 100% | Core PDCA 기능 누락 | R-4 Section 12, R-5 #6 |
| C-2 | Automation Guarantee 하락 | 69% | 85%+ | PDCA 신뢰성 저하 | R-5 Section 5.3 |
| C-3 | PreCompact Hook 부재 | 0% | 80%+ | 장기 세션 정보 손실 | R-3 #9505, R-5 |
| C-4 | Task Chain Auto-Creation 부재 | 0% | 80% | PDCA 워크플로우 수동화 | R-5 #10 |

#### 6.3.2 Major Gaps (중기 대응 필요)

| # | Gap | 현재 | 목표 | 영향 | 근거 |
|---|-----|:----:|:----:|------|------|
| M-1 | Agent 역할 미포팅 (16) | 15% | 50% | 전문 분석 품질 저하 | R-4 Section 2, R-5 |
| M-2 | Full-Auto Mode 미노출 | 0% | 50% | PDCA 자동화 수준 제한 | R-5 #9 |
| M-3 | Skill Orchestrator 부재 | 0% | 60% | 스킬 간 전환 수동화 | R-5 #12 |
| M-4 | Agent Memory 부재 | 0% | 40% | 세션 간 학습 불가 | R-5 #8 |
| M-5 | Task ID Persistence 부재 | 0% | 60% | 태스크 추적 불가 | R-5 #11 |
| M-6 | bkit-system Symlink 이동성 | 50% | 100% | 다른 머신 배포 불가 | R-5 #2 |

#### 6.3.3 Minor Gaps (장기/선택적 대응)

| # | Gap | 현재 | 목표 | 영향 | 근거 |
|---|-----|:----:|:----:|------|------|
| m-1 | Output Styles 전용 파일 부재 | 60% | 80% | 응답 형식 일관성 약화 | R-4 Section 8 |
| m-2 | /github-stats 명령 부재 | 0% | 0% | 부가 기능 | R-4 Section 4 |
| m-3 | Context Fork 부재 | 0% | 30% | 병렬 에이전트 격리 불가 | R-5 #13 |
| m-4 | Test file divergence | 50% | 100% | 개발/배포 테스트 차이 | R-5 #1 |
| m-5 | npm 미배포 | 0% | 50% | 대안 설치 경로 부재 | R-5 #6 |

### 6.4 Target Match Rate for v1.0.0

#### 6.4.1 현재 vs 목표

| 지표 | 현재 | v1.0.0 목표 | 차이 |
|------|:----:|:----------:|:----:|
| Overall Match Rate | 70.2% | 80% | +9.8% |
| Core PDCA Workflow | 88% | 95% | +7% |
| Automation Guarantee | 69% | 80% | +11% |
| Skills Coverage | 96.3% | 100% | +3.7% |
| Critical Gaps Resolved | 0/4 | 4/4 | All |

#### 6.4.2 80% 목표 달성을 위한 필수 조건

1. **plan-plus Skill 포팅** (C-1): Skills Coverage 96.3% -> 100%
2. **AGENTS.md 규칙 강화** (C-2): Automation Guarantee 69% -> ~80%
3. **PDCA 상태 영속화 강화** (C-3): Compaction 저항성 확보
4. **Task Chain 기본 구현** (C-4): bkit_pdca_plan에서 자동 태스크 체인 생성

이 4가지 Critical Gap을 해소하면 Overall Match Rate는 약 78-82%에 도달할 것으로 추정된다.

---

## 7. Recommendations

### 7.1 Immediate Actions (P0) -- v1.0.0 릴리스 이전

| # | 액션 | 예상 작업량 | 영향 |
|---|------|:----------:|------|
| P0-1 | **plan-plus SKILL.md 포팅** | 2-3시간 | Skills 100% 완성, Core PDCA 완성 |
| P0-2 | **AGENTS.md 규칙 강화** -- "ALWAYS call bkit_init/bkit_pre_write_check/bkit_complete_phase" 규칙을 더 구체적이고 반복적으로 명시 | 1-2시간 | Automation Guarantee +5-10% |
| P0-3 | **Test file sync** -- 개발 copy의 7개 테스트 파일을 .bkit-codex/에 동기화 | 1시간 | 배포 테스트 일관성 |
| P0-4 | **bkit-system symlink 수정** -- 절대 경로를 상대 경로 또는 문서 복사로 전환 | 1시간 | 이식성 확보 |
| P0-5 | **Memory file cleanup** -- .bkit-memory.json의 platform: "claude" 수정 | 30분 | 데이터 정합성 |

**예상 총 소요**: 5-7시간
**예상 Match Rate 변동**: 70.2% -> ~76%

### 7.2 Short-term Actions (P1) -- v1.1.0

| # | 액션 | 예상 작업량 | 영향 |
|---|------|:----------:|------|
| P1-1 | **Task Chain Auto-Creation** -- bkit_pdca_plan MCP 도구에서 Plan->Design->Do->Check->Report 태스크 자동 생성 | 4-6시간 | PDCA 자동화 수준 향상 |
| P1-2 | **PDCA 상태 Compaction 저항성** -- .pdca-status.json 핵심 데이터를 AGENTS.md에 주입하여 compaction 후에도 유지 | 3-4시간 | 장기 세션 안정성 |
| P1-3 | **Gap Analysis 기능 강화** -- gap-detector 에이전트의 핵심 로직을 bkit_pdca_analyze MCP 도구에 통합 | 4-6시간 | Check 페이즈 품질 향상 |
| P1-4 | **Output Style SKILL.md 추가** -- 4개 output style을 별도 SKILL.md로 정의하여 레벨별 자동 적용 | 2-3시간 | 응답 형식 일관성 |
| P1-5 | **Full-Auto Mode 노출** -- bkit.config.json의 자동화 모드를 bkit_init 응답에 포함 | 2시간 | PDCA 자동화 옵션 |

**예상 총 소요**: 15-21시간
**예상 Match Rate 변동**: ~76% -> ~82%

### 7.3 Medium-term Actions (P2) -- v1.2.0

| # | 액션 | 예상 작업량 | 영향 |
|---|------|:----------:|------|
| P2-1 | **Codex Multi-Agent 통합** -- features.multi_agent = true 활성화 + 3-5개 핵심 에이전트 역할 정의 | 8-12시간 | Agent 기능 부분 복원 |
| P2-2 | **Codex Native Hooks 마이그레이션** (출시 시) -- MCP 기반에서 Hook 기반으로 전환 | 6-10시간 | Automation Guarantee 80%+ |
| P2-3 | **MCP Resource/Prompt 지원 추가** -- 현재 tools만 노출, resources와 prompts 도 추가 | 4-6시간 | MCP 완전성 |
| P2-4 | **npm 배포** -- @popup-studio/bkit-codex-mcp를 npm에 배포 | 2-3시간 | 대안 설치 경로 |
| P2-5 | **Codex Sandbox 통합** -- bkit MCP 서버의 sandbox_mode 활용 | 3-4시간 | 보안 강화 |

**예상 총 소요**: 23-35시간
**예상 Match Rate 변동**: ~82% -> ~88%

### 7.4 Strategic Actions (P3) -- v2.0.0 이후

| # | 액션 | 예상 작업량 | 영향 |
|---|------|:----------:|------|
| P3-1 | **CTO Team 완전 포팅** -- Codex multi-agent 안정화 후 cto-lead + 10 에이전트 + 5 오케스트레이션 패턴 | 40-60시간 | Team 기능 완전 복원 |
| P3-2 | **Codex Plugin API 통합** -- 공식 플러그인 시스템 출시 시 호환 어댑터 개발 | 10-20시간 | 에코시스템 통합 |
| P3-3 | **codex exec 자동화** -- CI/CD 파이프라인에서 bkit PDCA 자동 실행 | 8-12시간 | DevOps 통합 |
| P3-4 | **Agents SDK 통합** -- Codex MCP 서버 모드를 통한 Agents SDK 오케스트레이션 | 12-20시간 | 멀티에이전트 오케스트레이션 |
| P3-5 | **Open Agent Skills 표준 적용** -- agentskills.io 호환 스킬 패키징 | 6-10시간 | 에코시스템 상호운용성 |
| P3-6 | **Rust 기반 bkit 통합** -- MCP 서버를 Node.js에서 Rust로 전환, Codex wire 프로토콜 직접 통합 | 60-100시간 | 네이티브 성능 |
| P3-7 | **Enterprise Governance** -- PDCA audit trail + 정책 강제 + OpenTelemetry 통합 | 20-30시간 | 엔터프라이즈 시장 |

**예상 총 소요**: 156-252시간 (중장기 로드맵)
**예상 Match Rate 변동**: ~88% -> ~95%+

---

## 8. References

### 8.1 Research Reports (Primary Sources)

| # | 보고서 | 경로 | 크기 |
|---|--------|------|------|
| R-1 | Codex CLI 공식 문서 및 아키텍처 심층조사 | `docs/03-analysis/research/01-codex-official-docs.md` | 45KB |
| R-2 | Context Engineering 기술블로그 및 방향성 | `docs/03-analysis/research/02-context-engineering-direction.md` | 23KB |
| R-3 | GitHub Issues 및 커뮤니티 요구사항 | `docs/03-analysis/research/03-github-issues-community.md` | 19KB |
| R-4 | bkit-claude-code 전체 기능 인벤토리 | `docs/03-analysis/research/04-bkit-feature-inventory.md` | 37KB |
| R-5 | bkit-codex 현재 구현 상태 분석 | `docs/03-analysis/research/05-bkit-codex-current-state.md` | 25KB |

### 8.2 Codex 공식 문서

- [Codex CLI Overview](https://developers.openai.com/codex/cli/)
- [CLI Features](https://developers.openai.com/codex/cli/features/)
- [AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/)
- [Agent Skills](https://developers.openai.com/codex/skills/)
- [Multi-Agent](https://developers.openai.com/codex/multi-agent/)
- [MCP Configuration](https://developers.openai.com/codex/mcp/)
- [Config Reference](https://developers.openai.com/codex/config-reference/)
- [Security](https://developers.openai.com/codex/security)
- [Non-Interactive Mode](https://developers.openai.com/codex/noninteractive/)
- [GitHub Action](https://developers.openai.com/codex/github-action/)
- [Changelog](https://developers.openai.com/codex/changelog/)

### 8.3 Context Engineering 참조

- [Anthropic - Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [LangChain - Context Engineering for Agents](https://blog.langchain.com/context-engineering-for-agents/)
- [Andrej Karpathy on Context Engineering](https://x.com/karpathy/status/1937902205765607626)
- [Tobi Lutke on Context Engineering](https://x.com/tobi/status/1935533422589399127)
- [Chroma Research - Context Rot](https://research.trychroma.com/context-rot)

### 8.4 GitHub Issues (Key References)

| 이슈 # | 주제 | Reactions | 상태 |
|--------|------|:---------:|:----:|
| #2109 | Event Hooks | 418+ | OPEN |
| #2604 | Subagent Support | 315+ | OPEN |
| #8512 | Plugin System | 47 | OPEN |
| #8925 | Plugin Marketplace | 18 | OPEN |
| #9613 | Plugin MVP Proposal | - | OPEN |
| #8368 | Long-term Memory | 12 | OPEN |
| #9505 | Compaction info loss | - | OPEN |
| #11315 | Compaction task drift | - | OPEN |
| #12190 | Governance hooks | - | OPEN |
| #12392 | Claude config migration | - | OPEN |
| #12297 | SDK MVP | - | OPEN |

### 8.5 Previous Reports

- [codex-context-engineering-research.report.md](../04-report/features/codex-context-engineering-research.report.md) (2026-02-14)
- [codex-porting.analysis.md](codex-porting.analysis.md)
- [bkit-codex-qa.analysis.md](bkit-codex-qa.analysis.md)
- [install-script-improvement.analysis.md](install-script-improvement.analysis.md)

### 8.6 bkit-codex Repository

- **Repository**: [popup/bkit-codex](https://github.com/popup-kay/bkit-codex)
- **License**: Apache-2.0
- **Version**: v1.0.0 (2026-02-14)
- **Tests**: 424 passing (100%)
- **CI/CD**: 4 workflows (validate, test, test-install, release)

---

> **Analysis Conclusion**: bkit-codex v1.0.0은 bkit-claude-code v1.5.5의 핵심 PDCA 워크플로우, 26/27 Skills, 28 Templates, 16 MCP Tools, 크로스 플랫폼 설치 시스템을 성공적으로 포팅했다. Overall Match Rate 70.2%에서 v1.0.0 목표인 80%까지의 갭은 plan-plus 포팅(C-1), AGENTS.md 강화(C-2), Compaction 저항성(C-3), Task Chain(C-4) 4개 Critical Gap을 해소하면 달성 가능하다. 장기적으로는 Codex 플랫폼의 Hook 시스템과 Multi-Agent 안정화를 추적하면서 90%+ Match Rate를 목표로 점진적 진화가 필요하다.

---

*Report generated: 2026-02-21*
*Analyst: PDCA Analysis Writer (Task #6)*
*Methodology: 5-Report Synthesis (R-1 ~ R-5, total ~149KB source material)*
*Word count: ~15,000+ words*
