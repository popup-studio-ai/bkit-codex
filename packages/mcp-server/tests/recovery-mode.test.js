'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { readPdcaStatus, writePdcaStatus, getCompactSummary } = require('../src/lib/pdca/status');

describe('get-status recovery mode (C-3)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-recovery-'));
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
  });

  it('should return default status when no status file exists', async () => {
    const status = await readPdcaStatus(tmpDir);
    assert.ok(status, 'Should return a status object');
    assert.strictEqual(status.version, '2.0');
    assert.strictEqual(status.primaryFeature, null);
  });

  it('should return full status with compact summary for recovery', async () => {
    const status = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: ['test-feature'],
      primaryFeature: 'test-feature',
      features: {
        'test-feature': {
          phase: 'design',
          matchRate: 75,
          iterationCount: 1,
          documents: {
            plan: 'docs/01-plan/features/test-feature.plan.md',
            design: 'docs/02-design/features/test-feature.design.md'
          },
          taskChain: [
            { phase: 'plan', status: 'completed' },
            { phase: 'design', status: 'active' },
            { phase: 'do', status: 'pending' },
            { phase: 'check', status: 'pending' },
            { phase: 'report', status: 'pending' }
          ]
        }
      },
      pipeline: { currentPhase: 3, level: 'Dynamic', phaseHistory: [] },
      session: {
        startedAt: new Date().toISOString(),
        onboardingCompleted: true,
        lastActivity: new Date().toISOString()
      },
      history: []
    };
    await writePdcaStatus(tmpDir, status);

    const readBack = await readPdcaStatus(tmpDir);
    const summary = getCompactSummary(readBack);

    assert.ok(summary.includes('test-feature'));
    assert.ok(summary.includes('design'));
    assert.ok(summary.includes('75%'));
    assert.ok(summary.includes('iter:1'));
    assert.ok(summary.includes('tasks:5'));
  });

  it('should handle status with no primary feature', async () => {
    const status = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: [],
      primaryFeature: null,
      features: {},
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      session: {
        startedAt: new Date().toISOString(),
        onboardingCompleted: false,
        lastActivity: new Date().toISOString()
      },
      history: []
    };
    await writePdcaStatus(tmpDir, status);

    const readBack = await readPdcaStatus(tmpDir);
    const summary = getCompactSummary(readBack);
    assert.strictEqual(summary, 'no-feature|none|0%|iter:0|tasks:0');
  });

  it('should handle feature without documents field', async () => {
    const status = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: ['bare-feature'],
      primaryFeature: 'bare-feature',
      features: {
        'bare-feature': {
          phase: 'plan',
          matchRate: null,
          iterationCount: 0
        }
      },
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      session: {
        startedAt: new Date().toISOString(),
        onboardingCompleted: false,
        lastActivity: new Date().toISOString()
      },
      history: []
    };
    await writePdcaStatus(tmpDir, status);

    const readBack = await readPdcaStatus(tmpDir);
    const summary = getCompactSummary(readBack);
    assert.strictEqual(summary, 'bare-feature|plan|0%|iter:0|tasks:0');
  });
});
