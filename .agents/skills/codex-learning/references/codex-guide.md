# Codex CLI Complete Guide

## Installation & Setup

### Install
```bash
npm install -g @openai/codex
```

### Verify Installation
```bash
codex --version
codex --help
```

### Set API Key
```bash
export OPENAI_API_KEY="sk-..."
# Or add to ~/.zshrc / ~/.bashrc for persistence
```

## Configuration Reference

### config.toml Location
- Global: `~/.codex/config.toml`
- Project: `.codex/config.toml` (overrides global)

### Full config.toml Reference
```toml
# Model selection
model = "o4-mini"           # Default model
# model = "o3"              # For complex tasks

# Approval mode
approval_mode = "suggest"   # suggest | auto-edit | full-auto

# History settings
[history]
persistence = "save_all"    # none | save_all
save_to = "$HOME/.codex/history"

# Sandbox settings
[sandbox]
network_access = true       # Allow network in sandbox
writable_paths = ["/tmp"]   # Additional writable paths

# Custom instructions (appended to system prompt)
[instructions]
text = "Always use TypeScript strict mode."
```

## AGENTS.md Complete Reference

### Syntax
AGENTS.md uses standard Markdown. Codex reads the entire file as context.

### Recommended Sections

```markdown
# Project: [Name]

## Overview
One-paragraph description of the project.

## Tech Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- State: Zustand + TanStack Query
- Backend: bkend.ai BaaS
- Database: MongoDB (via bkend.ai)

## Project Structure
\```
src/
├── app/          # Pages and layouts
├── components/   # UI components
├── hooks/        # Custom hooks
├── lib/          # Utilities
├── stores/       # State stores
└── types/        # TypeScript types
\```

## Coding Conventions
- Components: PascalCase files (UserProfile.tsx)
- Utilities: camelCase files (formatDate.ts)
- Types: PascalCase, suffix with Props/State/Response
- Hooks: prefix with use (useAuth.ts)

## Do NOT
- Do not modify package.json without asking
- Do not create test files unless asked
- Do not change ESLint/Prettier configuration
- Do not use `any` type in TypeScript

## Important Files
- src/lib/api-client.ts - API client (do not modify interface)
- src/stores/auth-store.ts - Auth state (critical)
```

### Inheritance Rules
1. Root AGENTS.md applies to entire project
2. Subdirectory AGENTS.md adds to parent context
3. More specific files take precedence
4. All applicable AGENTS.md files are loaded together

## MCP Server Configuration

### mcp.json Structure
```json
{
  "servers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "KEY": "value"
      },
      "description": "What this server provides"
    }
  }
}
```

### Common MCP Servers
```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-fs", "/path/to/allowed/dir"],
      "description": "File system access"
    },
    "bkit-codex": {
      "command": "npx",
      "args": ["bkit-codex-mcp"],
      "description": "bkit development pipeline"
    }
  }
}
```

### Debugging MCP
```bash
# Test MCP server manually
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx bkit-codex-mcp

# Check logs
cat ~/.codex/logs/mcp.log
```

## Skills Management

### Creating a Skill

```bash
# Create skill directory
mkdir -p .agents/skills/my-skill/agents

# Create SKILL.md
cat > .agents/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: |
  What this skill does. Keep under 1024 characters.
  Triggers: keyword1, keyword2
---

# My Skill

Instructions and content here.
EOF

# Create openai.yaml
cat > .agents/skills/my-skill/agents/openai.yaml << 'EOF'
interface:
  brand_color: "#3B82F6"
policy:
  allow_implicit_invocation: true
EOF
```

### Skill Frontmatter Rules
- `name`: Required, max 64 characters
- `description`: Required, max 1024 characters
- Include trigger keywords in description
- Include "Do NOT use for" exclusions
- Multi-language triggers improve matching

### Skill Invocation
- **Explicit**: User types `$skill-name action`
- **Implicit**: Codex matches triggers from user prompt (requires `allow_implicit_invocation: true`)

### Skill References
Skills can include reference files:
```
.agents/skills/my-skill/
├── SKILL.md
├── agents/openai.yaml
└── references/
    ├── patterns.md
    └── checklist.md
```

Reference files provide additional context when the skill is invoked.

## Command Line Usage

```bash
# Start interactive session
codex

# One-shot command
codex "create a new React component for user profile"

# With specific model
codex --model o3 "refactor the auth module"

# With approval mode
codex --approval-mode full-auto "fix all lint errors"

# With specific file context
codex "explain this file" --file src/lib/api-client.ts
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not found" | Set OPENAI_API_KEY environment variable |
| Skill not triggered | Check trigger keywords in SKILL.md description |
| MCP server not connecting | Test server manually with echo pipe |
| Wrong model used | Check config.toml model setting |
| Slow responses | Use o4-mini for simple tasks |
| Context too large | Split AGENTS.md, use subdirectory AGENTS.md |
