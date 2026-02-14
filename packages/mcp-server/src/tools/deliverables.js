'use strict';

const { checkDeliverables, getPhaseDeliverables } = require('../lib/pdca/phase');
const { readPdcaStatus } = require('../lib/pdca/status');

// Pipeline phase deliverables (1-9 phases)
const PIPELINE_DELIVERABLES = {
  1: {
    name: 'Schema & Terminology',
    files: ['docs/schema.md', 'docs/terminology.md'],
    description: 'Data model definitions and domain terminology'
  },
  2: {
    name: 'Convention',
    files: ['docs/convention.md', '.eslintrc', '.prettierrc'],
    description: 'Coding conventions and style rules'
  },
  3: {
    name: 'Mockup',
    files: ['docs/mockup/'],
    description: 'UI/UX mockups and wireframes'
  },
  4: {
    name: 'API',
    files: ['docs/api.md'],
    description: 'API specification and endpoint definitions'
  },
  5: {
    name: 'Design System',
    files: ['src/components/', 'docs/design-system.md'],
    description: 'Component library and design tokens'
  },
  6: {
    name: 'UI Integration',
    files: ['src/pages/', 'src/app/'],
    description: 'Frontend-backend integration'
  },
  7: {
    name: 'SEO & Security',
    files: ['docs/security.md'],
    description: 'SEO optimization and security hardening'
  },
  8: {
    name: 'Review',
    files: ['docs/review.md'],
    description: 'Code review and architecture review results'
  },
  9: {
    name: 'Deployment',
    files: ['docs/deployment.md', '.github/workflows/'],
    description: 'CI/CD pipeline and deployment configuration'
  }
};

/**
 * bkit_check_deliverables - Check pipeline phase deliverables.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const phase = args.phase;
  if (!phase || typeof phase !== 'number' || phase < 1 || phase > 9) {
    return { error: 'phase must be a number between 1 and 9' };
  }

  const feature = args.feature;
  const pipelineDeliverables = PIPELINE_DELIVERABLES[phase];

  // Check pipeline phase files
  const { fileExists } = require('../lib/core/file');
  const path = require('path');
  const found = [];
  const missing = [];

  for (const file of pipelineDeliverables.files) {
    const fullPath = path.join(projectDir, file);
    if (await fileExists(fullPath)) {
      found.push(file);
    } else {
      missing.push(file);
    }
  }

  // Also check PDCA deliverables if feature is provided
  let pdcaDeliverables = null;
  if (feature) {
    const pdcaPhaseMap = { 1: 'plan', 2: 'plan', 3: 'design', 4: 'design', 5: 'do', 6: 'do', 7: 'check', 8: 'check', 9: 'report' };
    const pdcaPhase = pdcaPhaseMap[phase];
    if (pdcaPhase) {
      pdcaDeliverables = await checkDeliverables(projectDir, feature, pdcaPhase);
    }
  }

  const complete = missing.length === 0;
  const completionRate = pipelineDeliverables.files.length > 0
    ? Math.round((found.length / pipelineDeliverables.files.length) * 100)
    : 100;

  return {
    phase,
    phaseName: pipelineDeliverables.name,
    description: pipelineDeliverables.description,
    complete,
    completionRate,
    found,
    missing,
    pdcaDeliverables,
    guidance: complete
      ? `Phase ${phase} deliverables are complete. Proceed to next phase.`
      : `Missing deliverables: ${missing.join(', ')}. Create these before proceeding.`
  };
}

const definition = {
  name: 'bkit_check_deliverables',
  description: 'Check if required deliverables for a pipeline phase are complete.',
  inputSchema: {
    type: 'object',
    properties: {
      phase: {
        type: 'number',
        minimum: 1,
        maximum: 9,
        description: 'Pipeline phase number (1-9)'
      },
      feature: {
        type: 'string',
        description: 'Feature name'
      }
    },
    required: ['phase']
  }
};

module.exports = { handler, definition };
