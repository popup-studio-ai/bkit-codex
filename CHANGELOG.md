# Changelog

All notable changes to bkit-codex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-14

### Added

- **AGENTS.md**: Global and project-level AGENTS.md for bkit core rules
  - Global AGENTS.md (~3.8 KB): Session init, 3 Core Principles, PDCA workflow, code quality
  - Project AGENTS.md (~2.0 KB): Level detection, key skills, response format

- **26 Agent Skills** ported from bkit-claude-code v1.5.4
  - P0 Core: `bkit-rules`, `pdca`, `bkit-templates`
  - P1 Level & Pipeline: `starter`, `dynamic`, `enterprise`, `development-pipeline`, `phase-1` through `phase-9`
  - P2 Specialized: `code-review`, `zero-script-qa`, `mobile-app`, `desktop-app`, `codex-learning` (new)
  - P3 bkend Ecosystem: `bkend-quickstart`, `bkend-data`, `bkend-auth`, `bkend-storage`, `bkend-cookbook`

- **MCP Server** (`@popup-studio/bkit-codex-mcp`) with 16 tools
  - Session: `bkit_init`, `bkit_analyze_prompt`
  - PDCA: `bkit_get_status`, `bkit_pre_write_check`, `bkit_post_write`, `bkit_complete_phase`
  - PDCA Actions: `bkit_pdca_plan`, `bkit_pdca_design`, `bkit_pdca_analyze`, `bkit_pdca_next`
  - Utility: `bkit_classify_task`, `bkit_detect_level`, `bkit_select_template`, `bkit_check_deliverables`
  - Memory: `bkit_memory_read`, `bkit_memory_write`

- **Lib modules** (~75 functions ported from 241)
  - `core/`: config, cache, file, path (20 functions)
  - `pdca/`: status, level, phase, automation, template (35 functions)
  - `intent/`: language, trigger, ambiguity (12 functions)
  - `task/`: classification, creator (8 functions)

- **Installation scripts**: `install.sh` (Unix/Mac), `install.ps1` (Windows)
- **CI/CD**: GitHub Actions for skill validation, MCP testing, and npm release
- **Documentation**: Installation guide, architecture overview, migration guide, API references
- **8-language support**: en, ko, ja, zh, es, fr, de, it

### Changed

- Architecture paradigm: Hook-Driven (100% auto) to Instruction-Driven (~70% auto)
- Skill format: bkit YAML to Codex SKILL.md with YAML frontmatter
- Agent system: 16 dedicated agents to unified SKILL.md descriptions
- State management: Hook-managed to MCP tool-managed

### Removed

- Hook system (10 events) - replaced by AGENTS.md rules + MCP tools
- Team orchestration (SubagentStart/Stop) - not available in Codex
- Output style system - integrated into AGENTS.md level-specific rules
- 166 functions excluded (Hook I/O, team management, Claude Code-specific)
