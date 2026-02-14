'use strict';

const path = require('path');
const { checkDesignExists, checkPlanExists, classifyTask } = require('../lib/pdca/automation');
const { readPdcaStatus } = require('../lib/pdca/status');
const { getConfig } = require('../lib/core/config');

/**
 * bkit_pre_write_check - Pre-write PDCA compliance check.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const filePath = args.filePath;
  if (!filePath) {
    return { error: 'filePath is required' };
  }

  // Extract feature name from path or args
  let feature = args.feature;
  if (!feature) {
    feature = extractFeatureName(filePath, projectDir);
  }

  // Check for design and plan documents
  const hasDesign = feature ? await checkDesignExists(projectDir, feature) : false;
  const hasPlan = feature ? await checkPlanExists(projectDir, feature) : false;

  // Get PDCA status for the feature
  const status = await readPdcaStatus(projectDir);
  const featureStatus = feature ? status.features[feature] : null;

  // Task classification (estimate based on context)
  const classification = classifyTask(args.estimatedLines || 50);

  // Get naming conventions
  const conventions = getConfig('conventions.naming');
  const conventionHints = [];
  if (conventions) {
    if (conventions.components) conventionHints.push(`Components: ${conventions.components}`);
    if (conventions.functions) conventionHints.push(`Functions: ${conventions.functions}`);
    if (conventions.files) conventionHints.push(`Files: ${conventions.files}`);
    if (conventions.constants) conventionHints.push(`Constants: ${conventions.constants}`);
  }

  // Build guidance
  let guidance = '';
  if (hasDesign) {
    guidance = `Design document exists. Reference: docs/02-design/features/${feature}.design.md`;
  } else if (hasPlan && !hasDesign) {
    guidance = `Plan exists but no design document. Consider creating design first: $pdca design ${feature}`;
  } else if (!hasPlan && !hasDesign && feature) {
    guidance = `No plan or design documents found for '${feature}'. Consider: $pdca plan ${feature}`;
  } else {
    guidance = 'No feature detected from file path. Proceed with caution.';
  }

  if (classification.pdcaRequired && !hasDesign) {
    guidance += ' Warning: Task classified as requiring PDCA but no design document exists.';
  }

  return {
    allowed: true,
    feature: feature || null,
    hasDesign,
    hasPlan,
    designPath: hasDesign ? `docs/02-design/features/${feature}.design.md` : null,
    planPath: hasPlan ? `docs/01-plan/features/${feature}.plan.md` : null,
    guidance,
    taskClassification: classification.classification,
    pdcaRequired: classification.pdcaRequired,
    conventionHints
  };
}

/**
 * Extract feature name from a file path.
 * Looks at directory names or common path patterns.
 */
function extractFeatureName(filePath, projectDir) {
  const relative = path.relative(projectDir, filePath);
  const parts = relative.split(path.sep);

  // Skip common directories
  const skip = ['src', 'lib', 'app', 'components', 'pages', 'api', 'utils', 'hooks', 'styles', 'public', 'assets'];

  for (const part of parts) {
    if (!skip.includes(part) && !part.startsWith('.') && !part.includes('.')) {
      return part;
    }
  }

  // Try extracting from filename
  const basename = path.basename(filePath, path.extname(filePath));
  if (basename && !skip.includes(basename)) {
    return basename;
  }

  return null;
}

const definition = {
  name: 'bkit_pre_write_check',
  description: 'Check PDCA compliance before writing/editing source code. Returns whether design documents exist and provides guidance.',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path of the file being written or edited'
      },
      feature: {
        type: 'string',
        description: 'Feature name if known (auto-detected from path if omitted)'
      },
      estimatedLines: {
        type: 'number',
        description: 'Estimated lines of code to be changed'
      }
    },
    required: ['filePath']
  }
};

module.exports = { handler, definition };
