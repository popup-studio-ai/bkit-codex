'use strict';

const { readPdcaStatus, getFeatureStatus, getCompactSummary } = require('../lib/pdca/status');
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
  const mode = args.mode || 'normal';

  // Recovery mode: full state reconstruction (C-3)
  if (mode === 'recovery') {
    return handleRecoveryMode(projectDir);
  }

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

/**
 * Handle recovery mode: full state reconstruction after context compaction (C-3).
 */
async function handleRecoveryMode(projectDir) {
  const status = await readPdcaStatus(projectDir);
  const compactSummary = getCompactSummary(status);

  const primary = status.primaryFeature;
  const primaryStatus = primary ? status.features[primary] : null;

  const recoveryGuidance = [];
  if (primary && primaryStatus) {
    recoveryGuidance.push(`You are working on feature '${primary}' in ${primaryStatus.phase} phase.`);

    if (primaryStatus.documents) {
      for (const [docType, docPath] of Object.entries(primaryStatus.documents)) {
        if (docPath && typeof docPath === 'string') {
          recoveryGuidance.push(`${docType} document: ${docPath}`);
        }
      }
    }

    if (primaryStatus.matchRate !== null && primaryStatus.matchRate !== undefined) {
      recoveryGuidance.push(`Current match rate: ${primaryStatus.matchRate}%, iteration ${primaryStatus.iterationCount || 0} of 5.`);
    }

    const nextAction = await suggestNextAction(projectDir, primary);
    recoveryGuidance.push(`Next action: ${nextAction.reason}`);
  } else {
    recoveryGuidance.push('No active PDCA feature. Start with: $pdca plan <feature-name>');
  }

  return {
    recoveryMode: true,
    fullStatus: status,
    primaryFeature: primary ? {
      name: primary,
      phase: primaryStatus.phase,
      matchRate: primaryStatus.matchRate,
      iterationCount: primaryStatus.iterationCount || 0,
      taskChain: primaryStatus.taskChain || [],
      documents: primaryStatus.documents || {}
    } : null,
    recoveryGuidance,
    compactSummary
  };
}

const definition = {
  name: 'bkit_get_status',
  description: 'Get current PDCA status for the project or a specific feature. Returns phase, match rate, and recommendations. Use mode="recovery" after context compaction.',
  inputSchema: {
    type: 'object',
    properties: {
      feature: {
        type: 'string',
        description: 'Feature name. If omitted, returns all active features.'
      },
      mode: {
        type: 'string',
        enum: ['normal', 'recovery'],
        description: 'Use "recovery" after context compaction to get full state reconstruction.'
      }
    }
  }
};

module.exports = { handler, definition };
