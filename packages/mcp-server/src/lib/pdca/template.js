'use strict';

const TEMPLATE_MATRIX = {
  plan: {
    Starter: 'plan.template.md',
    Dynamic: 'plan.template.md',
    Enterprise: 'plan.template.md'
  },
  design: {
    Starter: 'design-starter.template.md',
    Dynamic: 'design.template.md',
    Enterprise: 'design-enterprise.template.md'
  },
  analysis: {
    Starter: 'analysis.template.md',
    Dynamic: 'analysis.template.md',
    Enterprise: 'analysis.template.md'
  },
  report: {
    Starter: 'report.template.md',
    Dynamic: 'report.template.md',
    Enterprise: 'report.template.md'
  },
  do: {
    Starter: 'do.template.md',
    Dynamic: 'do.template.md',
    Enterprise: 'do.template.md'
  }
};

const TEMPLATES = {
  'plan.template.md': `# \${FEATURE} - Plan Document

> Version: 1.0.0 | Date: \${DATE} | Status: Draft
> Level: \${LEVEL}

---

## 1. Overview

### 1.1 Purpose
[Describe the purpose of this feature]

### 1.2 Background
[Context and motivation]

## 2. Goals

### 2.1 Primary Goals
- [ ] Goal 1
- [ ] Goal 2

### 2.2 Non-Goals
- What this feature will NOT do

## 3. Scope

### 3.1 In Scope
- Item 1
- Item 2

### 3.2 Out of Scope
- Item 1

## 4. Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## 5. Schedule

| Phase | Target Date | Status |
|-------|------------|--------|
| Plan | \${DATE} | In Progress |
| Design | TBD | Pending |
| Implementation | TBD | Pending |
| Review | TBD | Pending |

## 6. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Risk 1 | High | Medium | Mitigation 1 |

## 7. References

- Related documents
- External resources
`,

  'design.template.md': `# \${FEATURE} - Design Document

> Version: 1.0.0 | Date: \${DATE} | Status: Draft
> Level: \${LEVEL} | Plan: docs/01-plan/features/\${FEATURE}.plan.md

---

## 1. Overview

### 1.1 Purpose
[Brief description of this feature's design]

### 1.2 Design Goals
- Goal 1
- Goal 2

## 2. Architecture

### 2.1 System Architecture
[High-level architecture description]

### 2.2 Component Design
[Component breakdown]

### 2.3 Data Flow
[Data flow description]

## 3. Data Model

### 3.1 Entities
[Entity definitions]

### 3.2 Relationships
[Entity relationships]

## 4. API Specification

### 4.1 Endpoints
[API endpoint definitions]

### 4.2 Request/Response
[Request and response schemas]

## 5. Implementation Plan

### 5.1 File Structure
[Planned file organization]

### 5.2 Implementation Order
1. Step 1
2. Step 2

## 6. Test Plan

### 6.1 Unit Tests
- Test case 1
- Test case 2

### 6.2 Integration Tests
- Test scenario 1

## 7. Security Considerations

- Security item 1
- Security item 2
`,

  'design-starter.template.md': `# \${FEATURE} - Design Document (Starter)

> Version: 1.0.0 | Date: \${DATE} | Status: Draft
> Level: Starter | Plan: docs/01-plan/features/\${FEATURE}.plan.md

---

## 1. Overview
[What does this feature do?]

## 2. Page Structure
[What pages/sections will this have?]

## 3. Design
### 3.1 Layout
[Describe the layout - header, main, footer, sidebar, etc.]

### 3.2 Styling
[Colors, fonts, responsive breakpoints]

## 4. Components
[List the UI components needed]

## 5. Implementation Order
1. HTML structure
2. CSS styling
3. JavaScript interactivity

## 6. Learning Points
[Key concepts to learn from this feature]
`,

  'design-enterprise.template.md': `# \${FEATURE} - Design Document (Enterprise)

> Version: 1.0.0 | Date: \${DATE} | Status: Draft
> Level: Enterprise | Plan: docs/01-plan/features/\${FEATURE}.plan.md

---

## 1. Overview

### 1.1 Purpose
### 1.2 Design Goals
### 1.3 Constraints & Trade-offs

## 2. Architecture

### 2.1 System Context
### 2.2 Service Architecture
### 2.3 Data Flow & Event Architecture
### 2.4 Infrastructure Topology

## 3. Data Model

### 3.1 Entity Design
### 3.2 Database Selection & Justification
### 3.3 Migration Strategy
### 3.4 Data Retention Policy

## 4. API Specification

### 4.1 Service Contracts
### 4.2 Event Schemas
### 4.3 API Versioning Strategy
### 4.4 Rate Limiting & Throttling

## 5. Security Architecture

### 5.1 Authentication & Authorization
### 5.2 Data Encryption
### 5.3 Network Security
### 5.4 Compliance Requirements

## 6. Performance & Scalability

### 6.1 Performance Requirements
### 6.2 Scaling Strategy
### 6.3 Caching Strategy
### 6.4 Load Testing Plan

## 7. Observability

### 7.1 Logging Strategy
### 7.2 Metrics & Monitoring
### 7.3 Alerting Rules
### 7.4 Tracing

## 8. Deployment

### 8.1 CI/CD Pipeline
### 8.2 Rollback Strategy
### 8.3 Feature Flags
### 8.4 Canary/Blue-Green Deployment

## 9. Cost Analysis

### 9.1 Infrastructure Cost
### 9.2 Operational Cost
### 9.3 Cost Optimization Opportunities

## 10. Implementation Plan

### 10.1 Phased Delivery
### 10.2 Team Assignment
### 10.3 Risk Matrix

## 11. Test Plan

### 11.1 Unit Tests
### 11.2 Integration Tests
### 11.3 Performance Tests
### 11.4 Chaos Engineering
`,

  'analysis.template.md': `# Gap Analysis: \${FEATURE}

> Date: \${DATE} | Design: docs/02-design/features/\${FEATURE}.design.md

---

## Match Rate: __%

## Summary
[Brief summary of the analysis]

## Implemented Items
- [ ] Item 1
- [ ] Item 2

## Missing Items
- [ ] Missing 1
- [ ] Missing 2

## Changed Items (Deviations from Design)
- [ ] Changed 1

## Recommendations
1. Recommendation 1
2. Recommendation 2

## Next Steps
- [ ] Fix gaps or proceed to report if match rate >= 90%
`,

  'report.template.md': `# Completion Report: \${FEATURE}

> Date: \${DATE} | Level: \${LEVEL}

---

## 1. Summary

### 1.1 Feature Overview
[Brief description of what was built]

### 1.2 Final Match Rate
__% (Target: 90%)

## 2. Completed Items
- [x] Item 1
- [x] Item 2

## 3. Deviations from Design
[List any intentional deviations and their justifications]

## 4. Metrics

| Metric | Value |
|--------|-------|
| Lines of Code | __ |
| Files Changed | __ |
| PDCA Iterations | __ |
| Duration | __ |

## 5. Learnings
1. Learning 1
2. Learning 2

## 6. Follow-up Items
- [ ] Future improvement 1
- [ ] Future improvement 2
`,

  'do.template.md': `# Implementation Guide: \${FEATURE}

> Date: \${DATE} | Design: docs/02-design/features/\${FEATURE}.design.md

---

## Pre-Implementation Checklist
- [ ] Plan document reviewed
- [ ] Design document reviewed
- [ ] Development environment ready
- [ ] Dependencies identified

## Implementation Order
1. Step 1: [Description]
2. Step 2: [Description]

## Key References
- Design: docs/02-design/features/\${FEATURE}.design.md
- Plan: docs/01-plan/features/\${FEATURE}.plan.md

## Post-Implementation
- [ ] Call bkit_post_write for each modified file
- [ ] Run gap analysis when implementation is complete
`
};

/**
 * Select the appropriate template name based on phase and level.
 * @param {string} phase - PDCA phase
 * @param {string} [level='Dynamic'] - Project level
 * @returns {string} Template file name
 */
function selectTemplate(phase, level = 'Dynamic') {
  const phaseTemplates = TEMPLATE_MATRIX[phase];
  if (!phaseTemplates) return 'plan.template.md';
  return phaseTemplates[level] || phaseTemplates.Dynamic || 'plan.template.md';
}

/**
 * Get the raw template content.
 * @param {string} templateName
 * @returns {string}
 */
function getTemplateContent(templateName) {
  return TEMPLATES[templateName] || `# Template: ${templateName}\n\n[Template not found]\n`;
}

/**
 * Resolve template variables.
 * @param {string} content - Template content with ${VAR} placeholders
 * @param {object} vars - Variable map: { FEATURE, DATE, LEVEL, PROJECT }
 * @returns {string}
 */
function resolveTemplateVariables(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(pattern, value || '');
  }
  return result;
}

/**
 * Get list of all available templates.
 * @returns {string[]}
 */
function getTemplateList() {
  return Object.keys(TEMPLATES);
}

/**
 * Validate that a template has required sections.
 * @param {string} content
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTemplate(content) {
  const errors = [];
  if (!content || typeof content !== 'string') {
    return { valid: false, errors: ['Template content must be a non-empty string'] };
  }
  if (!content.startsWith('#')) {
    errors.push('Template should start with a markdown heading');
  }
  if (content.length < 50) {
    errors.push('Template content is too short');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  selectTemplate,
  getTemplateContent,
  resolveTemplateVariables,
  getTemplateList,
  validateTemplate
};
