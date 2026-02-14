'use strict';

const path = require('path');
const { fileExists } = require('../core/file');
const { readPdcaStatus } = require('./status');
const { getNextPhase } = require('./phase');

/**
 * Classify task by estimated lines of code.
 * @param {number} estimatedLines
 * @returns {{ classification: string, pdcaRequired: boolean, pdcaRecommended: boolean }}
 */
function classifyTask(estimatedLines) {
  if (estimatedLines < 10) {
    return { classification: 'quick_fix', pdcaRequired: false, pdcaRecommended: false };
  }
  if (estimatedLines < 50) {
    return { classification: 'minor_change', pdcaRequired: false, pdcaRecommended: true };
  }
  if (estimatedLines < 200) {
    return { classification: 'feature', pdcaRequired: true, pdcaRecommended: true };
  }
  return { classification: 'major_feature', pdcaRequired: true, pdcaRecommended: true };
}

/**
 * Determine if PDCA should be applied based on classification.
 * @param {{ classification: string }} classification
 * @returns {boolean}
 */
function shouldApplyPdca(classification) {
  return classification.pdcaRequired || classification.pdcaRecommended;
}

/**
 * Check if a design document exists for a feature.
 * @param {string} projectDir
 * @param {string} feature
 * @returns {Promise<boolean>}
 */
async function checkDesignExists(projectDir, feature) {
  const designPath = path.join(projectDir, 'docs', '02-design', 'features', `${feature}.design.md`);
  return fileExists(designPath);
}

/**
 * Check if a plan document exists for a feature.
 * @param {string} projectDir
 * @param {string} feature
 * @returns {Promise<boolean>}
 */
async function checkPlanExists(projectDir, feature) {
  const planPath = path.join(projectDir, 'docs', '01-plan', 'features', `${feature}.plan.md`);
  return fileExists(planPath);
}

/**
 * Suggest the next action based on current PDCA state.
 * @param {string} projectDir
 * @param {string} feature
 * @returns {Promise<{ action: string, command: string, reason: string }>}
 */
async function suggestNextAction(projectDir, feature) {
  const status = await readPdcaStatus(projectDir);
  const featureStatus = status.features[feature];

  if (!featureStatus) {
    return {
      action: 'Create plan document',
      command: '$pdca plan ' + feature,
      reason: 'No PDCA tracking found for this feature. Start with planning.'
    };
  }

  const currentPhase = featureStatus.phase;
  const hasPlan = await checkPlanExists(projectDir, feature);
  const hasDesign = await checkDesignExists(projectDir, feature);

  if (currentPhase === 'plan' && !hasPlan) {
    return {
      action: 'Create plan document',
      command: '$pdca plan ' + feature,
      reason: 'Plan phase active but no plan document found.'
    };
  }

  if (currentPhase === 'plan' && hasPlan) {
    return {
      action: 'Complete plan phase and start design',
      command: '$pdca design ' + feature,
      reason: 'Plan document exists. Proceed to design phase.'
    };
  }

  if (currentPhase === 'design' && !hasDesign) {
    return {
      action: 'Create design document',
      command: '$pdca design ' + feature,
      reason: 'Design phase active but no design document found.'
    };
  }

  if (currentPhase === 'design' && hasDesign) {
    return {
      action: 'Complete design and start implementation',
      command: '$pdca do ' + feature,
      reason: 'Design document exists. Proceed to implementation.'
    };
  }

  if (currentPhase === 'do') {
    return {
      action: 'Run gap analysis',
      command: '$pdca analyze ' + feature,
      reason: 'Implementation phase. Run gap analysis when ready.'
    };
  }

  if (currentPhase === 'check') {
    const matchRate = featureStatus.matchRate;
    if (matchRate !== null && matchRate >= 90) {
      return {
        action: 'Generate report',
        command: '$pdca report ' + feature,
        reason: `Match rate ${matchRate}% meets threshold. Generate completion report.`
      };
    }
    return {
      action: 'Iterate to fix gaps',
      command: '$pdca iterate ' + feature,
      reason: matchRate !== null
        ? `Match rate ${matchRate}% below 90% threshold. Fix gaps and re-analyze.`
        : 'Complete gap analysis first.'
    };
  }

  if (currentPhase === 'act') {
    return {
      action: 'Re-run gap analysis',
      command: '$pdca analyze ' + feature,
      reason: 'After fixing gaps, re-run analysis to verify improvements.'
    };
  }

  if (currentPhase === 'report') {
    return {
      action: 'Archive feature',
      command: '$pdca archive ' + feature,
      reason: 'Report complete. Archive this PDCA cycle.'
    };
  }

  const nextPhase = getNextPhase(currentPhase);
  return {
    action: nextPhase ? `Proceed to ${nextPhase} phase` : 'PDCA cycle complete',
    command: nextPhase ? `$pdca ${nextPhase} ${feature}` : '$pdca status',
    reason: 'Follow the PDCA cycle.'
  };
}

/**
 * Format PDCA progress as a visual string.
 * @param {object} featureStatus - Feature status from .pdca-status.json
 * @returns {string}
 */
function formatPdcaProgress(featureStatus) {
  if (!featureStatus) return '[No PDCA tracking]';

  const phases = ['plan', 'design', 'do', 'check', 'act'];
  const currentPhase = featureStatus.phase;
  const phaseLabels = {
    plan: 'Plan',
    design: 'Design',
    do: 'Do',
    check: 'Check',
    act: 'Act'
  };

  const phaseOrder = ['plan', 'design', 'do', 'check', 'act'];
  const currentIdx = phaseOrder.indexOf(currentPhase);

  const parts = phases.map((phase, idx) => {
    const label = phaseLabels[phase];
    if (idx < currentIdx) return `[${label}]✅`;
    if (idx === currentIdx) return `[${label}]🔄`;
    return `[${label}]⏳`;
  });

  return parts.join(' → ');
}

/**
 * Generate PDCA guidance based on current state.
 * @param {string} projectDir
 * @param {string} feature
 * @returns {Promise<string>}
 */
async function generatePdcaGuidance(projectDir, feature) {
  const status = await readPdcaStatus(projectDir);
  const featureStatus = status.features[feature];

  if (!featureStatus) {
    return `Feature '${feature}' is not tracked. Start with: $pdca plan ${feature}`;
  }

  const phase = featureStatus.phase;
  const hasPlan = await checkPlanExists(projectDir, feature);
  const hasDesign = await checkDesignExists(projectDir, feature);

  const lines = [];
  lines.push(`Feature '${feature}' is in ${phase} phase.`);

  if (phase === 'plan') {
    lines.push(hasPlan
      ? 'Plan document exists. Complete the plan phase and proceed to design.'
      : 'Create a plan document to define goals, scope, and success criteria.');
  } else if (phase === 'design') {
    lines.push(hasDesign
      ? 'Design document exists. Complete the design phase and start implementation.'
      : 'Create a design document with architecture, data model, and API specifications.');
  } else if (phase === 'do') {
    lines.push('Reference the design document during implementation.');
    lines.push('Call bkit_pre_write_check before writing each file.');
  } else if (phase === 'check') {
    lines.push('Run gap analysis to compare design with implementation.');
  } else if (phase === 'act') {
    lines.push('Fix identified gaps and re-run analysis.');
    if (featureStatus.iterationCount > 0) {
      lines.push(`Iteration ${featureStatus.iterationCount} of max 5.`);
    }
  } else if (phase === 'report') {
    lines.push('Generate completion report with metrics and learnings.');
  }

  return lines.join(' ');
}

module.exports = {
  classifyTask,
  shouldApplyPdca,
  checkDesignExists,
  checkPlanExists,
  suggestNextAction,
  formatPdcaProgress,
  generatePdcaGuidance
};
