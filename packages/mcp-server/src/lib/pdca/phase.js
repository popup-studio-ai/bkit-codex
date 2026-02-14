'use strict';

const { readPdcaStatus, writePdcaStatus } = require('./status');
const { getFeaturePath } = require('../core/path');
const { fileExists } = require('../core/file');

const PHASE_ORDER = ['plan', 'design', 'do', 'check', 'act', 'report'];

const PHASE_DELIVERABLES = {
  plan: {
    files: ['docs/01-plan/features/{feature}.plan.md'],
    description: 'Plan document with goals, scope, success criteria'
  },
  design: {
    files: ['docs/02-design/features/{feature}.design.md'],
    description: 'Design document with architecture, data model, API spec'
  },
  do: {
    files: [],
    description: 'Implementation code matching design specifications'
  },
  check: {
    files: ['docs/03-analysis/{feature}.analysis.md'],
    description: 'Gap analysis with match rate calculation'
  },
  act: {
    files: [],
    description: 'Gap fixes applied, match rate >= 90%'
  },
  report: {
    files: ['docs/04-report/{feature}.report.md'],
    description: 'Completion report with metrics and learnings'
  }
};

/**
 * Get current phase for a feature.
 * @param {string} projectDir
 * @param {string} feature
 * @returns {Promise<string|null>}
 */
async function getCurrentPhase(projectDir, feature) {
  const status = await readPdcaStatus(projectDir);
  const featureStatus = status.features[feature];
  return featureStatus ? featureStatus.phase : null;
}

/**
 * Set the phase for a feature.
 * @param {string} projectDir
 * @param {string} feature
 * @param {string} phase
 * @returns {Promise<object>}
 */
async function setPhase(projectDir, feature, phase) {
  const status = await readPdcaStatus(projectDir);

  if (!status.features[feature]) {
    status.features[feature] = {
      phase,
      matchRate: null,
      iterationCount: 0,
      documents: {}
    };
    if (!status.activeFeatures.includes(feature)) {
      status.activeFeatures.push(feature);
    }
  } else {
    status.features[feature].phase = phase;
  }

  // Update document paths based on phase
  const docPhases = ['plan', 'design', 'analysis', 'report'];
  const phaseToDoc = { plan: 'plan', design: 'design', check: 'analysis', report: 'report' };
  if (phaseToDoc[phase]) {
    const docPhase = phaseToDoc[phase];
    const docPath = getFeaturePath(projectDir, feature, docPhase);
    status.features[feature].documents[docPhase] = docPath.replace(projectDir + '/', '');
  }

  await writePdcaStatus(projectDir, status);
  return status;
}

/**
 * Get the next phase in the PDCA cycle.
 * @param {string} currentPhase
 * @returns {string|null}
 */
function getNextPhase(currentPhase) {
  const idx = PHASE_ORDER.indexOf(currentPhase);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

/**
 * Validate a phase transition.
 * @param {string} from - Current phase
 * @param {string} to - Target phase
 * @returns {{ valid: boolean, reason: string }}
 */
function validatePhaseTransition(from, to) {
  const fromIdx = PHASE_ORDER.indexOf(from);
  const toIdx = PHASE_ORDER.indexOf(to);

  if (fromIdx === -1) {
    return { valid: false, reason: `Unknown source phase: ${from}` };
  }
  if (toIdx === -1) {
    return { valid: false, reason: `Unknown target phase: ${to}` };
  }

  // Allow moving forward by one step
  if (toIdx === fromIdx + 1) {
    return { valid: true, reason: 'Sequential phase transition' };
  }

  // Allow skipping from plan to design is always ok
  // But never skip design to do
  if (from === 'plan' && to === 'do') {
    return { valid: false, reason: 'Cannot skip design phase. Design is required before implementation.' };
  }

  // Allow iterating back from act to check
  if (from === 'act' && to === 'check') {
    return { valid: true, reason: 'Iteration cycle: act back to check' };
  }

  // Allow moving forward multiple steps (with warning)
  if (toIdx > fromIdx) {
    return { valid: true, reason: `Skipping phases from ${from} to ${to}` };
  }

  return { valid: false, reason: `Cannot transition backward from ${from} to ${to}` };
}

/**
 * Get the required deliverables for a phase.
 * @param {string} phase
 * @returns {object}
 */
function getPhaseDeliverables(phase) {
  return PHASE_DELIVERABLES[phase] || { files: [], description: 'Unknown phase' };
}

/**
 * Check if deliverables for a phase are complete.
 * @param {string} projectDir
 * @param {string} feature
 * @param {string} phase
 * @returns {Promise<{ complete: boolean, missing: string[], found: string[] }>}
 */
async function checkDeliverables(projectDir, feature, phase) {
  const deliverables = getPhaseDeliverables(phase);
  const missing = [];
  const found = [];

  for (const fileTemplate of deliverables.files) {
    const filePath = fileTemplate.replace('{feature}', feature);
    const fullPath = require('path').join(projectDir, filePath);
    if (await fileExists(fullPath)) {
      found.push(filePath);
    } else {
      missing.push(filePath);
    }
  }

  return {
    complete: missing.length === 0,
    missing,
    found
  };
}

module.exports = {
  getCurrentPhase,
  setPhase,
  getNextPhase,
  validatePhaseTransition,
  getPhaseDeliverables,
  checkDeliverables
};
