'use strict';

const path = require('path');
const { readJsonFile, writeJsonFile, fileExists } = require('../core/file');

const STATUS_FILE = 'docs/.pdca-status.json';

function getDefaultStatus() {
  return {
    version: '2.0',
    lastUpdated: new Date().toISOString(),
    activeFeatures: [],
    primaryFeature: null,
    features: {},
    pipeline: {
      currentPhase: 1,
      level: 'Starter',
      phaseHistory: []
    },
    session: {
      startedAt: new Date().toISOString(),
      onboardingCompleted: false,
      lastActivity: new Date().toISOString()
    },
    history: []
  };
}

/**
 * Read PDCA status from project.
 * @param {string} projectDir
 * @returns {Promise<object>}
 */
async function readPdcaStatus(projectDir) {
  const statusPath = path.join(projectDir, STATUS_FILE);
  if (await fileExists(statusPath)) {
    try {
      return await readJsonFile(statusPath);
    } catch (err) {
      console.error(`[bkit] Failed to read PDCA status: ${err.message}`);
    }
  }
  return getDefaultStatus();
}

/**
 * Write PDCA status to project.
 * @param {string} projectDir
 * @param {object} status
 */
async function writePdcaStatus(projectDir, status) {
  const statusPath = path.join(projectDir, STATUS_FILE);
  status.lastUpdated = new Date().toISOString();
  status.session.lastActivity = new Date().toISOString();
  await writeJsonFile(statusPath, status);
}

/**
 * Get status for a specific feature.
 * @param {string} projectDir
 * @param {string} feature
 * @returns {Promise<object|null>}
 */
async function getFeatureStatus(projectDir, feature) {
  const status = await readPdcaStatus(projectDir);
  return status.features[feature] || null;
}

/**
 * Set the phase for a feature. Creates the feature if it doesn't exist.
 * @param {string} projectDir
 * @param {string} feature
 * @param {string} phase
 * @returns {Promise<object>} Updated status
 */
async function setFeaturePhase(projectDir, feature, phase) {
  const status = await readPdcaStatus(projectDir);

  if (!status.features[feature]) {
    status.features[feature] = {
      phase,
      matchRate: null,
      iterationCount: 0,
      documents: {}
    };
    if (!status.activeFeatures.includes(feature)) {
      status.activeFeatures.push(feature);
    }
  } else {
    const prev = status.features[feature].phase;
    status.features[feature].phase = phase;
    status.history.push({
      feature,
      from: prev,
      to: phase,
      timestamp: new Date().toISOString()
    });
  }

  if (!status.primaryFeature) {
    status.primaryFeature = feature;
  }

  await writePdcaStatus(projectDir, status);
  return status;
}

/**
 * Add a new feature with initial phase.
 * @param {string} projectDir
 * @param {string} feature
 * @param {string} [initialPhase='plan']
 * @returns {Promise<object>} Updated status
 */
async function addFeature(projectDir, feature, initialPhase = 'plan') {
  const status = await readPdcaStatus(projectDir);

  if (status.features[feature]) {
    return status;
  }

  status.features[feature] = {
    phase: initialPhase,
    matchRate: null,
    iterationCount: 0,
    documents: {}
  };

  if (!status.activeFeatures.includes(feature)) {
    status.activeFeatures.push(feature);
  }

  if (!status.primaryFeature) {
    status.primaryFeature = feature;
  }

  await writePdcaStatus(projectDir, status);
  return status;
}

/**
 * Remove a feature (archive it).
 * @param {string} projectDir
 * @param {string} feature
 * @returns {Promise<object>} Updated status
 */
async function removeFeature(projectDir, feature) {
  const status = await readPdcaStatus(projectDir);

  status.activeFeatures = status.activeFeatures.filter(f => f !== feature);

  if (status.primaryFeature === feature) {
    status.primaryFeature = status.activeFeatures[0] || null;
  }

  if (status.features[feature]) {
    status.features[feature].archived = true;
    status.features[feature].archivedAt = new Date().toISOString();
  }

  await writePdcaStatus(projectDir, status);
  return status;
}

/**
 * Get list of active (non-archived) features.
 * @param {string} projectDir
 * @returns {Promise<string[]>}
 */
async function getActiveFeatures(projectDir) {
  const status = await readPdcaStatus(projectDir);
  return status.activeFeatures || [];
}

/**
 * Get the primary (current) feature.
 * @param {string} projectDir
 * @returns {Promise<string|null>}
 */
async function getPrimaryFeature(projectDir) {
  const status = await readPdcaStatus(projectDir);
  return status.primaryFeature || null;
}

/**
 * Set the primary feature.
 * @param {string} projectDir
 * @param {string} feature
 * @returns {Promise<object>} Updated status
 */
async function setPrimaryFeature(projectDir, feature) {
  const status = await readPdcaStatus(projectDir);
  if (!status.activeFeatures.includes(feature)) {
    throw new Error(`Feature '${feature}' is not active`);
  }
  status.primaryFeature = feature;
  await writePdcaStatus(projectDir, status);
  return status;
}

/**
 * Get archived features.
 * @param {string} projectDir
 * @returns {Promise<string[]>}
 */
async function getArchivedFeatures(projectDir) {
  const status = await readPdcaStatus(projectDir);
  return Object.keys(status.features).filter(
    f => status.features[f].archived === true
  );
}

module.exports = {
  readPdcaStatus,
  writePdcaStatus,
  getFeatureStatus,
  setFeaturePhase,
  addFeature,
  removeFeature,
  getActiveFeatures,
  getPrimaryFeature,
  setPrimaryFeature,
  getArchivedFeatures
};
