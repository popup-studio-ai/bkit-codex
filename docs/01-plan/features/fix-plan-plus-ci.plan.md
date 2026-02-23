# fix-plan-plus-ci - Plan Plus Skill CI 실패 수정 계획서

> Version: 1.0.0 | Date: 2026-02-23 | Status: Draft
> Level: Dynamic
> Platform: OpenAI Codex CLI

---

## 1. Overview

### 1.1 Purpose

`plan-plus` 스킬의 `openai.yaml` 파일이 잘못된 위치에 있어 GitHub Actions CI (`Validate Skills`, `Test Install Scripts`)가 실패하는 문제를 수정한다. 단순 파일 이동뿐 아니라, 동일한 문제의 재발을 방지하기 위한 구조적 개선도 포함한다.

### 1.2 Background

PR #2 (`fix/global-install-absolute-path`) 머지 후 3개의 GitHub Actions 워크플로우 중 2개가 실패:

| Workflow | Status | Run ID |
|----------|--------|--------|
| Test MCP Server | Success | 22292580405 |
| Test Install Scripts | **Failure** | 22292580399 |
| Validate Skills | **Failure** | 22292580397 |

실패 원인은 PR #2와 무관하며, v1.0.0 릴리즈부터 존재했던 기존 문제:

```
FAIL: plan-plus
  - Missing agents/openai.yaml
Results: 26/27 passed
```

### 1.3 Root Cause

`scripts/validate-skills.js` (line 160)에서 모든 스킬에 대해 `agents/openai.yaml` 존재를 검증:

```javascript
const yamlFile = path.join(skillDir, 'agents', 'openai.yaml');
if (!fs.existsSync(yamlFile)) {
  errors.push('Missing agents/openai.yaml');
}
```

**현재 구조 (plan-plus만 예외):**
```
.agents/skills/plan-plus/
├── SKILL.md
├── openai.yaml              ← agents/ 없이 루트에 위치 (표준 위반)
└── references/
    └── plan-plus-process.md
```

**표준 구조 (다른 26개 스킬):**
```
.agents/skills/{skill-name}/
├── SKILL.md
├── agents/
│   └── openai.yaml          ← agents/ 하위에 위치 (표준)
└── references/
```

### 1.4 References

- `CONTRIBUTING.md` lines 26-34: 스킬 디렉토리 표준 구조 정의
- `scripts/validate-skills.js` lines 159-168: openai.yaml 검증 로직
- `.github/workflows/validate.yml`: Validate Skills 워크플로우
- `.github/workflows/test-install.yml`: Test Install Scripts 워크플로우 (내부에 동일 검증 포함)

---

## 2. Problem Analysis

### 2.1 직접 원인

| ID | Issue | Severity | Description |
|----|-------|----------|-------------|
| PP-01 | openai.yaml 위치 오류 | **High** | plan-plus의 openai.yaml이 `agents/` 하위가 아닌 스킬 루트에 위치 |

### 2.2 간접 원인 (재발 방지)

| ID | Issue | Severity | Description |
|----|-------|----------|-------------|
| PP-02 | 새 스킬 생성 시 구조 검증 부재 | Medium | 수동으로 스킬을 만들 때 표준 구조를 강제하는 자동화 없음 |
| PP-03 | PR 브랜치에서도 동일 CI 실패 | Low | `fix/global-install-absolute-path` PR 브랜치에서도 실패했으나 머지됨 (CI 실패가 블로킹되지 않음) |

### 2.3 openai.yaml 생성 방식 분석

조사 결과, openai.yaml은 **자동 생성 로직이 없으며** 개발자가 수동으로 생성:
- 스크립트/제너레이터: 없음
- 템플릿 엔진: 없음
- CONTRIBUTING.md에 수동 생성 가이드만 존재 (lines 61-69)
- `install.sh`/`install.ps1`은 심링크만 생성하며 파일 자체를 생성하지 않음
- `validate-skills.js`는 검증만 수행

따라서 **파일 이동만으로 문제 해결 가능**하며, 생성 로직 수정은 불필요.

---

## 3. Goals

### 3.1 Primary Goals

- [x] `plan-plus/openai.yaml`을 표준 위치 (`agents/openai.yaml`)로 이동
- [ ] GitHub Actions CI 2개 워크플로우 통과 확인

### 3.2 Secondary Goals

- [ ] validate-skills.js에 더 명확한 에러 메시지 추가 (기대 경로 표시)

### 3.3 Non-Goals

- openai.yaml 자동 생성 스크립트 (수동 생성이 프로젝트 의도)
- CI branch protection 설정 변경 (별도 이슈)
- plan-plus의 brand_color 변경 (보라색은 의도적 구분)

---

## 4. Scope

### 4.1 파일 변경

| File | Action | Description |
|------|--------|-------------|
| `.agents/skills/plan-plus/openai.yaml` | **삭제** | 기존 위치에서 제거 |
| `.agents/skills/plan-plus/agents/openai.yaml` | **생성** | 표준 위치에 동일 내용으로 생성 |
| `scripts/validate-skills.js` | **수정** | 에러 메시지에 기대 경로 포함하도록 개선 |

### 4.2 변경하지 않는 파일

| File | Reason |
|------|--------|
| `CONTRIBUTING.md` | 이미 올바른 표준 구조를 문서화하고 있음 |
| `install.sh` / `install.ps1` | 심링크 대상이므로 파일 위치 변경의 영향 없음 |
| `.github/workflows/*` | 워크플로우 자체는 정상, 검증 대상이 문제 |
| `plan-plus/SKILL.md` | 내용 변경 불필요 |

---

## 5. Success Criteria

| Metric | Target |
|--------|--------|
| Validate Skills workflow | Pass (27/27) |
| Test Install Scripts workflow | Pass |
| plan-plus agents/openai.yaml 존재 | 확인됨 |
| plan-plus 기존 openai.yaml 제거 | 확인됨 |
| 로컬 `node scripts/validate-skills.js` 통과 | 27/27 |

---

## 6. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| 파일 이동 시 내용 변경 | Low | Very Low | 내용 동일 유지, diff 확인 |
| 다른 스킬에 영향 | None | None | plan-plus만 변경 |
| 심링크 무효화 | Low | Very Low | 심링크는 스킬 디렉토리 레벨이므로 내부 파일 이동에 영향 없음 |

---

## 7. Task Breakdown

```
[PLAN] fix-plan-plus-ci ← Current
  Status: Complete

[DESIGN] fix-plan-plus-ci
  Status: Next
  blockedBy: PLAN

[DO] fix-plan-plus-ci
  Status: Pending
  blockedBy: DESIGN
  Subtasks:
    1. agents/ 디렉토리 생성 및 openai.yaml 이동
    2. validate-skills.js 에러 메시지 개선
    3. 로컬 검증 (validate-skills.js 실행)

[CHECK] fix-plan-plus-ci
  Status: Pending
  blockedBy: DO

[REPORT] fix-plan-plus-ci
  Status: Pending
  blockedBy: CHECK
```
