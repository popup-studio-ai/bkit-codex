# bkit - Vibecoding Kit (Global Rules)

You are operating with bkit (Vibecoding Kit) installed. These rules are MANDATORY.

## Session Initialization

ALWAYS call `bkit_init` MCP tool at the start of each session before doing any work.
This initializes PDCA state, detects project level, and returns session context.

## Three Core Principles

### 1. Automation First
- ALWAYS check PDCA status before starting any work
- ALWAYS call `bkit_analyze_prompt` for the first user message to detect intent
- After detecting intent, follow the suggested action without asking

### 2. No Guessing
- NEVER implement features without checking design documents first
- ALWAYS call `bkit_pre_write_check` before writing or editing any source code file
- If no design document exists, MUST suggest creating one before implementation
- If unsure about requirements, ask the user instead of guessing

### 3. Docs = Code
- Design documents are the source of truth for implementation
- After significant code changes, call `bkit_post_write` for next-step guidance
- When `bkit_post_write` suggests gap analysis, recommend it to the user

## PDCA Workflow Rules

### Before Writing Code
1. Call `bkit_pre_write_check(filePath)` for the target file
2. If response says design document exists → reference it during implementation
3. If response says no design document → suggest: "Shall I create a design first?"
4. For major changes (>200 lines), ALWAYS suggest gap analysis after completion

### After Writing Code
1. Call `bkit_post_write(filePath, linesChanged)` after significant changes
2. Follow the returned guidance (gap analysis suggestion, next phase, etc.)

### Phase Transitions
- Use `bkit_complete_phase(feature, phase)` to record phase completion
- Phase order: plan → design → do → check → act → report
- NEVER skip directly from plan to do; design is required

## Level Detection

Detect project level based on directory structure:
- **Enterprise**: Has `kubernetes/`, `terraform/`, `k8s/`, or `infra/` directories
- **Dynamic**: Has `lib/bkend/`, `supabase/`, `api/`, `.mcp.json`, or `docker-compose.yml`
- **Starter**: Default (none of the above)

Call `bkit_detect_level` for programmatic detection. Use detected level to select
appropriate skills and templates.

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

| Tool | When to Call |
|------|-------------|
| `bkit_init` | Session start |
| `bkit_analyze_prompt` | First user message |
| `bkit_get_status` | Before any PDCA operation |
| `bkit_pre_write_check` | Before writing/editing source code |
| `bkit_post_write` | After significant code changes |
| `bkit_complete_phase` | When a PDCA phase is done |
| `bkit_detect_level` | When project level is unclear |
| `bkit_classify_task` | When estimating task size |

## Response Style

Include bkit feature usage report at the end of responses when PDCA is active:
- Show current PDCA phase and feature
- Suggest next action based on current state
