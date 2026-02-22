# Research-3: OpenAI Codex CLI GitHub Issues & Community Requirements Analysis

> **Research Date**: 2026-02-21
> **Repository**: [openai/codex](https://github.com/openai/codex)
> **Repo Stats**: 61,276 stars | 8,123 forks | 1,365 open issues | Language: Rust

---

## 1. Repository Overview

OpenAI Codex CLI has evolved into a major open-source AI coding assistant with over 12,400 issues/PRs filed since its creation (April 2025). The project is undergoing rapid development with multiple OpenAI employees actively contributing daily, and a vibrant community submitting both issues and PRs.

### Label System (Issue Categories)
| Label | Description | Area |
|-------|-------------|------|
| `bug` | Something isn't working | Quality |
| `enhancement` | New feature or request | Feature |
| `mcp` | MCP server related | Extensibility |
| `sandbox` | Permissions or sandboxing | Security |
| `agent` | Core agent loop | Architecture |
| `context` | Context management/compaction | Context Engineering |
| `TUI` | Terminal user interface | UX |
| `extension` | VS Code extension | IDE |
| `exec` | `codex exec` subcommand | Headless |
| `sdk` | Codex SDK | Developer |
| `enterprise` | OTEL, RBAC, proxy | Enterprise |
| `custom-model` | Custom/local model providers | Flexibility |
| `app` | Codex desktop app | Product |

---

## 2. Top Feature Requests (by Community Engagement)

### Tier 1: Highest Community Demand (400+ reactions)

| # | Issue | Reactions | Comments | Status |
|---|-------|-----------|----------|--------|
| #2109 | **Event Hooks** - Define event hooks with pattern matching for before/after codex behaviors | 418 THUMBS_UP, 97 ROCKET, 35 EYES | 45 | OPEN |
| #2604 | **Subagent Support** - Official subagent/multi-agent functionality | 315 THUMBS_UP, 46 HEART, 41 ROCKET | 100+ | OPEN |

### Tier 2: Strong Community Demand (30-100 reactions)

| # | Issue | Reactions | Comments | Status |
|---|-------|-----------|----------|--------|
| #8512 | **Implement Codex Plugins same as Claude Plugins** | 47 THUMBS_UP | 7 | OPEN |
| #3696 | **Support remote MCP servers** | 32 THUMBS_UP | 13 | OPEN |
| #8925 | **Support for plugin marketplaces** | 18 THUMBS_UP | - | OPEN |

### Tier 3: Notable Feature Requests (5-30 reactions)

| # | Issue | Reactions | Comments | Status |
|---|-------|-----------|----------|--------|
| #8368 | **Long-term Memory** | 12 THUMBS_UP | 6 | OPEN |
| #9266 | **Lazy MCP load / MCP search tool** | 7 THUMBS_UP | 2 | OPEN |
| #6038 | **Include files in AGENTS.md** (like Claude's @include) | 6 THUMBS_UP | 1 | OPEN |
| #3853 | **Global/centralized AGENTS.md + configuration** | 6 THUMBS_UP | - | OPEN |

---

## 3. Issue Analysis by Category

### 3.1 Plugin / Extension System

The community strongly desires a plugin ecosystem comparable to Claude Code's:

- **#8512** (47 thumbs up): Direct request to implement Claude-style plugins for sharing skills, rules, AGENTS.md
- **#9613**: Concrete MVP proposal for `codex plugin install <git-url>` with skill/prompt/MCP materialization
- **#8925** (18 thumbs up): Plugin marketplace request - users migrating from Claude Code miss the extensibility
- **Key insight**: Users want to share complete Codex setups within teams, including all skills, rules, and AGENTS.md configurations

**bkit-codex implication**: Our PDCA install system directly addresses this gap. The concept of installable, sharable configuration bundles is precisely what the community is requesting.

### 3.2 AGENTS.md / Instructions Management

Multiple issues around improving AGENTS.md capabilities:

| # | Issue | Description |
|---|-------|-------------|
| #12115 | Dynamic nested AGENTS.md loading | Like Claude's on-demand child directory loading |
| #10067 | `--agents` flag for named variants | Switch between review/refactor/debug instruction sets |
| #6038 | Include files in AGENTS.md | `@another-file.md` include syntax |
| #3853 | Global/centralized AGENTS.md | Enterprise-wide shared instructions |
| #11838 | AGENTS.override.md not read | Override mechanism not working |
| #8547 | Auto-reread modified AGENTS.md | Hot-reload within sessions |
| #6149 | Custom AGENTS.md path | Prevent reading from parent directories |
| #7138 | Silent AGENTS.md truncation | No warning when truncated |

**Key community pain points**:
1. Cannot maintain multiple instruction sets per project
2. No file inclusion mechanism (Claude has `@include`)
3. No enterprise-grade centralized management
4. Dynamic/nested loading not supported

**bkit-codex implication**: Our structured approach to kit definitions with context files, rules, and multiple instruction sets directly addresses issues #10067, #6038, and #3853.

### 3.3 MCP (Model Context Protocol) Server Support

MCP is a major area of community activity with its own label:

| # | Issue | Description |
|---|-------|-------------|
| #3696 | Remote MCP servers (32 thumbs up) | HTTP/SSE transport support |
| #9266 | Lazy MCP load / search tool (7 thumbs up) | Reduce context consumption |
| #11765 | MCP server management UX | Better server configuration UI |
| #12058 | Per-tool priority for MCP | Prioritize tools across servers |
| #9325 | MCP settings per profile | Different MCP configs per context |
| #11816 | MCP server hang on approval | Deadlock when elicitation needed |
| #11489 | No auto-reconnect after disconnect | Reliability issue |
| #9989 | Pass workspace directory to MCP | Context awareness |
| #10122 | MCP resume_path for sessions | Session persistence |
| #5059 | MCP prompts support | Full MCP protocol support |
| #7953 | MCP tool select/filter/group | Tool organization |
| #12335 | Auto lifecycle cleanup for sub-agents/MCP | Resource management |
| #9608 | Image input support for MCP tools | Multi-modal support |

**Key themes**:
1. MCP reliability (hang, disconnect, memory leaks)
2. MCP tool context management (lazy loading, filtering)
3. MCP configuration flexibility (per-profile, per-session)
4. Full MCP protocol coverage (prompts, resources)

**bkit-codex implication**: Our MCP configuration management and lazy tool loading approaches address #9266 and #12058 directly.

### 3.4 Hooks / Lifecycle Events

Event hooks is the single most-requested feature:

| # | Issue | Reactions | Description |
|---|-------|-----------|-------------|
| #2109 | 418+ reactions | Event hooks with pattern matching |
| #11912 | - | Custom compaction hook |
| #12190 | - | Governance hooks: policies, threat detection, audit |
| #12208 | Closed | PreCompact hook event |
| #11870 | Closed | Interception hooks for tool results/input |
| #11808 | Closed | Notify hook for approval-request events |
| #8375 | Closed | Inbound hook to resume on external events |
| #7719 | Closed | Support Hooks (general) |

**Community vision**: Users want hooks for:
1. Pre/post command execution
2. Custom compaction strategies
3. Enterprise governance (audit, policy enforcement)
4. External system integration (notifications, CI/CD triggers)
5. Tool result interception and transformation

**Note**: Several hook-related issues are being closed, suggesting OpenAI may be implementing a hooks system. Active PR development confirms this.

**bkit-codex implication**: Our PDCA lifecycle hooks system is a differentiated feature that the Codex community desperately wants. The governance hooks request (#12190) aligns with enterprise PDCA audit trails.

### 3.5 Multi-Agent / Sub-Agent System

Second most-requested feature category:

| # | Issue | Description |
|---|-------|-------------|
| #2604 | Subagent Support (315+ reactions) - foundational request |
| #12047 | Multi-agent TUI overhaul: named agents, per-agent config, @mention |
| #12335 | Auto lifecycle cleanup for completed/idle sub-agents |
| #12431 | Parent agent decides full history for sub-agent |
| #10204 | Each sub-agent can have different tools |
| #11472 | Sub-agent shutdown exits app instead of restoring parent |
| #9912 | Configurable max agent recursion depth |
| #9902 | Persistent "Agents" sidepanel in TUI |
| #11815 | Agent/thread attribution on action rows |
| #12341 | Better notifications for multi-agent |
| #11956 | Multi-repo support |
| #12184 | Multi-worker agent change question problem |

**OpenAI's active development** (from PRs):
- #12332 - Better agent picker in TUI (MERGED)
- #12327 - Cleaner TUI for sub-agents (MERGED)
- #12320 - Add nick name to sub-agents (MERGED)
- #12297 - SDK MVP: collaborationMode + request_user_input + plan items (OPEN)
- #12392 - Detect & support migration from Claude configs (OPEN)

**bkit-codex implication**: Multi-agent orchestration is a rapidly developing area. Our kit-based approach to agent configuration could provide value when integrated with Codex's native multi-agent system.

### 3.6 Context Engineering / Management

Critical pain point for power users:

| # | Issue | Description |
|---|-------|-------------|
| #9505 | Important early context deleted during compaction |
| #8365 | Compaction loop leaves ~5% context, stalls session |
| #11315 | Compaction causes task drift (reverts to stale request) |
| #11072 | Compaction triggered after tool calls in fresh session |
| #10325 | 26% context use from first message |
| #11845 | MCP image data URLs overcount tokens |
| #9601 | Backtrack rewind sets context to 0% |
| #9546 | Context window explodes in long sessions |
| #12063 | Built-in `input_context` tool for iterative context building |
| #10100 | Equivalent of Copilot's `#githubRepo` context |
| #11165 | Improve file context handling (comparison with Cursor) |
| #10165 | Execute plan in new chat with refreshed context |
| #11626 | Checkpoint restore reverting chat context + code edits |

**Key pain points**:
1. Compaction loses critical information (instructions, decisions)
2. Context window fills too quickly with MCP tools
3. No priority-based context retention
4. Long sessions degrade significantly
5. No user control over what gets compacted

**bkit-codex implication**: This is the core opportunity. Our context engineering approach with structured kit definitions, priority-based context loading, and PDCA-guided context management directly addresses the most painful community issues.

### 3.7 Session / Memory Management

| # | Issue | Description |
|---|-------|-------------|
| #8368 | Long-term Memory (12 thumbs up) - cross-session learning |
| #10588 | Session statistics feature |
| #10407 | Offline session export + cache visibility |
| #10714 | Session ID not saving |
| #9876 | Session naming based on full contents |
| #11435 | Parallel exec instances interfere via shared session |
| #5066 | MCP tool to resume conversations from persistence |

### 3.8 Sandbox / Security

| # | Issue | Description |
|---|-------|-------------|
| #12283 | Rules to configure sandbox_policy |
| #11316 | Landlock read restrictions not enforced |
| #10535 | Devcontainer-like sandbox environment |
| #11973 | Allow access to hardware devices |
| #11095 | Cannot reach localhost from sandbox |
| #10390 | Network access silently ignored by seatbelt |
| #4497 | Go tests fail due to restrictive sandbox |
| #12389 | Managed filesystem deny_read blocklist (PR) |
| #12367 | Skill permission overlays in zsh exec bridge (PR) |
| #12353 | Require approval for destructive MCP tool calls (PR - MERGED) |

**Active development**:
- Permission system is being actively refined
- Skill-level permission overlays being added
- Destructive MCP calls now require approval

### 3.9 Custom Model / Provider Support

| # | Issue | Description |
|---|-------|-------------|
| #8937 | OAuth for custom providers |
| #10867 | Custom model providers in app |
| #7590 | reasoning_effort not forwarded to third-party |
| #9083 | Azure AD OAuth2 client credentials |
| #3638 | Azure support in extension GUI |

### 3.10 SDK / Integration

| # | Issue | Description |
|---|-------|-------------|
| #5320 | Python SDK for Codex |
| #11980 | A2A (Agent-to-Agent) session management |
| #12297 | SDK MVP: collaborationMode + request_user_input (PR) |
| #11166 | Expose app-server for remote/mobile session attach |

---

## 4. Active Development Signals (from PRs)

### What OpenAI Is Building Right Now (Feb 2026)

Based on recent merged and open PRs from OpenAI employees:

#### 4.1 Architecture: Rust Rewrite (codex-rs)
- Moving from TypeScript to Rust crate system
- `codex-core`, `codex-skills`, `codex-secrets` crate decomposition
- JSON schema generation improvements
- Protocol/shell re-export cleanup

#### 4.2 Multi-Agent System
- Sub-agent nick names and better agent picker (MERGED)
- Cleaner TUI for sub-agents (MERGED)
- Monitor role for agents (OPEN)
- Agent lifecycle cleanup (OPEN)

#### 4.3 App Server / SDK
- SDK MVP with collaborationMode (OPEN)
- Thread resume improvements (OPEN)
- Caller-supplied thread/turn IDs (OPEN)
- Realtime websocket support (OPEN)
- v2 websocket protocol (OPEN)

#### 4.4 Skills System
- Embedded system skills moved to `codex-skills` crate (MERGED)
- Skill permission overlays (OPEN)
- `/clear` command implementation (OPEN)

#### 4.5 Security / Permissions
- Destructive MCP tool approval required (MERGED)
- Filesystem deny_read blocklist (OPEN)
- Network approval persistence (OPEN)
- Linux sandbox bwrap improvements (OPEN)

#### 4.6 Configuration
- Config diagnostics improvements (MERGED)
- Map value clearing via --config (OPEN)
- Login shell configuration (MERGED)
- Claude config migration flow (OPEN - notable!)

#### 4.7 Claude Code Migration
- **#12392**: Active PR to detect and support migration from Claude Code configs
  - Detects Claude home and repo configs
  - Migrates CLAUDE.md -> AGENTS.md
  - Copies skills, imports MCP servers
  - Non-destructive: only fills missing fields

---

## 5. Community Sentiment Analysis

### What Users Love
1. **Open-source nature** - ability to contribute and customize
2. **GPT model integration** - native access to Codex-optimized models
3. **Multi-platform support** - CLI, Desktop App, VS Code extension
4. **Sandbox security** - safe command execution model
5. **MCP support** - extensibility through tool servers

### Main Pain Points
1. **Context window management** - compaction loses important information, sessions degrade
2. **Plugin/extension ecosystem** - far behind Claude Code in extensibility
3. **Configuration complexity** - AGENTS.md limitations, no multi-variant support
4. **MCP reliability** - hangs, disconnects, memory leaks
5. **Performance degradation** - long sessions become unusable
6. **Multi-agent UX** - raw UUIDs, no named agents, poor orchestration
7. **Enterprise features** - lacking centralized management, governance, audit

### Migration Patterns
- Users explicitly compare with **Claude Code** (plugins, @include, context handling)
- Users compare with **Cursor** (file context handling, UX)
- Users compare with **Copilot** (#githubRepo context feature)
- OpenAI actively building **Claude Code migration** tools (PR #12392)

---

## 6. Implications for bkit-codex Development

### 6.1 Direct Opportunity Areas

| Community Need | bkit-codex Solution | Priority |
|----------------|---------------------|----------|
| Plugin/extension system (#8512, #8925, #9613) | PDCA install system for kit bundles | **CRITICAL** |
| Event hooks (#2109, 418+ reactions) | PDCA lifecycle hooks | **CRITICAL** |
| AGENTS.md variants (#10067, #6038) | Multi-kit definitions with context rules | HIGH |
| Context engineering (#9505, #11315) | Priority-based context loading, smart compaction | HIGH |
| Long-term memory (#8368) | PDCA memory/learning persistence | HIGH |
| Governance/audit (#12190) | PDCA audit trail + policy enforcement | MEDIUM |
| MCP lazy loading (#9266) | Kit-managed MCP configurations | MEDIUM |
| Global instructions (#3853) | Centralized kit repository | MEDIUM |

### 6.2 Competitive Positioning

1. **vs. Claude Code**: Codex community is catching up on extensibility. bkit-codex bridges the gap by bringing structured kit management to Codex.

2. **Plugin Install Gap**: The #1 community request after hooks is a plugin system. Our `bkit install` approach directly addresses this with a more structured PDCA methodology.

3. **Context Engineering**: This is the biggest pain point. Our context engineering approach with structured rules and priorities provides a solution the community is actively seeking.

4. **Enterprise**: Growing demand for governance, audit trails, centralized management. Our PDCA approach naturally provides these capabilities.

### 6.3 Timing Considerations

- OpenAI is actively building multi-agent, skills, and SDK features
- Claude Code migration support suggests Codex wants to absorb Claude Code users
- The plugin system gap is wide open - no official solution yet
- Hook system may be coming (closed issues suggest implementation in progress)
- Context management improvements are desperately needed

### 6.4 Risk Factors

1. **Native hooks implementation**: If OpenAI ships event hooks, our hook system needs to integrate, not compete
2. **Skills crate evolution**: The `codex-skills` crate is being actively refactored; we need to track API changes
3. **Plugin system**: If OpenAI announces an official plugin system, our install approach needs to be compatible
4. **Rust migration**: The TypeScript -> Rust migration means some APIs may be unstable

---

## 7. Key Statistics Summary

| Metric | Value |
|--------|-------|
| Total Stars | 61,276 |
| Total Forks | 8,123 |
| Open Issues | 1,365 |
| Total Issues/PRs (all time) | ~12,400+ |
| Most-Reacted Issue | #2109 Event Hooks (418+ thumbs up) |
| Second Most-Reacted | #2604 Subagent Support (315+ thumbs up) |
| Active OpenAI Contributors | 15+ employees with daily commits |
| Primary Language | Rust (migrating from TypeScript) |
| Issue Labels | 38+ categories |
| Key Feature Gaps | Plugins, Hooks, Context Management, Enterprise |

---

## 8. Cross-Reference with bkit-codex Architecture

| Codex Community Need | bkit-codex Component | Implementation Status |
|----------------------|----------------------|----------------------|
| Plugin install from git (#9613) | `bkit install` CLI | Planned |
| Event hooks (#2109) | PDCA lifecycle hooks | Planned |
| Named AGENTS.md variants (#10067) | Kit definition system | Planned |
| Include files in AGENTS.md (#6038) | Context rule includes | Planned |
| Lazy MCP load (#9266) | Kit MCP configuration | Planned |
| Long-term memory (#8368) | PDCA memory persistence | Planned |
| Governance hooks (#12190) | PDCA audit/policy system | Planned |
| Custom compaction (#11912) | Context engineering rules | Planned |
| Global instructions (#3853) | Centralized kit repository | Planned |
| Session export (#10407) | PDCA session capture | Future |

---

*This analysis is based on GitHub data collected on 2026-02-21 from the openai/codex repository.*
