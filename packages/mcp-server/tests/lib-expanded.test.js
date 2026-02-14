'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

const { getCache, setCache, invalidateCache, clearCache } = require('../src/lib/core/cache');
const { readJsonFile, writeJsonFile, fileExists, ensureDir } = require('../src/lib/core/file');
const { resolveProjectPath, getDocsPath, getFeaturePath, getRelativePath } = require('../src/lib/core/path');
const {
  readPdcaStatus,
  writePdcaStatus,
  getFeatureStatus,
  setFeaturePhase,
  addFeature,
  removeFeature,
  getActiveFeatures,
  getPrimaryFeature,
  setPrimaryFeature,
  getArchivedFeatures
} = require('../src/lib/pdca/status');
const {
  getCurrentPhase,
  setPhase,
  getNextPhase,
  validatePhaseTransition,
  getPhaseDeliverables,
  checkDeliverables
} = require('../src/lib/pdca/phase');
const {
  classifyTask,
  shouldApplyPdca,
  checkDesignExists,
  checkPlanExists,
  suggestNextAction,
  formatPdcaProgress,
  generatePdcaGuidance
} = require('../src/lib/pdca/automation');
const {
  selectTemplate,
  getTemplateContent,
  resolveTemplateVariables,
  getTemplateList,
  validateTemplate
} = require('../src/lib/pdca/template');
const {
  matchSkillTrigger,
  matchAgentTrigger,
  getImplicitTriggers,
  matchMultiLanguageTrigger
} = require('../src/lib/intent/trigger');
const {
  classifyByLines,
  classifyByDescription,
  getClassificationLabel,
  getClassificationThresholds
} = require('../src/lib/task/classification');
const { createPdcaTask, formatTaskSubject, getTaskTemplate } = require('../src/lib/task/creator');

function mkTmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('core/cache', () => {
  beforeEach(() => clearCache());

  it('setCache/getCache should set and retrieve a value', () => {
    setCache('k', { x: 1 });
    assert.deepStrictEqual(getCache('k'), { x: 1 });
  });

  it('getCache should return undefined for missing key', () => {
    assert.strictEqual(getCache('missing'), undefined);
  });

  it('getCache should return undefined for expired entry', async () => {
    setCache('short', 'v', 1);
    await new Promise(r => setTimeout(r, 5));
    assert.strictEqual(getCache('short'), undefined);
  });

  it('setCache should overwrite existing key', () => {
    setCache('k', 1);
    setCache('k', 2);
    assert.strictEqual(getCache('k'), 2);
  });

  it('setCache should respect custom TTL', async () => {
    setCache('ttl', 'ok', 30);
    await new Promise(r => setTimeout(r, 5));
    assert.strictEqual(getCache('ttl'), 'ok');
  });

  it('setCache should use default TTL when omitted', async () => {
    setCache('default', 'ok');
    await new Promise(r => setTimeout(r, 10));
    assert.strictEqual(getCache('default'), 'ok');
  });

  it('invalidateCache should remove key', () => {
    setCache('x', 1);
    invalidateCache('x');
    assert.strictEqual(getCache('x'), undefined);
  });

  it('invalidateCache should no-op for missing key', () => {
    invalidateCache('none');
    assert.strictEqual(getCache('none'), undefined);
  });

  it('clearCache should remove all keys', () => {
    setCache('a', 1);
    setCache('b', 2);
    clearCache();
    assert.strictEqual(getCache('a'), undefined);
    assert.strictEqual(getCache('b'), undefined);
  });

  it('cache should work after clear', () => {
    setCache('a', 1);
    clearCache();
    setCache('a', 3);
    assert.strictEqual(getCache('a'), 3);
  });
});

describe('core/file', () => {
  let dir;

  beforeEach(() => {
    dir = mkTmp('bkit-core-file-');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('readJsonFile should read valid JSON', async () => {
    const p = path.join(dir, 'a.json');
    fs.writeFileSync(p, JSON.stringify({ a: 1 }));
    const data = await readJsonFile(p);
    assert.deepStrictEqual(data, { a: 1 });
  });

  it('readJsonFile should throw for missing file', async () => {
    await assert.rejects(() => readJsonFile(path.join(dir, 'missing.json')));
  });

  it('readJsonFile should throw for invalid JSON', async () => {
    const p = path.join(dir, 'bad.json');
    fs.writeFileSync(p, '{bad');
    await assert.rejects(() => readJsonFile(p));
  });

  it('writeJsonFile should pretty-print JSON', async () => {
    const p = path.join(dir, 'pretty.json');
    await writeJsonFile(p, { a: 1 });
    const content = fs.readFileSync(p, 'utf-8');
    assert.ok(content.includes('\n  "a": 1\n'));
  });

  it('writeJsonFile should create parent directories', async () => {
    const p = path.join(dir, 'a', 'b', 'c.json');
    await writeJsonFile(p, { ok: true });
    assert.strictEqual(fs.existsSync(p), true);
  });

  it('writeJsonFile should append trailing newline', async () => {
    const p = path.join(dir, 'newline.json');
    await writeJsonFile(p, { a: 1 });
    const content = fs.readFileSync(p, 'utf-8');
    assert.strictEqual(content.endsWith('\n'), true);
  });

  it('writeJsonFile should overwrite existing file', async () => {
    const p = path.join(dir, 'overwrite.json');
    fs.writeFileSync(p, JSON.stringify({ a: 1 }));
    await writeJsonFile(p, { a: 2 });
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    assert.strictEqual(data.a, 2);
  });

  it('fileExists should return true for existing file', async () => {
    const p = path.join(dir, 'f.txt');
    fs.writeFileSync(p, 'x');
    assert.strictEqual(await fileExists(p), true);
  });

  it('fileExists should return false for missing file', async () => {
    assert.strictEqual(await fileExists(path.join(dir, 'missing')), false);
  });

  it('fileExists should return true for existing directory', async () => {
    const p = path.join(dir, 'folder');
    fs.mkdirSync(p);
    assert.strictEqual(await fileExists(p), true);
  });

  it('ensureDir should create recursively', async () => {
    const p = path.join(dir, 'n1', 'n2', 'n3');
    await ensureDir(p);
    assert.strictEqual(fs.existsSync(p), true);
  });

  it('ensureDir should no-op for existing directory', async () => {
    await ensureDir(dir);
    assert.strictEqual(fs.existsSync(dir), true);
  });

  it('ensureDir should create deeply nested directories', async () => {
    const p = path.join(dir, 'a', 'b', 'c', 'd', 'e');
    await ensureDir(p);
    assert.strictEqual(fs.existsSync(p), true);
  });
});

describe('core/path', () => {
  it('resolveProjectPath should resolve relative path', () => {
    const out = resolveProjectPath('/tmp/proj', 'docs/a.md');
    assert.ok(out.endsWith(path.join('tmp', 'proj', 'docs', 'a.md')));
  });

  it('resolveProjectPath should handle absolute path', () => {
    const out = resolveProjectPath('/tmp/proj', '/var/log/a');
    assert.strictEqual(out, '/var/log/a');
  });

  it('getDocsPath should return docs directory', () => {
    assert.strictEqual(getDocsPath('/tmp/proj'), '/tmp/proj/docs');
  });

  it('getFeaturePath should return plan path', () => {
    assert.strictEqual(
      getFeaturePath('/tmp/proj', 'feat', 'plan'),
      '/tmp/proj/docs/01-plan/features/feat.plan.md'
    );
  });

  it('getFeaturePath should return design path', () => {
    assert.strictEqual(
      getFeaturePath('/tmp/proj', 'feat', 'design'),
      '/tmp/proj/docs/02-design/features/feat.design.md'
    );
  });

  it('getFeaturePath should return analysis path without features', () => {
    assert.strictEqual(
      getFeaturePath('/tmp/proj', 'feat', 'analysis'),
      '/tmp/proj/docs/03-analysis/feat.analysis.md'
    );
  });

  it('getFeaturePath should return report path without features', () => {
    assert.strictEqual(
      getFeaturePath('/tmp/proj', 'feat', 'report'),
      '/tmp/proj/docs/04-report/feat.report.md'
    );
  });

  it('getFeaturePath should fallback for unknown phase', () => {
    assert.strictEqual(getFeaturePath('/tmp/proj', 'feat', 'x'), '/tmp/proj/docs/feat');
  });

  it('getRelativePath should compute relative path', () => {
    const rel = getRelativePath('/tmp/proj/docs/a.md', '/tmp/proj/src/x.js');
    assert.strictEqual(rel, '../src/x.js');
  });

  it('getRelativePath should handle same directory', () => {
    const rel = getRelativePath('/tmp/proj/docs/a.md', '/tmp/proj/docs/b.md');
    assert.strictEqual(rel, 'b.md');
  });
});

describe('pdca/status', () => {
  let dir;

  beforeEach(() => {
    dir = mkTmp('bkit-status-');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('readPdcaStatus should return default when missing', async () => {
    const s = await readPdcaStatus(dir);
    assert.ok(Array.isArray(s.activeFeatures));
    assert.strictEqual(typeof s.features, 'object');
  });

  it('writePdcaStatus should write and update timestamps', async () => {
    const s = await readPdcaStatus(dir);
    const before = s.lastUpdated;
    await writePdcaStatus(dir, s);
    const written = await readPdcaStatus(dir);
    assert.ok(written.lastUpdated >= before);
    assert.ok(written.session.lastActivity);
  });

  it('readPdcaStatus should handle corrupted file gracefully', async () => {
    const p = path.join(dir, 'docs/.pdca-status.json');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, '{broken');
    const s = await readPdcaStatus(dir);
    assert.ok(s.features);
  });

  it('getFeatureStatus should return null for missing feature', async () => {
    const out = await getFeatureStatus(dir, 'missing');
    assert.strictEqual(out, null);
  });

  it('setFeaturePhase should create feature and add activeFeatures', async () => {
    const out = await setFeaturePhase(dir, 'f1', 'plan');
    assert.strictEqual(out.features.f1.phase, 'plan');
    assert.ok(out.activeFeatures.includes('f1'));
  });

  it('setFeaturePhase should append history on phase change', async () => {
    await setFeaturePhase(dir, 'f1', 'plan');
    const out = await setFeaturePhase(dir, 'f1', 'design');
    assert.ok(out.history.some(h => h.feature === 'f1' && h.to === 'design'));
  });

  it('setFeaturePhase should set primaryFeature when empty', async () => {
    const out = await setFeaturePhase(dir, 'f1', 'plan');
    assert.strictEqual(out.primaryFeature, 'f1');
  });

  it('addFeature should add with default plan phase', async () => {
    const out = await addFeature(dir, 'feat-default');
    assert.strictEqual(out.features['feat-default'].phase, 'plan');
  });

  it('addFeature should not overwrite existing feature', async () => {
    await addFeature(dir, 'f', 'plan');
    const out = await addFeature(dir, 'f', 'design');
    assert.strictEqual(out.features.f.phase, 'plan');
  });

  it('removeFeature should archive and remove from activeFeatures', async () => {
    await addFeature(dir, 'f1');
    const out = await removeFeature(dir, 'f1');
    assert.strictEqual(out.activeFeatures.includes('f1'), false);
    assert.strictEqual(out.features.f1.archived, true);
    assert.ok(out.features.f1.archivedAt);
  });

  it('removeFeature should switch primary feature', async () => {
    await addFeature(dir, 'a');
    await addFeature(dir, 'b');
    await setPrimaryFeature(dir, 'a');
    const out = await removeFeature(dir, 'a');
    assert.strictEqual(out.primaryFeature, 'b');
  });

  it('getActiveFeatures should return active list', async () => {
    await addFeature(dir, 'a');
    await addFeature(dir, 'b');
    const list = await getActiveFeatures(dir);
    assert.deepStrictEqual(list.sort(), ['a', 'b']);
  });

  it('getPrimaryFeature should return primary or null', async () => {
    assert.strictEqual(await getPrimaryFeature(dir), null);
    await addFeature(dir, 'a');
    assert.strictEqual(await getPrimaryFeature(dir), 'a');
  });

  it('setPrimaryFeature should throw for inactive feature', async () => {
    await assert.rejects(() => setPrimaryFeature(dir, 'x'));
  });

  it('getArchivedFeatures should return archived items', async () => {
    await addFeature(dir, 'a');
    await addFeature(dir, 'b');
    await removeFeature(dir, 'b');
    const archived = await getArchivedFeatures(dir);
    assert.deepStrictEqual(archived, ['b']);
  });

  it('getArchivedFeatures should return empty array if none', async () => {
    const archived = await getArchivedFeatures(dir);
    assert.deepStrictEqual(archived, []);
  });
});

describe('pdca/phase', () => {
  let dir;
  const feature = 'phase-feature';

  beforeEach(() => {
    dir = mkTmp('bkit-phase-');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('getCurrentPhase should return null for unknown feature', async () => {
    assert.strictEqual(await getCurrentPhase(dir, feature), null);
  });

  it('setPhase should set phase for new feature', async () => {
    const out = await setPhase(dir, feature, 'plan');
    assert.strictEqual(out.features[feature].phase, 'plan');
  });

  it('setPhase should update existing phase', async () => {
    await setPhase(dir, feature, 'plan');
    await setPhase(dir, feature, 'design');
    assert.strictEqual(await getCurrentPhase(dir, feature), 'design');
  });

  it('setPhase should update documents map for plan/check/report', async () => {
    await setPhase(dir, feature, 'plan');
    await setPhase(dir, feature, 'check');
    const out = await setPhase(dir, feature, 'report');
    assert.ok(out.features[feature].documents.plan.endsWith('.plan.md'));
    assert.ok(out.features[feature].documents.analysis.endsWith('.analysis.md'));
    assert.ok(out.features[feature].documents.report.endsWith('.report.md'));
  });

  it('getNextPhase should cover all transitions', () => {
    assert.strictEqual(getNextPhase('plan'), 'design');
    assert.strictEqual(getNextPhase('design'), 'do');
    assert.strictEqual(getNextPhase('do'), 'check');
    assert.strictEqual(getNextPhase('check'), 'act');
    assert.strictEqual(getNextPhase('act'), 'report');
    assert.strictEqual(getNextPhase('report'), null);
  });

  it('getNextPhase should return null for unknown phase', () => {
    assert.strictEqual(getNextPhase('x'), null);
  });

  it('validatePhaseTransition should allow sequential', () => {
    const out = validatePhaseTransition('plan', 'design');
    assert.strictEqual(out.valid, true);
  });

  it('validatePhaseTransition should block plan->do', () => {
    const out = validatePhaseTransition('plan', 'do');
    assert.strictEqual(out.valid, false);
  });

  it('validatePhaseTransition should allow act->check iteration', () => {
    const out = validatePhaseTransition('act', 'check');
    assert.strictEqual(out.valid, true);
  });

  it('validatePhaseTransition should block backward', () => {
    const out = validatePhaseTransition('design', 'plan');
    assert.strictEqual(out.valid, false);
  });

  it('validatePhaseTransition should reject unknown source/target', () => {
    assert.strictEqual(validatePhaseTransition('x', 'plan').valid, false);
    assert.strictEqual(validatePhaseTransition('plan', 'x').valid, false);
  });

  it('validatePhaseTransition should allow multi-step forward with warning', () => {
    const out = validatePhaseTransition('plan', 'check');
    assert.strictEqual(out.valid, true);
    assert.ok(out.reason.includes('Skipping'));
  });

  it('getPhaseDeliverables should return known and unknown fallback', () => {
    assert.ok(getPhaseDeliverables('plan').files.length > 0);
    assert.strictEqual(getPhaseDeliverables('unknown').description, 'Unknown phase');
  });

  it('checkDeliverables should be complete when required file exists', async () => {
    const p = path.join(dir, 'docs/01-plan/features/feat.plan.md');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, '# plan');
    const out = await checkDeliverables(dir, 'feat', 'plan');
    assert.strictEqual(out.complete, true);
  });

  it('checkDeliverables should report missing files', async () => {
    const out = await checkDeliverables(dir, 'feat', 'design');
    assert.strictEqual(out.complete, false);
    assert.ok(out.missing.some(m => m.includes('.design.md')));
  });
});

describe('pdca/automation', () => {
  let dir;

  beforeEach(() => {
    dir = mkTmp('bkit-auto-');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const classifyCases = [
    [1, 'quick_fix'],
    [20, 'minor_change'],
    [120, 'feature'],
    [300, 'major_feature']
  ];

  for (const [lines, expected] of classifyCases) {
    it(`classifyTask should classify ${lines} as ${expected}`, () => {
      const out = classifyTask(lines);
      assert.strictEqual(out.classification, expected);
    });
  }

  it('shouldApplyPdca should reflect required/recommended', () => {
    assert.strictEqual(shouldApplyPdca({ pdcaRequired: false, pdcaRecommended: false }), false);
    assert.strictEqual(shouldApplyPdca({ pdcaRequired: true, pdcaRecommended: false }), true);
    assert.strictEqual(shouldApplyPdca({ pdcaRequired: false, pdcaRecommended: true }), true);
  });

  it('checkDesignExists/checkPlanExists should detect docs', async () => {
    const plan = path.join(dir, 'docs/01-plan/features/a.plan.md');
    const design = path.join(dir, 'docs/02-design/features/a.design.md');
    fs.mkdirSync(path.dirname(plan), { recursive: true });
    fs.mkdirSync(path.dirname(design), { recursive: true });
    fs.writeFileSync(plan, 'x');
    fs.writeFileSync(design, 'x');
    assert.strictEqual(await checkPlanExists(dir, 'a'), true);
    assert.strictEqual(await checkDesignExists(dir, 'a'), true);
  });

  it('suggestNextAction should suggest plan when untracked', async () => {
    const out = await suggestNextAction(dir, 'x');
    assert.ok(out.command.includes('$pdca plan x'));
  });

  it('suggestNextAction should suggest design in plan phase with plan doc', async () => {
    await addFeature(dir, 'x', 'plan');
    const plan = path.join(dir, 'docs/01-plan/features/x.plan.md');
    fs.mkdirSync(path.dirname(plan), { recursive: true });
    fs.writeFileSync(plan, '# plan');
    const out = await suggestNextAction(dir, 'x');
    assert.ok(out.command.includes('$pdca design x'));
  });

  it('suggestNextAction should suggest do in design phase with design doc', async () => {
    await addFeature(dir, 'x', 'design');
    const design = path.join(dir, 'docs/02-design/features/x.design.md');
    fs.mkdirSync(path.dirname(design), { recursive: true });
    fs.writeFileSync(design, '# design');
    const out = await suggestNextAction(dir, 'x');
    assert.ok(out.command.includes('$pdca do x'));
  });

  it('suggestNextAction should suggest analyze in do phase', async () => {
    await addFeature(dir, 'x', 'do');
    const out = await suggestNextAction(dir, 'x');
    assert.ok(out.command.includes('$pdca analyze x'));
  });

  it('suggestNextAction should suggest report for check phase with >=90', async () => {
    const s = await readPdcaStatus(dir);
    s.features.x = { phase: 'check', matchRate: 95, iterationCount: 0, documents: {} };
    s.activeFeatures.push('x');
    await writePdcaStatus(dir, s);
    const out = await suggestNextAction(dir, 'x');
    assert.ok(out.command.includes('$pdca report x'));
  });

  it('suggestNextAction should suggest iterate for check phase with <90', async () => {
    const s = await readPdcaStatus(dir);
    s.features.x = { phase: 'check', matchRate: 80, iterationCount: 0, documents: {} };
    s.activeFeatures.push('x');
    await writePdcaStatus(dir, s);
    const out = await suggestNextAction(dir, 'x');
    assert.ok(out.command.includes('$pdca iterate x'));
  });

  it('suggestNextAction should suggest analyze in act phase and archive in report phase', async () => {
    const s = await readPdcaStatus(dir);
    s.features.a = { phase: 'act', matchRate: 70, iterationCount: 1, documents: {} };
    s.features.b = { phase: 'report', matchRate: 95, iterationCount: 1, documents: {} };
    s.activeFeatures.push('a', 'b');
    await writePdcaStatus(dir, s);
    const a = await suggestNextAction(dir, 'a');
    const b = await suggestNextAction(dir, 'b');
    assert.ok(a.command.includes('$pdca analyze a'));
    assert.ok(b.command.includes('$pdca archive b'));
  });

  it('formatPdcaProgress should render no tracking for null', () => {
    assert.strictEqual(formatPdcaProgress(null), '[No PDCA tracking]');
  });

  it('formatPdcaProgress should render completed/active/pending markers', () => {
    const out = formatPdcaProgress({ phase: 'check' });
    assert.ok(out.includes('[Plan]✅'));
    assert.ok(out.includes('[Check]🔄'));
    assert.ok(out.includes('[Act]⏳'));
  });

  it('generatePdcaGuidance should handle untracked feature', async () => {
    const out = await generatePdcaGuidance(dir, 'none');
    assert.ok(out.includes('$pdca plan none'));
  });

  it('generatePdcaGuidance should provide phase-specific messages', async () => {
    await addFeature(dir, 'f1', 'plan');
    await addFeature(dir, 'f2', 'design');
    await addFeature(dir, 'f3', 'do');
    await addFeature(dir, 'f4', 'act');

    const p = path.join(dir, 'docs/01-plan/features/f1.plan.md');
    const d = path.join(dir, 'docs/02-design/features/f2.design.md');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.writeFileSync(p, 'x');
    fs.writeFileSync(d, 'x');

    const g1 = await generatePdcaGuidance(dir, 'f1');
    const g2 = await generatePdcaGuidance(dir, 'f2');
    const g3 = await generatePdcaGuidance(dir, 'f3');
    const g4 = await generatePdcaGuidance(dir, 'f4');

    assert.ok(g1.includes('Plan document'));
    assert.ok(g2.includes('Design document'));
    assert.ok(g3.includes('bkit_pre_write_check'));
    assert.ok(g4.includes('Fix identified gaps'));
  });
});

describe('pdca/template', () => {
  it('selectTemplate should map plan/design/analysis/report/do templates by level', () => {
    assert.strictEqual(selectTemplate('plan', 'Starter'), 'plan.template.md');
    assert.strictEqual(selectTemplate('design', 'Starter'), 'design-starter.template.md');
    assert.strictEqual(selectTemplate('design', 'Dynamic'), 'design.template.md');
    assert.strictEqual(selectTemplate('design', 'Enterprise'), 'design-enterprise.template.md');
    assert.strictEqual(selectTemplate('analysis', 'Starter'), 'analysis.template.md');
    assert.strictEqual(selectTemplate('report', 'Dynamic'), 'report.template.md');
    assert.strictEqual(selectTemplate('do', 'Enterprise'), 'do.template.md');
  });

  it('selectTemplate should fallback for unknown phase/level', () => {
    assert.strictEqual(selectTemplate('unknown', 'Starter'), 'plan.template.md');
    assert.strictEqual(selectTemplate('design', 'Unknown'), 'design.template.md');
  });

  it('getTemplateContent should return content for known template', () => {
    const content = getTemplateContent('plan.template.md');
    assert.ok(content.startsWith('# ${FEATURE} - Plan Document'));
  });

  it('getTemplateContent should return fallback for unknown template', () => {
    const content = getTemplateContent('none.template.md');
    assert.ok(content.includes('[Template not found]'));
  });

  it('resolveTemplateVariables should resolve placeholders and repeated keys', () => {
    const tmpl = 'A:${FEATURE} B:${DATE} C:${LEVEL} D:${FEATURE}';
    const out = resolveTemplateVariables(tmpl, { FEATURE: 'f', DATE: '2026-02-15', LEVEL: 'Starter' });
    assert.strictEqual(out, 'A:f B:2026-02-15 C:Starter D:f');
  });

  it('resolveTemplateVariables should replace missing with empty string', () => {
    const out = resolveTemplateVariables('${FEATURE}-${MISSING}', { FEATURE: 'x', MISSING: '' });
    assert.strictEqual(out, 'x-');
  });

  it('getTemplateList should return all 7 templates', () => {
    const list = getTemplateList();
    assert.strictEqual(list.length, 7);
    assert.ok(list.includes('design-enterprise.template.md'));
  });

  it('validateTemplate should validate good template', () => {
    const out = validateTemplate(getTemplateContent('plan.template.md'));
    assert.strictEqual(out.valid, true);
  });

  it('validateTemplate should reject null', () => {
    const out = validateTemplate(null);
    assert.strictEqual(out.valid, false);
  });

  it('validateTemplate should warn on non-heading and too short', () => {
    const out = validateTemplate('short');
    assert.strictEqual(out.valid, false);
    assert.ok(out.errors.length >= 2);
  });
});

describe('intent/trigger', () => {
  it('matchSkillTrigger should return empty for null input', () => {
    assert.deepStrictEqual(matchSkillTrigger(null), []);
  });

  const skillCases = [
    ['static website portfolio', 'starter'],
    ['login and database backend', 'dynamic'],
    ['kubernetes microservices terraform', 'enterprise'],
    ['react native ios android', 'mobile-app'],
    ['로그인 기능 추가', 'dynamic'],
    ['静的サイトを作る', 'starter'],
    ['静态网站 创建', 'starter']
  ];

  for (const [text, expected] of skillCases) {
    it(`matchSkillTrigger should match ${expected} for "${text}"`, () => {
      const out = matchSkillTrigger(text);
      assert.strictEqual(out[0].skill, expected);
    });
  }

  it('matchSkillTrigger should increase confidence for multiple matches and sort', () => {
    const out = matchSkillTrigger('login signup authentication backend api');
    assert.strictEqual(out[0].skill, 'dynamic');
    assert.ok(out[0].confidence > 0.7);
  });

  it('matchSkillTrigger should be case-insensitive', () => {
    const out = matchSkillTrigger('KUBERNETES TERRAFORM');
    assert.strictEqual(out[0].skill, 'enterprise');
  });

  it('matchAgentTrigger should return empty for null input', () => {
    assert.deepStrictEqual(matchAgentTrigger(undefined), []);
  });

  const agentCases = [
    ['gap analysis and match rate', 'gap-detector'],
    ['improve and iterate fix gaps', 'pdca-iterator'],
    ['code review and code analysis', 'code-analyzer'],
    ['generate report summary', 'report-generator'],
    ['코드 리뷰 분석', 'code-analyzer']
  ];

  for (const [text, expected] of agentCases) {
    it(`matchAgentTrigger should match ${expected}`, () => {
      const out = matchAgentTrigger(text);
      assert.strictEqual(out[0].agent, expected);
    });
  }

  it('getImplicitTriggers should map by file/context hints', () => {
    assert.deepStrictEqual(getImplicitTriggers('component.tsx react page').sort(), ['dynamic']);
    assert.deepStrictEqual(getImplicitTriggers('index.html style.css').sort(), ['starter']);
    assert.deepStrictEqual(getImplicitTriggers('Dockerfile and deploy.yml').sort(), ['enterprise']);
    assert.deepStrictEqual(getImplicitTriggers('Main.swift').sort(), ['mobile-app']);
  });

  it('getImplicitTriggers should deduplicate and handle null', () => {
    assert.deepStrictEqual(getImplicitTriggers('react component.jsx react .tsx').sort(), ['dynamic']);
    assert.deepStrictEqual(getImplicitTriggers(null), []);
  });

  it('matchMultiLanguageTrigger should return matches with language and pattern', () => {
    const out = matchMultiLanguageTrigger('hello 안녕', { en: ['hello'], ko: ['안녕'] });
    assert.strictEqual(out.length, 2);
    assert.ok(out.some(m => m.language === 'en'));
    assert.ok(out.some(m => m.language === 'ko'));
  });

  it('matchMultiLanguageTrigger should return empty for nulls', () => {
    assert.deepStrictEqual(matchMultiLanguageTrigger(null, { en: ['x'] }), []);
    assert.deepStrictEqual(matchMultiLanguageTrigger('x', null), []);
  });
});

describe('task/classification', () => {
  const byLinesCases = [
    [-1, 'quick_fix'],
    ['x', 'quick_fix'],
    [0, 'quick_fix'],
    [9, 'quick_fix'],
    [10, 'minor_change'],
    [49, 'minor_change'],
    [50, 'feature'],
    [199, 'feature'],
    [200, 'major_feature']
  ];

  for (const [lines, expected] of byLinesCases) {
    it(`classifyByLines ${String(lines)} => ${expected}`, () => {
      assert.strictEqual(classifyByLines(lines), expected);
    });
  }

  const descCases = [
    ['refactor auth module', 'major_feature'],
    ['migration needed', 'major_feature'],
    ['redesign component', 'major_feature'],
    ['implement billing feature', 'feature'],
    ['add new endpoint', 'feature'],
    ['fix typo in docs', 'quick_fix'],
    ['formatting only', 'quick_fix'],
    ['fix bug in parser', 'minor_change'],
    [null, 'minor_change'],
    ['IMPLEMENT LOGIN', 'feature']
  ];

  for (const [desc, expected] of descCases) {
    it(`classifyByDescription "${String(desc)}" => ${expected}`, () => {
      assert.strictEqual(classifyByDescription(desc), expected);
    });
  }

  it('getClassificationLabel should map known and unknown keys', () => {
    assert.strictEqual(getClassificationLabel('quick_fix'), 'Quick Fix');
    assert.strictEqual(getClassificationLabel('major_feature'), 'Major Feature');
    assert.strictEqual(getClassificationLabel('x'), 'Unknown');
  });

  it('getClassificationThresholds should return a fresh copy', () => {
    const a = getClassificationThresholds();
    const b = getClassificationThresholds();
    a.quick_fix = 999;
    assert.notStrictEqual(a.quick_fix, b.quick_fix);
  });
});

describe('task/creator', () => {
  const phases = ['plan', 'design', 'do', 'check', 'act', 'report'];

  for (const phase of phases) {
    it(`createPdcaTask should build task for ${phase}`, () => {
      const task = createPdcaTask('my-feature', phase);
      assert.strictEqual(task.feature, 'my-feature');
      assert.strictEqual(task.phase, phase);
      assert.ok(task.subject.startsWith('['));
      assert.ok(task.description.length > 10);
    });
  }

  it('formatTaskSubject should fallback for unknown phase', () => {
    assert.strictEqual(formatTaskSubject('x', 'unknown-phase'), '[UNKNOWN-PHASE] x');
  });

  it('getTaskTemplate should return known and fallback template', () => {
    const known = getTaskTemplate('plan');
    const unknown = getTaskTemplate('something');
    assert.strictEqual(known.prefix, '[PLAN]');
    assert.ok(unknown.prefix.includes('[SOMETHING]'));
  });
});
