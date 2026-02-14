# Migration Guide: bkit-claude-code to bkit-codex

This guide helps existing bkit-claude-code users migrate to bkit-codex on the OpenAI Codex platform.

## What Works Immediately (100% Compatible)

These files transfer directly without modification:

| File/Directory | Notes |
|----------------|-------|
| `docs/.pdca-status.json` | v2.0 schema is identical |
| `docs/.bkit-memory.json` | Same format |
| `docs/01-plan/` | Plan documents work as-is |
| `docs/02-design/` | Design documents work as-is |
| `docs/03-analysis/` | Analysis documents work as-is |
| `docs/04-report/` | Report documents work as-is |

Simply install bkit-codex in your project and your existing PDCA state and documents will be recognized.

## What Requires Manual Migration

### CLAUDE.md to AGENTS.md

**Before** (bkit-claude-code):
```
# .claude/CLAUDE.md or CLAUDE.md
Custom project instructions for Claude Code
```

**After** (bkit-codex):
```
# AGENTS.md
Custom project instructions for Codex
```

The bkit installer creates a standard `AGENTS.md`. Merge any custom rules from your `CLAUDE.md` into `AGENTS.md`.

### Plugin Directory to Skills

**Before**:
```
.claude-plugin/          # or wherever bkit was installed
  skills/
  scripts/
  hooks.json
```

**After**:
```
.bkit-codex/             # bkit-codex repository clone
.agents/skills/          # Symlinks to bkit-codex skills
.codex/config.toml       # MCP server configuration
```

Remove the old `.claude-plugin/` directory after installing bkit-codex.

## Terminology Mapping

| bkit-claude-code | bkit-codex | Notes |
|------------------|------------|-------|
| Plugin | Agent Skills | Platform extension unit |
| CLAUDE.md | AGENTS.md | Project instruction file |
| Hooks (10 events) | MCP Tools (16) | Event-based to request-based |
| Scripts (45 .js) | MCP Server src/ | Node.js logic consolidated |
| Agents (16) | SKILL.md description | Roles merged into skill descriptions |
| `skills_preload` | `references/` | Preload to on-demand |
| `context: fork` | Codex sandbox | Context isolation |
| `user-invocable` | `$` prefix | Explicit invocation |
| Output Styles (4) | AGENTS.md rules | Response style integrated |
| Plugin Root | `.agents/skills/` | Skill root directory |
| `process.env.CLAUDE_PROJECT_DIR` | MCP `projectDir` arg | Project path access |

## Feature Comparison

| Feature | bkit-claude-code | bkit-codex | Status |
|---------|:----------------:|:----------:|:------:|
| PDCA Workflow | Full | Full | Equivalent |
| Level Detection | Auto | Auto | Equivalent |
| 9-Phase Pipeline | Full | Full | Equivalent |
| 8-Language Support | Full | Full | Equivalent |
| Pre-write Check | Hook (100%) | MCP (~80%) | Reduced |
| Post-write Guide | Hook (100%) | MCP (~75%) | Reduced |
| Intent Detection | Hook (100%) | MCP (~85%) | Reduced |
| Team Orchestration | Full | Not Available | Lost |
| Gap Analysis | Agent-driven | AI-guided + MCP | Changed |
| Output Styles | 4 dedicated | AGENTS.md rules | Simplified |
| Codex Learning | N/A | New skill | New |

## What Cannot Be Migrated

### Team Orchestration

bkit-claude-code supports multi-agent teams (SubagentStart/Stop hooks). Codex does not have an equivalent team system. Multi-agent workflows must be handled manually or through sequential skill invocations.

### Hook-Based Guarantees

bkit-claude-code hooks provided 100% automation (every file write was checked, every prompt was analyzed). bkit-codex relies on AGENTS.md instructions which the AI follows ~70% of the time. The MCP tools are available but not forcefully invoked.

### Output Style System

The 4 dedicated output styles (Starter, Dynamic, Enterprise, bkend) are replaced by level-specific formatting rules in AGENTS.md. The result is similar but less strictly enforced.

## Migration Steps

1. **Install bkit-codex** in your project (see [Installation Guide](installation.md))
2. **Verify PDCA state** is recognized: run `$pdca status` in Codex
3. **Merge CLAUDE.md** custom rules into the new `AGENTS.md`
4. **Remove old plugin**: delete `.claude-plugin/` directory
5. **Test PDCA cycle**: create a small feature and run through plan/design/do/check
6. **Adjust config** in `bkit.config.json` if you had custom thresholds

## Skill Name Changes

All skill names remain identical. The invocation syntax changes slightly:

**Before** (Claude Code):
```
/pdca plan user-auth
/starter
/code-review
```

**After** (Codex):
```
$pdca plan user-auth
$starter
$code-review
```

The `/` prefix becomes `$` in Codex.
