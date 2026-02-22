'use strict';

const { setFeaturePhase, readPdcaStatus, writePdcaStatus, addFeature, updateTaskChain } = require('../lib/pdca/status');
const { getNextPhase, validatePhaseTransition } = require('../lib/pdca/phase');
const { formatPdcaProgress } = require('../lib/pdca/automation');
const { invalidateCache } = require('../lib/core/cache');

/**
 * bkit_complete_phase - Mark a PDCA phase as complete.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const { feature, phase } = args;
  if (!feature) return { error: 'feature is required' };
  if (!phase) return { error: 'phase is required' };

  const validPhases = ['plan', 'design', 'do', 'check', 'act', 'report'];
  if (!validPhases.includes(phase)) {
    return { error: `Invalid phase '${phase}'. Must be one of: ${validPhases.join(', ')}` };
  }

  // Read current status
  let status = await readPdcaStatus(projectDir);

  // If feature doesn't exist, create it
  if (!status.features[feature]) {
    status = await addFeature(projectDir, feature, phase);
  }

  const currentPhase = status.features[feature].phase;
  const nextPhase = getNextPhase(phase);

  // Validate transition if current phase differs
  if (currentPhase !== phase) {
    const validation = validatePhaseTransition(currentPhase, phase);
    if (!validation.valid) {
      return {
        error: `Cannot complete phase '${phase}': ${validation.reason}`,
        currentPhase,
        suggestion: `Current phase is '${currentPhase}'. Complete it first.`
      };
    }
  }

  // Update to next phase
  if (nextPhase) {
    status = await setFeaturePhase(projectDir, feature, nextPhase);
  } else {
    // Report is the final phase - mark as archived
    status.features[feature].phase = 'completed';
    status.features[feature].completedAt = new Date().toISOString();
    await writePdcaStatus(projectDir, status);
  }

  // Add history entry
  status.history.push({
    feature,
    action: 'phase_complete',
    phase,
    nextPhase: nextPhase || 'completed',
    timestamp: new Date().toISOString()
  });
  await writePdcaStatus(projectDir, status);

  // Invalidate cache
  invalidateCache(`status:${feature}`);
  invalidateCache('status:all');

  const updatedFeature = status.features[feature];
  const progress = formatPdcaProgress(updatedFeature);

  let recommendation = '';
  if (nextPhase) {
    const phaseActions = {
      design: `Create design document: $pdca design ${feature}`,
      do: `Start implementation. Reference design at docs/02-design/features/${feature}.design.md`,
      check: `Run gap analysis: $pdca analyze ${feature}`,
      act: `Fix identified gaps and iterate`,
      report: `Generate completion report: $pdca report ${feature}`
    };
    recommendation = phaseActions[nextPhase] || `Proceed to ${nextPhase} phase`;
  } else {
    recommendation = `PDCA cycle complete for '${feature}'. Consider archiving: $pdca archive ${feature}`;
  }

  // Update task chain status (C-4)
  const updatedChain = await updateTaskChain(projectDir, feature, phase);
  if (updatedChain) {
    const activeTask = updatedChain.find(t => t.status === 'active');
    if (activeTask) {
      recommendation += ` Next task in chain: ${activeTask.phase.toUpperCase()}.`;
    }
  }

  return {
    completed: phase,
    nextPhase: nextPhase || 'completed',
    feature,
    recommendation,
    progress,
    taskChain: updatedChain || null
  };
}

const definition = {
  name: 'bkit_complete_phase',
  description: 'Mark a PDCA phase as complete. Updates .pdca-status.json and returns next phase recommendation.',
  inputSchema: {
    type: 'object',
    properties: {
      feature: {
        type: 'string',
        description: 'Feature name'
      },
      phase: {
        type: 'string',
        enum: ['plan', 'design', 'do', 'check', 'act', 'report'],
        description: 'Phase being completed'
      }
    },
    required: ['feature', 'phase']
  }
};

module.exports = { handler, definition };
