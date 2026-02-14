'use strict';

const path = require('path');

/**
 * Resolve a relative path against the project directory.
 * @param {string} projectDir - Absolute project root path
 * @param {string} relativePath - Relative path
 * @returns {string} Absolute resolved path
 */
function resolveProjectPath(projectDir, relativePath) {
  return path.resolve(projectDir, relativePath);
}

/**
 * Get the docs directory path for a project.
 * @param {string} projectDir
 * @returns {string}
 */
function getDocsPath(projectDir) {
  return path.join(projectDir, 'docs');
}

/**
 * Get the path for a specific feature and PDCA phase document.
 * @param {string} projectDir
 * @param {string} feature - Feature name (kebab-case)
 * @param {string} phase - PDCA phase: plan, design, analysis, report
 * @returns {string}
 */
function getFeaturePath(projectDir, feature, phase) {
  const phaseMap = {
    plan: '01-plan',
    design: '02-design',
    analysis: '03-analysis',
    report: '04-report'
  };
  const phaseDir = phaseMap[phase];
  if (!phaseDir) {
    return path.join(projectDir, 'docs', feature);
  }
  if (phase === 'analysis' || phase === 'report') {
    return path.join(projectDir, 'docs', phaseDir, `${feature}.${phase}.md`);
  }
  return path.join(projectDir, 'docs', phaseDir, 'features', `${feature}.${phase}.md`);
}

/**
 * Get relative path from one absolute path to another.
 * @param {string} from - Source absolute path
 * @param {string} to - Target absolute path
 * @returns {string}
 */
function getRelativePath(from, to) {
  return path.relative(path.dirname(from), to);
}

module.exports = {
  resolveProjectPath,
  getDocsPath,
  getFeaturePath,
  getRelativePath
};
