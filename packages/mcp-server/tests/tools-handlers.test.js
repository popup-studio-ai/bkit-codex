'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { clearCache } = require('../src/lib/core/cache');

const initTool = require('../src/tools/init').handler;
const getStatusTool = require('../src/tools/get-status').handler;
const preWriteTool = require('../src/tools/pre-write').handler;
const postWriteTool = require('../src/tools/post-write').handler;
const completeTool = require('../src/tools/complete').handler;
const planTool = require('../src/tools/pdca-plan').handler;
const designTool = require('../src/tools/pdca-design').handler;
const analyzeTool = require('../src/tools/pdca-analyze').handler;
const nextTool = require('../src/tools/pdca-next').handler;
const analyzePromptTool = require('../src/tools/analyze-prompt').handler;
const classifyTool = require('../src/tools/classify').handler;
const detectLevelTool = require('../src/tools/detect-level').handler;
const templateTool = require('../src/tools/template').handler;
const deliverablesTool = require('../src/tools/deliverables').handler;
const memoryReadTool = require('../src/tools/memory-read').handler;
const memoryWriteTool = require('../src/tools/memory-write').handler;

function mkProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-tools-'));
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  return dir;
}

async function seedDocs(projectDir, feature) {
  const plan = path.join(projectDir, `docs/01-plan/features/${feature}.plan.md`);
  const design = path.join(projectDir, `docs/02-design/features/${feature}.design.md`);
  fs.mkdirSync(path.dirname(plan), { recursive: true });
  fs.mkdirSync(path.dirname(design), { recursive: true });
  fs.writeFileSync(plan, '# plan');
  fs.writeFileSync(design, '# design');
}

describe('tool handlers', () => {
  let projectDir;
  let context;

  beforeEach(() => {
    clearCache();
    projectDir = mkProject();
    context = { projectDir: null };
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it('bkit_init should return error when projectDir missing', async () => {
    const out = await initTool({}, context);
    assert.ok(out.error);
  });

  it('bkit_init should initialize context and return session info', async () => {
    const out = await initTool({ projectDir }, context);
    assert.strictEqual(context.projectDir, projectDir);
    assert.ok(out.level);
    assert.ok(out.sessionId.startsWith('bkit-'));
    assert.ok(Array.isArray(out.pipelinePhases));
  });

  it('bkit_get_status should error before init', async () => {
    const out = await getStatusTool({}, { projectDir: null });
    assert.ok(out.error);
  });

  it('bkit_get_status should return all active features', async () => {
    await initTool({ projectDir }, context);
    const out = await getStatusTool({}, context);
    assert.ok(Array.isArray(out.activeFeatures));
    assert.ok(out.features);
  });

  it('bkit_get_status should return suggestion for unknown feature', async () => {
    await initTool({ projectDir }, context);
    const out = await getStatusTool({ feature: 'nope' }, context);
    assert.ok(out.error);
    assert.ok(out.suggestion.includes('$pdca plan nope'));
  });

  it('bkit_pre_write_check should error when not initialized or missing filePath', async () => {
    assert.ok((await preWriteTool({ filePath: 'x' }, { projectDir: null })).error);
    await initTool({ projectDir }, context);
    assert.ok((await preWriteTool({}, context)).error);
  });

  it('bkit_pre_write_check should detect feature from path and return conventions', async () => {
    await initTool({ projectDir }, context);
    await seedDocs(projectDir, 'auth');
    const filePath = path.join(projectDir, 'src', 'auth', 'service.js');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'module.exports = {};');

    const out = await preWriteTool({ filePath, estimatedLines: 120 }, context);
    assert.strictEqual(out.feature, 'auth');
    assert.strictEqual(out.hasPlan, true);
    assert.strictEqual(out.hasDesign, true);
    assert.ok(Array.isArray(out.conventionHints));
    assert.strictEqual(out.pdcaRequired, true);
  });

  it('bkit_post_write should error when not initialized or missing filePath', async () => {
    assert.ok((await postWriteTool({ filePath: 'x' }, { projectDir: null })).error);
    await initTool({ projectDir }, context);
    assert.ok((await postWriteTool({}, context)).error);
  });

  it('bkit_post_write should suggest gap analysis for significant changes', async () => {
    await initTool({ projectDir }, context);
    await seedDocs(projectDir, 'auth');
    const filePath = path.join(projectDir, 'src', 'auth', 'service.js');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'module.exports = {};');

    const out = await postWriteTool({ filePath, linesChanged: 80 }, context);
    assert.strictEqual(out.suggestGapAnalysis, true);
    assert.ok(out.guidance.includes('$pdca analyze auth'));
  });

  it('bkit_post_write should include large change recommendation for 200+ lines', async () => {
    await initTool({ projectDir }, context);
    const filePath = path.join(projectDir, 'src', 'big-feature', 'index.js');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'x');

    const out = await postWriteTool({ filePath, linesChanged: 210 }, context);
    assert.ok(out.nextSteps.some(s => s.includes('splitting')));
  });

  it('bkit_complete_phase should validate input and invalid phase', async () => {
    await initTool({ projectDir }, context);
    assert.ok((await completeTool({ phase: 'plan' }, context)).error);
    assert.ok((await completeTool({ feature: 'x' }, context)).error);
    assert.ok((await completeTool({ feature: 'x', phase: 'bad' }, context)).error);
  });

  it('bkit_complete_phase should complete phase and return next phase', async () => {
    await initTool({ projectDir }, context);
    await planTool({ feature: 'feat' }, context);
    const out = await completeTool({ feature: 'feat', phase: 'plan' }, context);
    assert.strictEqual(out.nextPhase, 'design');
  });

  it('bkit_complete_phase should block invalid transition', async () => {
    await initTool({ projectDir }, context);
    await planTool({ feature: 'feat' }, context);
    const out = await completeTool({ feature: 'feat', phase: 'do' }, context);
    assert.ok(out.error);
    assert.ok(out.error.includes('Cannot complete phase'));
  });

  it('bkit_complete_phase should mark completed at report', async () => {
    await initTool({ projectDir }, context);
    await planTool({ feature: 'feat' }, context);
    await completeTool({ feature: 'feat', phase: 'plan' }, context);
    await seedDocs(projectDir, 'feat');
    await completeTool({ feature: 'feat', phase: 'design' }, context);
    await completeTool({ feature: 'feat', phase: 'do' }, context);
    await completeTool({ feature: 'feat', phase: 'check' }, context);
    await completeTool({ feature: 'feat', phase: 'act' }, context);
    const out = await completeTool({ feature: 'feat', phase: 'report' }, context);
    assert.strictEqual(out.nextPhase, 'completed');
  });

  it('bkit_pdca_plan should require session/feature and register feature', async () => {
    assert.ok((await planTool({ feature: 'x' }, { projectDir: null })).error);
    await initTool({ projectDir }, context);
    assert.ok((await planTool({}, context)).error);
    const out = await planTool({ feature: 'my-feature' }, context);
    assert.strictEqual(out.phase, 'plan');
    assert.ok(out.template.includes('my-feature'));
  });

  it('bkit_pdca_design should require plan and then return design template', async () => {
    await initTool({ projectDir }, context);
    const err = await designTool({ feature: 'my-feature' }, context);
    assert.ok(err.error);

    const planPath = path.join(projectDir, 'docs/01-plan/features/my-feature.plan.md');
    fs.mkdirSync(path.dirname(planPath), { recursive: true });
    fs.writeFileSync(planPath, '# plan');
    await planTool({ feature: 'my-feature' }, context);

    const out = await designTool({ feature: 'my-feature' }, context);
    assert.strictEqual(out.phase, 'design');
    assert.ok(out.outputPath.endsWith('my-feature.design.md'));
  });

  it('bkit_pdca_analyze should require design and increment iteration', async () => {
    await initTool({ projectDir }, context);
    await planTool({ feature: 'my-feature' }, context);

    const err = await analyzeTool({ feature: 'my-feature' }, context);
    assert.ok(err.error);

    await seedDocs(projectDir, 'my-feature');
    await designTool({ feature: 'my-feature' }, context);

    const out = await analyzeTool({ feature: 'my-feature' }, context);
    assert.ok(out.analysisPath.endsWith('my-feature.analysis.md'));
    assert.ok(typeof out.iterationCount === 'number');
  });

  it('bkit_pdca_next should handle untracked and tracked feature', async () => {
    await initTool({ projectDir }, context);
    const u = await nextTool({ feature: 'newf' }, context);
    assert.strictEqual(u.nextPhase, 'plan');

    await planTool({ feature: 'tracked' }, context);
    const t = await nextTool({ feature: 'tracked' }, context);
    assert.ok(t.currentPhase);
    assert.ok(t.progress);
  });

  it('bkit_analyze_prompt should validate and return analysis', async () => {
    assert.ok((await analyzePromptTool({}, context)).error);
    await initTool({ projectDir }, context);

    const out = await analyzePromptTool({ prompt: 'Create login page for auth service in React' }, context);
    assert.strictEqual(out.language, 'en');
    assert.ok(out.intent);
    assert.ok(out.triggers);
    assert.ok(out.ambiguity);
  });

  it('bkit_analyze_prompt should return clarifying questions for ambiguous prompt', async () => {
    await initTool({ projectDir }, context);
    const out = await analyzePromptTool({ prompt: 'do it maybe all' }, context);
    assert.strictEqual(out.ambiguity.needsClarification, true);
    assert.ok(out.clarifyingQuestions.length > 0);
  });

  it('bkit_classify_task should validate input and classify conservatively', async () => {
    const err = await classifyTool({});
    assert.ok(err.error);

    const out = await classifyTool({ estimatedLines: 20, description: 'major refactor migration' });
    assert.strictEqual(out.classification, 'major_feature');
    assert.ok(out.label);
  });

  it('bkit_detect_level should use args or context projectDir', async () => {
    const c1 = await detectLevelTool({}, { projectDir: null });
    assert.ok(c1.error);

    const c2 = await detectLevelTool({ projectDir }, { projectDir: null });
    assert.ok(c2.level);

    const c3 = await detectLevelTool({}, { projectDir });
    assert.ok(c3.level);
  });

  it('bkit_select_template should validate phase and return template info', async () => {
    assert.ok((await templateTool({}, context)).error);
    const bad = await templateTool({ phase: 'bad' }, context);
    assert.ok(bad.error);

    await initTool({ projectDir }, context);
    const ok = await templateTool({ phase: 'design' }, context);
    assert.ok(ok.templateName.includes('design'));
    assert.ok(Array.isArray(ok.availableTemplates));
  });

  it('bkit_check_deliverables should validate and return found/missing', async () => {
    await initTool({ projectDir }, context);
    const bad = await deliverablesTool({ phase: 0 }, context);
    assert.ok(bad.error);

    const docsPath = path.join(projectDir, 'docs/schema.md');
    fs.mkdirSync(path.dirname(docsPath), { recursive: true });
    fs.writeFileSync(docsPath, '# schema');

    const out = await deliverablesTool({ phase: 1, feature: 'feat' }, context);
    assert.strictEqual(out.phase, 1);
    assert.ok(Array.isArray(out.found));
    assert.ok(Array.isArray(out.missing));
  });

  it('bkit_memory_read/write should validate, persist, and retrieve values', async () => {
    await initTool({ projectDir }, context);
    const miss = await memoryReadTool({ key: 'x' }, context);
    assert.strictEqual(miss.exists, false);

    assert.ok((await memoryWriteTool({ value: 'x' }, context)).error);
    const wr = await memoryWriteTool({ key: 'x', value: { ok: true } }, context);
    assert.strictEqual(wr.written, true);

    const rd = await memoryReadTool({ key: 'x' }, context);
    assert.strictEqual(rd.exists, true);
    assert.deepStrictEqual(rd.value, { ok: true });

    const all = await memoryReadTool({}, context);
    assert.ok(all.keys.includes('x'));
  });
});
