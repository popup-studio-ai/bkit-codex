'use strict';

const PHASE_TEMPLATES = {
  plan: {
    prefix: '[PLAN]',
    description: 'Create plan document with goals, scope, and success criteria'
  },
  design: {
    prefix: '[DESIGN]',
    description: 'Create design document with architecture, data model, and API spec'
  },
  do: {
    prefix: '[DO]',
    description: 'Implement feature according to design document'
  },
  check: {
    prefix: '[CHECK]',
    description: 'Run gap analysis comparing design vs implementation'
  },
  act: {
    prefix: '[ACT]',
    description: 'Fix identified gaps and improve implementation'
  },
  report: {
    prefix: '[REPORT]',
    description: 'Generate completion report with metrics and learnings'
  }
};

/**
 * Create a PDCA task object for a feature and phase.
 * @param {string} feature - Feature name
 * @param {string} phase - PDCA phase
 * @returns {{ subject: string, description: string, phase: string, feature: string }}
 */
function createPdcaTask(feature, phase) {
  const template = getTaskTemplate(phase);
  return {
    subject: formatTaskSubject(feature, phase),
    description: template.description,
    phase,
    feature
  };
}

/**
 * Format a task subject line.
 * @param {string} feature
 * @param {string} phase
 * @returns {string}
 */
function formatTaskSubject(feature, phase) {
  const template = PHASE_TEMPLATES[phase];
  const prefix = template ? template.prefix : `[${phase.toUpperCase()}]`;
  return `${prefix} ${feature}`;
}

/**
 * Get the task template for a phase.
 * @param {string} phase
 * @returns {{ prefix: string, description: string }}
 */
function getTaskTemplate(phase) {
  return PHASE_TEMPLATES[phase] || {
    prefix: `[${(phase || 'UNKNOWN').toUpperCase()}]`,
    description: `Complete ${phase || 'unknown'} phase`
  };
}

/**
 * Create a full PDCA task chain for a feature (C-4).
 * Generates 5 linked tasks: Plan -> Design -> Do -> Check -> Report
 * @param {string} feature - Feature name
 * @returns {{ tasks: object[], guidance: string }}
 */
function createTaskChain(feature) {
  const phases = ['plan', 'design', 'do', 'check', 'report'];
  const now = new Date().toISOString();

  const tasks = phases.map((phase, index) => ({
    phase,
    subject: formatTaskSubject(feature, phase),
    description: PHASE_TEMPLATES[phase] ? PHASE_TEMPLATES[phase].description : `Complete ${phase} phase`,
    status: index === 0 ? 'active' : 'pending',
    createdAt: now
  }));

  return {
    tasks,
    guidance: `PDCA task chain created with ${tasks.length} tasks. Complete [PLAN] then proceed to [DESIGN].`
  };
}

module.exports = {
  createPdcaTask,
  formatTaskSubject,
  getTaskTemplate,
  createTaskChain
};
