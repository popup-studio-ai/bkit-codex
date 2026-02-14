# MCP API Reference

The bkit-codex MCP server provides 16 tools for PDCA workflow management.

**Server**: `@popup-studio/bkit-codex-mcp`
**Transport**: STDIO (JSON-RPC 2.0)
**Protocol Version**: 2024-11-05
**Dependencies**: None (pure Node.js)

---

## Session Tools

### bkit_init

Initialize bkit session. Call at the start of each session.

**Priority**: P0
**Replaces**: SessionStart hook

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "projectDir": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    }
  },
  "required": ["projectDir"]
}
```

**Output**:
```json
{
  "level": "Dynamic",
  "pdcaStatus": {
    "activeFeatures": ["user-auth"],
    "primaryFeature": "user-auth",
    "features": { "user-auth": { "phase": "design", "matchRate": null } }
  },
  "sessionId": "bkit-1708000000",
  "guidance": "Feature 'user-auth' is in design phase."
}
```

---

### bkit_analyze_prompt

Analyze user prompt to detect intent, match skill triggers, and check ambiguity. Supports 8 languages.

**Priority**: P1
**Replaces**: UserPromptSubmit hook

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "User's input text to analyze"
    }
  },
  "required": ["prompt"]
}
```

**Output**:
```json
{
  "language": "ko",
  "intent": {
    "type": "feature_request",
    "feature": "user-auth",
    "confidence": 0.9
  },
  "triggers": {
    "skills": ["dynamic"],
    "keywords": ["login", "auth"]
  },
  "ambiguity": {
    "score": 25,
    "needsClarification": false
  },
  "suggestedAction": "Check PDCA status for user-auth feature",
  "pdcaRecommendation": "No plan document found. Suggest: $pdca plan user-auth"
}
```

---

## PDCA Status Tools

### bkit_get_status

Get current PDCA status for the project or a specific feature.

**Priority**: P0
**Replaces**: PDCA status check in hooks

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature": {
      "type": "string",
      "description": "Feature name. If omitted, returns all active features."
    }
  }
}
```

**Output** (feature specified):
```json
{
  "feature": "user-auth",
  "phase": "design",
  "matchRate": null,
  "iterationCount": 0,
  "documents": {
    "plan": "docs/01-plan/features/user-auth.plan.md",
    "design": "docs/02-design/features/user-auth.design.md"
  },
  "progress": "[Plan] done -> [Design] active -> [Do] pending -> [Check] pending -> [Act] pending",
  "nextAction": "Complete design document, then start implementation"
}
```

---

### bkit_pre_write_check

Check PDCA compliance before writing/editing source code.

**Priority**: P0
**Replaces**: PreToolUse(Write|Edit) hook

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "description": "Path of the file being written or edited"
    },
    "feature": {
      "type": "string",
      "description": "Feature name if known (auto-detected from path if omitted)"
    }
  },
  "required": ["filePath"]
}
```

**Output**:
```json
{
  "allowed": true,
  "feature": "user-auth",
  "hasDesign": true,
  "designPath": "docs/02-design/features/user-auth.design.md",
  "guidance": "Design document exists. Reference sections: Architecture, Data Model, API Spec.",
  "taskClassification": "feature",
  "conventionHints": ["Components: PascalCase", "Files: kebab-case"]
}
```

---

### bkit_post_write

Provide guidance after code changes.

**Priority**: P1
**Replaces**: PostToolUse(Write) hook

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "description": "Path of the file that was modified"
    },
    "linesChanged": {
      "type": "number",
      "description": "Number of lines changed"
    },
    "feature": {
      "type": "string",
      "description": "Feature name if known"
    }
  },
  "required": ["filePath"]
}
```

**Output**:
```json
{
  "feature": "user-auth",
  "taskClassification": "feature",
  "hasDesign": true,
  "suggestGapAnalysis": true,
  "guidance": "Significant changes detected. Consider running gap analysis: $pdca analyze user-auth",
  "nextSteps": ["Complete remaining implementation", "Run gap analysis when ready"]
}
```

---

### bkit_complete_phase

Mark a PDCA phase as complete. Updates `.pdca-status.json`.

**Priority**: P0
**Replaces**: Stop hook state transition

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature": {
      "type": "string",
      "description": "Feature name"
    },
    "phase": {
      "type": "string",
      "enum": ["plan", "design", "do", "check", "act", "report"],
      "description": "Phase being completed"
    }
  },
  "required": ["feature", "phase"]
}
```

**Output**:
```json
{
  "completed": "design",
  "nextPhase": "do",
  "recommendation": "Start implementation. Reference design document.",
  "progress": "[Plan] done -> [Design] done -> [Do] pending -> [Check] pending -> [Act] pending"
}
```

---

## PDCA Action Tools

### bkit_pdca_plan

Generate a plan document template for a feature.

**Priority**: P0

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature": {
      "type": "string",
      "description": "Feature name in kebab-case"
    },
    "level": {
      "type": "string",
      "enum": ["Starter", "Dynamic", "Enterprise"],
      "description": "Project level for template selection"
    }
  },
  "required": ["feature"]
}
```

**Output**:
```json
{
  "template": "# {Feature} - Plan Document\n\n> Date: ...\n\n## 1. Overview\n...",
  "outputPath": "docs/01-plan/features/{feature}.plan.md",
  "phase": "plan",
  "guidance": "Fill in the template. When complete, call bkit_complete_phase(feature, 'plan')."
}
```

---

### bkit_pdca_design

Generate a design document template. Requires plan document to exist.

**Priority**: P0

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature": {
      "type": "string",
      "description": "Feature name in kebab-case"
    },
    "level": {
      "type": "string",
      "enum": ["Starter", "Dynamic", "Enterprise"],
      "description": "Project level for template selection"
    }
  },
  "required": ["feature"]
}
```

**Output**:
```json
{
  "template": "# {Feature} - Design Document\n\n> Date: ...\n\n## 1. Architecture\n...",
  "outputPath": "docs/02-design/features/{feature}.design.md",
  "phase": "design",
  "planReference": "docs/01-plan/features/{feature}.plan.md",
  "guidance": "Reference plan document. Fill in architecture, data model, and API sections."
}
```

**Error** (no plan):
```json
{
  "error": "Plan document not found",
  "guidance": "Create a plan first: $pdca plan {feature}"
}
```

---

### bkit_pdca_analyze

Analyze gaps between design document and implementation code.

**Priority**: P1

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature": {
      "type": "string",
      "description": "Feature name to analyze"
    }
  },
  "required": ["feature"]
}
```

**Output**:
```json
{
  "feature": "user-auth",
  "designPath": "docs/02-design/features/user-auth.design.md",
  "analysisPath": "docs/03-analysis/user-auth.analysis.md",
  "matchRate": null,
  "guidance": "Read the design document and compare with implementation. Write analysis to the analysis path.",
  "template": "# Gap Analysis: user-auth\n\n## Match Rate: __%\n\n## Implemented\n- [ ] ...\n\n## Missing\n- [ ] ..."
}
```

---

### bkit_pdca_next

Get recommendation for the next PDCA phase.

**Priority**: P1

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "feature": {
      "type": "string",
      "description": "Feature name"
    }
  },
  "required": ["feature"]
}
```

**Output**:
```json
{
  "currentPhase": "do",
  "nextPhase": "check",
  "recommendation": "Implementation appears complete. Run gap analysis.",
  "command": "$pdca analyze user-auth",
  "progress": "[Plan] done -> [Design] done -> [Do] done -> [Check] pending -> [Act] pending"
}
```

---

## Utility Tools

### bkit_classify_task

Classify task size based on estimated lines of code change.

**Priority**: P1

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "estimatedLines": {
      "type": "number",
      "description": "Estimated lines of code to be changed"
    },
    "description": {
      "type": "string",
      "description": "Brief task description"
    }
  },
  "required": ["estimatedLines"]
}
```

**Output**:
```json
{
  "classification": "feature",
  "label": "Feature",
  "estimatedLines": 150,
  "pdcaRequired": true,
  "recommendation": "Create plan and design documents before implementation."
}
```

**Thresholds**:
| Classification | Lines | PDCA |
|----------------|:-----:|:----:|
| Quick Fix | < 10 | None |
| Minor Change | < 50 | Recommended |
| Feature | < 200 | Required |
| Major Feature | >= 200 | Required + Split |

---

### bkit_detect_level

Detect project level based on directory structure and config files.

**Priority**: P1

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "projectDir": {
      "type": "string",
      "description": "Project root directory path"
    }
  },
  "required": ["projectDir"]
}
```

**Output**:
```json
{
  "level": "Dynamic",
  "evidence": ["Found .mcp.json", "Found api/ directory"],
  "confidence": "high",
  "recommendedSkill": "$dynamic",
  "pipelinePhases": [1, 2, 3, 4, 5, 6, 7, 9]
}
```

**Detection Logic**:
1. Check Enterprise: `kubernetes/`, `terraform/`, `k8s/`, `infra/`
2. Check Dynamic: `lib/bkend/`, `supabase/`, `api/`, `.mcp.json`, `docker-compose.yml`
3. Check package.json: `bkend`, `@supabase`, `firebase`
4. Default: Starter

---

### bkit_select_template

Select appropriate PDCA template based on phase and project level.

**Priority**: P2

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "phase": {
      "type": "string",
      "enum": ["plan", "design", "analysis", "report", "do"],
      "description": "PDCA phase"
    },
    "level": {
      "type": "string",
      "enum": ["Starter", "Dynamic", "Enterprise"],
      "description": "Project level"
    }
  },
  "required": ["phase"]
}
```

**Template Matrix**:
| Phase | Starter | Dynamic | Enterprise |
|-------|---------|---------|------------|
| plan | plan.template.md | plan.template.md | plan.template.md |
| design | design-starter.template.md | design.template.md | design-enterprise.template.md |
| analysis | analysis.template.md | analysis.template.md | analysis.template.md |
| report | report.template.md | report.template.md | report.template.md |
| do | do.template.md | do.template.md | do.template.md |

---

### bkit_check_deliverables

Check if required deliverables for a pipeline phase are complete.

**Priority**: P2

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "phase": {
      "type": "number",
      "minimum": 1,
      "maximum": 9,
      "description": "Pipeline phase number (1-9)"
    },
    "feature": {
      "type": "string",
      "description": "Feature name"
    }
  },
  "required": ["phase"]
}
```

**Output**:
```json
{
  "phase": 3,
  "phaseName": "UI/UX Mockups",
  "complete": ["schema.md", "conventions.md"],
  "missing": ["mockup.md"],
  "ready": false,
  "guidance": "Create UI mockup document before proceeding to phase 4."
}
```

---

## Memory Tools

### bkit_memory_read

Read from bkit session memory (`docs/.bkit-memory.json`).

**Priority**: P2

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "description": "Memory key to read. Omit to get all memory."
    }
  }
}
```

**Output** (key specified):
```json
{
  "key": "lastFeature",
  "value": "user-auth"
}
```

**Output** (all memory):
```json
{
  "data": {
    "lastFeature": "user-auth",
    "sessionCount": 5,
    "userPreferences": { "language": "ko", "level": "Dynamic" }
  }
}
```

---

### bkit_memory_write

Write to bkit session memory. Persists across sessions.

**Priority**: P2

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "description": "Memory key"
    },
    "value": {
      "description": "Value to store (any JSON-serializable type)"
    }
  },
  "required": ["key", "value"]
}
```

**Output**:
```json
{
  "success": true,
  "key": "lastFeature",
  "value": "user-auth"
}
```
