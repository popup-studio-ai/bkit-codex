---
name: plan-plus
description: |
  Brainstorming-enhanced PDCA planning.
  6-phase process with HARD GATE rule.
triggers:
  - plan-plus
  - "brainstorming plan"
  - "enhanced planning"
  - "plan plus"
  - "detailed planning"
  - "deep planning"
allow_implicit_invocation: true
user_invocable: true
---

# Plan Plus - Brainstorming-Enhanced PDCA Planning

## HARD GATE RULE (CRITICAL)

CRITICAL: Do NOT generate any code until ALL brainstorming phases are complete
and the user has approved the final plan document. This is a HARD GATE -
no exceptions. If the user asks for code during planning, respond:
"We're still in the planning phase. Let's complete the plan first to ensure
we build the right thing."

## Overview

Plan Plus combines intent discovery from brainstorming methodology with
bkit PDCA's structured planning. It produces higher-quality Plan documents
by exploring user intent, comparing alternatives, and applying YAGNI review.

Use Plan Plus when:
- Feature requirements are ambiguous or complex
- Multiple implementation approaches exist
- Stakeholder alignment is needed before implementation
- The feature scope needs careful trimming

## Process

### Phase 0: Context Exploration (Automatic)

1. Call `bkit_get_status` to load current PDCA state
2. Read AGENTS.md for project context
3. Check git log for recent history (last 10 commits)
4. Scan `docs/01-plan/` for existing plans
5. Read `bkit.config.json` for project configuration

Output: Internal context understanding (not shown to user)

### Phase 1: Intent Discovery

Ask ONE question at a time. Wait for user response before next question.

Questions (in order):
1. "What is the core problem this feature solves?"
2. "Who are the target users and their key needs?"
3. "What does success look like? (measurable criteria)"
4. "What constraints exist? (time, tech, team, budget)"

Rules:
- Ask exactly ONE question per turn
- Wait for user response before proceeding
- Summarize each answer before asking the next
- If user provides vague answer, ask a follow-up clarification

### Phase 2: Alternatives Exploration

Based on Phase 1 answers, present 2-3 implementation approaches:

For each approach:
- **Summary**: 1-2 sentence overview
- **Pros**: 3-5 advantages
- **Cons**: 3-5 disadvantages
- **Effort**: Low / Medium / High / Very High
- **Best For**: When this approach is optimal

Ask user to select preferred approach or combine elements.

### Phase 3: YAGNI Review

Present a checklist of features from the selected approach:

- Mark each as: [Must Have] / [Nice to Have] / [Won't Do]
- Apply YAGNI principle: "You Aren't Gonna Need It"
- Remove speculative features
- Focus on MVP that delivers core value

Ask user to confirm the trimmed scope.

### Phase 4: Incremental Design Validation

Present the plan document section by section for approval:

1. User Intent (from Phase 1)
2. Alternatives Explored (from Phase 2)
3. YAGNI Review Results (from Phase 3)
4. Scope Definition
5. Requirements (Functional + Non-Functional)
6. Success Criteria
7. Risks and Mitigations
8. Architecture Considerations

For each section:
- Present draft content
- Ask: "Does this accurately capture your intent?"
- Revise if needed before proceeding

### Phase 5: Plan Document Generation

1. Use `bkit_pdca_plan` with the feature name to get template
2. Fill template with validated content from Phases 1-4
3. Write to `docs/01-plan/features/{feature}.plan.md`
4. Call `bkit_complete_phase(feature, 'plan')` to record completion
5. Present final document for user review

Output path: `docs/01-plan/features/{feature}.plan.md`

## MCP Tool Integration

| Phase | Tool | Purpose |
|-------|------|---------|
| 0 | `bkit_get_status` | Load PDCA state |
| 0 | `bkit_analyze_prompt` | Detect intent |
| 5 | `bkit_pdca_plan` | Get plan template |
| 5 | `bkit_complete_phase` | Record plan completion |

## References

For detailed process patterns, question templates, and examples, see:
`references/plan-plus-process.md`
