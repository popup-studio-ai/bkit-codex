'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- core/config tests ---

const {
  loadConfig,
  getConfig,
  mergeConfig,
  validateConfig,
  getDefaultConfig
} = require('../src/lib/core/config');

describe('core/config - loadConfig', () => {
  it('should return a config object for any directory', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
    const config = await loadConfig(tmpDir);
    assert.ok(config, 'loadConfig should return a config object');
    assert.strictEqual(typeof config, 'object');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return default config when no project config exists', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
    const config = await loadConfig(tmpDir);
    assert.strictEqual(config.version, '1.0.1');
    assert.ok(config.pdca, 'Config should have pdca section');
    assert.ok(config.taskClassification, 'Config should have taskClassification section');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should merge project config over defaults', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
    const configDir = path.join(tmpDir, '.bkit-codex');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, 'bkit.config.json'),
      JSON.stringify({ version: '2.0.0', pdca: { maxIterations: 10 } })
    );
    // Force cache invalidation by using a unique directory
    const config = await loadConfig(tmpDir);
    assert.strictEqual(config.version, '2.0.0');
    assert.strictEqual(config.pdca.maxIterations, 10);
    // Default values should still be present
    assert.strictEqual(config.pdca.matchRateThreshold, 90);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('core/config - getConfig', () => {
  it('should return a value by dot-notation path', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
    await loadConfig(tmpDir);
    const threshold = getConfig('pdca.matchRateThreshold');
    assert.strictEqual(typeof threshold, 'number');
    assert.ok(threshold > 0, 'matchRateThreshold should be a positive number');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return undefined for non-existent path', () => {
    const value = getConfig('nonexistent.path.deep');
    assert.strictEqual(value, undefined);
  });

  it('should return top-level value', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
    await loadConfig(tmpDir);
    const version = getConfig('version');
    assert.strictEqual(typeof version, 'string');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('core/config - mergeConfig', () => {
  it('should deep merge objects', () => {
    const base = { a: { b: 1, c: 2 }, d: 3 };
    const override = { a: { b: 10 }, e: 5 };
    const result = mergeConfig(base, override);
    assert.strictEqual(result.a.b, 10);
    assert.strictEqual(result.a.c, 2);
    assert.strictEqual(result.d, 3);
    assert.strictEqual(result.e, 5);
  });

  it('should replace arrays instead of merging them', () => {
    const base = { arr: [1, 2, 3] };
    const override = { arr: [4, 5] };
    const result = mergeConfig(base, override);
    assert.deepStrictEqual(result.arr, [4, 5]);
  });

  it('should not mutate the base object', () => {
    const base = { a: { b: 1 } };
    const override = { a: { b: 2 } };
    mergeConfig(base, override);
    assert.strictEqual(base.a.b, 1);
  });
});

describe('core/config - validateConfig', () => {
  it('should validate a correct default config', () => {
    const config = getDefaultConfig();
    const { valid, errors } = validateConfig(config);
    assert.strictEqual(valid, true, `Errors: ${errors.join(', ')}`);
    assert.strictEqual(errors.length, 0);
  });

  it('should reject non-object config', () => {
    const { valid, errors } = validateConfig(null);
    assert.strictEqual(valid, false);
    assert.ok(errors.length > 0);
  });

  it('should detect invalid pdca.matchRateThreshold', () => {
    const config = getDefaultConfig();
    config.pdca.matchRateThreshold = 'not-a-number';
    const { valid, errors } = validateConfig(config);
    assert.strictEqual(valid, false);
    assert.ok(errors.some(e => e.includes('matchRateThreshold')));
  });

  it('should detect invalid taskClassification thresholds', () => {
    const config = getDefaultConfig();
    config.taskClassification.thresholds.quickFix = 'invalid';
    const { valid, errors } = validateConfig(config);
    assert.strictEqual(valid, false);
    assert.ok(errors.some(e => e.includes('quickFix')));
  });
});

describe('core/config - getDefaultConfig', () => {
  it('should return a fresh copy each time', () => {
    const a = getDefaultConfig();
    const b = getDefaultConfig();
    assert.deepStrictEqual(a, b);
    a.version = 'modified';
    assert.notStrictEqual(a.version, b.version);
  });

  it('should contain all required sections', () => {
    const config = getDefaultConfig();
    assert.ok(config.version);
    assert.ok(config.pdca);
    assert.ok(config.taskClassification);
    assert.ok(config.levelDetection);
    assert.ok(config.conventions);
    assert.ok(config.supportedLanguages);
  });
});

// --- pdca/level tests ---

const { detectLevel } = require('../src/lib/pdca/level');

describe('pdca/level - detectLevel', () => {
  it('should return Starter for empty directory', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-level-'));
    const result = await detectLevel(tmpDir);
    assert.strictEqual(result.level, 'Starter');
    assert.ok(result.confidence, 'Should have confidence field');
    assert.ok(Array.isArray(result.evidence), 'Should have evidence array');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect Enterprise level when kubernetes dir exists', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-level-'));
    fs.mkdirSync(path.join(tmpDir, 'kubernetes'));
    const result = await detectLevel(tmpDir);
    assert.strictEqual(result.level, 'Enterprise');
    assert.ok(result.evidence.some(e => e.includes('kubernetes')));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect Enterprise level when terraform dir exists', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-level-'));
    fs.mkdirSync(path.join(tmpDir, 'terraform'));
    const result = await detectLevel(tmpDir);
    assert.strictEqual(result.level, 'Enterprise');
    assert.ok(result.evidence.some(e => e.includes('terraform')));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect Dynamic level when .mcp.json exists', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-level-'));
    fs.writeFileSync(path.join(tmpDir, '.mcp.json'), '{}');
    const result = await detectLevel(tmpDir);
    assert.strictEqual(result.level, 'Dynamic');
    assert.ok(result.evidence.some(e => e.includes('.mcp.json')));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect Dynamic level when api directory exists', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-level-'));
    fs.mkdirSync(path.join(tmpDir, 'api'));
    const result = await detectLevel(tmpDir);
    assert.strictEqual(result.level, 'Dynamic');
    assert.ok(result.evidence.some(e => e.includes('api')));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect Dynamic level from package.json with bkend dependency', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-level-'));
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { bkend: '^1.0.0' } })
    );
    const result = await detectLevel(tmpDir);
    assert.strictEqual(result.level, 'Dynamic');
    assert.ok(result.evidence.some(e => e.includes('bkend')));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should have high confidence with multiple enterprise indicators', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-level-'));
    fs.mkdirSync(path.join(tmpDir, 'kubernetes'));
    fs.mkdirSync(path.join(tmpDir, 'terraform'));
    const result = await detectLevel(tmpDir);
    assert.strictEqual(result.level, 'Enterprise');
    assert.strictEqual(result.confidence, 'high');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should prefer Enterprise over Dynamic when both indicators exist', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-level-'));
    fs.mkdirSync(path.join(tmpDir, 'kubernetes'));
    fs.mkdirSync(path.join(tmpDir, 'api'));
    const result = await detectLevel(tmpDir);
    assert.strictEqual(result.level, 'Enterprise');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

// --- intent/language tests ---

const { detectLanguage, getSupportedLanguages } = require('../src/lib/intent/language');

describe('intent/language - detectLanguage', () => {
  it('should return "en" for English text', () => {
    assert.strictEqual(detectLanguage('Create a login page'), 'en');
  });

  it('should return "en" for empty input', () => {
    assert.strictEqual(detectLanguage(''), 'en');
  });

  it('should return "en" for null input', () => {
    assert.strictEqual(detectLanguage(null), 'en');
  });

  it('should return "en" for undefined input', () => {
    assert.strictEqual(detectLanguage(undefined), 'en');
  });

  it('should detect Korean text', () => {
    assert.strictEqual(detectLanguage('로그인 페이지 만들어 주세요'), 'ko');
  });

  it('should detect Japanese text', () => {
    assert.strictEqual(detectLanguage('ログインページを作ってください'), 'ja');
  });

  it('should detect Chinese text', () => {
    assert.strictEqual(detectLanguage('创建登录页面'), 'zh');
  });

  it('should detect Spanish with multiple keywords', () => {
    assert.strictEqual(detectLanguage('hola crear una página de usuario'), 'es');
  });

  it('should detect French with multiple keywords', () => {
    assert.strictEqual(detectLanguage('bonjour créer une page utilisateur'), 'fr');
  });

  it('should detect German with multiple keywords', () => {
    assert.strictEqual(detectLanguage('hallo erstellen Seite Benutzer'), 'de');
  });

  it('should detect Italian with multiple keywords', () => {
    assert.strictEqual(detectLanguage('ciao creare una pagina utente'), 'it');
  });

  it('should default to "en" for a single European keyword (avoids false positive)', () => {
    // Single keyword should not be enough
    const result = detectLanguage('hola world');
    // With only one keyword match, score < 2, so defaults to 'en'
    assert.strictEqual(result, 'en');
  });

  it('should handle mixed Korean and English text', () => {
    const result = detectLanguage('로그인 page component');
    assert.strictEqual(result, 'ko');
  });
});

describe('intent/language - getSupportedLanguages', () => {
  it('should return an array of language codes', () => {
    const langs = getSupportedLanguages();
    assert.ok(Array.isArray(langs));
    assert.ok(langs.length > 0);
  });

  it('should include en, ko, ja, zh', () => {
    const langs = getSupportedLanguages();
    assert.ok(langs.includes('en'));
    assert.ok(langs.includes('ko'));
    assert.ok(langs.includes('ja'));
    assert.ok(langs.includes('zh'));
  });

  it('should include European languages', () => {
    const langs = getSupportedLanguages();
    assert.ok(langs.includes('es'));
    assert.ok(langs.includes('fr'));
    assert.ok(langs.includes('de'));
    assert.ok(langs.includes('it'));
  });

  it('should return a fresh copy each call', () => {
    const a = getSupportedLanguages();
    const b = getSupportedLanguages();
    assert.deepStrictEqual(a, b);
    a.push('xx');
    assert.notStrictEqual(a.length, b.length);
  });
});

// --- intent/ambiguity tests ---

const {
  calculateAmbiguityScore,
  needsClarification,
  checkMagicWords
} = require('../src/lib/intent/ambiguity');

describe('intent/ambiguity - calculateAmbiguityScore', () => {
  it('should return 100 for null input', () => {
    assert.strictEqual(calculateAmbiguityScore(null), 100);
  });

  it('should return 100 for empty string', () => {
    assert.strictEqual(calculateAmbiguityScore(''), 100);
  });

  it('should return 100 for undefined input', () => {
    assert.strictEqual(calculateAmbiguityScore(undefined), 100);
  });

  it('should return 0 for magic word !hotfix', () => {
    assert.strictEqual(calculateAmbiguityScore('!hotfix fix the login bug'), 0);
  });

  it('should return 0 for magic word !prototype', () => {
    assert.strictEqual(calculateAmbiguityScore('!prototype new feature'), 0);
  });

  it('should return 0 for magic word !bypass', () => {
    assert.strictEqual(calculateAmbiguityScore('!bypass just do it'), 0);
  });

  it('should return low score for specific technical prompt', () => {
    const score = calculateAmbiguityScore(
      'Create a React component in src/components/LoginForm.tsx that handles email and password authentication'
    );
    assert.ok(score < 30, `Expected low ambiguity but got ${score}`);
  });

  it('should return higher score for vague prompt', () => {
    const score = calculateAmbiguityScore('make better');
    assert.ok(score >= 40, `Expected high ambiguity but got ${score}`);
  });

  it('should penalize short prompts', () => {
    const shortScore = calculateAmbiguityScore('fix bug');
    const longScore = calculateAmbiguityScore(
      'Fix the authentication bug in src/lib/auth.ts where the JWT token validation fails for expired tokens'
    );
    assert.ok(
      shortScore > longScore,
      `Short prompt (${shortScore}) should be more ambiguous than long specific prompt (${longScore})`
    );
  });

  it('should reduce score when file paths are present', () => {
    const withPath = calculateAmbiguityScore('update src/lib/utils.ts');
    const withoutPath = calculateAmbiguityScore('update something');
    assert.ok(
      withPath < withoutPath,
      `With path (${withPath}) should be less ambiguous than without (${withoutPath})`
    );
  });

  it('should reduce score when technical terms are present', () => {
    const technical = calculateAmbiguityScore(
      'create a new React component with async database query'
    );
    const vague = calculateAmbiguityScore('create a new thing with some stuff');
    assert.ok(
      technical <= vague,
      `Technical (${technical}) should be less or equal ambiguity than vague (${vague})`
    );
  });

  it('should return score between 0 and 100', () => {
    const testCases = [
      'hello',
      'build everything',
      'simple complex frontend backend',
      'Create a component in src/components/Button.tsx with TypeScript',
      '!hotfix fix it now',
      ''
    ];
    for (const text of testCases) {
      const score = calculateAmbiguityScore(text);
      assert.ok(score >= 0, `Score ${score} for "${text}" should be >= 0`);
      assert.ok(score <= 100, `Score ${score} for "${text}" should be <= 100`);
    }
  });
});

describe('intent/ambiguity - needsClarification', () => {
  it('should return true for score >= 50', () => {
    assert.strictEqual(needsClarification(50), true);
    assert.strictEqual(needsClarification(75), true);
    assert.strictEqual(needsClarification(100), true);
  });

  it('should return false for score < 50', () => {
    assert.strictEqual(needsClarification(0), false);
    assert.strictEqual(needsClarification(25), false);
    assert.strictEqual(needsClarification(49), false);
  });
});

describe('intent/ambiguity - checkMagicWords', () => {
  it('should detect !hotfix', () => {
    const result = checkMagicWords('!hotfix fix the thing');
    assert.strictEqual(result.hasMagicWord, true);
    assert.strictEqual(result.word, '!hotfix');
  });

  it('should detect !prototype', () => {
    const result = checkMagicWords('!prototype new dashboard');
    assert.strictEqual(result.hasMagicWord, true);
    assert.strictEqual(result.word, '!prototype');
  });

  it('should detect !bypass', () => {
    const result = checkMagicWords('!bypass deploy now');
    assert.strictEqual(result.hasMagicWord, true);
    assert.strictEqual(result.word, '!bypass');
  });

  it('should return false when no magic words present', () => {
    const result = checkMagicWords('Create a login page');
    assert.strictEqual(result.hasMagicWord, false);
    assert.strictEqual(result.word, null);
  });

  it('should return false for null input', () => {
    const result = checkMagicWords(null);
    assert.strictEqual(result.hasMagicWord, false);
    assert.strictEqual(result.word, null);
  });

  it('should return false for empty string', () => {
    const result = checkMagicWords('');
    assert.strictEqual(result.hasMagicWord, false);
    assert.strictEqual(result.word, null);
  });
});
