# Contributing to bkit-codex

Thank you for your interest in contributing to bkit-codex! This document provides guidelines for contributing.

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or request features
- Include your Codex CLI version, OS, and Node.js version
- Provide steps to reproduce the issue

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes following the guidelines below
4. Run all tests: `node --test packages/mcp-server/tests/`
5. Submit a pull request with a clear description

## Adding a New Skill

Skills are located in `.agents/skills/`. To add a new skill:

### 1. Create the Directory Structure

```
.agents/skills/your-skill-name/
├── SKILL.md              # Required
├── agents/
│   └── openai.yaml       # Required
└── references/           # Optional
    └── your-reference.md
```

### 2. Write SKILL.md

SKILL.md must have YAML frontmatter with `name` and `description`:

```yaml
---
name: your-skill-name
description: |
  Brief description of what this skill does.
  Triggers: keyword1, keyword2, keyword3
  Do NOT use for: specific exclusions.
---

# Skill Title

Detailed instructions for the AI when this skill is activated.
```

**Requirements**:
- `name` must match the directory name exactly
- `name` must be 64 characters or fewer
- `description` must be 1024 characters or fewer
- Include trigger keywords in 8 languages (en, ko, ja, zh, es, fr, de, it)
- Include "Do NOT use for" exclusions

### 3. Create openai.yaml

```yaml
interface:
  brand_color: "#3B82F6"

policy:
  allow_implicit_invocation: true
```

### 4. Add References (Optional)

Place reference files in `references/` for on-demand loading by the AI.

## Modifying MCP Tools

MCP tools are in `packages/mcp-server/src/tools/`. To add or modify a tool:

### 1. Create the Tool File

```javascript
// packages/mcp-server/src/tools/your-tool.js

export const definition = {
  name: "bkit_your_tool",
  description: "What this tool does",
  inputSchema: {
    type: "object",
    properties: {
      // your parameters
    },
    required: []
  }
};

export async function handler(args, context) {
  // Implementation
  return {
    content: [{ type: "text", text: JSON.stringify(result) }]
  };
}
```

### 2. Register in Tool Index

Add your tool to `packages/mcp-server/src/tools/index.js`.

### 3. Write Tests

Create `packages/mcp-server/tests/tools/your-tool.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('bkit_your_tool', () => {
  it('should handle valid input', async () => {
    // test implementation
  });
});
```

## Testing Requirements

Before submitting a PR:

1. **All tests pass**: `node --test packages/mcp-server/tests/`
2. **Skill validation passes**: All SKILL.md files have valid frontmatter
3. **No breaking changes** to existing tool input/output schemas

## Code Style

- Use pure Node.js (no external dependencies in MCP server)
- Follow naming conventions: camelCase for functions, PascalCase for classes
- Use kebab-case for file names
- Log to stderr only (`console.error`), never stdout (reserved for JSON-RPC)

## Lib Module Guidelines

Library modules in `packages/mcp-server/src/lib/` should:

- Export pure functions where possible
- Accept `projectDir` as parameter (not from environment)
- Use async/await for file operations
- Include JSDoc comments for public functions

## Commit Messages

Use conventional commit format:

```
type(scope): description

feat(tools): add bkit_your_tool
fix(pdca): correct phase transition logic
docs(skills): update starter skill triggers
test(lib): add level detection tests
```

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
