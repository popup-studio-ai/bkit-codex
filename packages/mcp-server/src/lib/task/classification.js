'use strict';

const THRESHOLDS = {
  quick_fix: 10,
  minor_change: 50,
  feature: 200
};

const LABELS = {
  quick_fix: 'Quick Fix',
  minor_change: 'Minor Change',
  feature: 'Feature',
  major_feature: 'Major Feature'
};

/**
 * Classify task by estimated lines of code.
 * @param {number} lines
 * @returns {string} Classification key
 */
function classifyByLines(lines) {
  if (typeof lines !== 'number' || lines < 0) return 'quick_fix';
  if (lines < THRESHOLDS.quick_fix) return 'quick_fix';
  if (lines < THRESHOLDS.minor_change) return 'minor_change';
  if (lines < THRESHOLDS.feature) return 'feature';
  return 'major_feature';
}

/**
 * Classify task by description keywords.
 * @param {string} desc
 * @returns {string} Classification key
 */
function classifyByDescription(desc) {
  if (!desc || typeof desc !== 'string') return 'minor_change';

  const lower = desc.toLowerCase();

  // Major feature indicators
  const majorIndicators = ['refactor', 'rewrite', 'migration', 'overhaul', 'redesign', 'architecture'];
  for (const indicator of majorIndicators) {
    if (lower.includes(indicator)) return 'major_feature';
  }

  // Feature indicators
  const featureIndicators = ['implement', 'feature', 'add new', 'create', 'build', 'develop'];
  for (const indicator of featureIndicators) {
    if (lower.includes(indicator)) return 'feature';
  }

  // Quick fix indicators
  const quickFixIndicators = ['typo', 'fix typo', 'rename', 'comment', 'formatting', 'lint'];
  for (const indicator of quickFixIndicators) {
    if (lower.includes(indicator)) return 'quick_fix';
  }

  // Minor change indicators
  const minorIndicators = ['fix', 'bug', 'update', 'change', 'modify', 'adjust', 'tweak'];
  for (const indicator of minorIndicators) {
    if (lower.includes(indicator)) return 'minor_change';
  }

  return 'minor_change';
}

/**
 * Get human-readable label for a classification.
 * @param {string} classification
 * @returns {string}
 */
function getClassificationLabel(classification) {
  return LABELS[classification] || 'Unknown';
}

/**
 * Get the classification thresholds.
 * @returns {object}
 */
function getClassificationThresholds() {
  return { ...THRESHOLDS };
}

module.exports = {
  classifyByLines,
  classifyByDescription,
  getClassificationLabel,
  getClassificationThresholds
};
