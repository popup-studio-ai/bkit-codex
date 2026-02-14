'use strict';

const { detectLevel, getLevelConfig } = require('../lib/pdca/level');

/**
 * bkit_detect_level - Project level detection.
 */
async function handler(args, context) {
  const projectDir = args.projectDir || context.projectDir;
  if (!projectDir) {
    return { error: 'projectDir is required. Provide it as argument or call bkit_init first.' };
  }

  const result = await detectLevel(projectDir);
  const config = getLevelConfig(result.level);

  return {
    level: result.level,
    evidence: result.evidence,
    confidence: result.confidence,
    recommendedSkill: config.skill,
    pipelinePhases: config.pipelinePhases,
    skipPhases: config.skipPhases,
    description: config.description
  };
}

const definition = {
  name: 'bkit_detect_level',
  description: 'Detect project level (Starter/Dynamic/Enterprise) based on directory structure and config files.',
  inputSchema: {
    type: 'object',
    properties: {
      projectDir: {
        type: 'string',
        description: 'Project root directory path'
      }
    },
    required: ['projectDir']
  }
};

module.exports = { handler, definition };
