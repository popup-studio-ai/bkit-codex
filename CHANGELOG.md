# Changelog

All notable changes to bkit-codex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-02-23

### Fixed

- **plan-plus skill**: Moved `openai.yaml` from skill root to standard `agents/` directory, fixing CI validation failure (26/27 → 27/27)

### Improved

- **validate-skills.js**: Error message now includes expected file path for easier debugging

## [1.0.0] - 2026-02-14

### Added

- **AGENTS.md**: Global and project-level AGENTS.md for bkit core rules
  - Global AGENTS.md (~3.8 KB): Session init, 3 Core Principles, PDCA workflow, code quality
  - Project AGENTS.md (~2.0 KB): Level detection, key skills, response format
  - Mandatory MCP tool calls: pre-write, post-write, phase completion enforcement
  - Level-specific response format (Starter/Dynamic/Enterprise)
  - Context Recovery After Compaction section

- **27 Agent Skills** ported from bkit-claude-code v1.5.4
  - P0 Core: `bkit-rules`, `pdca`, `bkit-templates`
  - P1 Level & Pipeline: `starter`, `dynamic`, `enterprise`, `development-pipeline`, `phase-1` through `phase-9`
  - P2 Specialized: `code-review`, `zero-script-qa`, `mobile-app`, `desktop-app`, `codex-learning` (new), `plan-plus` (new)
  - P3 bkend Ecosystem: `bkend-quickstart`, `bkend-data`, `bkend-auth`, `bkend-storage`, `bkend-cookbook`

- **MCP Server** (`@popup-studio/bkit-codex-mcp`) with 16 tools
  - Session: `bkit_init` (with compact summary, context recovery hint), `bkit_analyze_prompt`
  - PDCA: `bkit_get_status` (with recovery mode), `bkit_pre_write_check`, `bkit_post_write`, `bkit_complete_phase` (with task chain update)
  - PDCA Actions: `bkit_pdca_plan` (with task chain creation), `bkit_pdca_design`, `bkit_pdca_analyze`, `bkit_pdca_next`
  - Utility: `bkit_classify_task`, `bkit_detect_level`, `bkit_select_template`, `bkit_check_deliverables`
  - Memory: `bkit_memory_read`, `bkit_memory_write`

- **Lib modules** (~80 functions ported from 241)
  - `core/`: config, cache, file, path (20 functions)
  - `pdca/`: status, level, phase, automation, template (40 functions)
  - `intent/`: language, trigger, ambiguity (12 functions)
  - `task/`: classification, creator, task chain (8 functions)

- **Context Recovery Mode (C-3)**: State reconstruction after context compaction
  - `bkit_get_status` supports `mode: "recovery"` for full state reconstruction
  - `getCompactSummary()` / `parseCompactSummary()` for compact state representation
  - Recovery guidance with current feature, phase, documents, and next action

- **Task Chain (C-4)**: Linked PDCA task progression
  - `createTaskChain()` generates 5 linked tasks: Plan -> Design -> Do -> Check -> Report
  - `updateTaskChain()` automatically advances task status on phase completion

- **plan-plus Skill**: Brainstorming-enhanced planning with 6-phase intent discovery
  - Intent discovery, alternatives exploration, and YAGNI review before plan generation

- **Installation scripts**: `install.sh` (Unix/Mac), `install.ps1` (Windows)
- **Sync Deploy Script**: `scripts/sync-deploy.sh` for dev-to-deploy directory sync
- **CI/CD**: GitHub Actions for skill validation, MCP testing, and npm release
- **Documentation**: Installation guide, architecture overview, migration guide, API references
- **8-language support**: en, ko, ja, zh, es, fr, de, it
- **Tests**: compact-summary, recovery-mode, task-chain, task-chain-update

### Changed

- Architecture paradigm: Hook-Driven (100% auto) to Instruction-Driven (~70% auto)
- Skill format: bkit YAML to Codex SKILL.md with YAML frontmatter
- Agent system: 16 dedicated agents to unified SKILL.md descriptions
- State management: Hook-managed to MCP tool-managed

### Removed

- Hook system (10 events) - replaced by AGENTS.md rules + MCP tools
- Team orchestration (SubagentStart/Stop) - not available in Codex
- Output style system - integrated into AGENTS.md level-specific rules
- 161 functions excluded (Hook I/O, team management, Claude Code-specific)
