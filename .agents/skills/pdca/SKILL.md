---
name: pdca
description: |
  Unified PDCA cycle management. Supports: plan, design, do, analyze, iterate,
  report, status, next, archive, cleanup.
  Actions: plan->create plan doc, design->create design doc, do->implementation guide,
  analyze->gap analysis (design vs code), iterate->auto-fix gaps,
  report->completion report, status->show progress, next->suggest next phase.
  Triggers: pdca, plan, design, analyze, iterate, report, status, gap analysis,
  계획, 설계, 분석, 검증, 보고서, 計画, 設計, 分析, 计划, 设计,
  planificar, diseño, analizar, planifier, conception, Planung, pianificare
  Do NOT use for: bkit rules reference (use $bkit-rules), template details
  (use $bkit-templates), level-specific guidance (use $starter/$dynamic/$enterprise).
---

# PDCA Unified Skill

> Unified Skill for managing the complete PDCA cycle: Plan, Design, Do, Check, Act.

## Usage

```
$pdca plan {feature}      Create plan document
$pdca design {feature}    Create design document
$pdca do {feature}        Implementation guide
$pdca analyze {feature}   Gap analysis (Check phase)
$pdca iterate {feature}   Auto-improvement (Act phase)
$pdca report {feature}    Completion report
$pdca status              Current PDCA status
$pdca next                Next phase suggestion
$pdca archive {feature}   Archive completed PDCA
$pdca cleanup             Clean archived features
```

## Phase Flow

```
Plan -> Design -> Do -> Check(analyze) -> Act(iterate) -> Report -> Archive
  |                                          |
  |                                          v
  |                                    (if < 90%)
  |                                    iterate -> re-analyze
  |                                          |
  v                                          v
[Complete]                             (if >= 90%)
                                       Report -> Archive
```

## Phase Progress Visualization

```
[Plan] -> [Design] -> [Do] -> [Check] -> [Act] -> [Report]

Status indicators:
  [Phase] done     -> phase completed
  [Phase] active   -> currently working
  [Phase] pending  -> not yet started
```

---

## Plan Phase

Create a planning document for the feature.

### Steps

1. Call `bkit_pdca_plan(feature, level)` MCP tool
2. Write template to `docs/01-plan/features/{feature}.plan.md`
3. Fill in sections: Goals, Scope, Success Criteria, Schedule
4. Call `bkit_complete_phase(feature, "plan")` when done

### Key Sections

- Overview and Purpose
- Scope (In/Out)
- Functional Requirements
- Non-Functional Requirements
- Success Criteria (Definition of Done)
- Risks and Mitigation
- Architecture Considerations
- Convention Prerequisites

### Output Path

`docs/01-plan/features/{feature}.plan.md`

---

## Design Phase

Create a technical design document based on the plan.

### Prerequisites

Plan document must exist. If missing, suggest: `$pdca plan {feature}` first.

### Steps

1. Verify plan exists (required prerequisite)
2. Call `bkit_pdca_design(feature, level)` MCP tool
3. Write template to `docs/02-design/features/{feature}.design.md`
4. Fill in: Architecture, Data Model, API Spec, Test Plan
5. Call `bkit_complete_phase(feature, "design")` when done

### Level-Specific Templates

| Level | Template | Focus |
|-------|----------|-------|
| Starter | design-starter.template.md | Simple structure, learning-oriented |
| Dynamic | design.template.md | Full-stack with BaaS integration |
| Enterprise | design-enterprise.template.md | MSA, Clean Architecture, K8s |

### Output Path

`docs/02-design/features/{feature}.design.md`

---

## Do Phase

Guide implementation based on the design document.

### Prerequisites

Design document must exist. If missing, suggest: `$pdca design {feature}` first.

### Steps

1. Verify design exists (required prerequisite)
2. Reference design document during implementation
3. Follow implementation order from design
4. Call `bkit_pre_write_check(filePath)` before each file write
5. Call `bkit_post_write(filePath, linesChanged)` after significant changes
6. Call `bkit_complete_phase(feature, "do")` when done

### Implementation Guide

Provide a structured implementation plan:

1. **Data Layer**: Types, models, API client
2. **Business Logic**: Services, custom hooks, state management
3. **UI Components**: Base components, pages, error handling
4. **Integration**: Connect API to UI, loading states, error handling

### Output Path

`docs/02-design/features/{feature}.do.md` (optional implementation tracking)

---

## Analyze Phase (Check)

Compare design document vs implementation to find gaps.

### Steps

1. Call `bkit_pdca_analyze(feature)` MCP tool
2. Read design document: `docs/02-design/features/{feature}.design.md`
3. Scan implementation code in relevant directories
4. Compare design items vs implemented items
5. Calculate Match Rate: `(implemented / total_design_items) * 100`
6. Write analysis to `docs/03-analysis/{feature}.analysis.md`

### Decision After Analysis

- If matchRate >= 90%: suggest `$pdca report {feature}`
- If matchRate < 90%: suggest `$pdca iterate {feature}`

### Gap Categories

| Category | Description | Example |
|----------|-------------|---------|
| Match | Design and code align | API endpoint exists as designed |
| Missing in Code | Designed but not implemented | Missing validation logic |
| Missing in Design | Implemented but not designed | Extra utility function |
| Changed | Implemented differently | Different data structure |

### Output Path

`docs/03-analysis/{feature}.analysis.md`

---

## Iterate Phase (Act)

Auto-fix identified gaps to improve match rate.

### Steps

1. Read gap list from analysis document
2. Fix identified gaps in code (prioritize "Missing in Code" items)
3. Re-run analysis: `$pdca analyze {feature}`
4. Repeat until matchRate >= 90% or max 5 iterations
5. Call `bkit_complete_phase(feature, "act")` when done

### Iteration Rules

- Maximum iterations: 5 (configurable via bkit.config.json)
- Stop conditions: matchRate >= 90% OR maxIterations reached
- If max iterations reached without 90%: report current state and suggest user review

---

## Report Phase

Generate a completion report for the feature.

### Prerequisites

Match rate should be >= 90%. Warn if below.

### Steps

1. Verify matchRate >= 90% (warn if below)
2. Gather data from plan, design, analysis documents
3. Generate completion report
4. Write to `docs/04-report/{feature}.report.md`
5. Include: completed items, quality metrics, learnings

### Report Sections

- Summary (completion rate, duration)
- Related Documents (plan, design, analysis links)
- Completed Items (functional, non-functional requirements)
- Quality Metrics (match rate, code quality score)
- Lessons Learned (keep, problem, try)
- Next Steps

### Output Path

`docs/04-report/{feature}.report.md`

---

## Status

Show current PDCA progress for all active features.

### Steps

1. Call `bkit_get_status(feature)` MCP tool
2. Display feature, phase, matchRate, iteration count
3. Show progress visualization

### Output Format

```
PDCA Status
---
Feature: {feature}
Phase: {current_phase}
Match Rate: {rate}%
Iteration: {count}/{max}
---
[Plan] done -> [Design] done -> [Do] done -> [Check] active -> [Act] pending
```

---

## Next

Suggest the next PDCA phase based on current state.

### Steps

1. Call `bkit_pdca_next(feature)` MCP tool
2. Display recommended next action with command

### Phase Guide

| Current | Next | Command |
|---------|------|---------|
| None | plan | `$pdca plan {feature}` |
| plan | design | `$pdca design {feature}` |
| design | do | Start implementation |
| do | check | `$pdca analyze {feature}` |
| check (<90%) | act | `$pdca iterate {feature}` |
| check (>=90%) | report | `$pdca report {feature}` |
| report | archive | `$pdca archive {feature}` |

---

## Archive

Archive completed PDCA documents.

### Steps

1. Verify report completion (phase = "completed" or matchRate >= 90%)
2. Create `docs/archive/YYYY-MM/{feature}/` folder
3. Move documents from original locations
4. Update `.pdca-status.json`: phase = "archived"

### Documents Archived

- `docs/01-plan/features/{feature}.plan.md`
- `docs/02-design/features/{feature}.design.md`
- `docs/03-analysis/{feature}.analysis.md`
- `docs/04-report/{feature}.report.md`

---

## Cleanup

Clean up archived features from `.pdca-status.json`.

### Steps

1. Read archived features from status
2. Display list with timestamps
3. Delete selected features from status
4. Archive documents remain in `docs/archive/`

---

## Template References

Templates are available in `references/` directory:

| Template | Purpose |
|----------|---------|
| `plan.template.md` | Plan document structure |
| `design.template.md` | Design document structure |
| `design-starter.template.md` | Starter-level design |
| `design-enterprise.template.md` | Enterprise-level design |
| `analysis.template.md` | Gap analysis structure |
| `report.template.md` | Completion report structure |
| `do.template.md` | Implementation guide structure |
