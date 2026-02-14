'use strict';

const { classifyByLines, classifyByDescription, getClassificationLabel } = require('../lib/task/classification');
const { classifyTask } = require('../lib/pdca/automation');

/**
 * bkit_classify_task - Task size classification.
 */
async function handler(args) {
  const estimatedLines = args.estimatedLines;
  if (typeof estimatedLines !== 'number') {
    return { error: 'estimatedLines is required and must be a number' };
  }

  // Classify by lines
  const lineClassification = classifyByLines(estimatedLines);

  // Classify by description if provided
  let descClassification = null;
  if (args.description) {
    descClassification = classifyByDescription(args.description);
  }

  // Use the more conservative (larger) classification
  let finalClassification = lineClassification;
  if (descClassification) {
    const order = ['quick_fix', 'minor_change', 'feature', 'major_feature'];
    const lineIdx = order.indexOf(lineClassification);
    const descIdx = order.indexOf(descClassification);
    if (descIdx > lineIdx) {
      finalClassification = descClassification;
    }
  }

  const automation = classifyTask(estimatedLines);
  const label = getClassificationLabel(finalClassification);

  let recommendation = '';
  if (finalClassification === 'quick_fix') {
    recommendation = 'Quick fix. PDCA is optional. Proceed directly.';
  } else if (finalClassification === 'minor_change') {
    recommendation = 'Minor change. PDCA recommended but not required.';
  } else if (finalClassification === 'feature') {
    recommendation = 'Feature-level change. Create plan and design documents before implementation.';
  } else {
    recommendation = 'Major feature. Create plan and design documents. Consider splitting into smaller features.';
  }

  return {
    classification: finalClassification,
    label,
    estimatedLines,
    pdcaRequired: automation.pdcaRequired,
    pdcaRecommended: automation.pdcaRecommended,
    recommendation
  };
}

const definition = {
  name: 'bkit_classify_task',
  description: 'Classify task size based on estimated lines of code change.',
  inputSchema: {
    type: 'object',
    properties: {
      estimatedLines: {
        type: 'number',
        description: 'Estimated lines of code to be changed'
      },
      description: {
        type: 'string',
        description: 'Brief task description'
      }
    },
    required: ['estimatedLines']
  }
};

module.exports = { handler, definition };
