'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
  createPdcaTask,
  formatTaskSubject,
  getTaskTemplate,
  createTaskChain
} = require('../src/lib/task/creator');

describe('task/creator - createTaskChain (C-4)', () => {
  it('should create a chain with exactly 5 tasks', () => {
    const result = createTaskChain('user-auth');
    assert.strictEqual(result.tasks.length, 5);
  });

  it('should include all 5 PDCA phases in order', () => {
    const result = createTaskChain('user-auth');
    const phases = result.tasks.map(t => t.phase);
    assert.deepStrictEqual(phases, ['plan', 'design', 'do', 'check', 'report']);
  });

  it('should set first task as active and rest as pending', () => {
    const result = createTaskChain('user-auth');
    assert.strictEqual(result.tasks[0].status, 'active');
    for (let i = 1; i < result.tasks.length; i++) {
      assert.strictEqual(result.tasks[i].status, 'pending');
    }
  });

  it('should format subjects with correct prefixes', () => {
    const result = createTaskChain('my-feature');
    assert.strictEqual(result.tasks[0].subject, '[PLAN] my-feature');
    assert.strictEqual(result.tasks[1].subject, '[DESIGN] my-feature');
    assert.strictEqual(result.tasks[2].subject, '[DO] my-feature');
    assert.strictEqual(result.tasks[3].subject, '[CHECK] my-feature');
    assert.strictEqual(result.tasks[4].subject, '[REPORT] my-feature');
  });

  it('should include descriptions for each task', () => {
    const result = createTaskChain('test-feature');
    for (const task of result.tasks) {
      assert.ok(task.description, `Task ${task.phase} should have a description`);
      assert.strictEqual(typeof task.description, 'string');
    }
  });

  it('should include createdAt timestamps', () => {
    const result = createTaskChain('test-feature');
    for (const task of result.tasks) {
      assert.ok(task.createdAt, `Task ${task.phase} should have createdAt`);
      assert.ok(!isNaN(Date.parse(task.createdAt)), 'createdAt should be valid ISO timestamp');
    }
  });

  it('should return guidance string', () => {
    const result = createTaskChain('test-feature');
    assert.strictEqual(typeof result.guidance, 'string');
    assert.ok(result.guidance.includes('PDCA task chain created'));
  });
});

describe('task/creator - formatTaskSubject', () => {
  it('should format known phases with template prefix', () => {
    assert.strictEqual(formatTaskSubject('feat', 'plan'), '[PLAN] feat');
    assert.strictEqual(formatTaskSubject('feat', 'design'), '[DESIGN] feat');
    assert.strictEqual(formatTaskSubject('feat', 'do'), '[DO] feat');
    assert.strictEqual(formatTaskSubject('feat', 'check'), '[CHECK] feat');
    assert.strictEqual(formatTaskSubject('feat', 'report'), '[REPORT] feat');
  });

  it('should handle unknown phase with uppercase fallback', () => {
    assert.strictEqual(formatTaskSubject('feat', 'custom'), '[CUSTOM] feat');
  });
});

describe('task/creator - getTaskTemplate', () => {
  it('should return template for known phases', () => {
    const template = getTaskTemplate('plan');
    assert.ok(template.prefix);
    assert.ok(template.description);
  });

  it('should return fallback for unknown phases', () => {
    const template = getTaskTemplate('custom');
    assert.strictEqual(template.prefix, '[CUSTOM]');
    assert.ok(template.description.includes('custom'));
  });

  it('should handle null/undefined phase', () => {
    const template = getTaskTemplate(null);
    assert.strictEqual(template.prefix, '[UNKNOWN]');
  });
});

describe('task/creator - createPdcaTask', () => {
  it('should create a task object with all required fields', () => {
    const task = createPdcaTask('my-feature', 'plan');
    assert.strictEqual(task.subject, '[PLAN] my-feature');
    assert.strictEqual(task.phase, 'plan');
    assert.strictEqual(task.feature, 'my-feature');
    assert.ok(task.description);
  });
});
