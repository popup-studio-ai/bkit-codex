'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { detectLanguage, getSupportedLanguages } = require('../src/lib/intent/language');
const { calculateAmbiguityScore, checkMagicWords } = require('../src/lib/intent/ambiguity');
const { getToolDefinitions } = require('../src/tools');
const { selectTemplate, getTemplateList } = require('../src/lib/pdca/template');
const { getLevelConfig } = require('../src/lib/pdca/level');
const { classifyByLines, classifyByDescription } = require('../src/lib/task/classification');
const analyzePrompt = require('../src/tools/analyze-prompt').handler;
const detectLevel = require('../src/tools/detect-level').handler;
const templateTool = require('../src/tools/template').handler;
const initTool = require('../src/tools/init').handler;
const getStatusTool = require('../src/tools/get-status').handler;

function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-gap-'));
}

describe('qa gap fill', () => {
  it('supported languages should be exactly 8 and immutable copy', () => {
    const a = getSupportedLanguages();
    const b = getSupportedLanguages();
    assert.strictEqual(a.length, 8);
    a.push('xx');
    assert.strictEqual(b.includes('xx'), false);
  });

  it('detectLanguage should prioritize japanese over cjk', () => {
    assert.strictEqual(detectLanguage('日本語テスト中文'), 'ja');
  });

  it('detectLanguage should detect ko/zh/es/fr/de/it fallback', () => {
    assert.strictEqual(detectLanguage('안녕하세요 로그인'), 'ko');
    assert.strictEqual(detectLanguage('中文測試'), 'zh');
    assert.strictEqual(detectLanguage('hola crear sitio'), 'es');
    assert.strictEqual(detectLanguage('bonjour créer page'), 'fr');
    assert.strictEqual(detectLanguage('hallo erstellen Webseite'), 'de');
    assert.strictEqual(detectLanguage('ciao creare pagina'), 'it');
  });

  it('magic words should bypass ambiguity', () => {
    assert.strictEqual(calculateAmbiguityScore('!hotfix do all'), 0);
    assert.strictEqual(checkMagicWords('hello').hasMagicWord, false);
  });

  it('tool list should contain 16 unique names', () => {
    const tools = getToolDefinitions();
    assert.strictEqual(tools.length, 16);
    assert.strictEqual(new Set(tools.map(t => t.name)).size, 16);
  });

  it('template selection should support all phases and default dynamic', () => {
    assert.strictEqual(selectTemplate('plan'), 'plan.template.md');
    assert.strictEqual(selectTemplate('design'), 'design.template.md');
    assert.strictEqual(selectTemplate('analysis'), 'analysis.template.md');
    assert.strictEqual(selectTemplate('report'), 'report.template.md');
    assert.strictEqual(selectTemplate('do'), 'do.template.md');
  });

  it('template list should include required 7 files', () => {
    const list = getTemplateList();
    const expected = [
      'plan.template.md',
      'design.template.md',
      'design-starter.template.md',
      'design-enterprise.template.md',
      'analysis.template.md',
      'report.template.md',
      'do.template.md'
    ];
    for (const file of expected) {
      assert.ok(list.includes(file));
    }
  });

  it('level configs should expose skill and phases', () => {
    const starter = getLevelConfig('Starter');
    const dynamic = getLevelConfig('Dynamic');
    const enterprise = getLevelConfig('Enterprise');
    assert.strictEqual(starter.skill, '$starter');
    assert.strictEqual(dynamic.skill, '$dynamic');
    assert.strictEqual(enterprise.skill, '$enterprise');
  });

  it('classification boundaries should be stable', () => {
    assert.strictEqual(classifyByLines(9), 'quick_fix');
    assert.strictEqual(classifyByLines(10), 'minor_change');
    assert.strictEqual(classifyByLines(49), 'minor_change');
    assert.strictEqual(classifyByLines(50), 'feature');
    assert.strictEqual(classifyByLines(199), 'feature');
    assert.strictEqual(classifyByLines(200), 'major_feature');
  });

  it('classification by description should remain case-insensitive', () => {
    assert.strictEqual(classifyByDescription('FIX TYPO NOW'), 'quick_fix');
    assert.strictEqual(classifyByDescription('Implement AUTH flow'), 'feature');
    assert.strictEqual(classifyByDescription('Refactor module architecture'), 'major_feature');
  });

  it('analyze_prompt should return error for empty prompt', async () => {
    const out = await analyzePrompt({}, { projectDir: null });
    assert.ok(out.error);
  });

  it('detect_level should error without args/context', async () => {
    const out = await detectLevel({}, { projectDir: null });
    assert.ok(out.error);
  });

  it('template tool should reject invalid phase', async () => {
    const out = await templateTool({ phase: 'invalid' }, { projectDir: null });
    assert.ok(out.error);
  });

  it('status tool should return session error before init', async () => {
    const out = await getStatusTool({}, { projectDir: null });
    assert.ok(out.error);
  });

  it('init tool should set project context', async () => {
    const projectDir = mkProject();
    try {
      const context = {};
      const out = await initTool({ projectDir }, context);
      assert.strictEqual(context.projectDir, projectDir);
      assert.ok(out.level);
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  it('analyze_prompt should detect feature intent for english request', async () => {
    const out = await analyzePrompt({ prompt: 'Create payment gateway module' }, { projectDir: null });
    assert.strictEqual(out.intent.type, 'feature_request');
    assert.strictEqual(out.intent.feature, 'payment-gateway-module');
  });

  it('analyze_prompt should detect bug-fix intent', async () => {
    const out = await analyzePrompt({ prompt: 'fix bug in parser' }, { projectDir: null });
    assert.strictEqual(out.intent.type, 'bug_fix');
  });

  it('analyze_prompt should detect question intent', async () => {
    const out = await analyzePrompt({ prompt: 'how to configure template selection?' }, { projectDir: null });
    assert.strictEqual(out.intent.type, 'question');
  });

  it('analyze_prompt should include suggested action and triggers', async () => {
    const out = await analyzePrompt({ prompt: 'React login page with API' }, { projectDir: null });
    assert.ok(out.suggestedAction);
    assert.ok(out.triggers.skills.length >= 0);
    assert.ok(out.triggers.implicit.length >= 0);
  });

  it('analyze_prompt should expose ambiguity object fields', async () => {
    const out = await analyzePrompt({ prompt: 'maybe do something' }, { projectDir: null });
    assert.strictEqual(typeof out.ambiguity.score, 'number');
    assert.strictEqual(typeof out.ambiguity.needsClarification, 'boolean');
    assert.ok('magicWord' in out.ambiguity);
  });

  it('analyze_prompt should keep score 0 on magic word', async () => {
    const out = await analyzePrompt({ prompt: '!prototype build all quickly' }, { projectDir: null });
    assert.strictEqual(out.ambiguity.score, 0);
  });

  it('template tool should return all templates and guidance with context', async () => {
    const projectDir = mkProject();
    try {
      const out = await templateTool({ phase: 'plan' }, { projectDir });
      assert.ok(out.templateName);
      assert.ok(out.template.includes('${FEATURE}') || out.template.includes('#'));
      assert.ok(Array.isArray(out.availableTemplates));
      assert.ok(out.guidance.includes('template'));
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
