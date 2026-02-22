# Context Engineering 심층 분석 및 Codex 전략적 방향성 연구

> **Research-2**: Codex Context Engineering 기술블로그 및 방향성 조사
> **작성일**: 2026-02-21
> **연구 범위**: Context Engineering 개념, OpenAI Codex 전략, 업계 동향, 경쟁 환경 분석

---

## 목차

1. [Context Engineering 개념 및 진화](#1-context-engineering-개념-및-진화)
2. [OpenAI Codex의 Context Engineering 접근법](#2-openai-codex의-context-engineering-접근법)
3. [업계 전문가 분석](#3-업계-전문가-분석)
4. [경쟁 환경 비교 분석](#4-경쟁-환경-비교-분석)
5. [Codex 전략적 방향성](#5-codex-전략적-방향성)
6. [bkit-codex 프로젝트에 대한 시사점](#6-bkit-codex-프로젝트에-대한-시사점)
7. [참고 문헌](#7-참고-문헌)

---

## 1. Context Engineering 개념 및 진화

### 1.1 정의

**Context Engineering**은 LLM이 주어진 태스크를 수행할 수 있도록 최적의 컨텍스트를 설계하고 관리하는 기술적 규율(discipline)이다.

Shopify CEO **Tobi Lutke**의 정의:
> "Context engineering is the art of providing all the context for the task to be plausibly solvable by the LLM."

Andrej Karpathy의 정의:
> "Context engineering is the delicate art and science of filling the context window with just the right information for the next step."

### 1.2 Prompt Engineering에서 Context Engineering으로의 진화

| 구분 | Prompt Engineering | Context Engineering |
|------|-------------------|-------------------|
| **초점** | "어떻게 물어볼 것인가" (How) | "무엇을 제공할 것인가" (What) |
| **범위** | 단일 프롬프트 문장 최적화 | 시스템 프롬프트, 도구, 예시, 히스토리, 상태 전체 |
| **비유** | "마법의 문장 찾기" | "전체 시나리오 작성" |
| **성숙도** | 실험 단계 (Pilot) | 프로덕션 단계 (Production) |
| **대상** | 개별 사용자 대화 | 에이전트 시스템 아키텍처 |

LangChain의 2025 State of Agent Engineering 보고서에 따르면, 57%의 조직이 AI 에이전트를 프로덕션에 배포했으나, 32%가 품질을 최대 장벽으로 지목했으며 대부분의 실패 원인은 LLM 능력이 아닌 **잘못된 컨텍스트 관리(poor context management)**로 추적되었다.

### 1.3 핵심 멘탈 모델: LLM = CPU, Context Window = RAM

Karpathy가 제시한 핵심 비유:

```
LLM ≈ CPU (처리 엔진)
Context Window ≈ RAM (작업 메모리)
Context Engineer ≈ OS (운영 체제 — 작업 메모리에 적절한 코드와 데이터를 로드)
```

이 비유의 핵심 통찰:
- **너무 적은 컨텍스트**: 모델이 최적 성능을 내지 못함
- **너무 많거나 무관한 컨텍스트**: 비용 증가 및 성능 저하
- **적절한 컨텍스트**: 비자명(highly non-trivial)하며 art와 science의 결합이 필요

### 1.4 Context Engineering의 네 가지 핵심 전략

LangChain이 정리한 네 가지 전략 프레임워크:

#### (1) Write (쓰기 - 컨텍스트 영속화)
- 컨텍스트 윈도우 밖에 정보를 저장
- Scratchpad, 노트, 파일 시스템 활용
- 예: Claude Code의 TodoList를 마크다운 파일로 저장하여 compaction 시에도 유지

#### (2) Select (선택 - 컨텍스트 검색)
- 지능적 정보 필터링
- Semantic search, relevance scoring으로 관련 히스토리만 선별
- 예: Cursor의 codebase embedding 모델을 통한 의미 기반 검색

#### (3) Compress (압축 - 컨텍스트 축소)
- 재귀적/계층적 요약(summarization)
- 하드코딩된 규칙으로 오래된 메시지 제거(trimming)
- 예: Codex의 context compaction — 자동 세션 요약

#### (4) Isolate (분리 - 컨텍스트 격리)
- 서브 에이전트로 컨텍스트 분할
- 각 에이전트가 고유한 도구, 지시, 컨텍스트 윈도우 보유
- 여러 에이전트의 격리된 컨텍스트가 단일 에이전트보다 우수한 성능

### 1.5 Context Rot 문제

**Context Rot**은 LLM이 점점 더 많은 입력을 처리할수록 성능이 저하되는 현상이다.

**원인:**
- **Lost in the Middle** 현상: 모델이 컨텍스트 시작과 끝의 토큰을 선호하고 중간 토큰을 잃어버림
- **Attention Dilution**: 컨텍스트 윈도우가 커지면서 중요한 제약 조건이 묻히고 도구 선택이 표류

**해결 방안:**
1. **검색 기반 접근**: JIT(Just-In-Time) 검색으로 관련 정보만 적시 제공
2. **컨텍스트 압축**: 요약과 compaction으로 메모리를 간결하게 유지
3. **세션 관리**: CLAUDE.md, AGENTS.md 등 파일 기반 상태 영속화
4. **멀티 에이전트 아키텍처**: 태스크를 서브 에이전트로 분할하여 컨텍스트 부하 분산

---

## 2. OpenAI Codex의 Context Engineering 접근법

### 2.1 Codex 아키텍처 개요

OpenAI Codex는 2025년에 "코딩 모델"에서 **"소프트웨어 엔지니어 팀메이트"**로 진화했다. Codex CLI는 Rust로 작성된 오픈소스 코딩 에이전트로, 로컬 터미널에서 실행된다.

**핵심 구성요소:**
- **Codex CLI**: 로컬 환경에서 실행되는 에이전트 (Rust 기반, 오픈소스)
- **Codex Cloud (Web)**: 클라우드 기반 비동기 태스크 위임
- **Codex App (macOS)**: 2026년 2월 2일 출시된 데스크톱 앱
- **Codex IDE Extension**: VS Code, Cursor, Windsurf 등 지원
- **GPT-5.2-Codex**: 에이전틱 코딩에 최적화된 모델

### 2.2 Context Compaction 메커니즘

Codex의 핵심 컨텍스트 관리 기술:

```
[세션 시작] → [작업 진행] → [컨텍스트 한계 접근]
                                    ↓
                            [자동 compaction 발동]
                                    ↓
                            [세션 요약 생성]
                                    ↓
                            [새 컨텍스트 윈도우로 재시작]
                                    ↓
                            [반복 — 태스크 완료까지]
```

**세부 동작:**
1. GPT-5.2-Codex는 컨텍스트 윈도우 한계에 접근하면 자동으로 세션을 compaction
2. 내부 노이즈를 필터링한 후 모델에 전달하여 요약 생성
3. 새로운 컨텍스트 윈도우에서 요약을 기반으로 작업 재개
4. 태스크 완료까지 이 프로세스 반복

**상태 스냅샷:**
- Compaction 발생 시 중요한 상태의 경량 receipt(영수증)를 저장
- 파일 상태 등의 스냅샷은 채팅 메시지로 표시되지 않고 모델에 전송되지도 않음
- 시스템이 compaction 후 resume/fork를 더 안정적으로 수행하기 위해 존재

### 2.3 AGENTS.md를 통한 프로젝트 컨텍스트

```
프로젝트 루트 (Git 루트)
├── AGENTS.md              ← 글로벌 지침
├── AGENTS.override.md     ← 오버라이드 (우선 적용)
├── src/
│   └── AGENTS.md          ← 디렉토리별 지침
└── tests/
    └── AGENTS.md          ← 테스트 전용 지침
```

**동작 방식:**
- Codex는 작업 시작 전 AGENTS.md 파일을 읽음
- 프로젝트 루트에서 현재 작업 디렉토리까지 경로를 따라 내려감
- 각 디렉토리에서 `AGENTS.override.md` → `AGENTS.md` → fallback 파일 순으로 확인
- 글로벌 지침 + 프로젝트별 오버라이드 계층화

### 2.4 MCP (Model Context Protocol) 통합

Codex는 MCP를 통해 외부 도구 및 컨텍스트와 연결된다:

**지원 범위:**
- CLI와 IDE 익스텐션 모두에서 MCP 서버 지원
- 써드파티 문서, 브라우저, Figma 등과 연동 가능
- Codex 자체를 MCP 서버로 실행하여 다른 MCP 클라이언트에서 연결 가능

**멀티 에이전트 워크플로우:**
```
Agents SDK (오케스트레이터)
    ├── Codex (MCP Server) — 코딩 에이전트
    ├── Designer Agent — 디자인 에이전트
    ├── Tester Agent — 테스트 에이전트
    └── PM Agent — 프로젝트 매니저 에이전트
```

각 에이전트는 scoped context를 가지며, PM 에이전트가 REQUIREMENTS.md, TEST.md, AGENT_TASKS.md를 작성하고 hand-off를 조율한다.

### 2.5 세션 관리

- `codex resume`: 이전 세션을 이어서 작업
- 트랜스크립트를 로컬에 저장하여 컨텍스트 재구성 없이 재개
- 동일 리포지토리 상태와 지시사항으로 이전 스레드 재오픈

### 2.6 GPT-5.2-Codex의 Context Engineering 개선

| 기능 | 설명 |
|------|------|
| **Context Compaction** | 장기 작업에서 컨텍스트 윈도우 한계 극복 |
| **Long-Context Understanding** | 대규모 코드 변경(리팩토링, 마이그레이션) 성능 향상 |
| **Reliable Tool Calling** | 더 정확한 도구 사용 |
| **Improved Factuality** | 사실 정확도 향상 |
| **Native Compaction** | 모델 수준의 네이티브 compaction 지원 |
| **Vision** | 스크린샷, 기술 다이어그램, UI 해석 능력 향상 |
| **Cybersecurity** | 보안 역량 대폭 강화 |

---

## 3. 업계 전문가 분석

### 3.1 Andrej Karpathy (전 Tesla/OpenAI 연구원)

**핵심 주장:**
> "+1 for 'context engineering' over 'prompt engineering'. People associate prompts with short task descriptions you'd give an LLM in your day-to-day use. When in every industrial-strength LLM app, context engineering is the delicate art and science of filling the context window."

**컨텍스트의 "과학" 측면:**
- 태스크 설명 및 해설
- Few-shot 예시
- RAG (검색 증강 생성)
- 관련 멀티모달 데이터
- 도구(Tools)
- 상태 및 히스토리
- Compacting

**컨텍스트의 "예술" 측면:**
- LLM 심리학(psychology)에 대한 직관
- 인간적 요소의 설계

### 3.2 Tobi Lutke (Shopify CEO)

**핵심 주장:**
- "Context engineering"이 "prompt engineering"보다 핵심 기술을 더 잘 설명
- Shopify에서 "Reflexive AI usage is now a baseline expectation" 선언
- AI 활용이 선택이 아닌 기본 기대치로 전환

**영향력:**
- 2025년 6월 X(Twitter) 게시물이 Context Engineering 용어 대중화의 촉매
- Karpathy의 동의와 함께 업계 용어로 확립

### 3.3 Simon Willison (개발자/기술 블로거)

**핵심 주장:**
- "Context engineering"은 의도된 의미에 훨씬 가까운 추론 가능한 정의를 가짐
- Prompt engineering과 달리, 용어 자체가 실제 활동을 정확히 설명
- 그래프 기반 컨텍스트 표현이 복잡한 도메인에서 효과적

**비유:**
> "We've been treating AI systems like vending machines—inserting a prompt and expecting a predictable output—when we really need them to be more like apprentices that learn and adapt over time."

### 3.4 Swyx (AI Engineer Summit, Latent Space)

**핵심 주장:**
- "Everything that makes agents good is context engineering"
- Context engineering이 AI Engineering의 가장 중요한 문제의 정신(zeitgeist)을 포착
- 에이전트의 품질은 근본적으로 정교한 컨텍스트 관리에 의존

**"LLM OS" 3대 도구:**
1. RAG (Retrieval Augmented Generation / Contextual)
2. Sandboxes / Canvas
3. Browsers / CUA (Computer Use Agent)

### 3.5 Anthropic (Claude Code 팀)

**핵심 주장 (2025년 9월 블로그):**
- 에이전트의 간결한 정의: "LLMs autonomously using tools in a loop"
- 효과적인 에이전트는 컨텍스트를 전체론적(holistically)으로 사고해야 함
- 시스템 프롬프트, 도구, 예시, 메시지 히스토리, 런타임 데이터 검색이 모두 동일한 유한 자원을 놓고 경쟁

**Claude Code의 Compaction 전략:**
- 대화 히스토리를 압축하면서 아키텍처 결정, 미해결 버그, 핵심 구현 세부사항 보존
- TodoList와 Plan을 마크다운 파일로 영속화하여 compaction에서도 유지
- "Just-In-Time" 컨텍스트 접근 — 필요한 데이터만 적시에 로드

### 3.6 LangChain

**핵심 주장:**
- "Context engineering is building dynamic systems to provide the right information and tools in the right format such that the LLM can plausibly accomplish the task"
- 파일시스템을 활용한 컨텍스트 관리: 대화 히스토리 대신 파일에 도구 호출 결과와 노트를 저장
- 에이전트가 필요할 때 키워드로 검색하여 관련 컨텍스트만 읽어들임

---

## 4. 경쟁 환경 비교 분석

### 4.1 주요 AI 코딩 도구 비교

| 특성 | OpenAI Codex | Claude Code | Cursor | Windsurf |
|------|-------------|------------|--------|----------|
| **아키텍처** | 클라우드 + 로컬 CLI | 터미널 기반 로컬 | AI-네이티브 IDE | AI-네이티브 IDE |
| **컨텍스트 윈도우** | GPT-5.2 기반 | 200K tokens | 272K tokens | 가변 |
| **컨텍스트 관리** | Compaction + AGENTS.md | Compaction + CLAUDE.md | Codebase Embedding | Codemaps + Fast Context |
| **코드베이스 이해** | MCP + 파일 시스템 | 직접 읽기 + grep | Semantic indexing | Codemaps |
| **멀티에이전트** | Agents SDK 오케스트레이션 | Sub-agent (Task) | Composer 멀티에이전트 | Cascade |
| **오픈소스** | CLI: Yes | No | No | No |
| **가격** | ChatGPT Plus 포함 | 별도 구독 | $20/mo Pro | $15/mo Pro |
| **SWE-Bench** | ~49% | ~70.3% | 높음 | 보통 |

### 4.2 각 도구의 Context Engineering 접근 방식

#### OpenAI Codex
- **철학**: 클라우드 기반 비동기 위임 + 로컬 CLI 하이브리드
- **강점**: MCP 에코시스템, Agents SDK 오케스트레이션, AGENTS.md 계층화
- **약점**: 모델 성능(SWE-Bench)에서 Claude 대비 열세

#### Claude Code (Anthropic)
- **철학**: 터미널 기반, 개발자 제어 중심
- **강점**: SWE-Bench 최고 성적, Just-In-Time 컨텍스트, 아키텍처 유연성
- **약점**: IDE 통합 부족 (터미널 전용), 컨텍스트 윈도우 200K 제한

#### Cursor
- **철학**: AI-네이티브 IDE, Composer 모델
- **강점**: ~250 토큰/초 속도, 8 에이전트 병렬, semantic codebase indexing
- **약점**: 독점 모델 의존, IDE 락인

#### Windsurf (Cognition AI 인수)
- **철학**: Cascade 기반 프로젝트 전체 컨텍스트 이해
- **강점**: Codemaps, Fast Context, 엔터프라이즈 보안 (SOC 2 Type II)
- **약점**: 2025년 12월 Cognition AI에 인수, 방향 불확실성

### 4.3 수렴 트렌드

> "All of these products are converging, with Cursor's latest agent being pretty similar to Claude Code's latest agents, which is pretty similar to Codex's agent."

**공통 수렴 방향:**
1. 에이전틱 아키텍처 (도구 사용 루프)
2. 컨텍스트 compaction/summarization
3. 파일 기반 상태 영속화 (AGENTS.md, CLAUDE.md, .cursorrules)
4. MCP 또는 유사 프로토콜을 통한 도구 확장
5. 멀티 에이전트 워크플로우

---

## 5. Codex 전략적 방향성

### 5.1 Codex가 최적화하는 영역

| 영역 | 전략 |
|------|------|
| **장기 작업** | Context compaction으로 멀티-시간 추론 가능 |
| **개발자 경험** | CLI + IDE + Web + App 멀티 서피스 |
| **에코시스템** | MCP, Agents SDK, AGENTS.md 표준화 |
| **자율성** | Plan mode, 백그라운드 bash, 자동화 스케줄 |
| **보안** | 샌드박싱, approval modes, 인간 감독 |

### 5.2 오픈소스 전략과 커뮤니티 구축

**오픈소스 요소:**
- Codex CLI: 완전 오픈소스 (Rust)
- AGENTS.md 사양: AAIF(Agentic AI Foundation)와 함께 표준화 추진
- MCP 지원: 오픈 프로토콜 채택

**커뮤니티 전략:**
- GitHub 오픈소스 리포지토리를 통한 직접 참여
- OpenAI Developer Community 포럼
- DevDay 이벤트를 통한 에코시스템 확장
- IDE 익스텐션으로 기존 도구 체인 통합 (VS Code, Cursor, Windsurf)

### 5.3 OpenAI 에코시스템 통합

```
ChatGPT (대화형 AI)
    ↕
Codex (코딩 에이전트)
    ↕ MCP
Agents SDK (오케스트레이션)
    ↕
Apps SDK (UI + MCP 서버)
    ↕
API Platform (모델 접근)
```

**통합 전략:**
- ChatGPT Plus/Pro 구독으로 Codex 접근 통합
- Codex를 MCP 서버로 실행하여 Agents SDK에서 오케스트레이션
- Apps SDK로 MCP 서버에 UI를 추가하는 개발자 경험

### 5.4 Codex App (macOS) — 2026년 2월 출시

**핵심 기능:**
- 복수 에이전트 동시 관리
- 병렬 작업 실행
- 장기 실행 태스크에서 에이전트와 협업
- 백그라운드 자동화 스케줄 (자동 실행 → 결과 큐잉 → 리뷰)
- 에이전트 성격 선택 (pragmatic, empathetic 등)
- Skills: 코드 생성을 넘어 정보 수집, 문제 해결, 작문 등으로 확장

**경쟁적 의미:**
- Claude Code ($1B ARR)와 Cursor (360K+ 유료 사용자)에 대한 직접 경쟁
- GPT-5.2-Codex를 통한 모델 성능 차별화 시도

### 5.5 로드맵 및 향후 방향

**공식 발표/신호 기반:**
1. **CLI 최우선**: CLI를 최상위 우선순위로 유지, Pro 제한 축소 계획 없음
2. **목표**: Codex를 일일 코딩 에이전트로 사용하여 전체 근무 주간 커버
3. **Plan Mode**: 계획 모드 검토 중
4. **Background Bash**: API 서버 실행 → 테스트 → 코드 수정 → 재실행의 자율 루프
5. **Hooks**: 고려 중이나 최적 솔루션 미확정
6. **가상 팀메이트**: 인간 엔지니어가 몇 시간~며칠 걸리는 태스크를 자율적으로 완료

---

## 6. bkit-codex 프로젝트에 대한 시사점

### 6.1 Context Engineering 관점의 bkit-codex 포지셔닝

bkit-codex가 Claude Code에서 OpenAI Codex로의 포팅을 진행하면서 고려해야 할 Context Engineering 핵심 사항:

#### (1) 파일 기반 컨텍스트 영속화 매핑
| Claude Code | OpenAI Codex |
|-------------|-------------|
| CLAUDE.md | AGENTS.md |
| .claude/settings.json | codex.json / codex.yaml |
| Memory (auto) | 세션 트랜스크립트 + resume |
| Sub-agent Task | MCP + Agents SDK |

#### (2) Compaction 전략 차이
- **Claude Code**: SDK 수준에서 토큰 모니터링 → `<summary>` 태그 기반 요약 → 히스토리 교체
- **Codex**: 모델 수준의 native compaction → 상태 receipt 저장 → 새 컨텍스트 윈도우

#### (3) 도구 확장 생태계
- **Claude Code**: MCP 클라이언트로서 도구 연결
- **Codex**: MCP 서버이자 클라이언트 양방향 + Agents SDK 오케스트레이션

### 6.2 핵심 전략적 권고

1. **AGENTS.md 최적화**: bkit-codex의 프로젝트 컨텍스트를 AGENTS.md 계층 구조로 체계화
2. **MCP 서버 활용**: bkit의 기존 기능을 MCP 서버로 노출하여 Codex 에코시스템과 통합
3. **Compaction 인식 설계**: 장기 작업에서 context compaction이 발생해도 핵심 상태가 유지되도록 설계
4. **Skills 체계 매핑**: Claude Code의 Skill 시스템을 Codex의 Skills 개념으로 변환
5. **멀티 에이전트 고려**: Agents SDK를 활용한 멀티 에이전트 워크플로우 지원 검토

### 6.3 Context Engineering 성숙도 체크리스트

- [ ] 프로젝트별 AGENTS.md 구조 정의
- [ ] Context compaction 시 보존해야 할 핵심 상태 식별
- [ ] MCP 서버/클라이언트 통합 포인트 설계
- [ ] 파일 기반 상태 영속화 전략 수립
- [ ] 멀티 에이전트 워크플로우 프로토타입
- [ ] Context rot 방지를 위한 JIT 검색 전략

---

## 7. 참고 문헌

### 공식 문서 및 블로그
- [OpenAI - Introducing Codex](https://openai.com/index/introducing-codex/)
- [OpenAI - Introducing GPT-5.2-Codex](https://openai.com/index/introducing-gpt-5-2-codex/)
- [OpenAI - Codex CLI Features](https://developers.openai.com/codex/cli/features/)
- [OpenAI - Codex MCP](https://developers.openai.com/codex/mcp/)
- [OpenAI - Custom Instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md/)
- [OpenAI - Use Codex with the Agents SDK](https://developers.openai.com/codex/guides/agents-sdk/)
- [OpenAI - Introducing the Codex App](https://openai.com/index/introducing-the-codex-app/)
- [Anthropic - Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude API Docs - Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)

### 업계 전문가 분석
- [Tobi Lutke on X - Context Engineering](https://x.com/tobi/status/1935533422589399127)
- [Andrej Karpathy on X - Context Engineering](https://x.com/karpathy/status/1937902205765607626)
- [Simon Willison - Context Engineering](https://simonwillison.net/2025/jun/27/context-engineering/)
- [Swyx on X - Context Engineering](https://x.com/swyx/status/1940877277476409563)

### 기술 블로그 및 가이드
- [LangChain - Context Engineering for Agents](https://blog.langchain.com/context-engineering-for-agents/)
- [LangChain - The Rise of Context Engineering](https://blog.langchain.com/the-rise-of-context-engineering/)
- [How Codex is Built - Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/how-codex-is-built)
- [Prompting Guide - Context Engineering Guide](https://www.promptingguide.ai/guides/context-engineering-guide)
- [KDnuggets - Context Engineering is the New Prompt Engineering](https://www.kdnuggets.com/context-engineering-is-the-new-prompt-engineering)
- [Addyo Substack - Context Engineering: Bringing Engineering Discipline to Prompts](https://addyo.substack.com/p/context-engineering-bringing-engineering)

### Context Rot 연구
- [Chroma Research - Context Rot](https://research.trychroma.com/context-rot)
- [Inkeep - Fighting Context Rot](https://inkeep.com/blog/fighting-context-rot)
- [Redis - Context Rot Explained](https://redis.io/blog/context-rot/)

### 경쟁 분석
- [Builder.io - Codex vs Claude Code](https://www.builder.io/blog/codex-vs-claude-code)
- [Render Blog - Testing AI Coding Agents 2025](https://render.com/blog/ai-coding-agents-benchmark)
- [Adaline Labs - Claude Code vs OpenAI Codex](https://labs.adaline.ai/p/claude-code-vs-openai-codex)
- [TechCrunch - OpenAI Launches New macOS App](https://techcrunch.com/2026/02/02/openai-launches-new-macos-app-for-agentic-coding/)

### 커뮤니티 및 포럼
- [GitHub - Codex Compaction Discussion #5799](https://github.com/openai/codex/discussions/5799)
- [GitHub - Codex Session Checkpoint RFC #8573](https://github.com/openai/codex/issues/8573)
- [OpenAI Community - Codex Roadmap](https://community.openai.com/t/codex-roadmap-of-future-development/1364810)
- [Threads - Codex CLI Roadmap](https://www.threads.com/@btibor91/post/DPmwrXcCZQF/)

---

> **연구 결론**: Context Engineering은 단순한 용어 변경이 아니라, AI 에이전트 시대의 핵심 기술적 패러다임 전환을 나타낸다. OpenAI Codex는 context compaction, AGENTS.md, MCP, Agents SDK를 통해 이 패러다임을 적극 수용하고 있으며, bkit-codex 프로젝트는 이러한 방향성에 맞춰 Claude Code의 기존 기능을 Codex 에코시스템에 전략적으로 매핑해야 한다.
