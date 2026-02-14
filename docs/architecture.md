# Architecture Overview

## Design Philosophy

bkit-codex preserves three core philosophies from bkit-claude-code:

1. **Automation First** - AI follows rules and calls MCP tools without being asked
2. **No Guessing** - Always check design documents before implementing
3. **Docs = Code** - Design documents are the source of truth

## Architecture Paradigm Shift

```
bkit-claude-code (Hook-Driven, 100% Auto)
  Hook Event --> Script (stdin/stdout) --> decision: allow/block
  = System controls the AI

bkit-codex (Instruction-Driven, ~70% Auto)
  AGENTS.md Rule --> AI reads --> AI calls MCP Tool --> MCP returns guidance
  = AI voluntarily follows rules
```

## 3-Tier Context Strategy

```
+------------------------------------------------------------------+
|                    Tier 1: AGENTS.md                              |
|                    (Always Loaded)                                |
|                                                                  |
|  Global AGENTS.md (~3.8 KB)    Project AGENTS.md (~2.0 KB)      |
|  - Session initialization      - Level-specific guidance         |
|  - 3 Core Principles           - Key skills reference            |
|  - PDCA workflow rules          - Response format rules           |
|  - MCP tools reference          - PDCA status location            |
|  - Code quality standards                                        |
|                                                                  |
|  Total: ~5.8 KB / 32 KB limit (18% used, 82% available)         |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Tier 2: SKILL.md                               |
|                    (On-Demand Loading)                            |
|                                                                  |
|  Phase 1: name + description only (metadata scan)                |
|    26 skills * ~200 bytes = ~5 KB                                |
|                                                                  |
|  Phase 2: Full SKILL.md body (when skill is activated)           |
|    Loaded when AI matches triggers or user invokes $skill        |
|                                                                  |
|  Progressive Disclosure minimizes context usage                  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Tier 3: references/                            |
|                    (Deep Dive on Request)                         |
|                                                                  |
|  ~30 reference files across all skills                           |
|  - PDCA templates (plan, design, analysis, report)               |
|  - Phase-specific patterns and checklists                        |
|  - Code quality standards and naming conventions                 |
|                                                                  |
|  Loaded only when AI explicitly requests a reference file        |
+------------------------------------------------------------------+
```

## Component Architecture

```
+---------------------+     +---------------------+     +------------------+
|    Codex CLI        |     |    AGENTS.md         |     |   SKILL.md       |
|                     |     |    (Rules)           |     |   (26 Skills)    |
|  - User input       |---->|  - MUST/ALWAYS/NEVER |---->|  - Triggers      |
|  - AI reasoning     |     |  - MCP tool refs     |     |  - Instructions  |
|  - Tool execution   |     |  - Quality standards |     |  - references/   |
+---------------------+     +---------------------+     +------------------+
         |                                                        |
         v                                                        v
+------------------------------------------------------------------+
|                    MCP Server (STDIO)                             |
|                    @popup-studio/bkit-codex-mcp                  |
|                                                                  |
|  +------------------+  +------------------+  +------------------+|
|  |  16 MCP Tools    |  |  lib/ (~75 fn)   |  |  State Files     ||
|  |                  |  |                  |  |                  ||
|  |  bkit_init       |  |  core/           |  |  .pdca-status    ||
|  |  bkit_get_status |  |    config.js     |  |  .bkit-memory    ||
|  |  bkit_pre_write  |  |    cache.js      |  |                  ||
|  |  bkit_post_write |  |    file.js       |  |                  ||
|  |  bkit_complete   |  |    path.js       |  |                  ||
|  |  bkit_pdca_*     |  |  pdca/           |  |                  ||
|  |  bkit_analyze    |  |    status.js     |  |                  ||
|  |  bkit_classify   |  |    level.js      |  |                  ||
|  |  bkit_detect     |  |    phase.js      |  |                  ||
|  |  bkit_template   |  |    automation.js |  |                  ||
|  |  bkit_deliver    |  |    template.js   |  |                  ||
|  |  bkit_memory_*   |  |  intent/         |  |                  ||
|  |                  |  |    language.js   |  |                  ||
|  |                  |  |    trigger.js    |  |                  ||
|  |                  |  |    ambiguity.js  |  |                  ||
|  |                  |  |  task/           |  |                  ||
|  |                  |  |    classify.js   |  |                  ||
|  |                  |  |    creator.js    |  |                  ||
|  +------------------+  +------------------+  +------------------+|
+------------------------------------------------------------------+
```

## Session Lifecycle

```
Session Start
    |
    +-- 1. Codex reads ~/.codex/AGENTS.md (Global)      ~3.8 KB
    |
    +-- 2. Codex reads ./AGENTS.md (Project)             ~2.0 KB
    |
    +-- 3. Concatenate (root-to-CWD)                     ~5.8 KB / 32 KB
    |
    +-- 4. Load skill metadata (Progressive Disclosure Phase 1)
    |       26 skills: name + description only
    |
    +-- 5. MCP Server starts (via config.toml)
    |       bkit-codex-mcp: 16 tools available
    |
    +-- 6. AI reads AGENTS.md rules --> calls bkit_init
            Session initialized, ready for user input
```

## Automation Guarantee Levels

| Behavior | bkit-claude-code (Hook) | bkit-codex (AGENTS.md + MCP) | Guarantee |
|----------|:----------------------:|:----------------------------:|:---------:|
| Session init | 100% | 95% | High |
| Intent detection | 100% | 85% | Good |
| Pre-write check | 100% | 80% | Good |
| Post-write guide | 100% | 75% | Moderate |
| Phase transition | 100% | 80% | Good |
| Team orchestration | 100% | N/A | N/A |
| **Average** | **100%** | **~69%** | |

## State Management

### PDCA Status (`docs/.pdca-status.json`)

```json
{
  "version": "2.0",
  "lastUpdated": "2026-02-14T09:00:00.000Z",
  "activeFeatures": ["user-auth"],
  "primaryFeature": "user-auth",
  "features": {
    "user-auth": {
      "phase": "design",
      "matchRate": null,
      "iterationCount": 0,
      "documents": {
        "plan": "docs/01-plan/features/user-auth.plan.md",
        "design": "docs/02-design/features/user-auth.design.md"
      }
    }
  }
}
```

### Session Memory (`docs/.bkit-memory.json`)

```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-14T09:00:00.000Z",
  "data": {
    "lastFeature": "user-auth",
    "sessionCount": 5,
    "userPreferences": { "language": "ko", "level": "Dynamic" }
  }
}
```

Both state files are 100% compatible between bkit-claude-code and bkit-codex.

## MCP Server Protocol

The MCP server uses JSON-RPC 2.0 over STDIO:

- **Transport**: stdin/stdout (JSON-RPC), stderr (logging)
- **Protocol Version**: 2024-11-05
- **Dependencies**: Zero external dependencies (pure Node.js)
- **Methods**: `initialize`, `tools/list`, `tools/call`, `notifications/initialized`

## Directory Structure

```
bkit-codex/
|
+-- .agents/skills/              # 26 Codex Agent Skills
|   +-- bkit-rules/              # Core rules reference
|   +-- pdca/                    # PDCA workflow management
|   +-- bkit-templates/          # Template selection
|   +-- starter/                 # Beginner guidance
|   +-- dynamic/                 # Fullstack guidance
|   +-- enterprise/              # Enterprise guidance
|   +-- development-pipeline/    # 9-phase overview
|   +-- phase-1-schema/ ... phase-9-deployment/
|   +-- code-review/             # Code quality analysis
|   +-- zero-script-qa/          # Log-based testing
|   +-- mobile-app/              # React Native/Flutter
|   +-- desktop-app/             # Electron/Tauri
|   +-- codex-learning/          # Codex CLI guide
|   +-- bkend-*/                 # bkend.ai ecosystem (5 skills)
|
+-- packages/mcp-server/         # MCP Server
|   +-- src/tools/               # 16 tool implementations
|   +-- src/lib/                 # Ported library (~75 functions)
|   +-- tests/                   # Test suite
|
+-- AGENTS.md                    # Sample Project AGENTS.md
+-- agents.global.md             # Global AGENTS.md template
+-- bkit.config.json             # Internal configuration
+-- install.sh / install.ps1     # Installers
```
