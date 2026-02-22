# codex-context-engineering-research Completion Report

> **Summary**: OpenAI Codex의 Context Engineering 방향성과 현재 구현 기능을 공식문서, OpenAI 기술 블로그, GitHub(릴리스/이슈) 기준으로 심층 조사한 보고서
>
> **Author**: codex
> **Created**: 2026-02-14
> **Project Level**: Starter
> **Status**: Completed

---

## 1. Feature Overview

### 1.1 Feature Identification

| Attribute | Value |
|---|---|
| Feature Name | codex-context-engineering-research |
| Display Name | Codex Context Engineering 심층 조사 |
| Purpose | Codex의 컨텍스트 설계 철학, 구현 기능, 운영 리스크를 실무 적용 관점에서 정리 |
| Category | Research / Strategy |
| Scope Date | 2026-02-14 기준 최신 공개 자료 |

### 1.2 Timeline

| Phase | Date | Status |
|---|---|---|
| Data Collection | 2026-02-14 | Completed |
| Source Verification | 2026-02-14 | Completed |
| Synthesis | 2026-02-14 | Completed |
| Reporting | 2026-02-14 | Completed |

---

## 2. PDCA Cycle Summary

### 2.1 Plan

- 조사 질문 정의:
  - Codex가 “컨텍스트 엔지니어링”을 어떤 방향으로 진화시키는가?
  - 2026-02-14 시점에서 실제 제품/CLI에 구현된 기능은 무엇인가?
  - 공개 이슈 기준 미해결 리스크는 무엇인가?
- 소스 우선순위:
  - 1순위: OpenAI 공식 문서/공식 블로그
  - 2순위: `openai/codex` 릴리스/이슈

### 2.2 Design

- 분석 프레임:
  - Vision(지향점) / Capability(구현) / Gap(미해결) / Action(권고)
- 증거 기준:
  - 공식 문서에 명시된 동작
  - 릴리스 노트의 실제 변경 로그
  - 이슈 상태(Open/Closed)와 재현 가능한 사용자 보고

### 2.3 Do

- 조사 대상:
  - Codex docs: `AGENTS.md`, `config`, `MCP`, `sandbox`, `changelog`, `feature maturity`
  - OpenAI 기술 블로그/인덱스: Codex 소개, 업그레이드, OpenAI 내부 활용 사례, Engineering agents 운영 사례
  - GitHub: `openai/codex` releases, issues
- 산출물:
  - 로컬 리포트 문서 1건
  - Confluence `03-codex` 하위 페이지 1건

### 2.4 Check (Findings)

#### A. Codex Context Engineering의 추구 방향 (Direction)

1. **계층형 지시 컨텍스트 정형화**
- 시스템/개발자/사용자 프롬프트에 더해, `AGENTS.md`를 작업 디렉터리 계층으로 읽어 지시를 합성하는 구조가 핵심 축이다.
- 이는 “일회성 프롬프트”보다 “저장형 실행 규칙”을 우선하는 운영 모델로 이동하고 있음을 의미한다.

2. **장기 작업 대응: 컨텍스트 압축 + 메모리 연속성**
- 설정(`model_context_window`)과 압축(`compact`)으로 토큰 초과를 제어하고, 베타 기능인 `memory.md` 기반 메모리 파이프라인으로 장기 세션 연속성을 강화한다.
- 릴리스 노트 기준 메모리 파이프라인 관련 개선이 연속 반영되고 있어, “장기 작업 안정성”이 제품 방향의 중심임이 확인된다.

3. **도구/환경까지 포함하는 컨텍스트 확장**
- MCP 로컬/원격 서버를 통한 외부 도구 문맥 주입, Codex 자체 MCP 서버화, 샌드박스/승인 정책의 코드화는 컨텍스트를 “텍스트”에서 “실행 환경”까지 확장한다.

4. **실서비스 운영 관점의 안전장치 내재화**
- 승인 모드, 샌드박스 모드, 네트워크 도메인 제어 등은 단순 보안 기능이 아니라 컨텍스트 엔지니어링의 “행동 제약 조건”으로 작동한다.

#### B. 현재 구현 기능 (Implemented Capabilities, 2026-02-14 기준)

1. **AGENTS.md 기반 지시 관리**
- 프로젝트 경로 기준 계층 탐색/병합 규칙 지원
- 글로벌(`~/.codex/AGENTS.md`)까지 확장 가능한 운영 패턴

2. **컨텍스트 윈도우/압축 제어**
- `config.toml`에서 `model_context_window` 제어
- 자동/수동 컨텍스트 압축 옵션(`compact`) 운영

3. **메모리 파이프라인 (Beta)**
- `memory.md`에서 장기 정보 불러오기/요약 전달
- 릴리스(예: `v0.99.0`)에서 memory pipeline 고도화 항목 반영

4. **MCP 확장성**
- 로컬 stdio + 원격(streamable HTTP) MCP 서버 연결
- OAuth 기반 원격 인증 흐름 지원
- Codex를 MCP 서버로 실행 가능

5. **안전/권한 제어**
- 승인 정책(예: `untrusted`, `on-failure`, `on-request`, `never`) 및 샌드박스(`read-only`, `workspace-write`, `danger-full-access`) 운용
- 네트워크 정책(`network_access`, 도메인 허용/차단) 설정 지원

6. **릴리스 기반 실기능 진화**
- `openai/codex` 릴리스에서 메모리/도구 호출/명령 실행/오류 복구 관련 개선이 빠르게 반영
- Feature Maturity 문서로 안정성 단계(Stable/Beta/Experimental) 공개

#### C. GitHub 이슈 기반 관찰 (Risk & Gap)

1. **문서-동작 불일치 리스크**
- 예: `#3995`에서 `disable_response_storage` 동작/문서 차이가 보고되었고 이후 수정됨(Closed).
- 시사점: 운영 가이드는 문서만 신뢰하지 말고 버전별 검증 필요.

2. **회귀(regression) 리스크**
- 예: `#4138`에서 히스토리 명령 회귀가 보고되어 수정(Closed).
- 시사점: CLI 자동화 스크립트는 버전 pinning과 smoke test가 필요.

3. **지시 파일 탐색 정책 확장 요구**
- 예: `#4222`에서 AGENTS 파일 탐색 경로 확장 요구(Open).
- 시사점: 대규모 모노레포/다중 루트 프로젝트에서는 현재 탐색 규칙이 운영 병목이 될 수 있음.

### 2.5 Act (Recommendations)

1. `03-codex` 운영 표준에 다음 3종 문서를 고정:
- `AGENTS.md` (행동 규칙)
- `.codex/config.toml` (승인/샌드박스/컨텍스트 윈도우)
- `memory.md` (장기 결정/용어/제약)

2. Codex 버전 업그레이드 시 체크리스트 도입:
- 릴리스 노트 diff 확인
- 핵심 명령 smoke test (`run`, `exec`, `history`, MCP 연결)
- 보안 정책(`approval_policy`, sandbox, network) 회귀 확인

3. 문서 신뢰성 관리:
- 월 1회 `docs/changelog` + `github issues` 동기화 리포트 작성
- Open 이슈 중 운영영향도 높은 항목은 내부 대응 가이드 선반영

---

## 3. Quality Metrics

| Metric | Result |
|---|---|
| Source Freshness | 2026-02-14 기준 최신 공개 페이지/이슈 반영 |
| Primary Source Ratio | 100% (공식 문서/공식 블로그/GitHub 원문) |
| Evidence Types | Docs + Blog + Release + Issue (4종) |
| Reliability Assessment | High (1차 출처 중심) |

---

## 4. Lessons Learned

### Keep
- 컨텍스트 엔지니어링은 프롬프트 문장보다 **지시 파일 + 실행 정책 + 메모리**의 결합 품질이 성패를 좌우한다.

### Problem
- 문서와 실제 동작의 시차가 존재할 수 있어, 운영 자동화에 바로 반영하면 회귀 위험이 있다.

### Try
- 버전 고정/검증 파이프라인(릴리스 체크 + smoke test)을 `03-codex` 표준 프로세스로 도입한다.

---

## 5. References (Primary Sources)

### Official Docs
- https://developers.openai.com/codex/agents-md/
- https://developers.openai.com/codex/config/
- https://developers.openai.com/codex/mcp/
- https://developers.openai.com/codex/sandbox/
- https://developers.openai.com/codex/changelog/
- https://developers.openai.com/codex/feature-maturity/

### OpenAI Technical Blog / Official Posts
- https://openai.com/index/introducing-codex/
- https://openai.com/index/introducing-upgrades-to-codex/
- https://openai.com/index/how-openai-uses-codex/
- https://openai.com/index/harnessing-engineering-agents-at-openai/

### GitHub (Releases & Issues)
- https://github.com/openai/codex/releases
- https://github.com/openai/codex/issues/3995
- https://github.com/openai/codex/issues/4138
- https://github.com/openai/codex/issues/4222

