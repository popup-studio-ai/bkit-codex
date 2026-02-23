# fix-plan-plus-ci - Design Document

> Version: 1.0.0 | Date: 2026-02-23 | Status: Draft
> Level: Dynamic
> Plan: docs/01-plan/features/fix-plan-plus-ci.plan.md

---

## 1. Current State Analysis

### 1.1 plan-plus 디렉토리 구조 (현재 - 비표준)

```
.agents/skills/plan-plus/
├── SKILL.md                       # 정상
├── openai.yaml                    # 비표준: agents/ 없이 루트에 위치
└── references/
    └── plan-plus-process.md       # 정상
```

### 1.2 표준 디렉토리 구조 (다른 26개 스킬)

```
.agents/skills/{skill-name}/
├── SKILL.md
├── agents/
│   └── openai.yaml                # 표준: agents/ 하위
└── references/
    └── {reference-files}.md
```

### 1.3 plan-plus/openai.yaml 현재 내용

```yaml
interface:
  brand_color: "#8B5CF6"
policy:
  allow_implicit_invocation: true
```

- `brand_color: "#8B5CF6"` (보라색) - 다른 스킬의 `"#3B82F6"` (파란색)과 의도적으로 다름
- 이 차이는 plan-plus가 enhanced planning 스킬임을 시각적으로 구분하기 위한 것으로 유지

### 1.4 validate-skills.js 검증 로직 (현재)

```javascript
// scripts/validate-skills.js lines 159-168
const yamlFile = path.join(skillDir, 'agents', 'openai.yaml');
if (!fs.existsSync(yamlFile)) {
  errors.push('Missing agents/openai.yaml');  // 기대 경로가 에러 메시지에 없음
} else {
  const yamlErr = validateYamlFile(yamlFile);
  if (yamlErr) {
    errors.push(`agents/openai.yaml: ${yamlErr}`);
  }
}
```

**문제점**: 에러 메시지 `'Missing agents/openai.yaml'`이 상대적 경로만 표시하여, 어떤 스킬에서 어떤 절대 경로가 기대되는지 명확하지 않음. 실제 CI 로그에서는 스킬 이름이 별도 라인에 출력되므로 큰 문제는 아니지만, 개발자 경험을 위해 개선 가능.

### 1.5 영향 받는 GitHub Actions 워크플로우

| Workflow | File | 실패 Job | validate-skills.js 호출 |
|----------|------|----------|------------------------|
| Validate Skills | `.github/workflows/validate.yml` | `validate` | line 12: `node scripts/validate-skills.js` |
| Test Install Scripts | `.github/workflows/test-install.yml` | `test-skills-validation` | line 42: `node scripts/validate-skills.js` |

두 워크플로우 모두 동일한 `validate-skills.js`를 호출하므로, 파일 이동 한 번으로 **두 워크플로우 모두 해결**.

---

## 2. Target Design

### 2.1 plan-plus 디렉토리 구조 (수정 후)

```
.agents/skills/plan-plus/
├── SKILL.md                       # 변경 없음
├── agents/
│   └── openai.yaml                # 이동됨: 표준 위치
└── references/
    └── plan-plus-process.md       # 변경 없음
```

### 2.2 agents/openai.yaml 내용 (수정 후 - 동일)

```yaml
interface:
  brand_color: "#8B5CF6"
policy:
  allow_implicit_invocation: true
```

내용 변경 없음. 파일 위치만 이동.

### 2.3 validate-skills.js 에러 메시지 개선

**Before:**
```javascript
errors.push('Missing agents/openai.yaml');
```

**After:**
```javascript
errors.push(`Missing agents/openai.yaml (expected at ${yamlFile})`);
```

이를 통해 CI 로그에서 기대 경로를 즉시 확인 가능:
```
FAIL: plan-plus
  - Missing agents/openai.yaml (expected at /home/runner/work/.agents/skills/plan-plus/agents/openai.yaml)
```

---

## 3. File-by-File Change Specification

### 3.1 파일 이동: openai.yaml

| Action | Path |
|--------|------|
| 삭제 | `.agents/skills/plan-plus/openai.yaml` |
| 생성 | `.agents/skills/plan-plus/agents/openai.yaml` |

**Git 명령:**
```bash
mkdir -p .agents/skills/plan-plus/agents
git mv .agents/skills/plan-plus/openai.yaml .agents/skills/plan-plus/agents/openai.yaml
```

`git mv`를 사용하여 Git이 파일 이동을 추적하도록 함.

### 3.2 수정: scripts/validate-skills.js

**변경 위치:** line 162

**Before (line 162):**
```javascript
      errors.push('Missing agents/openai.yaml');
```

**After (line 162):**
```javascript
      errors.push(`Missing agents/openai.yaml (expected at ${yamlFile})`);
```

변경 범위: **1줄**. 로직 변경 없이 에러 메시지만 개선.

---

## 4. Implementation Steps

```
Step 1: agents/ 디렉토리 생성
        mkdir -p .agents/skills/plan-plus/agents

Step 2: openai.yaml 이동 (git mv)
        git mv .agents/skills/plan-plus/openai.yaml .agents/skills/plan-plus/agents/openai.yaml

Step 3: validate-skills.js 에러 메시지 개선
        line 162: 기대 경로를 포함하도록 수정

Step 4: 로컬 검증
        node scripts/validate-skills.js
        Expected: Results: 27/27 passed

Step 5: 커밋 및 푸시 (사용자 승인 후)
```

---

## 5. Verification Plan

### 5.1 로컬 검증

```bash
# 1. validate-skills.js 실행 → 27/27 통과 확인
node scripts/validate-skills.js

# 2. openai.yaml 내용 보존 확인
cat .agents/skills/plan-plus/agents/openai.yaml
# Expected: brand_color: "#8B5CF6"

# 3. 기존 위치 파일 제거 확인
ls .agents/skills/plan-plus/openai.yaml
# Expected: No such file or directory

# 4. 다른 스킬 영향 없음 확인
ls .agents/skills/*/agents/openai.yaml | wc -l
# Expected: 27 (모든 스킬)
```

### 5.2 CI 검증

커밋 & 푸시 후 GitHub Actions에서 확인:

| Workflow | Expected |
|----------|----------|
| Validate Skills | Pass (27/27) |
| Test Install Scripts | Pass |
| Test MCP Server | Pass (기존 통과, 영향 없음) |

---

## 6. Rollback Plan

변경이 극히 단순하므로, 롤백 시:

```bash
git mv .agents/skills/plan-plus/agents/openai.yaml .agents/skills/plan-plus/openai.yaml
rmdir .agents/skills/plan-plus/agents
git revert <commit-hash>
```

---

## 7. Breaking Changes

**없음.** 모든 변경은 하위 호환:

- `openai.yaml` 내용 불변 (위치만 이동)
- `validate-skills.js` 에러 메시지만 더 상세해짐 (검증 로직 불변)
- 심링크는 스킬 디렉토리 레벨이므로 내부 파일 이동에 영향 없음
- `SKILL.md`, `references/` 변경 없음
