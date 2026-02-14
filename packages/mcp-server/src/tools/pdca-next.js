'use strict';

const { readPdcaStatus } = require('../lib/pdca/status');
const { suggestNextAction, formatPdcaProgress } = require('../lib/pdca/automation');

/**
 * bkit_pdca_next - Next phase recommendation.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const feature = args.feature;
  if (!feature) return { error: 'feature is required' };

  const status = await readPdcaStatus(projectDir);
  const featureStatus = status.features[feature];

  if (!featureStatus) {
    return {
      feature,
      currentPhase: null,
      nextPhase: 'plan',
      recommendation: `Feature '${feature}' is not tracked. Start with planning.`,
      command: `$pdca plan ${feature}`,
      progress: '[No PDCA tracking]'
    };
  }

  const nextAction = await suggestNextAction(projectDir, feature);
  const progress = formatPdcaProgress(featureStatus);

  return {
    feature,
    currentPhase: featureStatus.phase,
    nextPhase: nextAction.action.includes('plan') ? 'plan'
      : nextAction.action.includes('design') ? 'design'
      : nextAction.action.includes('implementation') ? 'do'
      : nextAction.action.includes('gap analysis') ? 'check'
      : nextAction.action.includes('iterate') ? 'act'
      : nextAction.action.includes('report') ? 'report'
      : featureStatus.phase,
    recommendation: nextAction.reason,
    command: nextAction.command,
    progress,
    matchRate: featureStatus.matchRate,
    iterationCount: featureStatus.iterationCount || 0
  };
}

const definition = {
  name: 'bkit_pdca_next',
  description: 'Get recommendation for the next PDCA phase based on current status.',
  inputSchema: {
    type: 'object',
    properties: {
      feature: {
        type: 'string',
        description: 'Feature name'
      }
    },
    required: ['feature']
  }
};

module.exports = { handler, definition };
