'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { readPdcaStatus, writePdcaStatus, updateTaskChain } = require('../src/lib/pdca/status');

describe('pdca/status - updateTaskChain (C-4)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-chain-'));
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
  });

  it('should mark completed phase and activate next', async () => {
    const status = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: ['test-feature'],
      primaryFeature: 'test-feature',
      features: {
        'test-feature': {
          phase: 'plan',
          matchRate: null,
          iterationCount: 0,
          taskChain: [
            { phase: 'plan', status: 'active', createdAt: new Date().toISOString() },
            { phase: 'design', status: 'pending', createdAt: new Date().toISOString() },
            { phase: 'do', status: 'pending', createdAt: new Date().toISOString() },
            { phase: 'check', status: 'pending', createdAt: new Date().toISOString() },
            { phase: 'report', status: 'pending', createdAt: new Date().toISOString() }
          ],
          timestamps: {
            started: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        }
      },
      pipeline: { currentPhase: 1, level: 'Dynamic', phaseHistory: [] },
      session: {
        startedAt: new Date().toISOString(),
        onboardingCompleted: true,
        lastActivity: new Date().toISOString()
      },
      history: []
    };
    await writePdcaStatus(tmpDir, status);

    const chain = await updateTaskChain(tmpDir, 'test-feature', 'plan');
    assert.ok(chain, 'Should return updated chain');
    assert.strictEqual(chain[0].status, 'completed');
    assert.ok(chain[0].completedAt, 'Completed task should have completedAt');
    assert.strictEqual(chain[1].status, 'active');
    assert.strictEqual(chain[2].status, 'pending');
  });

  it('should return null when feature has no task chain', async () => {
    const status = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: ['no-chain'],
      primaryFeature: 'no-chain',
      features: {
        'no-chain': {
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

    const chain = await updateTaskChain(tmpDir, 'no-chain', 'plan');
    assert.strictEqual(chain, null);
  });

  it('should return null when feature does not exist', async () => {
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

    const chain = await updateTaskChain(tmpDir, 'nonexistent', 'plan');
    assert.strictEqual(chain, null);
  });

  it('should persist updated chain to status file', async () => {
    const status = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: ['persist-test'],
      primaryFeature: 'persist-test',
      features: {
        'persist-test': {
          phase: 'design',
          matchRate: null,
          iterationCount: 0,
          taskChain: [
            { phase: 'plan', status: 'completed', createdAt: new Date().toISOString() },
            { phase: 'design', status: 'active', createdAt: new Date().toISOString() },
            { phase: 'do', status: 'pending', createdAt: new Date().toISOString() },
            { phase: 'check', status: 'pending', createdAt: new Date().toISOString() },
            { phase: 'report', status: 'pending', createdAt: new Date().toISOString() }
          ],
          timestamps: {
            started: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        }
      },
      pipeline: { currentPhase: 1, level: 'Dynamic', phaseHistory: [] },
      session: {
        startedAt: new Date().toISOString(),
        onboardingCompleted: true,
        lastActivity: new Date().toISOString()
      },
      history: []
    };
    await writePdcaStatus(tmpDir, status);

    await updateTaskChain(tmpDir, 'persist-test', 'design');

    // Re-read and verify persistence
    const readBack = await readPdcaStatus(tmpDir);
    const chain = readBack.features['persist-test'].taskChain;
    assert.strictEqual(chain[1].status, 'completed');
    assert.strictEqual(chain[2].status, 'active');
  });

  it('should only activate the next pending task', async () => {
    const status = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: ['multi-test'],
      primaryFeature: 'multi-test',
      features: {
        'multi-test': {
          phase: 'do',
          matchRate: null,
          iterationCount: 0,
          taskChain: [
            { phase: 'plan', status: 'completed', createdAt: new Date().toISOString() },
            { phase: 'design', status: 'completed', createdAt: new Date().toISOString() },
            { phase: 'do', status: 'active', createdAt: new Date().toISOString() },
            { phase: 'check', status: 'pending', createdAt: new Date().toISOString() },
            { phase: 'report', status: 'pending', createdAt: new Date().toISOString() }
          ],
          timestamps: {
            started: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        }
      },
      pipeline: { currentPhase: 1, level: 'Dynamic', phaseHistory: [] },
      session: {
        startedAt: new Date().toISOString(),
        onboardingCompleted: true,
        lastActivity: new Date().toISOString()
      },
      history: []
    };
    await writePdcaStatus(tmpDir, status);

    const chain = await updateTaskChain(tmpDir, 'multi-test', 'do');
    assert.strictEqual(chain[2].status, 'completed');
    assert.strictEqual(chain[3].status, 'active');
    assert.strictEqual(chain[4].status, 'pending');
  });
});
