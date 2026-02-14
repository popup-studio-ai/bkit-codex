'use strict';

const { readPdcaStatus, getFeatureStatus } = require('../lib/pdca/status');
const { formatPdcaProgress, suggestNextAction, checkDesignExists, checkPlanExists } = require('../lib/pdca/automation');
const { getCache, setCache } = require('../lib/core/cache');

/**
 * bkit_get_status - Get current PDCA status.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const feature = args.feature;

  if (feature) {
    // Return specific feature status
    const cacheKey = `status:${feature}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const featureStatus = await getFeatureStatus(projectDir, feature);
    if (!featureStatus) {
      return {
        feature,
        error: `Feature '${feature}' not found in PDCA status.`,
        suggestion: `Start tracking with: $pdca plan ${feature}`
      };
    }

    const hasPlan = await checkPlanExists(projectDir, feature);
    const hasDesign = await checkDesignExists(projectDir, feature);
    const progress = formatPdcaProgress(featureStatus);
    const nextAction = await suggestNextAction(projectDir, feature);

    const result = {
      feature,
      phase: featureStatus.phase,
      matchRate: featureStatus.matchRate,
      iterationCount: featureStatus.iterationCount || 0,
      documents: {
        plan: hasPlan ? `docs/01-plan/features/${feature}.plan.md` : null,
        design: hasDesign ? `docs/02-design/features/${feature}.design.md` : null
      },
      progress,
      nextAction: nextAction.action,
      nextCommand: nextAction.command
    };

    setCache(cacheKey, result, 5000);
    return result;
  }

  // Return all active features
  const cached = getCache('status:all');
  if (cached) return cached;

  const status = await readPdcaStatus(projectDir);
  const features = {};

  for (const f of status.activeFeatures) {
    const fs = status.features[f];
    if (fs) {
      features[f] = {
        phase: fs.phase,
        matchRate: fs.matchRate,
        progress: formatPdcaProgress(fs)
      };
    }
  }

  const result = {
    activeFeatures: status.activeFeatures,
    primaryFeature: status.primaryFeature,
    features,
    pipelineLevel: status.pipeline.level,
    pipelinePhase: status.pipeline.currentPhase
  };

  setCache('status:all', result, 5000);
  return result;
}

const definition = {
  name: 'bkit_get_status',
  description: 'Get current PDCA status for the project or a specific feature. Returns phase, match rate, and recommendations.',
  inputSchema: {
    type: 'object',
    properties: {
      feature: {
        type: 'string',
        description: 'Feature name. If omitted, returns all active features.'
      }
    }
  }
};

module.exports = { handler, definition };
