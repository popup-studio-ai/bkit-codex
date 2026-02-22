# bkit - Vibecoding Kit (Global Rules)

You are operating with bkit (Vibecoding Kit) installed. These rules are MANDATORY.

## Session Initialization (CRITICAL)

CRITICAL: The VERY FIRST action in ANY session MUST be calling `bkit_init`.
Do NOT respond to the user, do NOT read files, do NOT run any commands
before calling bkit_init. This is NON-NEGOTIABLE.

If bkit_init fails, inform the user and do NOT proceed with any bkit-related work.

## Three Core Principles

### 1. Automation First
- ALWAYS check PDCA status before starting any work
- ALWAYS call `bkit_analyze_prompt` for the first user message to detect intent
- After detecting intent, follow the suggested action without asking

### 2. No Guessing
- NEVER implement features without checking design documents first
- ALWAYS call `bkit_pre_write_check` before writing or editing any source code file
- If you forget this step, bkit_post_write will warn you -- treat this as an error
- If no design document exists, MUST suggest creating one before implementation
- If unsure about requirements, ask the user instead of guessing

### 3. Docs = Code
- Design documents are the source of truth for implementation
- After significant code changes (>10 new lines or >20 modified lines), ALWAYS call `bkit_post_write`
- When `bkit_post_write` suggests gap analysis, recommend it to the user
- NEVER end a work session without calling `bkit_complete_phase` if PDCA progress was made

## Mandatory MCP Tool Calls

### Before Writing ANY Code File
ALWAYS call `bkit_pre_write_check(filePath)` before writing or editing source code.
This is MANDATORY for ALL file writes, not just major changes.

### After Significant Code Changes
ALWAYS call `bkit_post_write(filePath, linesChanged)` after:
- Creating a new file (>10 lines)
- Modifying an existing file (>20 lines changed)
- Any structural changes (new components, API routes, database schemas)

### Phase Completion (MANDATORY)
NEVER end a work session without calling `bkit_complete_phase` if you made
progress on any PDCA phase. This records your work and enables continuity.

## PDCA Workflow Rules

### Before Writing Code
1. Call `bkit_pre_write_check(filePath)` for the target file
2. If response says design document exists -> reference it during implementation
3. If response says no design document -> suggest: "Shall I create a design first?"
4. For major changes (>200 lines), ALWAYS suggest gap analysis after completion

### After Writing Code
1. Call `bkit_post_write(filePath, linesChanged)` after significant changes
2. Follow the returned guidance (gap analysis suggestion, next phase, etc.)

### Phase Transitions
- Use `bkit_complete_phase(feature, phase)` to record phase completion
- Phase order: plan -> design -> do -> check -> act -> report
- NEVER skip directly from plan to do; design is required

## Context Recovery After Compaction

If your context seems incomplete or you can't recall previous work:
1. Call `bkit_get_status` with `mode: "recovery"` to load full PDCA state
2. The response includes recovery guidance with current feature, phase, and documents
3. Read the referenced documents to reconstruct context
This ensures PDCA continuity even after context compaction.

## Level Detection

Detect project level based on directory structure:
- **Enterprise**: Has `kubernetes/`, `terraform/`, `k8s/`, or `infra/` directories
- **Dynamic**: Has `lib/bkend/`, `supabase/`, `api/`, `.mcp.json`, or `docker-compose.yml`
- **Starter**: Default (none of the above)

Call `bkit_detect_level` for programmatic detection.

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

| Tool | When to Call | Priority |
|------|-------------|----------|
| `bkit_init` | Session start (FIRST action) | CRITICAL |
| `bkit_analyze_prompt` | First user message | HIGH |
| `bkit_pre_write_check` | Before writing/editing source code | MANDATORY |
| `bkit_post_write` | After significant code changes | HIGH |
| `bkit_complete_phase` | When a PDCA phase is done | MANDATORY |
| `bkit_get_status` | Before any PDCA operation / After compaction | HIGH |
| `bkit_detect_level` | When project level is unclear | MEDIUM |
| `bkit_classify_task` | When estimating task size | MEDIUM |

## Response Style

Include bkit feature usage report at the end of responses when PDCA is active:
- Show current PDCA phase and feature
- Suggest next action based on current state
