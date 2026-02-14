# bkit-codex-qa - Comprehensive QA Test Plan

> Version: 1.0.0 | Date: 2026-02-15 | Status: Draft
> Level: Enterprise
> Execution Platform: OpenAI Codex

---

## 1. Overview

### 1.1 Purpose

Create a comprehensive QA test plan covering all 75 lib functions, 16 MCP tools, the JSON-RPC 2.0 server, and STDIO entry point of the bkit-codex MCP server. The tests verify functional correctness AND compliance with 4 bkit philosophy documents (core-mission, context-engineering, pdca-methodology, ai-native-principles).

### 1.2 Background

bkit-codex is a port of bkit-claude-code to the OpenAI Codex CLI platform. The existing test suite covers approximately 60% of the codebase with `lib.test.js` (476 lines), `tools.test.js` (178 lines), and `server.test.js` (108 lines). This QA plan aims to achieve 100% function coverage, add cross-module integration tests, E2E server tests, and philosophy compliance verification.

### 1.3 Scope Summary

| Category | Count | Coverage Target |
|----------|-------|-----------------|
| Core lib functions | 17 | 100% |
| PDCA lib functions | 27 | 100% |
| Intent lib functions | 10 | 100% |
| Task lib functions | 7 | 100% |
| MCP tool handlers | 16 | 100% |
| Server dispatcher | 1 module | 100% |
| STDIO entry point | 1 module | 100% |
| Philosophy compliance | 4 docs | Full matrix |

---

## 2. Goals

### 2.1 Primary Goals

- [ ] 100% function coverage across all 75 lib functions (14 source files)
- [ ] 100% tool handler coverage for all 16 MCP tools
- [ ] E2E JSON-RPC 2.0 request/response testing through STDIO transport
- [ ] Philosophy compliance verification matrix across all 4 philosophy documents
- [ ] Codex-compatible test execution (Node.js node:test runner, zero external deps)

### 2.2 Non-Goals

- Performance/load testing (out of scope for Codex platform)
- UI/visual testing (MCP server is headless)
- Network-dependent tests (Codex runs sandboxed)
- Cross-platform OS compatibility testing

---

## 3. Codebase Analysis

### 3.1 Source File Inventory

```
packages/mcp-server/src/
  lib/
    core/
      config.js     - 5 exports: loadConfig, getConfig, mergeConfig, validateConfig, getDefaultConfig
      cache.js      - 4 exports: getCache, setCache, invalidateCache, clearCache
      file.js       - 4 exports: readJsonFile, writeJsonFile, fileExists, ensureDir
      path.js       - 4 exports: resolveProjectPath, getDocsPath, getFeaturePath, getRelativePath

    pdca/
      status.js     - 10 exports: readPdcaStatus, writePdcaStatus, getFeatureStatus, setFeaturePhase,
                                   addFeature, removeFeature, getActiveFeatures, getPrimaryFeature,
                                   setPrimaryFeature, getArchivedFeatures
      level.js      - 3 exports: detectLevel, getLevelConfig, isLevelMatch
      phase.js      - 6 exports: getCurrentPhase, setPhase, getNextPhase, validatePhaseTransition,
                                  getPhaseDeliverables, checkDeliverables
      automation.js - 7 exports: classifyTask, shouldApplyPdca, checkDesignExists, checkPlanExists,
                                  suggestNextAction, formatPdcaProgress, generatePdcaGuidance
      template.js   - 5 exports: selectTemplate, getTemplateContent, resolveTemplateVariables,
                                  getTemplateList, validateTemplate

    intent/
      language.js   - 2 exports: detectLanguage, getSupportedLanguages
      trigger.js    - 4 exports: matchSkillTrigger, matchAgentTrigger, getImplicitTriggers,
                                  matchMultiLanguageTrigger
      ambiguity.js  - 4 exports: calculateAmbiguityScore, needsClarification,
                                  generateClarifyingQuestions, checkMagicWords

    task/
      classification.js - 4 exports: classifyByLines, classifyByDescription,
                                      getClassificationLabel, getClassificationThresholds
      creator.js        - 3 exports: createPdcaTask, formatTaskSubject, getTaskTemplate

  tools/
    index.js          - 2 exports: getToolDefinitions, executeToolCall
    init.js           - bkit_init handler
    get-status.js     - bkit_get_status handler
    pre-write.js      - bkit_pre_write_check handler
    post-write.js     - bkit_post_write handler
    complete.js       - bkit_complete_phase handler
    pdca-plan.js      - bkit_pdca_plan handler
    pdca-design.js    - bkit_pdca_design handler
    pdca-analyze.js   - bkit_pdca_analyze handler
    pdca-next.js      - bkit_pdca_next handler
    analyze-prompt.js - bkit_analyze_prompt handler
    classify.js       - bkit_classify_task handler
    detect-level.js   - bkit_detect_level handler
    template.js       - bkit_select_template handler
    deliverables.js   - bkit_check_deliverables handler
    memory-read.js    - bkit_memory_read handler
    memory-write.js   - bkit_memory_write handler

  server.js           - createServer, handleRequest, dispatch
  index.js (entry)    - STDIO transport, newline-delimited JSON-RPC parsing
```

### 3.2 Function Count by Module

| Module | File | Exported Functions | Internal Functions | Total |
|--------|------|-------------------:|-------------------:|------:|
| core/config | config.js | 5 | 1 (getValueByPath) | 6 |
| core/cache | cache.js | 4 | 0 | 4 |
| core/file | file.js | 4 | 0 | 4 |
| core/path | path.js | 4 | 0 | 4 |
| pdca/status | status.js | 10 | 1 (getDefaultStatus) | 11 |
| pdca/level | level.js | 3 | 0 | 3 |
| pdca/phase | phase.js | 6 | 0 | 6 |
| pdca/automation | automation.js | 7 | 2 (checkDesignExists internal, checkPlanExists internal) | 9 |
| pdca/template | template.js | 5 | 0 | 5 |
| intent/language | language.js | 2 | 0 | 2 |
| intent/trigger | trigger.js | 4 | 0 | 4 |
| intent/ambiguity | ambiguity.js | 4 | 0 | 4 |
| task/classification | classification.js | 4 | 0 | 4 |
| task/creator | creator.js | 3 | 0 | 3 |
| tools/index | index.js | 2 | 0 | 2 |
| **Total** | | **67** | **4** | **71** |
| tools (16 handlers) | 16 files | 16 handler functions | 2 (extractFeatureName x2) | 18 |
| server | server.js | 1 (createServer) | 3 (handleRequest, dispatch, handleToolsCall) | 4 |

**Grand Total: 93 functions** (71 lib + 18 tool + 4 server)

### 3.3 Existing Test Coverage Analysis

| Test File | Lines | Tests | Coverage |
|-----------|------:|------:|----------|
| lib.test.js | 476 | ~45 | core/config (18), pdca/level (8), intent/language (14), intent/ambiguity (15) |
| tools.test.js | 178 | ~20 | Tool definitions only (no handler execution) |
| server.test.js | 108 | 5 | initialize, tools/list, tools/call, error cases |

**Coverage Gaps:**
- core/cache.js: 0% (no tests)
- core/file.js: 0% (no tests)
- core/path.js: 0% (no tests)
- pdca/status.js: 0% (no tests)
- pdca/phase.js: 0% (no tests)
- pdca/automation.js: 0% (only classifyTask indirectly via level tests)
- pdca/template.js: 0% (no tests)
- intent/trigger.js: 0% (no tests)
- task/classification.js: 0% (no tests)
- task/creator.js: 0% (no tests)
- Tool handlers: 0% functional tests (only schema validation)
- Integration tests: 0%
- E2E tests: 0%
- Philosophy compliance: 0%

---

## 4. Team Structure & Responsibilities

### 4.1 Team Composition (8 Members)

| Role | Agent Type | Responsibility | PDCA Phase |
|------|-----------|----------------|------------|
| CTO Lead | cto-lead | Architecture, orchestration, quality gates | All |
| QA Architect | qa-strategist | Test strategy, test plan review, coverage analysis | Plan, Check |
| Core Module Tester | bkend-expert | Unit tests for core/ (config, cache, file, path) | Do |
| PDCA Module Tester | bkend-expert | Unit tests for pdca/ (status, level, phase, automation, template) | Do |
| Intent/Task Tester | bkend-expert | Unit tests for intent/ and task/ modules | Do |
| Tool Handler Tester | bkend-expert | Functional tests for all 16 tool handlers | Do |
| Integration/E2E Tester | qa-monitor | Integration + E2E server tests, STDIO transport | Do, Check |
| Philosophy Compliance Auditor | gap-detector | Philosophy document compliance verification matrix | Check |

### 4.2 Work Distribution

```
Phase 1 (Plan):     CTO Lead + QA Architect
Phase 2 (Do):       4 parallel testers (Core, PDCA, Intent/Task, Tools)
                     + Integration/E2E Tester
Phase 3 (Check):    QA Architect + Philosophy Auditor + Gap Detector
Phase 4 (Act):      CTO Lead coordinates fixes
```

---

## 5. Test Categories

### 5.1 Category 1: Unit Tests - core/ Module

**File: `tests/lib/core/config.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| C-CFG-01 | loadConfig | Returns default config for directory without config file | P0 |
| C-CFG-02 | loadConfig | Merges project config over defaults | P0 |
| C-CFG-03 | loadConfig | Caches config for same projectDir | P1 |
| C-CFG-04 | loadConfig | Returns fresh config for different projectDir | P1 |
| C-CFG-05 | loadConfig | Handles malformed JSON config file gracefully | P1 |
| C-CFG-06 | getConfig | Returns value by dot-notation path | P0 |
| C-CFG-07 | getConfig | Returns undefined for non-existent path | P0 |
| C-CFG-08 | getConfig | Returns from DEFAULT_CONFIG when cache is empty | P1 |
| C-CFG-09 | getConfig | Returns nested object at partial path | P1 |
| C-CFG-10 | mergeConfig | Deep merges nested objects | P0 |
| C-CFG-11 | mergeConfig | Replaces arrays (does not merge) | P0 |
| C-CFG-12 | mergeConfig | Does not mutate base object | P0 |
| C-CFG-13 | mergeConfig | Handles null override values | P1 |
| C-CFG-14 | mergeConfig | Handles empty override object | P1 |
| C-CFG-15 | validateConfig | Validates correct default config | P0 |
| C-CFG-16 | validateConfig | Rejects null config | P0 |
| C-CFG-17 | validateConfig | Detects invalid pdca.matchRateThreshold (non-number) | P0 |
| C-CFG-18 | validateConfig | Detects invalid pdca.maxIterations (non-number) | P0 |
| C-CFG-19 | validateConfig | Detects invalid taskClassification thresholds | P0 |
| C-CFG-20 | validateConfig | Accepts config without pdca section (partial validation) | P1 |
| C-CFG-21 | getDefaultConfig | Returns fresh copy each call (no mutation leakage) | P0 |
| C-CFG-22 | getDefaultConfig | Contains all required sections | P0 |
| C-CFG-23 | getDefaultConfig | supportedLanguages has exactly 8 entries | P1 |

**File: `tests/lib/core/cache.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| C-CAC-01 | setCache/getCache | Set and retrieve a value | P0 |
| C-CAC-02 | getCache | Returns undefined for missing key | P0 |
| C-CAC-03 | getCache | Returns undefined for expired entry | P0 |
| C-CAC-04 | setCache | Overwrites existing key with new value | P1 |
| C-CAC-05 | setCache | Respects custom TTL | P0 |
| C-CAC-06 | setCache | Uses default 5s TTL when no TTL provided | P1 |
| C-CAC-07 | invalidateCache | Removes specific key | P0 |
| C-CAC-08 | invalidateCache | No-op for non-existent key | P1 |
| C-CAC-09 | clearCache | Removes all entries | P0 |
| C-CAC-10 | clearCache | Cache works after clear | P1 |

**File: `tests/lib/core/file.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| C-FIL-01 | readJsonFile | Reads and parses valid JSON file | P0 |
| C-FIL-02 | readJsonFile | Throws on non-existent file | P0 |
| C-FIL-03 | readJsonFile | Throws on invalid JSON content | P0 |
| C-FIL-04 | writeJsonFile | Writes JSON with pretty formatting | P0 |
| C-FIL-05 | writeJsonFile | Creates parent directories if needed | P0 |
| C-FIL-06 | writeJsonFile | Appends trailing newline | P1 |
| C-FIL-07 | writeJsonFile | Overwrites existing file | P1 |
| C-FIL-08 | fileExists | Returns true for existing file | P0 |
| C-FIL-09 | fileExists | Returns false for non-existent file | P0 |
| C-FIL-10 | fileExists | Returns true for existing directory | P1 |
| C-FIL-11 | ensureDir | Creates directory recursively | P0 |
| C-FIL-12 | ensureDir | No-op for existing directory | P0 |
| C-FIL-13 | ensureDir | Creates deeply nested directories | P1 |

**File: `tests/lib/core/path.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| C-PTH-01 | resolveProjectPath | Resolves relative path against project dir | P0 |
| C-PTH-02 | resolveProjectPath | Handles absolute paths correctly | P1 |
| C-PTH-03 | getDocsPath | Returns docs/ under project dir | P0 |
| C-PTH-04 | getFeaturePath | Returns correct plan path | P0 |
| C-PTH-05 | getFeaturePath | Returns correct design path | P0 |
| C-PTH-06 | getFeaturePath | Returns correct analysis path (not in features/) | P0 |
| C-PTH-07 | getFeaturePath | Returns correct report path (not in features/) | P0 |
| C-PTH-08 | getFeaturePath | Returns fallback for unknown phase | P1 |
| C-PTH-09 | getRelativePath | Computes relative path between two absolute paths | P0 |
| C-PTH-10 | getRelativePath | Handles same directory case | P1 |

**Core Module Total: 56 test cases**

---

### 5.2 Category 2: Unit Tests - pdca/ Module

**File: `tests/lib/pdca/status.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| P-STA-01 | readPdcaStatus | Returns default status when no file exists | P0 |
| P-STA-02 | readPdcaStatus | Reads existing status file | P0 |
| P-STA-03 | readPdcaStatus | Handles corrupted JSON file gracefully | P1 |
| P-STA-04 | writePdcaStatus | Writes status file with updated timestamps | P0 |
| P-STA-05 | writePdcaStatus | Updates lastUpdated and session.lastActivity | P0 |
| P-STA-06 | getFeatureStatus | Returns feature data for existing feature | P0 |
| P-STA-07 | getFeatureStatus | Returns null for non-existent feature | P0 |
| P-STA-08 | setFeaturePhase | Creates new feature with initial phase | P0 |
| P-STA-09 | setFeaturePhase | Updates phase for existing feature | P0 |
| P-STA-10 | setFeaturePhase | Adds to activeFeatures on creation | P0 |
| P-STA-11 | setFeaturePhase | Adds history entry on phase change | P0 |
| P-STA-12 | setFeaturePhase | Sets primaryFeature if none set | P1 |
| P-STA-13 | addFeature | Adds new feature with default plan phase | P0 |
| P-STA-14 | addFeature | Returns unchanged status if feature exists | P0 |
| P-STA-15 | addFeature | Adds to activeFeatures list | P0 |
| P-STA-16 | addFeature | Sets primaryFeature if none set | P1 |
| P-STA-17 | removeFeature | Removes from activeFeatures | P0 |
| P-STA-18 | removeFeature | Sets archived flag and archivedAt timestamp | P0 |
| P-STA-19 | removeFeature | Updates primaryFeature when removed feature was primary | P0 |
| P-STA-20 | getActiveFeatures | Returns list of active features | P0 |
| P-STA-21 | getActiveFeatures | Returns empty array when no features | P0 |
| P-STA-22 | getPrimaryFeature | Returns current primary feature | P0 |
| P-STA-23 | getPrimaryFeature | Returns null when no primary feature | P0 |
| P-STA-24 | setPrimaryFeature | Sets primary feature when feature is active | P0 |
| P-STA-25 | setPrimaryFeature | Throws error for inactive feature | P0 |
| P-STA-26 | getArchivedFeatures | Returns list of archived features | P0 |
| P-STA-27 | getArchivedFeatures | Returns empty array when no archived features | P0 |

**File: `tests/lib/pdca/level.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| P-LVL-01 | detectLevel | Returns Starter for empty directory | P0 |
| P-LVL-02 | detectLevel | Detects Enterprise for kubernetes/ dir | P0 |
| P-LVL-03 | detectLevel | Detects Enterprise for terraform/ dir | P0 |
| P-LVL-04 | detectLevel | Detects Enterprise for k8s/ dir | P0 |
| P-LVL-05 | detectLevel | Detects Enterprise for infra/ dir | P0 |
| P-LVL-06 | detectLevel | Detects Dynamic for .mcp.json | P0 |
| P-LVL-07 | detectLevel | Detects Dynamic for api/ dir | P0 |
| P-LVL-08 | detectLevel | Detects Dynamic for docker-compose.yml | P0 |
| P-LVL-09 | detectLevel | Detects Dynamic from package.json with bkend pattern | P0 |
| P-LVL-10 | detectLevel | Detects Dynamic from package.json with @supabase pattern | P1 |
| P-LVL-11 | detectLevel | Detects Dynamic from package.json with firebase pattern | P1 |
| P-LVL-12 | detectLevel | Returns high confidence for 2+ enterprise indicators | P0 |
| P-LVL-13 | detectLevel | Returns medium confidence for single enterprise indicator | P1 |
| P-LVL-14 | detectLevel | Prefers Enterprise over Dynamic when both present | P0 |
| P-LVL-15 | getLevelConfig | Returns correct config for Starter | P0 |
| P-LVL-16 | getLevelConfig | Returns correct config for Dynamic | P0 |
| P-LVL-17 | getLevelConfig | Returns correct config for Enterprise | P0 |
| P-LVL-18 | getLevelConfig | Returns Starter config for unknown level | P1 |
| P-LVL-19 | getLevelConfig | Starter skips phases 4, 5, 7, 8 | P0 |
| P-LVL-20 | getLevelConfig | Dynamic skips phase 8 | P0 |
| P-LVL-21 | getLevelConfig | Enterprise has no skip phases | P0 |
| P-LVL-22 | isLevelMatch | Returns true for matching level | P0 |
| P-LVL-23 | isLevelMatch | Returns false for non-matching level | P0 |

**File: `tests/lib/pdca/phase.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| P-PHA-01 | getCurrentPhase | Returns phase for existing feature | P0 |
| P-PHA-02 | getCurrentPhase | Returns null for non-existent feature | P0 |
| P-PHA-03 | setPhase | Sets phase for new feature | P0 |
| P-PHA-04 | setPhase | Updates phase for existing feature | P0 |
| P-PHA-05 | setPhase | Updates document paths in status | P0 |
| P-PHA-06 | getNextPhase | Returns design after plan | P0 |
| P-PHA-07 | getNextPhase | Returns do after design | P0 |
| P-PHA-08 | getNextPhase | Returns check after do | P0 |
| P-PHA-09 | getNextPhase | Returns act after check | P0 |
| P-PHA-10 | getNextPhase | Returns report after act | P0 |
| P-PHA-11 | getNextPhase | Returns null after report (end of cycle) | P0 |
| P-PHA-12 | getNextPhase | Returns null for unknown phase | P1 |
| P-PHA-13 | validatePhaseTransition | Allows sequential forward transition (plan->design) | P0 |
| P-PHA-14 | validatePhaseTransition | Blocks plan->do (must not skip design) | P0 |
| P-PHA-15 | validatePhaseTransition | Allows act->check (iteration cycle) | P0 |
| P-PHA-16 | validatePhaseTransition | Blocks backward transition (design->plan) | P0 |
| P-PHA-17 | validatePhaseTransition | Reports unknown source phase | P1 |
| P-PHA-18 | validatePhaseTransition | Reports unknown target phase | P1 |
| P-PHA-19 | validatePhaseTransition | Allows multi-step forward with warning | P1 |
| P-PHA-20 | getPhaseDeliverables | Returns correct deliverables for plan | P0 |
| P-PHA-21 | getPhaseDeliverables | Returns correct deliverables for design | P0 |
| P-PHA-22 | getPhaseDeliverables | Returns empty files array for do phase | P0 |
| P-PHA-23 | getPhaseDeliverables | Returns correct deliverables for check | P0 |
| P-PHA-24 | getPhaseDeliverables | Returns fallback for unknown phase | P1 |
| P-PHA-25 | checkDeliverables | Returns complete=true when all files exist | P0 |
| P-PHA-26 | checkDeliverables | Returns missing files list when incomplete | P0 |

**File: `tests/lib/pdca/automation.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| P-AUT-01 | classifyTask | Returns quick_fix for <10 lines | P0 |
| P-AUT-02 | classifyTask | Returns minor_change for 10-49 lines | P0 |
| P-AUT-03 | classifyTask | Returns feature for 50-199 lines | P0 |
| P-AUT-04 | classifyTask | Returns major_feature for >=200 lines | P0 |
| P-AUT-05 | shouldApplyPdca | Returns false for quick_fix | P0 |
| P-AUT-06 | shouldApplyPdca | Returns true for feature | P0 |
| P-AUT-07 | shouldApplyPdca | Returns true for minor_change (recommended) | P0 |
| P-AUT-08 | checkDesignExists | Returns true when design file exists | P0 |
| P-AUT-09 | checkDesignExists | Returns false when design file missing | P0 |
| P-AUT-10 | checkPlanExists | Returns true when plan file exists | P0 |
| P-AUT-11 | checkPlanExists | Returns false when plan file missing | P0 |
| P-AUT-12 | suggestNextAction | Suggests plan for untracked feature | P0 |
| P-AUT-13 | suggestNextAction | Suggests design when plan exists | P0 |
| P-AUT-14 | suggestNextAction | Suggests do when design exists | P0 |
| P-AUT-15 | suggestNextAction | Suggests analyze when in do phase | P0 |
| P-AUT-16 | suggestNextAction | Suggests report when matchRate >= 90 | P0 |
| P-AUT-17 | suggestNextAction | Suggests iterate when matchRate < 90 | P0 |
| P-AUT-18 | suggestNextAction | Suggests re-analyze when in act phase | P1 |
| P-AUT-19 | suggestNextAction | Suggests archive when in report phase | P1 |
| P-AUT-20 | formatPdcaProgress | Returns formatted progress string | P0 |
| P-AUT-21 | formatPdcaProgress | Returns '[No PDCA tracking]' for null | P0 |
| P-AUT-22 | formatPdcaProgress | Shows completed phases, active phase, pending phases | P1 |
| P-AUT-23 | generatePdcaGuidance | Returns guidance for untracked feature | P0 |
| P-AUT-24 | generatePdcaGuidance | Returns plan-phase guidance | P0 |
| P-AUT-25 | generatePdcaGuidance | Returns design-phase guidance | P0 |
| P-AUT-26 | generatePdcaGuidance | Returns do-phase guidance with bkit_pre_write_check mention | P1 |
| P-AUT-27 | generatePdcaGuidance | Returns act-phase guidance with iteration count | P1 |

**File: `tests/lib/pdca/template.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| P-TPL-01 | selectTemplate | Returns plan.template.md for plan/Starter | P0 |
| P-TPL-02 | selectTemplate | Returns design-starter.template.md for design/Starter | P0 |
| P-TPL-03 | selectTemplate | Returns design.template.md for design/Dynamic | P0 |
| P-TPL-04 | selectTemplate | Returns design-enterprise.template.md for design/Enterprise | P0 |
| P-TPL-05 | selectTemplate | Returns analysis.template.md for analysis (all levels) | P0 |
| P-TPL-06 | selectTemplate | Returns fallback for unknown phase | P1 |
| P-TPL-07 | selectTemplate | Uses Dynamic as default level | P1 |
| P-TPL-08 | getTemplateContent | Returns content for valid template name | P0 |
| P-TPL-09 | getTemplateContent | Returns fallback content for unknown template | P0 |
| P-TPL-10 | resolveTemplateVariables | Replaces ${FEATURE} placeholder | P0 |
| P-TPL-11 | resolveTemplateVariables | Replaces ${DATE} placeholder | P0 |
| P-TPL-12 | resolveTemplateVariables | Replaces ${LEVEL} placeholder | P0 |
| P-TPL-13 | resolveTemplateVariables | Replaces multiple occurrences of same variable | P0 |
| P-TPL-14 | resolveTemplateVariables | Handles missing variable (replaces with empty string) | P1 |
| P-TPL-15 | getTemplateList | Returns array of all template names | P0 |
| P-TPL-16 | getTemplateList | Contains exactly 7 templates | P0 |
| P-TPL-17 | validateTemplate | Valid template passes validation | P0 |
| P-TPL-18 | validateTemplate | Rejects null content | P0 |
| P-TPL-19 | validateTemplate | Warns when template does not start with # | P1 |
| P-TPL-20 | validateTemplate | Warns when content is too short (<50 chars) | P1 |

**PDCA Module Total: 123 test cases**

---

### 5.3 Category 3: Unit Tests - intent/ Module

**File: `tests/lib/intent/language.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| I-LNG-01 | detectLanguage | Returns "en" for English text | P0 |
| I-LNG-02 | detectLanguage | Returns "en" for null/empty/undefined | P0 |
| I-LNG-03 | detectLanguage | Detects Korean (Hangul characters) | P0 |
| I-LNG-04 | detectLanguage | Detects Japanese (Hiragana/Katakana) | P0 |
| I-LNG-05 | detectLanguage | Detects Chinese (CJK without kana) | P0 |
| I-LNG-06 | detectLanguage | Detects Spanish (>=2 keyword matches) | P0 |
| I-LNG-07 | detectLanguage | Detects French (>=2 keyword matches) | P0 |
| I-LNG-08 | detectLanguage | Detects German (>=2 keyword matches) | P0 |
| I-LNG-09 | detectLanguage | Detects Italian (>=2 keyword matches) | P0 |
| I-LNG-10 | detectLanguage | Defaults to en for single European keyword (avoids false positive) | P0 |
| I-LNG-11 | detectLanguage | Handles mixed Korean/English text (Korean dominates) | P1 |
| I-LNG-12 | detectLanguage | Japanese kana overrides CJK-only detection | P1 |
| I-LNG-13 | getSupportedLanguages | Returns array of exactly 8 language codes | P0 |
| I-LNG-14 | getSupportedLanguages | Contains all expected codes: en, ko, ja, zh, es, fr, de, it | P0 |
| I-LNG-15 | getSupportedLanguages | Returns fresh copy (no mutation leakage) | P0 |

**File: `tests/lib/intent/trigger.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| I-TRG-01 | matchSkillTrigger | Returns empty for null/undefined input | P0 |
| I-TRG-02 | matchSkillTrigger | Matches starter skill for "static website" | P0 |
| I-TRG-03 | matchSkillTrigger | Matches dynamic skill for "login" | P0 |
| I-TRG-04 | matchSkillTrigger | Matches enterprise skill for "kubernetes" | P0 |
| I-TRG-05 | matchSkillTrigger | Matches mobile-app skill for "react native" | P0 |
| I-TRG-06 | matchSkillTrigger | Matches Korean triggers | P0 |
| I-TRG-07 | matchSkillTrigger | Matches Japanese triggers | P0 |
| I-TRG-08 | matchSkillTrigger | Matches Chinese triggers | P1 |
| I-TRG-09 | matchSkillTrigger | Returns sorted by confidence (highest first) | P0 |
| I-TRG-10 | matchSkillTrigger | Increases confidence for multiple pattern matches | P1 |
| I-TRG-11 | matchSkillTrigger | Case-insensitive matching | P0 |
| I-TRG-12 | matchAgentTrigger | Returns empty for null input | P0 |
| I-TRG-13 | matchAgentTrigger | Matches gap-detector for "gap analysis" | P0 |
| I-TRG-14 | matchAgentTrigger | Matches pdca-iterator for "improve" | P0 |
| I-TRG-15 | matchAgentTrigger | Matches code-analyzer for "code review" | P0 |
| I-TRG-16 | matchAgentTrigger | Matches report-generator for "generate report" | P0 |
| I-TRG-17 | matchAgentTrigger | Matches Korean agent triggers | P1 |
| I-TRG-18 | getImplicitTriggers | Returns dynamic for .tsx/.jsx/react | P0 |
| I-TRG-19 | getImplicitTriggers | Returns starter for .html/.css | P0 |
| I-TRG-20 | getImplicitTriggers | Returns enterprise for Dockerfile/.yml | P0 |
| I-TRG-21 | getImplicitTriggers | Returns mobile-app for .swift/.kt/.dart | P0 |
| I-TRG-22 | getImplicitTriggers | Returns empty for null input | P0 |
| I-TRG-23 | getImplicitTriggers | Deduplicates results | P1 |
| I-TRG-24 | matchMultiLanguageTrigger | Matches custom patterns | P0 |
| I-TRG-25 | matchMultiLanguageTrigger | Returns empty for null text or patterns | P0 |
| I-TRG-26 | matchMultiLanguageTrigger | Returns language and matched pattern | P0 |

**File: `tests/lib/intent/ambiguity.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| I-AMB-01 | calculateAmbiguityScore | Returns 100 for null/empty/undefined | P0 |
| I-AMB-02 | calculateAmbiguityScore | Returns 0 for !hotfix magic word | P0 |
| I-AMB-03 | calculateAmbiguityScore | Returns 0 for !prototype magic word | P0 |
| I-AMB-04 | calculateAmbiguityScore | Returns 0 for !bypass magic word | P0 |
| I-AMB-05 | calculateAmbiguityScore | Low score for specific technical prompt with file path | P0 |
| I-AMB-06 | calculateAmbiguityScore | High score for vague 2-word prompt | P0 |
| I-AMB-07 | calculateAmbiguityScore | Penalizes short prompts (<3 words) | P0 |
| I-AMB-08 | calculateAmbiguityScore | Penalizes scope words (all, everything, any) | P0 |
| I-AMB-09 | calculateAmbiguityScore | Penalizes ambiguous verbs in short context | P0 |
| I-AMB-10 | calculateAmbiguityScore | Penalizes conflicting pairs (simple+complex) | P0 |
| I-AMB-11 | calculateAmbiguityScore | Reduces score for file paths | P0 |
| I-AMB-12 | calculateAmbiguityScore | Reduces score for 2+ technical terms | P0 |
| I-AMB-13 | calculateAmbiguityScore | Score always between 0-100 | P0 |
| I-AMB-14 | needsClarification | True for score >= 50 | P0 |
| I-AMB-15 | needsClarification | False for score < 50 | P0 |
| I-AMB-16 | generateClarifyingQuestions | Returns questions for short text | P0 |
| I-AMB-17 | generateClarifyingQuestions | Returns category question for multiple triggers | P0 |
| I-AMB-18 | generateClarifyingQuestions | Returns project type question for zero triggers | P0 |
| I-AMB-19 | generateClarifyingQuestions | Returns feature focus question when no component keywords | P0 |
| I-AMB-20 | generateClarifyingQuestions | Always returns at least one question | P0 |
| I-AMB-21 | checkMagicWords | Detects !hotfix | P0 |
| I-AMB-22 | checkMagicWords | Detects !prototype | P0 |
| I-AMB-23 | checkMagicWords | Detects !bypass | P0 |
| I-AMB-24 | checkMagicWords | Returns false for no magic words | P0 |
| I-AMB-25 | checkMagicWords | Returns false for null/empty input | P0 |

**Intent Module Total: 66 test cases**

---

### 5.4 Category 4: Unit Tests - task/ Module

**File: `tests/lib/task/classification.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| T-CLS-01 | classifyByLines | Returns quick_fix for <10 lines | P0 |
| T-CLS-02 | classifyByLines | Returns minor_change for 10-49 lines | P0 |
| T-CLS-03 | classifyByLines | Returns feature for 50-199 lines | P0 |
| T-CLS-04 | classifyByLines | Returns major_feature for >=200 lines | P0 |
| T-CLS-05 | classifyByLines | Returns quick_fix for negative number | P0 |
| T-CLS-06 | classifyByLines | Returns quick_fix for non-number input | P0 |
| T-CLS-07 | classifyByLines | Returns quick_fix for zero | P0 |
| T-CLS-08 | classifyByLines | Tests boundary values (9, 10, 49, 50, 199, 200) | P0 |
| T-CLS-09 | classifyByDescription | Returns major_feature for "refactor" | P0 |
| T-CLS-10 | classifyByDescription | Returns major_feature for "migration" | P0 |
| T-CLS-11 | classifyByDescription | Returns major_feature for "redesign" | P0 |
| T-CLS-12 | classifyByDescription | Returns feature for "implement" | P0 |
| T-CLS-13 | classifyByDescription | Returns feature for "add new" | P0 |
| T-CLS-14 | classifyByDescription | Returns quick_fix for "typo" | P0 |
| T-CLS-15 | classifyByDescription | Returns quick_fix for "formatting" | P0 |
| T-CLS-16 | classifyByDescription | Returns minor_change for "fix" | P0 |
| T-CLS-17 | classifyByDescription | Returns minor_change for null/undefined | P0 |
| T-CLS-18 | classifyByDescription | Case-insensitive matching | P0 |
| T-CLS-19 | getClassificationLabel | Returns "Quick Fix" for quick_fix | P0 |
| T-CLS-20 | getClassificationLabel | Returns "Major Feature" for major_feature | P0 |
| T-CLS-21 | getClassificationLabel | Returns "Unknown" for unrecognized key | P0 |
| T-CLS-22 | getClassificationThresholds | Returns correct threshold values | P0 |
| T-CLS-23 | getClassificationThresholds | Returns fresh copy (no mutation leakage) | P1 |

**File: `tests/lib/task/creator.test.js`**

| ID | Function | Test Case | Priority |
|----|----------|-----------|----------|
| T-CRT-01 | createPdcaTask | Creates task for plan phase | P0 |
| T-CRT-02 | createPdcaTask | Creates task for all 6 phases | P0 |
| T-CRT-03 | createPdcaTask | Returns correct subject, description, phase, feature | P0 |
| T-CRT-04 | formatTaskSubject | Returns "[PLAN] feature-name" | P0 |
| T-CRT-05 | formatTaskSubject | Returns "[DESIGN] feature-name" | P0 |
| T-CRT-06 | formatTaskSubject | Returns "[UNKNOWN-PHASE] feature-name" for unknown phase | P1 |
| T-CRT-07 | getTaskTemplate | Returns template for known phase | P0 |
| T-CRT-08 | getTaskTemplate | Returns fallback template for unknown phase | P0 |
| T-CRT-09 | getTaskTemplate | Returns correct prefix and description | P0 |

**Task Module Total: 32 test cases**

---

### 5.5 Category 5: Tool Handler Functional Tests

**File: `tests/tools/handlers.test.js`**

Each tool handler test uses a temp directory with appropriate fixtures.

| ID | Tool | Test Case | Priority |
|----|------|-----------|----------|
| TH-INI-01 | bkit_init | Returns session context with level, guidance, sessionId | P0 |
| TH-INI-02 | bkit_init | Returns error when projectDir is missing | P0 |
| TH-INI-03 | bkit_init | Sets projectDir in server context | P0 |
| TH-INI-04 | bkit_init | Detects correct project level | P0 |
| TH-INI-05 | bkit_init | Returns active features from PDCA status | P1 |
| TH-STS-01 | bkit_get_status | Returns error when not initialized | P0 |
| TH-STS-02 | bkit_get_status | Returns all active features when no feature arg | P0 |
| TH-STS-03 | bkit_get_status | Returns specific feature status | P0 |
| TH-STS-04 | bkit_get_status | Returns suggestion for non-existent feature | P0 |
| TH-STS-05 | bkit_get_status | Returns cached result within TTL | P1 |
| TH-PRE-01 | bkit_pre_write_check | Returns error when not initialized | P0 |
| TH-PRE-02 | bkit_pre_write_check | Returns error when filePath missing | P0 |
| TH-PRE-03 | bkit_pre_write_check | Returns allowed=true with guidance | P0 |
| TH-PRE-04 | bkit_pre_write_check | Detects feature name from file path | P0 |
| TH-PRE-05 | bkit_pre_write_check | Returns design reference when design exists | P0 |
| TH-PRE-06 | bkit_pre_write_check | Warns when PDCA required but no design | P1 |
| TH-PRE-07 | bkit_pre_write_check | Returns convention hints | P1 |
| TH-PST-01 | bkit_post_write | Returns error when not initialized | P0 |
| TH-PST-02 | bkit_post_write | Returns error when filePath missing | P0 |
| TH-PST-03 | bkit_post_write | Suggests gap analysis for significant changes | P0 |
| TH-PST-04 | bkit_post_write | Returns next steps | P0 |
| TH-PST-05 | bkit_post_write | Suggests splitting for 200+ line changes | P1 |
| TH-CMP-01 | bkit_complete_phase | Returns error when not initialized | P0 |
| TH-CMP-02 | bkit_complete_phase | Returns error when feature missing | P0 |
| TH-CMP-03 | bkit_complete_phase | Returns error for invalid phase | P0 |
| TH-CMP-04 | bkit_complete_phase | Completes phase and returns next phase | P0 |
| TH-CMP-05 | bkit_complete_phase | Creates feature if not tracked | P0 |
| TH-CMP-06 | bkit_complete_phase | Returns error for invalid transition | P0 |
| TH-CMP-07 | bkit_complete_phase | Returns "completed" for report phase | P0 |
| TH-PLN-01 | bkit_pdca_plan | Returns error when not initialized | P0 |
| TH-PLN-02 | bkit_pdca_plan | Returns error when feature missing | P0 |
| TH-PLN-03 | bkit_pdca_plan | Returns template content and output path | P0 |
| TH-PLN-04 | bkit_pdca_plan | Registers feature in PDCA status | P0 |
| TH-PLN-05 | bkit_pdca_plan | Auto-detects level when not provided | P1 |
| TH-DSN-01 | bkit_pdca_design | Returns error when not initialized | P0 |
| TH-DSN-02 | bkit_pdca_design | Returns error when plan does not exist | P0 |
| TH-DSN-03 | bkit_pdca_design | Returns template when plan exists | P0 |
| TH-DSN-04 | bkit_pdca_design | Selects level-appropriate template | P0 |
| TH-DSN-05 | bkit_pdca_design | Updates PDCA status to design phase | P0 |
| TH-ANL-01 | bkit_pdca_analyze | Returns error when not initialized | P0 |
| TH-ANL-02 | bkit_pdca_analyze | Returns error when design does not exist | P0 |
| TH-ANL-03 | bkit_pdca_analyze | Returns analysis template and paths when design exists | P0 |
| TH-ANL-04 | bkit_pdca_analyze | Updates status to check phase | P0 |
| TH-ANL-05 | bkit_pdca_analyze | Increments iteration count | P0 |
| TH-NXT-01 | bkit_pdca_next | Returns error when not initialized | P0 |
| TH-NXT-02 | bkit_pdca_next | Returns plan recommendation for untracked feature | P0 |
| TH-NXT-03 | bkit_pdca_next | Returns next phase based on current state | P0 |
| TH-APR-01 | bkit_analyze_prompt | Returns error when prompt missing | P0 |
| TH-APR-02 | bkit_analyze_prompt | Returns language, intent, triggers, ambiguity | P0 |
| TH-APR-03 | bkit_analyze_prompt | Detects feature intent from prompt | P0 |
| TH-APR-04 | bkit_analyze_prompt | Returns PDCA recommendation when projectDir set | P1 |
| TH-APR-05 | bkit_analyze_prompt | Returns clarifying questions for ambiguous prompt | P0 |
| TH-CLF-01 | bkit_classify_task | Returns error when estimatedLines not a number | P0 |
| TH-CLF-02 | bkit_classify_task | Returns classification with label and recommendation | P0 |
| TH-CLF-03 | bkit_classify_task | Uses more conservative of line/description classification | P0 |
| TH-DLV-01 | bkit_detect_level | Returns level with evidence and config | P0 |
| TH-DLV-02 | bkit_detect_level | Uses context projectDir when arg not provided | P1 |
| TH-TPL-01 | bkit_select_template | Returns error when phase missing | P0 |
| TH-TPL-02 | bkit_select_template | Returns error for invalid phase | P0 |
| TH-TPL-03 | bkit_select_template | Returns template content for valid phase/level | P0 |
| TH-DEL-01 | bkit_check_deliverables | Returns error when not initialized | P0 |
| TH-DEL-02 | bkit_check_deliverables | Returns error for invalid phase number | P0 |
| TH-DEL-03 | bkit_check_deliverables | Returns found/missing files for pipeline phase | P0 |
| TH-MRD-01 | bkit_memory_read | Returns error when not initialized | P0 |
| TH-MRD-02 | bkit_memory_read | Returns all memory when no key provided | P0 |
| TH-MRD-03 | bkit_memory_read | Returns specific key value | P0 |
| TH-MRD-04 | bkit_memory_read | Returns null for non-existent key | P0 |
| TH-MWR-01 | bkit_memory_write | Returns error when not initialized | P0 |
| TH-MWR-02 | bkit_memory_write | Returns error when key missing | P0 |
| TH-MWR-03 | bkit_memory_write | Writes value and returns confirmation | P0 |
| TH-MWR-04 | bkit_memory_write | Overwrites existing key | P1 |
| TH-MWR-05 | bkit_memory_write | Invalidates cache after write | P1 |

**Tool Handler Total: 71 test cases**

---

### 5.6 Category 6: Integration Tests

**File: `tests/integration/cross-module.test.js`**

| ID | Test Case | Modules Involved | Priority |
|----|-----------|------------------|----------|
| INT-01 | init tool loads config, detects level, reads status | tools/init + core/config + pdca/level + pdca/status | P0 |
| INT-02 | Plan -> Design flow: plan creates status, design verifies plan exists | tools/pdca-plan + tools/pdca-design + pdca/status + pdca/automation | P0 |
| INT-03 | Full PDCA cycle: plan -> design -> do -> check -> report | tools/complete + pdca/phase + pdca/status | P0 |
| INT-04 | Pre-write check references design doc from status | tools/pre-write + pdca/automation + pdca/status | P0 |
| INT-05 | Post-write triggers gap analysis suggestion | tools/post-write + pdca/automation | P0 |
| INT-06 | Analyze prompt triggers skill and agent matching | tools/analyze-prompt + intent/language + intent/trigger + intent/ambiguity | P0 |
| INT-07 | Template selection uses detected level | tools/template + pdca/template + pdca/level | P0 |
| INT-08 | Task classification feeds into pre-write PDCA decision | tools/classify + task/classification + pdca/automation | P0 |
| INT-09 | Memory write then read returns same value | tools/memory-write + tools/memory-read + core/file + core/cache | P0 |
| INT-10 | Cache invalidation after phase completion | tools/complete + core/cache + pdca/status | P0 |
| INT-11 | Feature lifecycle: add -> set phase -> remove -> get archived | pdca/status end-to-end | P0 |
| INT-12 | Design phase blocks plan->do skip via validatePhaseTransition | pdca/phase + tools/complete | P0 |
| INT-13 | Act->Check iteration cycle allowed by validatePhaseTransition | pdca/phase + tools/complete | P0 |
| INT-14 | Multi-language prompt analysis with Korean input | intent/language + intent/trigger + intent/ambiguity | P1 |
| INT-15 | Deliverables check with PDCA feature context | tools/deliverables + pdca/phase + core/file | P1 |

**Integration Total: 15 test cases**

---

### 5.7 Category 7: E2E Tests (Full Server)

**File: `tests/integration/e2e-server.test.js`**

| ID | Test Case | Priority |
|----|-----------|----------|
| E2E-01 | JSON-RPC initialize returns protocol version and capabilities | P0 |
| E2E-02 | JSON-RPC tools/list returns exactly 16 tools | P0 |
| E2E-03 | JSON-RPC tools/call bkit_init returns session context | P0 |
| E2E-04 | JSON-RPC tools/call with unknown tool returns isError response | P0 |
| E2E-05 | JSON-RPC unknown method returns -32601 error | P0 |
| E2E-06 | JSON-RPC missing tool name returns -32602 error | P0 |
| E2E-07 | JSON-RPC notification (no id) returns null | P0 |
| E2E-08 | Full workflow: init -> plan -> design -> complete_phase | P0 |
| E2E-09 | Multi-request: sequential requests maintain server state | P0 |
| E2E-10 | Error response format: has jsonrpc, id, error fields | P0 |
| E2E-11 | Success response format: has jsonrpc, id, result with content array | P0 |
| E2E-12 | Content array item has type and text fields | P0 |
| E2E-13 | Result text is valid JSON for structured tool responses | P1 |
| E2E-14 | STDIO transport: newline-delimited JSON-RPC parsing simulation | P1 |
| E2E-15 | STDIO transport: JSON parse error returns -32700 | P1 |

**E2E Total: 15 test cases**

---

### 5.8 Category 8: Philosophy Compliance Tests

**File: `tests/philosophy/compliance.test.js`**

#### 5.8.1 Core Mission Compliance

| ID | Philosophy | Verification | Test Method | Priority |
|----|-----------|-------------|-------------|----------|
| PHI-CM-01 | Automation First | bkit_init auto-detects level without user command | Assert detectLevel returns result without user input | P0 |
| PHI-CM-02 | Automation First | Pre-write hook auto-checks PDCA compliance | Assert bkit_pre_write_check returns guidance without explicit command | P0 |
| PHI-CM-03 | Automation First | Post-write auto-suggests gap analysis | Assert bkit_post_write returns suggestGapAnalysis for significant changes | P0 |
| PHI-CM-04 | Automation First | Task classification auto-determines PDCA level | Assert classifyTask returns pdcaRequired/pdcaRecommended automatically | P0 |
| PHI-CM-05 | No Guessing | ambiguity score >=50 triggers clarification | Assert needsClarification(50)===true | P0 |
| PHI-CM-06 | No Guessing | Vague prompt triggers clarifying questions | Assert generateClarifyingQuestions returns non-empty array | P0 |
| PHI-CM-07 | No Guessing | bkit_analyze_prompt returns clarifyingQuestions when ambiguous | Assert array is populated for ambiguous prompt | P0 |
| PHI-CM-08 | No Guessing | Magic words (!hotfix, !prototype, !bypass) explicitly bypass ambiguity | Assert calculateAmbiguityScore returns 0 | P0 |
| PHI-CM-09 | Docs=Code | bkit_pdca_design requires plan document to exist | Assert error returned when plan missing | P0 |
| PHI-CM-10 | Docs=Code | bkit_pre_write_check references design document | Assert designPath is returned when design exists | P0 |
| PHI-CM-11 | Docs=Code | validatePhaseTransition blocks plan->do (must have design) | Assert valid===false for plan->do transition | P0 |
| PHI-CM-12 | Docs=Code | Post-write suggests gap analysis to keep docs in sync | Assert suggestGapAnalysis===true for large changes with design | P0 |

#### 5.8.2 Context Engineering Compliance

| ID | Requirement | Verification | Test Method | Priority |
|----|------------|-------------|-------------|----------|
| PHI-CE-01 | FR-01: Multi-Level Hierarchy | Config merges project config over defaults (L4>L3>L2>L1) | Assert loadConfig merges correctly | P0 |
| PHI-CE-02 | FR-01: Multi-Level Hierarchy | Level detection provides evidence for decisions | Assert evidence array is non-empty | P0 |
| PHI-CE-03 | FR-06: Task Dependency | PDCA phases have sequential dependencies | Assert validatePhaseTransition enforces order | P0 |
| PHI-CE-04 | FR-06: Task Dependency | Phase deliverables track required documents | Assert getPhaseDeliverables returns file templates | P0 |
| PHI-CE-05 | FR-08: MEMORY Variable | bkit_memory_write persists data to file | Assert writeJsonFile is called | P0 |
| PHI-CE-06 | FR-08: MEMORY Variable | bkit_memory_read retrieves persisted data | Assert readJsonFile returns stored value | P0 |
| PHI-CE-07 | Dynamic Context | Template selection varies by level | Assert selectTemplate returns different templates for Starter vs Enterprise | P0 |
| PHI-CE-08 | Token Optimization | Cache with TTL avoids redundant reads | Assert getCache returns cached value within TTL | P0 |

#### 5.8.3 PDCA Methodology Compliance

| ID | Requirement | Verification | Test Method | Priority |
|----|------------|-------------|-------------|----------|
| PHI-PD-01 | Correct Phase Order | PHASE_ORDER is [plan, design, do, check, act, report] | Assert array matches expected order | P0 |
| PHI-PD-02 | Design is Mandatory | plan->do transition blocked | Assert validatePhaseTransition rejects plan->do | P0 |
| PHI-PD-03 | Check-Act Loop | act->check transition allowed | Assert validatePhaseTransition allows act->check | P0 |
| PHI-PD-04 | 90% Threshold | suggestNextAction recommends report at >=90% matchRate | Assert action contains "report" when matchRate>=90 | P0 |
| PHI-PD-05 | 90% Threshold | suggestNextAction recommends iterate at <90% matchRate | Assert action contains "iterate" when matchRate<90 | P0 |
| PHI-PD-06 | Level-Specific Flow | Starter skips phases 4, 5, 7, 8 | Assert getLevelConfig('Starter').skipPhases matches | P0 |
| PHI-PD-07 | Level-Specific Flow | Dynamic skips phase 8 | Assert getLevelConfig('Dynamic').skipPhases matches | P0 |
| PHI-PD-08 | Level-Specific Flow | Enterprise has all 9 phases | Assert getLevelConfig('Enterprise').skipPhases is empty | P0 |
| PHI-PD-09 | Task Classification | <10 lines = PDCA optional | Assert classifyTask(5).pdcaRequired===false | P0 |
| PHI-PD-10 | Task Classification | >=50 lines = PDCA required | Assert classifyTask(50).pdcaRequired===true | P0 |
| PHI-PD-11 | Max Iterations | Default maxIterations is 5 | Assert getDefaultConfig().pdca.maxIterations===5 | P0 |
| PHI-PD-12 | 6-Phase PDCA | All 6 phases supported: plan, design, do, check, act, report | Assert getNextPhase chain covers all 6 | P0 |
| PHI-PD-13 | Document Templates | 7 templates available | Assert getTemplateList().length===7 | P0 |
| PHI-PD-14 | Level-Specific Templates | Design has 3 variants (starter, default, enterprise) | Assert selectTemplate returns different for each level | P0 |

#### 5.8.4 AI-Native Principles Compliance

| ID | Competency | Verification | Test Method | Priority |
|----|-----------|-------------|-------------|----------|
| PHI-AN-01 | Verification Ability | Gap analysis tools exist (bkit_pdca_analyze) | Assert tool definition exists | P0 |
| PHI-AN-02 | Verification Ability | Match rate tracking in status | Assert featureStatus has matchRate field | P0 |
| PHI-AN-03 | Direction Setting | Design-first workflow enforced | Assert plan->do blocked, design required | P0 |
| PHI-AN-04 | Direction Setting | Templates provide structure for direction | Assert all 5 PDCA phases have templates | P0 |
| PHI-AN-05 | Quality Standards | Naming convention hints returned in pre-write check | Assert conventionHints is non-empty | P0 |
| PHI-AN-06 | Quality Standards | Config validation catches invalid values | Assert validateConfig detects errors | P0 |
| PHI-AN-07 | Speed Improvement | Cache reduces redundant file reads | Assert getCache returns value without file I/O | P1 |
| PHI-AN-08 | Speed Improvement | Session initialization sets all context in one call | Assert bkit_init returns level, status, guidance | P1 |

**Philosophy Compliance Total: 42 test cases**

---

## 6. Test File Structure

```
packages/mcp-server/tests/
  lib/
    core/
      config.test.js       - 23 tests
      cache.test.js         - 10 tests
      file.test.js          - 13 tests
      path.test.js          - 10 tests
    pdca/
      status.test.js        - 27 tests
      level.test.js         - 23 tests
      phase.test.js         - 26 tests
      automation.test.js    - 27 tests
      template.test.js      - 20 tests
    intent/
      language.test.js      - 15 tests
      trigger.test.js       - 26 tests
      ambiguity.test.js     - 25 tests
    task/
      classification.test.js - 23 tests
      creator.test.js        - 9 tests
  tools/
    handlers.test.js        - 71 tests
  integration/
    cross-module.test.js    - 15 tests
    e2e-server.test.js      - 15 tests
  philosophy/
    compliance.test.js      - 42 tests
```

**Total: 420 test cases** across 18 test files

---

## 7. Test Execution Strategy

### 7.1 Execution Environment

- **Runtime**: Node.js >= 18.0.0
- **Test Runner**: `node:test` (built-in, zero external dependencies)
- **Assertion**: `node:assert` (built-in)
- **Platform**: OpenAI Codex (sandboxed, no network, no global state persistence)

### 7.2 Test Fixture Strategy

All tests use temporary directories created with `fs.mkdtempSync()` and cleaned up with `fs.rmSync()` in afterEach hooks:

```javascript
const { describe, it, beforeEach, afterEach } = require('node:test');
const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
```

### 7.3 Execution Order

```
Phase 1: Unit tests (can run in parallel)
  node --test tests/lib/core/*.test.js
  node --test tests/lib/pdca/*.test.js
  node --test tests/lib/intent/*.test.js
  node --test tests/lib/task/*.test.js

Phase 2: Tool handler tests (can run in parallel)
  node --test tests/tools/handlers.test.js

Phase 3: Integration + E2E tests (sequential)
  node --test tests/integration/cross-module.test.js
  node --test tests/integration/e2e-server.test.js

Phase 4: Philosophy compliance (after all functional tests pass)
  node --test tests/philosophy/compliance.test.js
```

### 7.4 package.json Test Scripts

```json
{
  "scripts": {
    "test": "node --test tests/**/*.test.js",
    "test:unit": "node --test tests/lib/**/*.test.js",
    "test:tools": "node --test tests/tools/*.test.js",
    "test:integration": "node --test tests/integration/*.test.js",
    "test:philosophy": "node --test tests/philosophy/*.test.js",
    "test:core": "node --test tests/lib/core/*.test.js",
    "test:pdca": "node --test tests/lib/pdca/*.test.js",
    "test:intent": "node --test tests/lib/intent/*.test.js",
    "test:task": "node --test tests/lib/task/*.test.js"
  }
}
```

### 7.5 Codex-Specific Considerations

| Constraint | Mitigation |
|-----------|-----------|
| No network access | All tests use local temp files, no HTTP calls |
| No external dependencies | Only `node:test` and `node:assert` |
| Sandboxed filesystem | Use `os.tmpdir()` for test fixtures |
| No persistent state between runs | Each test creates and destroys its own fixtures |
| Limited execution time | Tests are designed to be fast (<5ms each) |

---

## 8. Philosophy Compliance Verification Matrix

### 8.1 Full Matrix: Source Function -> Philosophy Requirement

| Source File | Function | Core Mission | Context Eng. | PDCA Method | AI-Native |
|------------|----------|:----------:|:----------:|:----------:|:--------:|
| config.js | loadConfig | - | FR-01 | - | - |
| config.js | mergeConfig | - | FR-01 | - | - |
| config.js | validateConfig | - | - | - | Quality |
| config.js | getDefaultConfig | - | FR-01 | Max Iter | - |
| cache.js | getCache/setCache | Automation | FR-07 | - | Speed |
| file.js | readJsonFile/writeJsonFile | - | FR-08 | - | - |
| path.js | getFeaturePath | - | - | Doc Paths | - |
| status.js | readPdcaStatus | Automation | FR-06 | Status | - |
| status.js | setFeaturePhase | Automation | FR-06 | Phases | - |
| status.js | addFeature/removeFeature | - | FR-06 | Lifecycle | - |
| level.js | detectLevel | Automation | FR-01 | Levels | Direction |
| level.js | getLevelConfig | - | FR-01 | Level Flow | - |
| phase.js | validatePhaseTransition | Docs=Code | FR-06 | Design Req | Direction |
| phase.js | getNextPhase | - | FR-06 | 6-Phase | - |
| phase.js | checkDeliverables | Docs=Code | FR-06 | Deliverable | Verify |
| automation.js | classifyTask | Automation | - | Task Class | - |
| automation.js | suggestNextAction | Automation | - | 90% Gate | - |
| automation.js | checkDesignExists | Docs=Code | - | Design Req | - |
| automation.js | formatPdcaProgress | - | - | Visibility | - |
| template.js | selectTemplate | - | FR-01 | Level Tmpl | - |
| template.js | resolveTemplateVariables | - | - | Templates | Direction |
| language.js | detectLanguage | Automation | - | - | - |
| trigger.js | matchSkillTrigger | Automation | - | - | - |
| trigger.js | matchAgentTrigger | Automation | - | - | - |
| ambiguity.js | calculateAmbiguityScore | No Guessing | - | - | Verify |
| ambiguity.js | needsClarification | No Guessing | - | - | - |
| ambiguity.js | checkMagicWords | No Guessing | - | - | - |
| classification.js | classifyByLines | Automation | - | Task Class | - |
| classification.js | classifyByDescription | Automation | - | Task Class | - |
| creator.js | createPdcaTask | - | FR-06 | Task Mgmt | - |

### 8.2 Coverage Summary

| Philosophy | Test IDs | Count |
|-----------|----------|------:|
| Core Mission: Automation First | PHI-CM-01 to PHI-CM-04 | 4 |
| Core Mission: No Guessing | PHI-CM-05 to PHI-CM-08 | 4 |
| Core Mission: Docs=Code | PHI-CM-09 to PHI-CM-12 | 4 |
| Context Engineering | PHI-CE-01 to PHI-CE-08 | 8 |
| PDCA Methodology | PHI-PD-01 to PHI-PD-14 | 14 |
| AI-Native Principles | PHI-AN-01 to PHI-AN-08 | 8 |
| **Total** | | **42** |

---

## 9. Success Criteria & Metrics

### 9.1 Pass/Fail Criteria

| Metric | Target | Acceptable | Fail |
|--------|--------|-----------|------|
| Unit test pass rate | 100% | >= 98% | < 95% |
| Tool handler pass rate | 100% | >= 97% | < 95% |
| Integration pass rate | 100% | >= 100% | < 100% |
| E2E pass rate | 100% | >= 100% | < 100% |
| Philosophy compliance | 100% | >= 100% | < 100% |
| Total test count | >= 420 | >= 400 | < 350 |
| Function coverage | 100% | >= 95% | < 90% |

### 9.2 Quality Gates

| Gate | Requirement | Enforcement |
|------|------------|-------------|
| G1: Unit Tests | All 277 unit tests pass | Block integration testing |
| G2: Tool Tests | All 71 tool handler tests pass | Block E2E testing |
| G3: Integration | All 15 integration tests pass | Block philosophy testing |
| G4: E2E | All 15 E2E tests pass | Block philosophy testing |
| G5: Philosophy | All 42 philosophy tests pass | Block report generation |

### 9.3 Execution Time Budget

| Category | Tests | Target Time |
|----------|------:|----------:|
| Unit tests | 277 | < 5s |
| Tool handlers | 71 | < 3s |
| Integration | 15 | < 5s |
| E2E | 15 | < 3s |
| Philosophy | 42 | < 2s |
| **Total** | **420** | **< 18s** |

---

## 10. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|-----------|
| Cache timing issues in tests (TTL expiry) | Medium | Medium | Use explicit TTL values, avoid time-dependent assertions |
| File system race conditions in parallel tests | High | Low | Each test uses unique temp directory |
| Config cache pollution between tests | High | Medium | Clear module-level cache in beforeEach; use unique dirs |
| Large test file size affecting Codex parsing | Medium | Low | Split into 18 separate test files |
| Temp file cleanup failures | Low | Low | Use process.on('exit') cleanup as fallback |
| Regex-based language detection edge cases | Medium | Medium | Include boundary test cases for each language |
| Philosophy compliance subjectivity | Medium | Medium | Map each test to specific code assertion, not behavioral judgment |

### 10.1 Known Limitations

1. **STDIO entry point (index.js)**: Cannot be fully unit-tested as it sets up process.stdin listeners. Tested indirectly through server.js integration.
2. **Config cache module-level state**: The `_cachedConfig` variable in config.js persists across tests within the same process. Tests must use unique project directories.
3. **Cache module-level state**: The `_cache` Map in cache.js is shared. Tests must call `clearCache()` in beforeEach.
4. **Emoji in progress strings**: `formatPdcaProgress` uses emoji characters. Tests should match exact Unicode sequences.

---

## 11. Task Management

### 11.1 PDCA Tasks

```
[PLAN] bkit-codex-qa
  Status: In Progress
  Description: Comprehensive QA test plan document

[DESIGN] bkit-codex-qa
  Status: Pending
  blockedBy: [PLAN] bkit-codex-qa
  Description: Test implementation design (file structure, fixture patterns)

[DO] bkit-codex-qa
  Status: Pending
  blockedBy: [DESIGN] bkit-codex-qa
  Description: Implement all 420 test cases across 18 test files

[CHECK] bkit-codex-qa
  Status: Pending
  blockedBy: [DO] bkit-codex-qa
  Description: Execute tests, verify 100% pass rate, calculate match rate

[ACT] bkit-codex-qa
  Status: Pending
  blockedBy: [CHECK] bkit-codex-qa
  Description: Fix any gaps found during check phase

[REPORT] bkit-codex-qa
  Status: Pending
  blockedBy: [CHECK] bkit-codex-qa (matchRate >= 90%)
  Description: Generate completion report with metrics
```

### 11.2 Work Breakdown by Team Member

| Team Member | Tasks | Estimated Tests | Priority |
|-------------|-------|----------------:|----------|
| Core Module Tester | cache.test.js, file.test.js, path.test.js, config.test.js | 56 | P0 |
| PDCA Module Tester | status.test.js, level.test.js, phase.test.js, automation.test.js, template.test.js | 123 | P0 |
| Intent/Task Tester | language.test.js, trigger.test.js, ambiguity.test.js, classification.test.js, creator.test.js | 98 | P0 |
| Tool Handler Tester | handlers.test.js | 71 | P0 |
| Integration/E2E Tester | cross-module.test.js, e2e-server.test.js | 30 | P0 |
| Philosophy Auditor | compliance.test.js | 42 | P0 |
| QA Architect | Test plan review, coverage analysis, report | Review | P0 |
| CTO Lead | Orchestration, quality gates, final approval | Oversight | P0 |

---

## 12. References

- Source code: `/Users/popup-kay/Documents/GitHub/popup/bkit-codex/packages/mcp-server/src/`
- Existing tests: `/Users/popup-kay/Documents/GitHub/popup/bkit-codex/packages/mcp-server/tests/`
- Philosophy docs: `/Users/popup-kay/Documents/GitHub/popup/bkit-codex/bkit-system/philosophy/`
  - `core-mission.md` - 3 Core Philosophies, User Journey, Value by Level
  - `context-engineering.md` - 8 Functional Requirements (FR-01 to FR-08)
  - `pdca-methodology.md` - PDCA cycle, 9-stage pipeline, level-specific flows
  - `ai-native-principles.md` - 3 Competencies, speed/quality metrics
- Architecture doc: `/Users/popup-kay/Documents/GitHub/popup/bkit-codex/docs/architecture.md`
- AGENTS.md: `/Users/popup-kay/Documents/GitHub/popup/bkit-codex/AGENTS.md`
