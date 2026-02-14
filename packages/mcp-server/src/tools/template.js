'use strict';

const { selectTemplate, getTemplateContent, resolveTemplateVariables, getTemplateList } = require('../lib/pdca/template');
const { detectLevel } = require('../lib/pdca/level');

/**
 * bkit_select_template - Template selection for PDCA documents.
 */
async function handler(args, context) {
  const phase = args.phase;
  if (!phase) return { error: 'phase is required' };

  const validPhases = ['plan', 'design', 'analysis', 'report', 'do'];
  if (!validPhases.includes(phase)) {
    return { error: `Invalid phase '${phase}'. Must be one of: ${validPhases.join(', ')}` };
  }

  // Detect or use provided level
  let level = args.level;
  if (!level) {
    const projectDir = context.projectDir;
    if (projectDir) {
      const detected = await detectLevel(projectDir);
      level = detected.level;
    } else {
      level = 'Dynamic';
    }
  }

  const templateName = selectTemplate(phase, level);
  const templateContent = getTemplateContent(templateName);
  const allTemplates = getTemplateList();

  return {
    phase,
    level,
    templateName,
    template: templateContent,
    availableTemplates: allTemplates,
    guidance: `Use this template for the ${phase} phase. Replace \${FEATURE}, \${DATE}, and \${LEVEL} placeholders.`
  };
}

const definition = {
  name: 'bkit_select_template',
  description: 'Select appropriate PDCA template based on phase and project level.',
  inputSchema: {
    type: 'object',
    properties: {
      phase: {
        type: 'string',
        enum: ['plan', 'design', 'analysis', 'report', 'do'],
        description: 'PDCA phase'
      },
      level: {
        type: 'string',
        enum: ['Starter', 'Dynamic', 'Enterprise'],
        description: 'Project level (auto-detected if omitted)'
      }
    },
    required: ['phase']
  }
};

module.exports = { handler, definition };
