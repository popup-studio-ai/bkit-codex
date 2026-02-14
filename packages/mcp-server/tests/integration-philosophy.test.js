'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const { createServer } = require('../src/server');
const { getToolDefinitions } = require('../src/tools');
const { detectLevel, getLevelConfig } = require('../src/lib/pdca/level');
const { validatePhaseTransition, getNextPhase, checkDeliverables } = require('../src/lib/pdca/phase');
const { classifyTask, suggestNextAction } = require('../src/lib/pdca/automation');
const { calculateAmbiguityScore, needsClarification, generateClarifyingQuestions } = require('../src/lib/intent/ambiguity');
const { loadConfig, validateConfig, getDefaultConfig } = require('../src/lib/core/config');
const { setCache, getCache, clearCache } = require('../src/lib/core/cache');

function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-int-'));
}

function write(p, content = 'x') {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

async function sendStdioRequest(proc, request) {
  return new Promise((resolve, reject) => {
    let out = '';
    const onData = (chunk) => {
      out += chunk.toString();
      const idx = out.indexOf('\n');
      if (idx !== -1) {
        proc.stdout.off('data', onData);
        try {
          resolve(JSON.parse(out.slice(0, idx)));
        } catch (e) {
          reject(e);
        }
      }
    };
    proc.stdout.on('data', onData);
    proc.stdin.write(JSON.stringify(request) + '\n');
  });
}

describe('integration and e2e', () => {
  let projectDir;

  beforeEach(() => {
    clearCache();
    projectDir = mkProject();
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it('server initialize should return protocol and capabilities', async () => {
    const server = createServer();
    const res = await server.handleRequest({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    assert.strictEqual(res.result.protocolVersion, '2024-11-05');
    assert.ok(res.result.capabilities.tools);
  });

  it('tools/list should return exactly 16 tools', async () => {
    const server = createServer();
    const res = await server.handleRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    assert.strictEqual(res.result.tools.length, 16);
  });

  it('tools/call unknown tool should return isError', async () => {
    const server = createServer();
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'unknown_tool', arguments: {} }
    });
    assert.strictEqual(res.result.isError, true);
  });

  it('unknown method should return -32601', async () => {
    const server = createServer();
    const res = await server.handleRequest({ jsonrpc: '2.0', id: 4, method: 'x/y', params: {} });
    assert.strictEqual(res.error.code, -32601);
  });

  it('tools/call without name should return -32602', async () => {
    const server = createServer();
    const res = await server.handleRequest({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: {} });
    assert.strictEqual(res.error.code, -32602);
  });

  it('notification request should return null', async () => {
    const server = createServer();
    const res = await server.handleRequest({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
    assert.strictEqual(res, null);
  });

  it('full workflow init->plan->design->complete should maintain state', async () => {
    const server = createServer();

    await server.handleRequest({
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: { name: 'bkit_init', arguments: { projectDir } }
    });

    await server.handleRequest({
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/call',
      params: { name: 'bkit_pdca_plan', arguments: { feature: 'auth' } }
    });

    write(path.join(projectDir, 'docs/01-plan/features/auth.plan.md'), '# plan');
    await server.handleRequest({
      jsonrpc: '2.0',
      id: 12,
      method: 'tools/call',
      params: { name: 'bkit_pdca_design', arguments: { feature: 'auth' } }
    });

    const completed = await server.handleRequest({
      jsonrpc: '2.0',
      id: 13,
      method: 'tools/call',
      params: { name: 'bkit_complete_phase', arguments: { feature: 'auth', phase: 'design' } }
    });

    const payload = JSON.parse(completed.result.content[0].text);
    assert.strictEqual(payload.nextPhase, 'do');
  });

  it('response format should contain jsonrpc/id/result and content array', async () => {
    const server = createServer();
    const res = await server.handleRequest({
      jsonrpc: '2.0',
      id: 20,
      method: 'tools/call',
      params: { name: 'bkit_detect_level', arguments: { projectDir } }
    });
    assert.strictEqual(res.jsonrpc, '2.0');
    assert.strictEqual(res.id, 20);
    assert.ok(Array.isArray(res.result.content));
    assert.strictEqual(res.result.content[0].type, 'text');
    assert.doesNotThrow(() => JSON.parse(res.result.content[0].text));
  });

  it('stdio entry should parse newline-delimited requests and return responses', async () => {
    const proc = spawn(process.execPath, ['index.js'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      const initRes = await sendStdioRequest(proc, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
      assert.strictEqual(initRes.id, 1);
      assert.ok(initRes.result.serverInfo);

      const listRes = await sendStdioRequest(proc, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      assert.strictEqual(listRes.id, 2);
      assert.strictEqual(listRes.result.tools.length, 16);
    } finally {
      proc.stdin.end();
      proc.kill();
    }
  });

  it('stdio entry should return parse error for invalid json', async () => {
    const proc = spawn(process.execPath, ['index.js'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    try {
      const p = new Promise((resolve, reject) => {
        let out = '';
        proc.stdout.on('data', chunk => {
          out += chunk.toString();
          const idx = out.indexOf('\n');
          if (idx !== -1) {
            try {
              resolve(JSON.parse(out.slice(0, idx)));
            } catch (e) {
              reject(e);
            }
          }
        });
      });

      proc.stdin.write('{not-json}\n');
      const err = await p;
      assert.strictEqual(err.error.code, -32700);
    } finally {
      proc.stdin.end();
      proc.kill();
    }
  });
});

describe('philosophy compliance checks', () => {
  let projectDir;

  beforeEach(() => {
    clearCache();
    projectDir = mkProject();
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it('Automation First: classifyTask auto determines pdca flags', () => {
    assert.strictEqual(classifyTask(5).pdcaRequired, false);
    assert.strictEqual(classifyTask(50).pdcaRequired, true);
  });

  it('No Guessing: ambiguity score >= 50 requires clarification', () => {
    const score = calculateAmbiguityScore('do maybe all');
    assert.strictEqual(needsClarification(score), true);
    assert.ok(generateClarifyingQuestions('do maybe all', []).length > 0);
  });

  it('Docs=Code: design cannot be skipped plan->do', () => {
    const out = validatePhaseTransition('plan', 'do');
    assert.strictEqual(out.valid, false);
  });

  it('Context Engineering: config should merge project config over defaults', async () => {
    const configPath = path.join(projectDir, '.bkit-codex/bkit.config.json');
    write(configPath, JSON.stringify({ pdca: { maxIterations: 7 } }));
    const config = await loadConfig(projectDir);
    assert.strictEqual(config.pdca.maxIterations, 7);
    assert.strictEqual(config.pdca.matchRateThreshold, 90);
  });

  it('Context Engineering: level detection should provide evidence', async () => {
    write(path.join(projectDir, '.mcp.json'), '{}');
    const res = await detectLevel(projectDir);
    assert.ok(res.evidence.length > 0);
  });

  it('PDCA Methodology: phase chain should be plan->design->do->check->act->report', () => {
    const chain = ['plan'];
    while (true) {
      const next = getNextPhase(chain[chain.length - 1]);
      if (!next) break;
      chain.push(next);
    }
    assert.deepStrictEqual(chain, ['plan', 'design', 'do', 'check', 'act', 'report']);
  });

  it('PDCA Methodology: suggestNextAction should report at >=90 and iterate below', async () => {
    const statusPath = path.join(projectDir, 'docs/.pdca-status.json');
    write(statusPath, JSON.stringify({
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      activeFeatures: ['f1', 'f2'],
      primaryFeature: 'f1',
      features: {
        f1: { phase: 'check', matchRate: 95, iterationCount: 1, documents: {} },
        f2: { phase: 'check', matchRate: 80, iterationCount: 1, documents: {} }
      },
      pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
      session: { startedAt: new Date().toISOString(), onboardingCompleted: false, lastActivity: new Date().toISOString() },
      history: []
    }));

    const a = await suggestNextAction(projectDir, 'f1');
    const b = await suggestNextAction(projectDir, 'f2');
    assert.ok(a.command.includes('$pdca report f1'));
    assert.ok(b.command.includes('$pdca iterate f2'));
  });

  it('PDCA Methodology: level-specific pipeline config should match definitions', () => {
    assert.deepStrictEqual(getLevelConfig('Starter').skipPhases, [4, 5, 7, 8]);
    assert.deepStrictEqual(getLevelConfig('Dynamic').skipPhases, [8]);
    assert.deepStrictEqual(getLevelConfig('Enterprise').skipPhases, []);
  });

  it('AI-Native: validateConfig should detect invalid values', () => {
    const c = getDefaultConfig();
    c.pdca.maxIterations = 'bad';
    const out = validateConfig(c);
    assert.strictEqual(out.valid, false);
  });

  it('AI-Native: cache should avoid repeated expensive access within ttl', () => {
    setCache('phi', { ok: true }, 1000);
    assert.deepStrictEqual(getCache('phi'), { ok: true });
  });

  it('AI-Native: server should expose analysis tool for verification', () => {
    const tools = getToolDefinitions();
    assert.ok(tools.some(t => t.name === 'bkit_pdca_analyze'));
  });

  it('deliverables verification should return found/missing arrays', async () => {
    write(path.join(projectDir, 'docs/01-plan/features/qa.plan.md'), '#');
    const out = await checkDeliverables(projectDir, 'qa', 'plan');
    assert.ok(Array.isArray(out.found));
    assert.ok(Array.isArray(out.missing));
  });
});
