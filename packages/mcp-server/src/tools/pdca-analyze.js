'use strict';

const { checkDesignExists } = require('../lib/pdca/automation');
const { readPdcaStatus, writePdcaStatus } = require('../lib/pdca/status');
const { selectTemplate, getTemplateContent, resolveTemplateVariables } = require('../lib/pdca/template');
const { detectLevel } = require('../lib/pdca/level');

/**
 * bkit_pdca_analyze - Gap analysis guidance.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const feature = args.feature;
  if (!feature) return { error: 'feature is required' };

  // Check design document exists
  const hasDesign = await checkDesignExists(projectDir, feature);
  if (!hasDesign) {
    return {
      error: `Design document not found for '${feature}'.`,
      guidance: `Create design first: $pdca design ${feature}`,
      designPath: `docs/02-design/features/${feature}.design.md`
    };
  }

  // Get level
  const detected = await detectLevel(projectDir);
  const level = detected.level;

  // Get analysis template
  const templateName = selectTemplate('analysis', level);
  const templateContent = getTemplateContent(templateName);
  const resolved = resolveTemplateVariables(templateContent, {
    FEATURE: feature,
    DATE: new Date().toISOString().split('T')[0],
    LEVEL: level
  });

  // Update status to check phase
  const status = await readPdcaStatus(projectDir);
  if (status.features[feature]) {
    status.features[feature].phase = 'check';
    if (typeof status.features[feature].iterationCount !== 'number') {
      status.features[feature].iterationCount = 0;
    }
    status.features[feature].iterationCount++;
    await writePdcaStatus(projectDir, status);
  }

  const designPath = `docs/02-design/features/${feature}.design.md`;
  const analysisPath = `docs/03-analysis/${feature}.analysis.md`;

  return {
    feature,
    designPath,
    analysisPath,
    matchRate: status.features[feature] ? status.features[feature].matchRate : null,
    iterationCount: status.features[feature] ? status.features[feature].iterationCount : 1,
    guidance: `Read the design document at ${designPath} and compare with implementation code. Write analysis results to ${analysisPath}. Calculate match rate based on: implemented items / total design items * 100. If match rate >= 90%, suggest report. If < 90%, suggest iterate.`,
    template: resolved,
    nextAction: {
      ifAbove90: `$pdca report ${feature}`,
      ifBelow90: `Fix gaps and re-run: $pdca analyze ${feature}`
    }
  };
}

const definition = {
  name: 'bkit_pdca_analyze',
  description: 'Analyze gaps between design document and implementation code. Returns match rate guidance and gap analysis template.',
  inputSchema: {
    type: 'object',
    properties: {
      feature: {
        type: 'string',
        description: 'Feature name to analyze'
      }
    },
    required: ['feature']
  }
};

module.exports = { handler, definition };
