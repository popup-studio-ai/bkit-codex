'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  getCompactSummary,
  parseCompactSummary
} = require('../src/lib/pdca/status');

describe('pdca/status - getCompactSummary (C-3)', () => {
  it('should return summary for a valid status with primary feature', () => {
    const status = {
      primaryFeature: 'user-auth',
      features: {
        'user-auth': {
          phase: 'design',
          matchRate: 85,
          iterationCount: 2,
          taskChain: [1, 2, 3, 4, 5]
        }
      }
    };
    const summary = getCompactSummary(status);
    assert.strictEqual(summary, 'user-auth|design|85%|iter:2|tasks:5');
  });

  it('should handle null matchRate', () => {
    const status = {
      primaryFeature: 'test',
      features: {
        test: {
          phase: 'plan',
          matchRate: null,
          iterationCount: 0
        }
      }
    };
    const summary = getCompactSummary(status);
    assert.strictEqual(summary, 'test|plan|0%|iter:0|tasks:0');
  });

  it('should handle no primary feature', () => {
    const status = {
      primaryFeature: null,
      features: {}
    };
    const summary = getCompactSummary(status);
    assert.strictEqual(summary, 'no-feature|none|0%|iter:0|tasks:0');
  });

  it('should handle primary feature not in features map', () => {
    const status = {
      primaryFeature: 'missing',
      features: {}
    };
    const summary = getCompactSummary(status);
    assert.strictEqual(summary, 'missing|unknown|0%|iter:0|tasks:0');
  });

  it('should round decimal matchRate', () => {
    const status = {
      primaryFeature: 'feat',
      features: {
        feat: {
          phase: 'check',
          matchRate: 85.7,
          iterationCount: 1
        }
      }
    };
    const summary = getCompactSummary(status);
    assert.ok(summary.includes('86%'));
  });

  it('should handle missing taskChain', () => {
    const status = {
      primaryFeature: 'feat',
      features: {
        feat: {
          phase: 'do',
          matchRate: 50,
          iterationCount: 0
        }
      }
    };
    const summary = getCompactSummary(status);
    assert.ok(summary.includes('tasks:0'));
  });
});

describe('pdca/status - parseCompactSummary (C-3)', () => {
  it('should parse a valid summary string', () => {
    const result = parseCompactSummary('user-auth|design|85%|iter:2|tasks:5');
    assert.deepStrictEqual(result, {
      feature: 'user-auth',
      phase: 'design',
      matchRate: 85,
      iterationCount: 2,
      taskCount: 5
    });
  });

  it('should return null for null input', () => {
    assert.strictEqual(parseCompactSummary(null), null);
  });

  it('should return null for empty string', () => {
    assert.strictEqual(parseCompactSummary(''), null);
  });

  it('should return null for non-string input', () => {
    assert.strictEqual(parseCompactSummary(123), null);
  });

  it('should return null for string with fewer than 5 parts', () => {
    assert.strictEqual(parseCompactSummary('a|b|c'), null);
  });

  it('should handle zero values', () => {
    const result = parseCompactSummary('no-feature|none|0%|iter:0|tasks:0');
    assert.strictEqual(result.feature, 'no-feature');
    assert.strictEqual(result.phase, 'none');
    assert.strictEqual(result.matchRate, 0);
    assert.strictEqual(result.iterationCount, 0);
    assert.strictEqual(result.taskCount, 0);
  });

  it('should parse matchRate without % sign', () => {
    const result = parseCompactSummary('feat|plan|90|iter:1|tasks:3');
    assert.strictEqual(result.matchRate, 90);
  });
});
