'use strict';

const path = require('path');
const { fileExists } = require('../core/file');
const fs = require('fs');

const ENTERPRISE_DIRS = ['kubernetes', 'terraform', 'k8s', 'infra'];
const DYNAMIC_DIRS = ['lib/bkend', 'supabase', 'api', 'backend'];
const DYNAMIC_FILES = ['.mcp.json', 'docker-compose.yml'];
const DYNAMIC_PACKAGE_PATTERNS = ['bkend', '@supabase', 'firebase'];

/**
 * Detect project level based on directory structure and config files.
 * @param {string} projectDir - Absolute path to project root
 * @returns {Promise<{ level: string, evidence: string[], confidence: string }>}
 */
async function detectLevel(projectDir) {
  const evidence = [];

  // Check Enterprise indicators
  for (const dir of ENTERPRISE_DIRS) {
    const dirPath = path.join(projectDir, dir);
    if (await fileExists(dirPath)) {
      evidence.push(`Found ${dir}/ directory`);
    }
  }

  if (evidence.length > 0) {
    return {
      level: 'Enterprise',
      evidence,
      confidence: evidence.length >= 2 ? 'high' : 'medium'
    };
  }

  // Check Dynamic indicators
  for (const dir of DYNAMIC_DIRS) {
    const dirPath = path.join(projectDir, dir);
    if (await fileExists(dirPath)) {
      evidence.push(`Found ${dir}/ directory`);
    }
  }

  for (const file of DYNAMIC_FILES) {
    const filePath = path.join(projectDir, file);
    if (await fileExists(filePath)) {
      evidence.push(`Found ${file}`);
    }
  }

  // Check package.json for BaaS patterns
  const pkgPath = path.join(projectDir, 'package.json');
  if (await fileExists(pkgPath)) {
    try {
      const content = fs.readFileSync(pkgPath, 'utf-8');
      for (const pattern of DYNAMIC_PACKAGE_PATTERNS) {
        if (content.includes(pattern)) {
          evidence.push(`Found '${pattern}' in package.json`);
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  if (evidence.length > 0) {
    return {
      level: 'Dynamic',
      evidence,
      confidence: evidence.length >= 2 ? 'high' : 'medium'
    };
  }

  // Default: Starter
  return {
    level: 'Starter',
    evidence: ['No enterprise or dynamic indicators found'],
    confidence: 'high'
  };
}

/**
 * Get config for a specific level.
 * @param {string} level - 'Starter', 'Dynamic', or 'Enterprise'
 * @returns {object}
 */
function getLevelConfig(level) {
  const configs = {
    Starter: {
      skill: '$starter',
      pipelinePhases: [1, 2, 3, 6, 9],
      description: 'Static web development for beginners',
      skipPhases: [4, 5, 7, 8]
    },
    Dynamic: {
      skill: '$dynamic',
      pipelinePhases: [1, 2, 3, 4, 5, 6, 7, 9],
      description: 'Fullstack development with BaaS',
      skipPhases: [8]
    },
    Enterprise: {
      skill: '$enterprise',
      pipelinePhases: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      description: 'Enterprise-grade microservices',
      skipPhases: []
    }
  };
  return configs[level] || configs.Starter;
}

/**
 * Check if project matches a specific level.
 * @param {string} projectDir
 * @param {string} level - Level to check against
 * @returns {Promise<boolean>}
 */
async function isLevelMatch(projectDir, level) {
  const detected = await detectLevel(projectDir);
  return detected.level === level;
}

module.exports = {
  detectLevel,
  getLevelConfig,
  isLevelMatch
};
