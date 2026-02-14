# @popup-studio/bkit-codex-mcp

MCP Server for bkit-codex -- PDCA methodology automation for OpenAI Codex.

## Installation

```bash
npm install @popup-studio/bkit-codex-mcp
```

## Usage

Add to your MCP client configuration (e.g., `config.toml`):

```toml
[mcp.servers.bkit]
command = "npx"
args = ["-y", "@popup-studio/bkit-codex-mcp"]
```

Or run directly:

```bash
npx @popup-studio/bkit-codex-mcp
```

The server communicates via STDIO using JSON-RPC 2.0 (MCP protocol).

## Available Tools

| Tool | Description |
|------|-------------|
| `bkit_init` | Initialize bkit session with project detection |
| `bkit_get_status` | Get current PDCA status for project or feature |
| `bkit_pre_write_check` | Check PDCA compliance before writing code |
| `bkit_post_write` | Guidance after code changes with next steps |
| `bkit_complete_phase` | Mark a PDCA phase as complete |
| `bkit_pdca_plan` | Generate plan document template |
| `bkit_pdca_design` | Generate design document template |
| `bkit_pdca_analyze` | Analyze gaps between design and implementation |
| `bkit_pdca_next` | Get next PDCA phase recommendation |
| `bkit_analyze_prompt` | Analyze user prompt for intent and triggers |
| `bkit_classify_task` | Classify task size by estimated lines changed |
| `bkit_detect_level` | Detect project level (Starter/Dynamic/Enterprise) |
| `bkit_select_template` | Select PDCA template for phase and level |
| `bkit_check_deliverables` | Check if phase deliverables are complete |
| `bkit_memory_read` | Read from bkit session memory |
| `bkit_memory_write` | Write to bkit session memory |

## Development

```bash
# Run the server
node index.js

# Run tests
node --test tests/
```

## License

Apache-2.0
