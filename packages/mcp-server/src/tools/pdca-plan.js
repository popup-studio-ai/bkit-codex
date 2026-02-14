'use strict';

const { selectTemplate, getTemplateContent, resolveTemplateVariables } = require('../lib/pdca/template');
const { addFeature } = require('../lib/pdca/status');
const { detectLevel } = require('../lib/pdca/level');

/**
 * bkit_pdca_plan - Generate plan document template.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const feature = args.feature;
  if (!feature) return { error: 'feature is required' };

  // Detect or use provided level
  let level = args.level;
  if (!level) {
    const detected = await detectLevel(projectDir);
    level = detected.level;
  }

  // Select and resolve template
  const templateName = selectTemplate('plan', level);
  const templateContent = getTemplateContent(templateName);
  const resolved = resolveTemplateVariables(templateContent, {
    FEATURE: feature,
    DATE: new Date().toISOString().split('T')[0],
    LEVEL: level
  });

  // Register feature in PDCA status
  await addFeature(projectDir, feature, 'plan');

  const outputPath = `docs/01-plan/features/${feature}.plan.md`;

  return {
    template: resolved,
    outputPath,
    phase: 'plan',
    level,
    guidance: `Fill in the template sections. When complete, call bkit_complete_phase('${feature}', 'plan').`
  };
}

const definition = {
  name: 'bkit_pdca_plan',
  description: 'Generate a plan document template for a feature. Returns template content to write to docs/01-plan/features/{feature}.plan.md',
  inputSchema: {
    type: 'object',
    properties: {
      feature: {
        type: 'string',
        description: 'Feature name in kebab-case'
      },
      level: {
        type: 'string',
        enum: ['Starter', 'Dynamic', 'Enterprise'],
        description: 'Project level for template selection (auto-detected if omitted)'
      }
    },
    required: ['feature']
  }
};

module.exports = { handler, definition };
