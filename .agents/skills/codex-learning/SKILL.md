---
name: codex-learning
description: |
  Codex CLI learning and optimization guide. Teaches configuration,
  AGENTS.md setup, MCP servers, skills management, and best practices.
  Start learning with "learn codex" or "setup codex".
  Triggers: learn codex, codex setup, AGENTS.md, MCP, skills, configuration,
  코덱스 배우기, 설정 방법, コーデックス学習, 学习Codex,
  aprender codex, apprendre codex, Codex lernen, imparare codex
  Do NOT use for: bkit-specific PDCA workflow (use $pdca).
---

# Codex Learning Skill

> Learn to configure and optimize OpenAI Codex CLI for maximum productivity.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `learn` | Start learning guide | `$codex-learning learn` |
| `setup` | Configuration walkthrough | `$codex-learning setup` |
| `tips` | Best practices and tips | `$codex-learning tips` |

## What is Codex CLI?

Codex CLI is OpenAI's command-line coding agent that:
- Reads and writes files in your project
- Executes shell commands
- Uses tools via MCP (Model Context Protocol)
- Follows instructions from AGENTS.md files
- Invokes skills for specialized tasks

## Quick Start

### 1. Installation

```bash
npm install -g @openai/codex
```

### 2. Configuration

```bash
# Create config directory
mkdir -p ~/.codex

# Create config.toml
cat > ~/.codex/config.toml << 'CONFIG'
model = "o4-mini"
approval_mode = "suggest"

[history]
persistence = "save_all"
save_to = "$HOME/.codex/history"

[sandbox]
network_access = true
CONFIG
```

### 3. Project Setup

Create `AGENTS.md` at your project root:

```markdown
# Project Agent Instructions

## Project Overview
Brief description of this project.

## Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: bkend.ai BaaS
- Level: Dynamic

## Conventions
- Use TypeScript strict mode
- Follow ESLint + Prettier rules
- Commit messages: conventional commits format

## File Structure
[Describe your project structure]

## Important Notes
[Project-specific instructions for the AI]
```

## AGENTS.md Guide

### Location Hierarchy

```
project/
├── AGENTS.md                # Root (applies to entire project)
├── src/
│   ├── AGENTS.md           # Applies to src/ and subdirectories
│   ├── components/
│   │   └── AGENTS.md       # Applies to components/
│   └── lib/
│       └── AGENTS.md       # Applies to lib/
```

Child AGENTS.md files inherit from parent and can add/override instructions.

### Best Practices for AGENTS.md

1. **Be specific**: "Use TypeScript strict mode" not "write good code"
2. **Include conventions**: Naming rules, file structure, patterns
3. **List tech stack**: Framework versions, key dependencies
4. **Define boundaries**: What the AI should and should not do
5. **Keep it updated**: Review and update as project evolves

## MCP Server Configuration

### What is MCP?

Model Context Protocol allows Codex to connect to external tools and data sources.

### Configure MCP Servers

```json
// ~/.codex/mcp.json
{
  "servers": {
    "bkit-codex": {
      "command": "npx",
      "args": ["bkit-codex-mcp"],
      "description": "bkit development pipeline tools"
    }
  }
}
```

### Project-level MCP

```json
// .codex/mcp.json (in project root)
{
  "servers": {
    "project-tools": {
      "command": "node",
      "args": ["./tools/mcp-server.js"]
    }
  }
}
```

## Skills System

### What are Skills?

Skills are reusable instruction sets that Codex loads when triggered by keywords in your prompt.

### Skill Structure

```
.agents/skills/
├── my-skill/
│   ├── SKILL.md              # Instructions (YAML frontmatter + body)
│   └── agents/
│       └── openai.yaml       # Codex-specific config
```

### SKILL.md Format

```yaml
---
name: my-skill
description: |
  Brief description of what this skill does.
  Triggers: keyword1, keyword2, keyword3
  Do NOT use for: things this skill should not handle.
---

# Skill Body

Instructions for the AI when this skill is activated.
```

### openai.yaml Format

```yaml
interface:
  brand_color: "#3B82F6"
policy:
  allow_implicit_invocation: true
```

## Approval Modes

| Mode | Description | Best For |
|------|------------|---------|
| `suggest` | Shows changes, asks before applying | Learning, careful work |
| `auto-edit` | Auto-applies file edits, asks for commands | Experienced users |
| `full-auto` | Auto-applies everything | Trusted workflows |

## Best Practices

### Effective Prompts
- Be specific about what you want
- Reference file paths explicitly
- Mention the framework/language
- Ask for one thing at a time for complex tasks

### Project Organization
- Keep AGENTS.md up to date
- Use .codex/ for project-specific config
- Store skills in .agents/skills/
- Use MCP for tool integration

### Performance Tips
- Use `o4-mini` for fast tasks, `o3` for complex reasoning
- Break large tasks into smaller steps
- Use skills to provide context instead of repeating instructions
- Keep AGENTS.md concise (under 2000 words)

## Codex CLI Reference

See `references/codex-guide.md` for complete command reference and advanced configuration.
