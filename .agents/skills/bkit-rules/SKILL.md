---
name: bkit-rules
description: |
  Core rules for bkit PDCA methodology. Detailed reference for document-driven
  development, level detection, task classification, and code quality standards.
  Use when you need detailed bkit rules beyond what AGENTS.md provides.
  Triggers: bkit rules, PDCA rules, development rules, coding standards,
  개발 규칙, 코딩 표준, ルール, 规则, reglas, règles, Regeln, regole
  Do NOT use for: specific PDCA actions (use $pdca instead).
---

# bkit Core Rules (Detailed Reference)

> Comprehensive rules for bkit's document-driven AI-native development methodology.

## 1. PDCA Auto-Apply Rules

### Task Classification

Classify tasks to determine the appropriate PDCA level:

| Classification | Content Size | PDCA Level | Action |
|----------------|-------------|------------|--------|
| Quick Fix | < 10 lines | None | Execute immediately |
| Minor Change | < 50 lines | Recommended | Show summary, proceed |
| Feature | < 200 lines | Required | Check/create design doc |
| Major Feature | >= 200 lines | Required + Split | Require design, split into subtasks |

#### Classification Keywords

| Classification | Keywords |
|----------------|----------|
| Quick Fix | fix, typo, correct, adjust, tweak |
| Minor Change | improve, refactor, enhance, optimize, update |
| Feature | add, create, implement, build, new feature |
| Major Feature | redesign, migrate, architecture, overhaul, rewrite |

### Design Document Check Flow

Before writing code, follow this decision tree:

1. Extract feature name from file path or user request
2. Check: `docs/01-plan/features/{feature}.plan.md`
3. Check: `docs/02-design/features/{feature}.design.md`
4. Decision:
   - If neither exists: suggest creating a plan first
   - If plan exists but no design: suggest creating a design
   - If both exist: reference design during implementation
   - If task is Quick Fix (<10 lines): skip PDCA, proceed directly

### Pre-Write Rules

Before writing or editing any source code file:

1. Call `bkit_pre_write_check(filePath)` MCP tool
2. If response says design document exists: reference it during implementation
3. If response says no design document: suggest "Shall I create a design first?"
4. For major changes (>200 lines): ALWAYS suggest creating design first

### Post-Write Guidance Rules

After significant code changes:

1. Call `bkit_post_write(filePath, linesChanged)` MCP tool
2. Follow the returned guidance
3. For features with design docs: suggest gap analysis
4. Format suggestion: "Consider running gap analysis: $pdca analyze {feature}"

---

## 2. Level Detection Rules

Detect project level based on directory structure and config files.

### Enterprise (2+ conditions met)

- `kubernetes/`, `terraform/`, `k8s/`, or `infra/` directories exist
- `services/` folder with 2+ services
- `turbo.json` or `pnpm-workspace.yaml`
- `docker-compose.yml`
- `.github/workflows/` (CI/CD)

### Dynamic (1+ conditions met)

- `lib/bkend/` or `src/lib/bkend/` directory
- `.mcp.json` with bkend configuration
- `supabase/` folder
- `firebase.json`
- `api/` or `backend/` directory
- `docker-compose.yml` (without K8s indicators)
- `package.json` containing: `bkend`, `@supabase`, `firebase`

### Starter

None of the above conditions met. Default level for simple projects.

### Level-Specific Behavior

| Aspect | Starter | Dynamic | Enterprise |
|--------|---------|---------|------------|
| Explanation | Friendly, avoid jargon | Technical but clear | Concise, use terms |
| Code comments | Detailed | Core logic only | Architecture only |
| Error handling | Step-by-step guide | Technical solutions | Brief cause + fix |
| PDCA docs | Simple | Feature-specific | Detailed architecture |
| Reference Skill | `$starter` | `$dynamic` | `$enterprise` |

### Level Upgrade Signals

- Starter to Dynamic: "Add login", "Save data", "Admin page"
- Dynamic to Enterprise: "High traffic", "Microservices", "Own server"

---

## 3. 8-Language Trigger Keywords

bkit supports trigger detection in 8 languages:

| Language | Plan | Design | Analyze | Report |
|----------|------|--------|---------|--------|
| EN | plan, planning | design, architecture | analyze, verify, check | report, summary |
| KO | 계획, 기획 | 설계, 아키텍처 | 분석, 검증 | 보고서, 요약 |
| JA | 計画 | 設計 | 分析, 検証 | 報告 |
| ZH | 计划 | 设计 | 分析, 验证 | 报告 |
| ES | planificar | diseño | analizar | informe |
| FR | planifier | conception | analyser | rapport |
| DE | planen | Entwurf | analysieren | Bericht |
| IT | pianificare | progettazione | analizzare | rapporto |

### Feature Keywords by Language

| Language | Feature Request | Bug Fix | Refactor |
|----------|----------------|---------|----------|
| EN | add, create, implement | fix, bug, error | refactor, clean |
| KO | 추가, 생성, 구현 | 수정, 버그, 오류 | 리팩토링, 정리 |
| JA | 追加, 作成, 実装 | 修正, バグ, エラー | リファクタリング |
| ZH | 添加, 创建, 实现 | 修复, 错误 | 重构 |
| ES | agregar, crear | arreglar, error | refactorizar |
| FR | ajouter, créer | corriger, erreur | refactoriser |
| DE | hinzufügen, erstellen | beheben, Fehler | refaktorisieren |
| IT | aggiungere, creare | correggere, errore | rifattorizzare |

---

## 4. Naming Conventions

### Code Naming Rules

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `UserProfile`, `LoginForm` |
| Functions | camelCase | `getUserById()`, `handleSubmit()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse` |
| Files (component) | PascalCase.tsx | `UserProfile.tsx` |
| Files (utility) | camelCase.ts | `formatDate.ts` |
| Folders | kebab-case | `user-profile/`, `auth-provider/` |

### Document Naming Rules

| Format | Example | When to Use |
|--------|---------|-------------|
| `{feature}.plan.md` | `user-auth.plan.md` | Plan documents |
| `{feature}.design.md` | `user-auth.design.md` | Design documents |
| `{feature}.analysis.md` | `user-auth.analysis.md` | Analysis reports |
| `{feature}.report.md` | `user-auth.report.md` | Completion reports |

---

## 5. Code Quality Standards

### Core Principles

- **DRY**: Extract to common function on 2nd use
- **SRP**: One function, one responsibility
- **No Hardcoding**: Use meaningful constants
- **Extensibility**: Write in generalized patterns

### Pre-coding Checks

1. Does similar functionality exist? Search first
2. Check `utils/`, `hooks/`, `components/ui/`
3. Reuse if exists; create if not

### Self-Check After Coding

- Same logic exists elsewhere?
- Can function be reused?
- Hardcoded values present?
- Function does only one thing?

### When to Refactor

- Same code appears 2nd time
- Function exceeds 20 lines
- if-else nests 3+ levels
- Same parameters passed to multiple functions

### Safety Rules

- NEVER commit `.env`, credentials, or secret files
- ALWAYS validate user input at system boundaries
- Prefer explicit error handling over silent failures
- Follow OWASP Top 10 guidelines for security:
  - Input validation (XSS, SQL Injection prevention)
  - Authentication/authorization handling
  - Sensitive data encryption
  - HTTPS enforcement
  - Rate limiting

---

## 6. MCP Tools Quick Reference

| Tool | When to Call | Priority |
|------|-------------|----------|
| `bkit_init` | Session start | P0 |
| `bkit_analyze_prompt` | First user message | P1 |
| `bkit_get_status` | Before any PDCA operation | P0 |
| `bkit_pre_write_check` | Before writing/editing source code | P0 |
| `bkit_post_write` | After significant code changes | P1 |
| `bkit_complete_phase` | When a PDCA phase is done | P0 |
| `bkit_detect_level` | When project level is unclear | P1 |
| `bkit_classify_task` | When estimating task size | P1 |
| `bkit_pdca_plan` | Creating plan document | P0 |
| `bkit_pdca_design` | Creating design document | P0 |
| `bkit_pdca_analyze` | Running gap analysis | P1 |
| `bkit_pdca_next` | Suggesting next phase | P1 |
| `bkit_select_template` | Selecting PDCA template | P2 |
| `bkit_check_deliverables` | Verifying phase deliverables | P2 |
| `bkit_memory_read` | Reading session memory | P2 |
| `bkit_memory_write` | Writing session memory | P2 |

---

## 7. Response Style Guidelines

### Include bkit Feature Usage Report

When PDCA is active, include at the end of responses:

```
---
bkit Status: {feature} | Phase: {phase} | Match Rate: {rate}%
Next: {suggested next action}
```

### Level-Appropriate Formatting

- **Starter**: Include learning points, explain concepts simply
- **Dynamic**: Include PDCA status badges, checklists, next-step guidance
- **Enterprise**: Include tradeoff analysis, cost impact, deployment considerations
