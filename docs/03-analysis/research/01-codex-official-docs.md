# Research-1: OpenAI Codex CLI 공식 문서 및 아키텍처 심층조사

> **연구 일자**: 2026-02-21
> **연구 대상**: OpenAI Codex CLI (GitHub: [openai/codex](https://github.com/openai/codex))
> **공식 문서**: [developers.openai.com/codex](https://developers.openai.com/codex/cli/)
> **최신 버전**: CLI 0.104.0 (2026-02-18 기준)
> **라이선스**: Apache-2.0

---

## 목차

1. [개요 및 핵심 정보](#1-개요-및-핵심-정보)
2. [설치 및 인증](#2-설치-및-인증)
3. [저장소 구조 및 아키텍처](#3-저장소-구조-및-아키텍처)
4. [AGENTS.md 커스텀 지시사항 시스템](#4-agentsmd-커스텀-지시사항-시스템)
5. [config.toml 설정 시스템](#5-configtoml-설정-시스템)
6. [MCP 서버 지원 및 통합](#6-mcp-서버-지원-및-통합)
7. [Skills (스킬) 시스템](#7-skills-스킬-시스템)
8. [보안 및 샌드박스 모델](#8-보안-및-샌드박스-모델)
9. [세션 관리 및 상태 지속성](#9-세션-관리-및-상태-지속성)
10. [컨텍스트 윈도우 관리](#10-컨텍스트-윈도우-관리)
11. [멀티-에이전트 시스템](#11-멀티-에이전트-시스템)
12. [비대화형 실행 (codex exec)](#12-비대화형-실행-codex-exec)
13. [슬래시 커맨드 및 UI](#13-슬래시-커맨드-및-ui)
14. [Hooks 및 알림 시스템](#14-hooks-및-알림-시스템)
15. [최근 변경사항 및 릴리스 히스토리](#15-최근-변경사항-및-릴리스-히스토리)
16. [Claude Code와의 비교 분석](#16-claude-code와의-비교-분석)
17. [bkit 통합을 위한 핵심 인사이트](#17-bkit-통합을-위한-핵심-인사이트)

---

## 1. 개요 및 핵심 정보

### 1.1 Codex CLI란?

OpenAI Codex CLI는 터미널에서 로컬로 실행되는 코딩 에이전트이다. Rust로 작성된 오픈소스 프로젝트로, 코드 읽기/수정/실행을 지원하는 AI 어시스턴트 역할을 한다.

**핵심 특징:**
- **Rust 기반 네이티브 바이너리**: Node.js에서 Rust로 완전 리라이트 (2025년 하반기 완료)
- **제로 의존성 설치**: Node.js 런타임 불필요 (npm은 배포 래퍼로만 사용)
- **멀티 인터페이스**: CLI (TUI), IDE 확장, 데스크톱 앱, 클라우드 웹
- **OS 레벨 샌드박스**: macOS Seatbelt, Linux Landlock+seccomp
- **MCP 프로토콜 네이티브 지원**: 클라이언트 및 서버 모드 모두 지원

### 1.2 접근 방식

| 인터페이스 | 설명 |
|-----------|------|
| `codex` | 대화형 터미널 UI (TUI, Ratatui 기반) |
| `codex exec` | 비대화형/스크립트 실행 모드 |
| `codex cloud` | 클라우드 태스크 관리 |
| `codex app` | macOS 데스크톱 앱 |
| `codex mcp-server` | MCP 서버 모드 (다른 에이전트에서 호출 가능) |
| IDE Extension | VS Code, Cursor, Windsurf 통합 |

### 1.3 지원 모델

- **기본 모델**: `gpt-5.3-codex` (코딩 태스크 최적화)
- **경량 모델**: `gpt-5.3-codex-spark` (1000+ tokens/sec, Pro 구독자 전용)
- **구형 모델**: `gpt-5.2`, `gpt-5-codex` 등
- **커스텀 모델**: Ollama, LM Studio 등 로컬 모델 지원

---

## 2. 설치 및 인증

### 2.1 설치 방법

```bash
# npm (크로스 플랫폼)
npm install -g @openai/codex

# Homebrew (macOS)
brew install --cask codex

# 직접 바이너리 다운로드 (GitHub Releases)
# macOS Apple Silicon: codex-aarch64-apple-darwin.tar.gz
# macOS x86_64:        codex-x86_64-apple-darwin.tar.gz
# Linux x86_64:        codex-x86_64-unknown-linux-musl.tar.gz
# Linux ARM64:         codex-aarch64-unknown-linux-musl.tar.gz
```

**플랫폼 지원:**
- macOS: 완전 지원 (Apple Silicon + Intel)
- Linux: 완전 지원 (x86_64, ARM64, musl/glibc)
- Windows: WSL 통한 실험적 지원

### 2.2 인증

```bash
# ChatGPT 계정 로그인 (권장)
codex login

# 디바이스 코드 OAuth
codex login --device-auth

# API 키
echo "sk-..." | codex login --with-api-key

# 인증 상태 확인
codex login status
```

**인증 저장소 옵션:**
```toml
# config.toml
credential_store = "auto"  # auto | file | keyring
```

**구독 요구사항**: ChatGPT Plus, Pro, Business, Edu, Enterprise (무료 사용자는 제한된 트라이얼)

---

## 3. 저장소 구조 및 아키텍처

### 3.1 저장소 구조 (Hybrid Rust/TypeScript Monorepo)

```
openai/codex/
├── codex-rs/                    # Rust 코어 (Cargo workspace, 65+ 크레이트)
│   ├── Cargo.toml               # 워크스페이스 루트 (142 공유 의존성)
│   ├── cli/                     # 메인 CLI 바이너리
│   ├── tui/                     # 터미널 UI (Ratatui 기반)
│   ├── exec/                    # 비대화형 실행 모드
│   ├── core/                    # 핵심 비즈니스 로직 (세션, 모델, 도구)
│   │   └── src/
│   │       └── protocol.rs      # Wire 프로토콜 정의
│   ├── config/                  # 설정 관리
│   ├── protocol/                # 프로토콜 타입 정의
│   ├── state/                   # 상태 관리
│   ├── app-server/              # JSON-RPC API 서버 (IDE 통합)
│   ├── mcp-server/              # MCP 서버 모드
│   ├── apply-patch/             # 패치 적용 도구
│   ├── execpolicy/              # 실행 정책 평가
│   ├── shell-command/           # 셸 명령 실행
│   ├── linux-sandbox/           # Linux Landlock/seccomp 샌드박스
│   ├── login/                   # 인증 모듈
│   ├── chatgpt/                 # ChatGPT 통합
│   ├── codex-api/               # API 클라이언트
│   ├── rmcp-client/             # MCP 클라이언트
│   └── utils/                   # 유틸리티 크레이트
│       ├── absolute-path/
│       ├── pty/
│       └── git/
├── codex-cli/                   # npm 배포 래퍼 (TypeScript)
├── shell-tool-mcp/              # 셸 도구 MCP 서버
├── docs/                        # 문서
│   ├── config.md
│   └── exec.md
├── README.md
└── LICENSE                      # Apache-2.0
```

### 3.2 3-Tier 아키텍처

```
┌─────────────────────────────────────────────────┐
│              Tier 1: User Interface              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   TUI    │  │   Exec   │  │  App Server   │  │
│  │(Ratatui) │  │(Headless)│  │ (JSON-RPC 2.0)│  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │              │               │           │
├───────┴──────────────┴───────────────┴───────────┤
│              Tier 2: Core Logic                   │
│  ┌─────────────────────────────────────────────┐ │
│  │              codex-core                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │ │
│  │  │  Codex   │ │ Session  │ │   Thread    │ │ │
│  │  │ (Queue)  │ │ Manager  │ │  Manager    │ │ │
│  │  └──────────┘ └──────────┘ └─────────────┘ │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
├───────────────────────────────────────────────────┤
│          Tier 3: External Integrations            │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │   Model    │ │    MCP     │ │  Unified     │ │
│  │  Client    │ │ Connection │ │  Exec Proc   │ │
│  │            │ │  Manager   │ │  Manager     │ │
│  └────────────┘ └────────────┘ └──────────────┘ │
│  ┌────────────────────────────────────────────┐  │
│  │         RolloutRecorder (JSONL)            │  │
│  └────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

### 3.3 통신 프로토콜 (Queue-Based Submission/Event Pattern)

```
User ──[Submission]──► Codex Core ──[Event]──► UI Layer

Submission 타입:
  - UserTurn       : 사용자 메시지 제출
  - Interrupt       : 진행 중 작업 중단
  - ExecApproval    : 실행 승인/거부

Event 타입:
  - TurnStarted     : 추론 사이클 시작
  - AgentMessage     : 에이전트 응답
  - ExecCommandBegin : 명령 실행 시작
  - TurnComplete     : 사이클 완료 (토큰 사용량 포함)
  - Error            : 오류 발생
```

이 패턴은 다음을 가능하게 한다:
- Non-blocking UI 업데이트
- 세션 재개를 위한 이벤트 리플레이
- 멀티스레드 동시 실행

### 3.4 Rust 리라이트 배경

2025년 하반기, OpenAI는 TypeScript에서 Rust로 완전 리라이트를 단행했다:

| 동기 | 설명 |
|------|------|
| **제로 의존성** | Node.js v22+ 요구사항 제거 |
| **네이티브 보안** | OS 레벨 샌드박스 바인딩 직접 통합 |
| **성능** | GC 없음, 낮은 메모리 소비 |
| **확장성** | 다중 언어 확장 가능한 Wire 프로토콜 |

---

## 4. AGENTS.md 커스텀 지시사항 시스템

### 4.1 개요

`AGENTS.md`는 Codex의 프로젝트별 지시사항 시스템이다. Claude Code의 `CLAUDE.md`에 해당하는 기능으로, Codex가 작업 시작 전에 읽는 지시사항 파일이다.

### 4.2 검색 순서 (Discovery Order)

```
1단계: 글로벌 스코프 (~/.codex/)
   └── AGENTS.override.md (존재 시) → 또는 AGENTS.md

2단계: 프로젝트 스코프 (Git 루트 → 현재 디렉토리)
   각 레벨에서:
   └── AGENTS.override.md → AGENTS.md → fallback 파일명들
```

**검색 규칙:**
- 글로벌 레벨에서는 첫 번째 비어있지 않은 파일만 사용
- 프로젝트 레벨에서는 Git 루트부터 현재 디렉토리까지 하향 탐색
- 각 레벨에서 `AGENTS.override.md` → `AGENTS.md` → fallback 순서 확인
- 빈 파일은 건너뜀

### 4.3 병합 규칙

```
[글로벌 AGENTS.md]
      ↓ (빈 줄로 연결)
[프로젝트 루트 AGENTS.md]
      ↓ (빈 줄로 연결)
[서브디렉토리 AGENTS.md]
      ↓ (빈 줄로 연결)
[현재 디렉토리 AGENTS.md]
```

- 파일은 루트부터 하향으로 연결 (concatenation)
- 현재 디렉토리에 가까운 파일이 우선 (나중에 나타나므로)
- 총 크기가 `project_doc_max_bytes` 도달 시 중단

### 4.4 Override 메커니즘

```
# 글로벌 임시 오버라이드 (기본 파일 삭제 없이)
~/.codex/AGENTS.override.md

# 프로젝트 서브디렉토리 오버라이드
services/payments/AGENTS.override.md
```

### 4.5 설정 옵션

```toml
# config.toml
project_doc_max_bytes = 65536           # 기본값: 32768 (32KiB)
project_doc_fallback_filenames = [      # 대체 파일명
  "TEAM_GUIDE.md",
  ".agents.md"
]
```

### 4.6 검증 방법

```bash
# 현재 로드된 지시사항 확인
codex --ask-for-approval never "Summarize current instructions"

# 서브디렉토리에서 활성 지시사항 확인
codex --cd subdir --ask-for-approval never "Show active instruction files"

# 로그에서 로드된 파일 확인
# ~/.codex/log/codex-tui.log
```

### 4.7 AGENTS.md 스캐폴드 생성

```bash
# TUI에서 /init 명령으로 AGENTS.md 템플릿 생성
/init
```

### 4.8 Claude Code CLAUDE.md와의 비교

| 기능 | Codex AGENTS.md | Claude Code CLAUDE.md |
|------|----------------|----------------------|
| **파일명** | `AGENTS.md` / `AGENTS.override.md` | `CLAUDE.md` |
| **글로벌 위치** | `~/.codex/` | `~/.claude/` |
| **프로젝트 위치** | 프로젝트 루트 ~ 현재 디렉토리 | 프로젝트 루트 ~ 현재 디렉토리 |
| **오버라이드** | `AGENTS.override.md` 별도 파일 | 단일 파일 (오버라이드 없음) |
| **Fallback 파일명** | 설정으로 커스터마이즈 가능 | 없음 |
| **크기 제한** | `project_doc_max_bytes` (기본 32KB) | 약 200줄 권장 |
| **병합 방식** | 연결 (concatenation) | 연결 (concatenation) |

---

## 5. config.toml 설정 시스템

### 5.1 설정 파일 위치 및 우선순위

```
[최고 우선순위]
  1. CLI 플래그 및 --config 오버라이드
  2. 프로필 값 (--profile <name>)
  3. 프로젝트 설정 (.codex/config.toml, 가장 가까운 파일 우선)
  4. 사용자 설정 (~/.codex/config.toml)
  5. 시스템 설정 (/etc/codex/config.toml)
  6. MDM 프로필 (macOS 관리 디바이스)
  7. 빌트인 기본값
[최저 우선순위]
```

### 5.2 주요 설정 카테고리

#### 모델 및 프로바이더

```toml
model = "gpt-5.3-codex"
model_provider = "openai"                    # 기본 프로바이더
model_context_window = 400000                # 컨텍스트 토큰 (auto 가능)
model_reasoning_effort = "high"              # minimal|low|medium|high|xhigh
model_verbosity = "medium"                   # low|medium|high
model_instructions_file = "path/to/file"     # 커스텀 지시사항 파일 경로
```

#### 보안 및 샌드박스

```toml
approval_policy = "on-request"               # untrusted|on-request|never
sandbox_mode = "workspace-write"             # read-only|workspace-write|danger-full-access
web_search = "cached"                        # disabled|cached|live

[sandbox_workspace_write]
network_access = false                       # 네트워크 접근 제어
writable_roots = ["/path/to/dir"]            # 쓰기 가능 디렉토리
```

#### 기능 플래그

```toml
[features]
shell_tool = true                            # stable: 셸 명령 실행
multi_agent = false                          # experimental: 멀티에이전트
unified_exec = false                         # beta: PTY 기반 실행
web_search = true                            # stable: 웹 검색
shell_snapshot = false                       # 셸 스냅샷
```

#### 프로필 시스템

```toml
# 기본 프로필 설정
profile = "deep-review"

[profiles.deep-review]
model = "gpt-5.3-codex"
model_reasoning_effort = "xhigh"

[profiles.quick]
model = "gpt-5.3-codex-spark"
model_reasoning_effort = "low"
```

```bash
# 프로필 사용
codex --profile deep-review
codex --profile quick "Fix this bug"
```

#### 셸 환경 정책

```toml
[shell_environment_policy]
inherit = "none"                             # all|core|none
exclude = ["AWS_*", "SECRET_*"]
include_only = ["PATH", "HOME"]
ignore_default_excludes = false

[shell_environment_policy.set]
PATH = "/usr/bin"
NODE_ENV = "development"
```

#### 커스텀 모델 프로바이더

```toml
[model_providers.my-ollama]
base_url = "http://localhost:11434/v1"
env_key = "OLLAMA_API_KEY"

[model_providers.azure]
base_url = "https://my-resource.openai.azure.com/openai/deployments/my-model"
env_key = "AZURE_API_KEY"
```

#### UI 및 알림

```toml
personality = "friendly"                     # none|friendly|pragmatic
file_opener = "vscode"                       # 클릭 가능 파일 링크

[tui]
animations = true
notifications = true
alternate_screen = true
show_tooltips = true
```

#### 히스토리

```toml
[history]
persistence = "save-all"                     # save-all|none
max_bytes = 10485760                         # 최대 파일 크기
```

#### 텔레메트리 (opt-in)

```toml
[otel]
exporter = "otlp-http"                       # otlp-http|otlp-grpc
environment = "production"
log_user_prompt = false                      # 기본값: false (프롬프트 비기록)

[analytics]
enabled = false                              # 텔레메트리 비활성화
```

### 5.3 requirements.toml (관리자 강제 설정)

```toml
# /etc/codex/requirements.toml
# 관리자가 보안 관련 설정을 강제하는 파일
# 사용자가 오버라이드할 수 없음

[allowed]
approval_policy = ["on-request", "untrusted"]
sandbox_mode = ["read-only", "workspace-write"]
```

### 5.4 CLI 오버라이드

```bash
# 전용 플래그
codex --model gpt-5.2
codex --sandbox workspace-write

# 일반 key=value
codex --config model='"gpt-5.2"'
codex -c 'model_reasoning_effort="xhigh"'

# 중첩 설정 (점 표기법)
codex -c 'features.multi_agent=true'
```

---

## 6. MCP 서버 지원 및 통합

### 6.1 개요

MCP (Model Context Protocol)는 Codex를 서드파티 도구 및 컨텍스트 소스와 연결한다. Codex는 MCP 클라이언트(외부 서버 연결)와 MCP 서버(다른 에이전트에서 Codex 호출) 모드를 모두 지원한다.

### 6.2 서버 타입

| 타입 | 설명 | 설정 키 |
|------|------|---------|
| **STDIO** | 로컬 프로세스 (명령으로 시작) | `command` |
| **Streamable HTTP** | 원격 서버 (URL 접근) | `url` |

### 6.3 CLI를 통한 MCP 서버 관리

```bash
# 서버 추가 (STDIO)
codex mcp add context7 -- npx -y @upstash/context7-mcp

# 서버 추가 (HTTP)
codex mcp add figma --url https://mcp.figma.com/mcp

# 환경변수와 함께 추가
codex mcp add myserver --env API_KEY=abc123 -- mycommand

# 서버 목록 확인
codex mcp list
codex mcp list --json

# 서버 제거
codex mcp remove context7

# OAuth 로그인
codex mcp login figma --scopes "read,write"

# OAuth 로그아웃
codex mcp logout figma

# TUI에서 활성 MCP 확인
/mcp
```

### 6.4 config.toml MCP 설정

#### STDIO 서버

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
cwd = "/path/to/dir"                        # 선택: 작업 디렉토리

[mcp_servers.context7.env]
MY_ENV_VAR = "MY_ENV_VALUE"

env_vars = ["FORWARDED_VAR"]                 # 전달할 환경변수
```

#### HTTP 서버

```toml
[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
bearer_token_env_var = "FIGMA_OAUTH_TOKEN"

[mcp_servers.figma.http_headers]
"X-Figma-Region" = "us-east-1"
```

#### 고급 옵션

```toml
[mcp_servers.chrome_devtools]
url = "http://localhost:3000/mcp"
enabled = true                               # 서버 토글 (삭제 없이)
required = true                              # 초기화 실패 시 시작 중단
startup_timeout_sec = 20                     # 기본: 10
tool_timeout_sec = 45                        # 기본: 60
enabled_tools = ["open", "screenshot"]       # 허용 도구 목록
disabled_tools = ["dangerous_tool"]          # 차단 도구 목록

# OAuth 콜백 포트 (최상위 레벨)
mcp_oauth_callback_port = 8080
```

### 6.5 Codex를 MCP 서버로 실행

```bash
codex mcp-server
```

다른 에이전트에서 Codex를 도구로 호출할 수 있으며, 두 가지 도구를 노출한다:

| 도구 | 설명 |
|------|------|
| `codex` | 새 Codex 세션 시작 (prompt, approval-policy, sandbox, model 등) |
| `codex-reply` | 기존 세션에 후속 메시지 전송 (prompt, threadId) |

### 6.6 권장 MCP 서버

| 서버 | 용도 |
|------|------|
| OpenAI Docs MCP | OpenAI 개발자 문서 검색/읽기 |
| Context7 | 개발자 문서 컨텍스트 |
| Figma | 디자인 파일 접근 |
| Playwright | 브라우저 제어/검사 |
| Chrome DevTools | Chrome 제어/검사 |
| Sentry | 에러 로그 접근 |
| GitHub | PR, 이슈, 저장소 관리 |

### 6.7 MCP 네임스페이싱

MCP 도구는 `server_name/tool_name` 형식으로 네임스페이싱된다. `McpConnectionManager`가 외부 서버의 도구를 집계한다.

---

## 7. Skills (스킬) 시스템

### 7.1 개요

스킬은 Codex에 태스크별 전문 능력을 추가하는 확장 시스템이다. `SKILL.md` 파일과 선택적 스크립트/리소스로 구성된 디렉토리이다.

### 7.2 스킬 디렉토리 구조

```
my-skill/
├── SKILL.md              # 필수: 지시사항 + 메타데이터
├── scripts/              # 선택: 실행 가능 코드
├── references/           # 선택: 참조 문서
├── assets/               # 선택: 템플릿, 리소스
└── agents/
    └── openai.yaml       # 선택: 외형, 의존성 설정
```

### 7.3 SKILL.md 형식

```yaml
---
name: skill-name
description: Explain when this skill triggers and when it shouldn't.
---

# 스킬 지시사항

여기에 Codex가 따를 구체적인 지시사항을 작성한다.
```

### 7.4 스킬 활성화 방식

1. **명시적 호출**: `/skills` 명령 또는 `$skill-name` 멘션
2. **암시적 호출**: Codex가 태스크 설명에 맞는 스킬을 자동 선택

**Progressive Disclosure**: 메타데이터가 먼저 로드되고, 필요할 때만 전체 `SKILL.md` 지시사항이 로드된다.

### 7.5 스킬 검색 위치 (우선순위)

| 스코프 | 경로 | 용도 |
|--------|------|------|
| **REPO (local)** | `$CWD/.agents/skills` | 현재 폴더 전용 스킬 |
| **REPO (parent)** | `$CWD/../.agents/skills` | 중첩 저장소 스킬 |
| **REPO (root)** | `$REPO_ROOT/.agents/skills` | 조직 전체 스킬 |
| **USER** | `$HOME/.agents/skills` | 개인 크로스 저장소 스킬 |
| **ADMIN** | `/etc/codex/skills` | 시스템 전체 공유 스킬 |
| **SYSTEM** | Built-in | OpenAI 번들 스킬 |

### 7.6 agents/openai.yaml 메타데이터

```yaml
interface:
  display_name: "User-facing name"
  short_description: "Brief description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: false           # 암시적 호출 비활성화

dependencies:
  tools:
    - type: "mcp"
      value: "openaiDeveloperDocs"
      description: "OpenAI Docs MCP server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### 7.7 스킬 관리

```bash
# 빌트인 스킬 생성기 사용
$skill-creator

# 스킬 설치
$skill-installer install the linear skill from the .experimental folder
```

**config.toml에서 비활성화:**
```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

### 7.8 Open Agent Skills 표준

Codex 스킬은 [Open Agent Skills](https://agentskills.io) 표준을 따르며, 상호 운용 가능한 에이전트 스킬 생태계를 지향한다.

### 7.9 Claude Code와의 비교

| 기능 | Codex Skills | Claude Code |
|------|-------------|-------------|
| **확장 시스템** | `.agents/skills/` 디렉토리 기반 | 없음 (CLAUDE.md에 포함) |
| **호출 방식** | 명시적 (`$name`) + 암시적 자동 매칭 | 슬래시 명령 (제한적) |
| **Progressive Disclosure** | 메타데이터 먼저, 전체 로드는 필요시 | 해당 없음 |
| **외부 표준** | Open Agent Skills (agentskills.io) | 독자적 |
| **도구 의존성** | openai.yaml에서 MCP 의존성 선언 | 해당 없음 |

---

## 8. 보안 및 샌드박스 모델

### 8.1 2계층 보안 모델

```
┌──────────────────────────────────────────────┐
│           Layer 1: Sandbox Mode              │
│  (기술적 제한: 파일시스템, 네트워크 접근)       │
│                                              │
│  read-only │ workspace-write │ full-access   │
├──────────────────────────────────────────────┤
│           Layer 2: Approval Policy           │
│  (사용자 승인: 언제 사용자에게 물어볼 것인가)   │
│                                              │
│  untrusted │ on-request │ never              │
└──────────────────────────────────────────────┘
```

### 8.2 샌드박스 모드

| 모드 | 파일 읽기 | 파일 쓰기 | 네트워크 | 용도 |
|------|----------|----------|---------|------|
| `read-only` | O | X | X | 안전한 코드 리뷰 |
| `workspace-write` | O | 작업 디렉토리만 | 기본 X | 일반 개발 (기본값) |
| `danger-full-access` | O | 모든 곳 | O | 테스트/실험 |

### 8.3 승인 정책

| 정책 | 설명 |
|------|------|
| `untrusted` | 상태 변경 명령만 승인 요구 |
| `on-request` | 작업 공간 외 접근, 네트워크 접근 시 승인 (기본값) |
| `never` | 승인 없이 모든 작업 자동 실행 |

### 8.4 플랫폼별 구현

#### macOS: Seatbelt

```bash
# Codex가 내부적으로 사용하는 방식
sandbox-exec -p <compiled-profile> <command>
```

- `sandbox_init()` 시스템 콜로 프로파일 적용
- 커널 레벨 강제
- 런타임에 프로파일 컴파일

#### Linux: Landlock + seccomp

```bash
# codex-linux-sandbox 헬퍼 바이너리
# 별도 서브프로세스로 실행
# 전체 프로세스 트리에 적용
```

- Landlock: 파일시스템 제한
- seccomp: 시스템 콜 필터링
- 대안: bwrap (bubblewrap)

#### Windows

- WSL: Linux 샌드박스 구현 사용
- 네이티브: 실험적 (Restricted Token API)

### 8.5 보호 경로

`workspace-write` 모드에서도 다음 경로는 읽기 전용:
- `.git` 디렉토리 (포인터 파일 포함)
- `.agents` 디렉토리
- `.codex` 디렉토리

### 8.6 관리자 강제 (requirements.toml)

```toml
# /etc/codex/requirements.toml
# 사용자가 오버라이드 불가

[allowed]
approval_policy = ["on-request", "untrusted"]
sandbox_mode = ["read-only", "workspace-write"]

# macOS MDM 통합
# com.openai.codex 도메인에서 base64 인코딩 TOML 배포
# config_toml_base64, requirements_toml_base64
```

### 8.7 CLI 샌드박스 직접 사용

```bash
# macOS
codex sandbox seatbelt -- <command>

# Linux
codex sandbox landlock -- <command>

# 편의 옵션
codex sandbox --full-auto -- <command>
```

---

## 9. 세션 관리 및 상태 지속성

### 9.1 세션 저장 구조

```
~/.codex/sessions/
└── YYYY/
    └── MM/
        └── DD/
            └── rollout-<session-id>.jsonl
```

모든 세션은 JSONL 롤아웃 파일로 저장되며, 대화 히스토리, 도구 호출, 토큰 사용량을 포함한다.

### 9.2 세션 재개 (Resume)

```bash
# 마지막 세션 재개
codex resume --last

# 특정 세션 재개
codex resume <SESSION_ID>

# 모든 세션 목록에서 선택
codex resume --all

# TUI에서
/resume
```

재개 시 원래 트랜스크립트, 계획 히스토리, 승인 상태가 보존된다. 재개된 세션은 기존 롤아웃 파일에 새 내용을 추가한다.

### 9.3 세션 포크 (Fork)

```bash
# TUI에서
/fork
```

원래 트랜스크립트를 보존하면서 새 스레드로 분기한다. 대안적 접근을 탐색할 때 유용하다.

### 9.4 히스토리 설정

```toml
[history]
persistence = "save-all"                     # save-all | none
max_bytes = 10485760                         # 최대 파일 크기

# 임시 세션 (저장 안 함)
# codex exec --ephemeral "..."
```

### 9.5 비대화형 세션 재개

```bash
codex exec resume --last "fix the race conditions you found"
codex exec resume <SESSION_ID>
```

---

## 10. 컨텍스트 윈도우 관리

### 10.1 컨텍스트 윈도우 크기

| 모델 | 컨텍스트 윈도우 |
|------|----------------|
| gpt-5.3-codex | 400K 토큰 |
| gpt-5.2 | 272K 토큰 |
| gpt-5-codex | 272K~400K 토큰 |

### 10.2 자동 압축 (Auto-Compaction)

- 세션이 컨텍스트 윈도우 한계에 도달하면 자동으로 이전 메시지를 요약
- 최근 메시지와 코드 컨텍스트가 우선 보존
- 오래된 컨텍스트는 요약되거나 삭제됨

### 10.3 수동 압축

```bash
# TUI에서
/compact
```

### 10.4 설정

```toml
model_context_window = 400000               # auto (기본) 또는 직접 지정
# model_auto_compact_token_limit 도 설정 가능
```

### 10.5 Phase-1 메모리

CLI 0.101.0 (2026-02-12)부터 developer 메시지가 phase-1 메모리에서 제외되며, 메모리 단계 처리 동시성이 감소되었다. `/memory` 관련 슬래시 명령도 추가되었다.

---

## 11. 멀티-에이전트 시스템

### 11.1 개요

실험적 기능으로, 복잡한 태스크를 병렬 에이전트로 분할 실행한다.

### 11.2 활성화

```toml
# config.toml
[features]
multi_agent = true
```

```bash
# 또는 TUI에서
/experimental
# → Multi-agents 활성화 후 재시작
```

### 11.3 에이전트 역할 설정

```toml
# ~/.codex/config.toml

[agents]
max_threads = 6                              # 최대 동시 에이전트 스레드

[agents.default]
description = "General-purpose helper."

[agents.reviewer]
description = "Find security, correctness, and test risks in code."
config_file = "agents/reviewer.toml"

[agents.explorer]
description = "Fast codebase explorer for read-heavy tasks."
config_file = "agents/custom-explorer.toml"
```

**역할별 설정 파일 (~/.codex/agents/reviewer.toml):**

```toml
model = "gpt-5.3-codex"
model_reasoning_effort = "high"
developer_instructions = "Focus on high priority issues, write tests to validate hypothesis before flagging."
```

**읽기 전용 탐색기 (~/.codex/agents/custom-explorer.toml):**

```toml
model = "gpt-5.3-codex-spark"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
```

### 11.4 빌트인 역할

| 역할 | 설명 |
|------|------|
| `default` | 범용 헬퍼 |
| `worker` | 작업 실행 에이전트 |
| `explorer` | 코드베이스 탐색 에이전트 |

### 11.5 에이전트 관리

```bash
# TUI에서 활성 스레드 확인 및 전환
/agent

# 에이전트 조종, 중지, 닫기
# 서브 에이전트는 부모 샌드박스 정책 상속
# 승인되지 않은 작업은 실패하고 에러가 표면화됨
```

### 11.6 사용 예시

```
"다음 PR 포인트를 병렬로 리뷰해주세요. 포인트당 에이전트 하나를 생성하고
모두 완료되면 결과를 요약해주세요:
1. Security issues
2. Code quality
3. Bugs
4. Race conditions
5. Test flakiness
6. Maintainability"
```

### 11.7 Agents SDK 통합

`codex mcp-server`를 통해 OpenAI Agents SDK와 통합하여 결정론적이고 검토 가능한 워크플로우를 구성할 수 있다:

```
Project Manager → Designer → Frontend Dev → Backend Dev → Tester
                     ↓             ↓              ↓
              (MCP 호출)     (MCP 호출)      (MCP 호출)
```

각 에이전트가 범위가 지정된 지시사항을 받고, 파일 완료 게이트에 기반하여 다음 역할로 핸드오프한다.

---

## 12. 비대화형 실행 (codex exec)

### 12.1 기본 사용법

```bash
# 간단한 실행
codex exec "summarize the repository structure"

# 파이프라인
codex exec "generate release notes" | tee release-notes.md

# 임시 실행 (세션 미저장)
codex exec --ephemeral "triage this repo"
```

### 12.2 출력 모드

#### 텍스트 출력 (기본)
- 진행 상황: stderr
- 최종 메시지: stdout

#### JSON Lines 스트림 (--json)

```bash
codex exec --json "analyze codebase"
```

```json
{"type":"thread.started","thread_id":"0199a213-..."}
{"type":"turn.started"}
{"type":"item.completed","item":{"type":"agent_message","text":"..."}}
{"type":"turn.completed","usage":{"input_tokens":24763,"output_tokens":122}}
```

**이벤트 타입:**
- `thread.started` / `turn.started` / `turn.completed` / `turn.failed`
- `item.started` / `item.completed`
- 아이템 타입: agent_message, reasoning, command_execution, file_change, mcp_tool_call, web_search, plan_update

#### 구조화된 출력 (--output-schema)

```bash
codex exec "Extract project metadata" \
  --output-schema ./schema.json \
  -o ./project-metadata.json
```

```json
// schema.json
{
  "type": "object",
  "properties": {
    "project_name": { "type": "string" },
    "programming_languages": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["project_name", "programming_languages"]
}
```

### 12.3 CI/CD 통합 패턴

```yaml
# GitHub Actions 예시
- name: Run Codex
  env:
    CODEX_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: |
    codex exec --full-auto --sandbox workspace-write \
      "Read repository, run tests, identify minimal fix, implement only that change."
```

### 12.4 GitHub Action

```yaml
- uses: openai/codex-action@v1
  with:
    prompt: "Review this PR for security issues"
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    model: gpt-5.3-codex
    sandbox: read-only
    safety-strategy: drop-sudo                # 기본: sudo 제거
```

**Safety Strategy 옵션:**
| 전략 | 설명 |
|------|------|
| `drop-sudo` | sudo 접근 영구 제거 (기본) |
| `unprivileged-user` | 비루트 계정으로 실행 |
| `read-only` | 파일 변경 및 네트워크 차단 |
| `unsafe` | 제한 없음 (Windows용) |

---

## 13. 슬래시 커맨드 및 UI

### 13.1 빌트인 슬래시 커맨드 (22개)

| 커맨드 | 기능 |
|--------|------|
| `/model` | 활성 모델 변경 (추론 노력도 조절 가능) |
| `/personality` | 커뮤니케이션 스타일 전환 |
| `/plan` | 플랜 모드 진입 (선택적 인라인 프롬프트) |
| `/permissions` | 승인 없이 가능한 작업 설정 |
| `/experimental` | 실험적 기능 토글 |
| `/agent` | 활성 에이전트 스레드 전환 |
| `/status` | 세션 설정 및 토큰 사용량 표시 |
| `/debug-config` | 설정 레이어 및 진단 정보 출력 |
| `/compact` | 대화 요약으로 토큰 절약 |
| `/diff` | Git diff 표시 (미추적 파일 포함) |
| `/mention` | 특정 파일을 대화에 첨부 |
| `/review` | 워킹 트리 분석 요청 |
| `/mcp` | 설정된 MCP 도구 목록 |
| `/apps` | 커넥터 브라우징 및 삽입 |
| `/new` | 같은 세션에서 새 대화 시작 |
| `/resume` | 저장된 대화 재개 |
| `/fork` | 현재 대화를 새 스레드로 클론 |
| `/init` | AGENTS.md 스캐폴드 생성 |
| `/ps` | 백그라운드 터미널 및 최근 출력 |
| `/quit`, `/exit` | CLI 즉시 종료 |
| `/feedback` | 로그를 메인테이너에게 제출 |
| `/logout` | 로컬 자격증명 삭제 |

### 13.2 UI 기능

- **Prompt Editor**: Ctrl+G로 외부 에디터에서 긴 프롬프트 작성
- **Draft History**: Up/Down 키로 이전 입력 복원
- **Shell Integration**: `!` 접두사로 직접 셸 명령 실행
- **File Citations**: `file_opener = "vscode"`로 클릭 가능 파일 링크
- **Notifications**: 에이전트 턴 완료 시 데스크톱 알림

---

## 14. Hooks 및 알림 시스템

### 14.1 현재 구현

Codex의 훅 시스템은 현재 제한적이며, `notify` 기능만 구현되어 있다:

```toml
# config.toml
notify = ["python3", "/path/to/notification-script.py"]
```

**지원 이벤트:**
- `agent-turn-complete` (현재 유일한 지원 이벤트)

### 14.2 커뮤니티 요구사항

GitHub에서 확장된 훅 시스템에 대한 요청이 활발하다:
- [Discussion #2150](https://github.com/openai/codex/discussions/2150): 범용 훅 기능 요청
- [Issue #7396](https://github.com/openai/codex/issues/7396): post-run 훅 요청

OpenAI 팀은 훅 시스템 설계를 진행 중이라고 언급했다.

### 14.3 Claude Code와의 비교

| 기능 | Codex | Claude Code |
|------|-------|-------------|
| **훅 시스템** | notify (1개 이벤트만) | 포괄적 (PreToolUse, PostToolUse 등) |
| **이벤트 범위** | agent-turn-complete만 | 다수의 도구/세션 이벤트 |
| **성숙도** | 초기/설계 단계 | 안정/프로덕션 |

---

## 15. 최근 변경사항 및 릴리스 히스토리

### 15.1 2026년 2월 주요 변경사항

| 날짜 | 버전 | 주요 변경 |
|------|------|----------|
| 02-18 | CLI 0.104.0 | WebSocket 프록시 환경변수, 알림 향상, 고유 승인 ID |
| 02-17 | App 26.217 | 큐 메시지 드래그앤드롭, 모델 다운그레이드 경고 |
| 02-17 | CLI 0.103.0 | 커밋 공저자 귀속, remote_models 플래그 제거 |
| 02-17 | CLI 0.102.0 | 통합 권한 흐름, 커스텀 멀티에이전트 역할, 모델 리라우트 알림 |
| 02-12 | App 26.212 | GPT-5.3-Codex-Spark 지원, 대화 포킹, 팝아웃 윈도우 |
| 02-12 | CLI 0.101.0 | 모델 해상도 보존, phase-1 메모리 최적화 |
| 02-12 | CLI 0.100.0 | 실험적 JS REPL, 다중 레이트 리밋, WebSocket 재도입, 메모리 슬래시 명령 |
| 02-11 | CLI 0.99.0 | 직접 셸 명령 개선, /statusline 설정, 재개 정렬 토글 |

### 15.2 GPT-5.3-Codex-Spark 출시 (2026-02-12)

- 실시간 코딩에 최적화된 소형 고속 모델
- 1000+ tokens/sec 처리량
- ChatGPT Pro 구독자 전용 리서치 프리뷰

### 15.3 주요 마일스톤

| 시기 | 이벤트 |
|------|--------|
| 2025년 중반 | Codex CLI 최초 출시 (TypeScript) |
| 2025년 하반기 | Rust 리라이트 시작 및 네이티브 전환 |
| 2025년 9월 | GPT-5-Codex 출시, MCP 서버 지원 추가 |
| 2025년 11월 | GPT-5.1-Codex-Max 출시 |
| 2026년 1월 | Skills 시스템 도입, Multi-agent 실험적 기능 |
| 2026년 2월 | GPT-5.3-Codex-Spark, CLI 0.104.0, 멀티에이전트 역할 커스터마이즈 |

---

## 16. Claude Code와의 비교 분석

### 16.1 아키텍처 비교

| 항목 | Codex CLI | Claude Code |
|------|----------|-------------|
| **언어** | Rust (네이티브 바이너리) | TypeScript (Node.js 런타임) |
| **설치** | npm / Homebrew / 직접 바이너리 | npm (`@anthropic-ai/claude-code`) |
| **런타임 의존성** | 없음 (제로 의존성) | Node.js 필요 |
| **UI 프레임워크** | Ratatui (Rust) | Ink (React for CLI) |
| **샌드박스** | OS 레벨 (Seatbelt/Landlock) | Docker 컨테이너 기반 |
| **오픈소스** | Apache-2.0 | 소스 공개 (별도 라이선스) |
| **저장소 크기** | 65+ Rust 크레이트 | 단일 패키지 |

### 16.2 기능 비교

| 기능 | Codex CLI | Claude Code |
|------|----------|-------------|
| **커스텀 지시사항** | AGENTS.md + AGENTS.override.md | CLAUDE.md |
| **설정 형식** | config.toml (TOML) | settings.json (JSON) |
| **확장 시스템** | Skills (.agents/skills/) | 없음 (CLAUDE.md에 통합) |
| **MCP 지원** | 네이티브 (클라이언트 + 서버) | 네이티브 (클라이언트) |
| **멀티 에이전트** | 실험적 (역할 커스터마이즈 가능) | 팀 (SendMessage 기반) |
| **비대화형 모드** | codex exec (JSON 스트림, 스키마 출력) | 제한적 |
| **세션 재개** | resume / fork | 없음 (컨텍스트 내 유지) |
| **웹 검색** | 내장 (cached/live) | 내장 (WebSearch 도구) |
| **코드 리뷰** | /review (빌트인 프리셋) | 없음 (수동) |
| **훅 시스템** | 초기 (notify만) | 성숙 (PreToolUse, PostToolUse 등) |
| **프로필** | config.toml profiles | 없음 |
| **관리자 강제** | requirements.toml + MDM | 없음 |
| **텔레메트리** | OpenTelemetry (opt-in) | 없음 |
| **GitHub Action** | openai/codex-action@v1 | 없음 (공식) |
| **클라우드 연동** | codex cloud (원격 태스크) | 없음 |

### 16.3 컨텍스트 관리 비교

| 항목 | Codex CLI | Claude Code |
|------|----------|-------------|
| **컨텍스트 윈도우** | 최대 400K 토큰 | ~200K 토큰 |
| **자동 압축** | 자동 요약 (auto-compaction) | 자동 압축 (prior message compression) |
| **수동 압축** | /compact | 자동 |
| **지시사항 크기 제한** | project_doc_max_bytes (32KB 기본) | ~200줄 권장 |
| **세션 지속** | JSONL 롤아웃 파일 | 메모리 내 (auto memory) |

---

## 17. bkit 통합을 위한 핵심 인사이트

### 17.1 AGENTS.md 적응 전략

bkit-codex에서 Claude Code의 `CLAUDE.md` 역할을 Codex의 `AGENTS.md`에 매핑해야 한다:

```
bkit-claude-code                    bkit-codex
─────────────────                   ──────────
~/.claude/CLAUDE.md        →        ~/.codex/AGENTS.md
project/CLAUDE.md          →        project/AGENTS.md
project/.claude/settings   →        project/.codex/config.toml
```

**핵심 차이점:**
- Codex는 `AGENTS.override.md` 오버라이드 메커니즘이 있음
- fallback 파일명 커스터마이즈 가능
- 크기 제한이 바이트 단위로 정밀 제어 가능

### 17.2 Skills 시스템 활용

bkit의 install 스크립트와 설정을 Skills로 패키징할 수 있다:

```
.agents/skills/
├── bkit-setup/
│   ├── SKILL.md              # bkit 환경 설정 지시사항
│   └── scripts/
│       └── install.sh
├── bkit-pdca/
│   ├── SKILL.md              # PDCA 분석 워크플로우
│   └── references/
│       └── pdca-template.md
└── bkit-codex-config/
    ├── SKILL.md              # Codex 설정 최적화
    └── agents/
        └── openai.yaml
```

### 17.3 config.toml 통합 포인트

bkit-codex 설치 시 자동 생성할 설정:

```toml
# .codex/config.toml (프로젝트 레벨)
model = "gpt-5.3-codex"
model_reasoning_effort = "high"
approval_policy = "on-request"
sandbox_mode = "workspace-write"
personality = "pragmatic"

project_doc_max_bytes = 65536
project_doc_fallback_filenames = ["AGENTS.md", "CLAUDE.md"]

[features]
multi_agent = true
web_search = true
```

### 17.4 MCP 서버 통합

bkit 도구를 MCP 서버로 노출하거나, 외부 MCP 서버를 자동 설정할 수 있다:

```toml
# ~/.codex/config.toml
[mcp_servers.bkit-tools]
command = "bkit"
args = ["mcp-server"]

[mcp_servers.github]
command = "gh"
args = ["copilot", "mcp"]
```

### 17.5 비대화형 자동화

bkit의 CI/CD 파이프라인에서 `codex exec`를 활용할 수 있다:

```bash
# bkit 릴리스 노트 자동 생성
codex exec --full-auto --output-schema release-schema.json \
  "Generate release notes for bkit-codex v1.0.0" \
  -o release-notes.json

# bkit 코드 리뷰 자동화
codex exec --sandbox read-only \
  "Review current PR for security and quality issues" \
  | bkit report
```

### 17.6 멀티에이전트 활용

bkit 워크플로우에 맞는 커스텀 에이전트 역할:

```toml
[agents.researcher]
description = "Deep research on codebases and documentation."
config_file = "agents/researcher.toml"

[agents.analyst]
description = "PDCA analysis and reporting."
config_file = "agents/analyst.toml"

[agents.installer]
description = "Setup and configuration specialist."
config_file = "agents/installer.toml"
```

### 17.7 문서화 부족 영역

조사 중 발견한 문서화가 부족한 영역:

1. **훅 시스템**: `notify` 이벤트 외에는 문서가 거의 없음
2. **컨텍스트 압축 알고리즘**: 자동 압축의 내부 동작이 불분명
3. **멀티에이전트 내부 프로토콜**: 에이전트 간 통신 방식 상세 미공개
4. **Skills 런타임**: 스킬 내 스크립트 실행 환경 상세 미공개
5. **메모리 시스템**: phase-1 메모리 관련 최신 기능의 상세 문서 부족
6. **Windows 네이티브 샌드박스**: 실험적 단계로 문서 최소

---

## 부록: 참조 링크

### 공식 문서
- [Codex CLI Overview](https://developers.openai.com/codex/cli/)
- [CLI Features](https://developers.openai.com/codex/cli/features/)
- [CLI Reference (Commands)](https://developers.openai.com/codex/cli/reference/)
- [Slash Commands](https://developers.openai.com/codex/cli/slash-commands/)
- [Quickstart](https://developers.openai.com/codex/quickstart/)

### 설정
- [Config Basics](https://developers.openai.com/codex/config-basic/)
- [Config Reference](https://developers.openai.com/codex/config-reference/)
- [Advanced Configuration](https://developers.openai.com/codex/config-advanced/)
- [Sample Configuration](https://developers.openai.com/codex/config-sample/)

### 지시사항 및 확장
- [AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/)
- [Agent Skills](https://developers.openai.com/codex/skills/)
- [Multi-Agent](https://developers.openai.com/codex/multi-agent/)
- [MCP Configuration](https://developers.openai.com/codex/mcp/)

### 보안
- [Security](https://developers.openai.com/codex/security)

### 자동화
- [Non-Interactive Mode](https://developers.openai.com/codex/noninteractive/)
- [GitHub Action](https://developers.openai.com/codex/github-action/)
- [Agents SDK Integration](https://developers.openai.com/codex/guides/agents-sdk/)

### 변경사항
- [Changelog](https://developers.openai.com/codex/changelog/)

### GitHub
- [Repository](https://github.com/openai/codex)
- [DeepWiki Architecture Analysis](https://deepwiki.com/openai/codex)

---

> **연구 노트**: 본 문서는 2026-02-21 기준 공식 문서, GitHub 저장소, DeepWiki 분석을 기반으로 작성되었다. Codex CLI는 빠르게 진화 중이며 (v0.99~v0.104 in 1 week), 일부 실험적 기능은 변경될 수 있다.
