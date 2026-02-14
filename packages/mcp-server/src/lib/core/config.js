'use strict';

const path = require('path');
const { readJsonFile, fileExists } = require('./file');

const DEFAULT_CONFIG = {
  version: '1.0.0',
  pdca: {
    matchRateThreshold: 90,
    maxIterations: 5,
    statusFile: 'docs/.pdca-status.json',
    memoryFile: 'docs/.bkit-memory.json'
  },
  taskClassification: {
    thresholds: {
      quickFix: 10,
      minorChange: 50,
      feature: 200
    }
  },
  levelDetection: {
    enterprise: {
      directories: ['kubernetes', 'terraform', 'k8s', 'infra']
    },
    dynamic: {
      directories: ['lib/bkend', 'supabase', 'api', 'backend'],
      files: ['.mcp.json', 'docker-compose.yml'],
      packagePatterns: ['bkend', '@supabase', 'firebase']
    }
  },
  conventions: {
    naming: {
      components: 'PascalCase',
      functions: 'camelCase',
      constants: 'UPPER_SNAKE_CASE',
      files: 'kebab-case'
    }
  },
  supportedLanguages: ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it']
};

let _cachedConfig = null;
let _cachedProjectDir = null;

/**
 * Load config from project directory, merging with defaults.
 * @param {string} projectDir - Absolute path to project root
 * @returns {Promise<object>} Merged config
 */
async function loadConfig(projectDir) {
  if (_cachedConfig && _cachedProjectDir === projectDir) {
    return _cachedConfig;
  }

  let projectConfig = {};
  const configPath = path.join(projectDir, '.bkit-codex', 'bkit.config.json');

  if (await fileExists(configPath)) {
    try {
      projectConfig = await readJsonFile(configPath);
    } catch (err) {
      console.error(`[bkit] Failed to read config: ${err.message}`);
    }
  }

  _cachedConfig = mergeConfig(getDefaultConfig(), projectConfig);
  _cachedProjectDir = projectDir;
  return _cachedConfig;
}

/**
 * Get a config value by dot-notation key path.
 * @param {string} keyPath - e.g. "pdca.matchRateThreshold"
 * @returns {*} Config value or undefined
 */
function getConfig(keyPath) {
  if (!_cachedConfig) {
    return getValueByPath(DEFAULT_CONFIG, keyPath);
  }
  return getValueByPath(_cachedConfig, keyPath);
}

/**
 * Deep merge base config with override values.
 * Arrays are replaced, not merged.
 * @param {object} base
 * @param {object} override
 * @returns {object} Merged config
 */
function mergeConfig(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overVal = override[key];
    if (
      overVal !== null &&
      typeof overVal === 'object' &&
      !Array.isArray(overVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = mergeConfig(baseVal, overVal);
    } else {
      result[key] = overVal;
    }
  }
  return result;
}

/**
 * Validate config for required fields.
 * @param {object} config
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be an object'] };
  }

  if (config.pdca) {
    if (typeof config.pdca.matchRateThreshold !== 'number') {
      errors.push('pdca.matchRateThreshold must be a number');
    }
    if (typeof config.pdca.maxIterations !== 'number') {
      errors.push('pdca.maxIterations must be a number');
    }
  }

  if (config.taskClassification && config.taskClassification.thresholds) {
    const t = config.taskClassification.thresholds;
    if (typeof t.quickFix !== 'number') errors.push('thresholds.quickFix must be a number');
    if (typeof t.minorChange !== 'number') errors.push('thresholds.minorChange must be a number');
    if (typeof t.feature !== 'number') errors.push('thresholds.feature must be a number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get the default config object.
 * @returns {object}
 */
function getDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function getValueByPath(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

module.exports = {
  loadConfig,
  getConfig,
  mergeConfig,
  validateConfig,
  getDefaultConfig
};
