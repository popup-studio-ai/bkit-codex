'use strict';

const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

/**
 * Read and parse a JSON file asynchronously.
 * @param {string} filePath - Absolute path to JSON file
 * @returns {Promise<object>} Parsed JSON object
 */
async function readJsonFile(filePath) {
  const content = await fsPromises.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write data to a JSON file with pretty formatting.
 * Ensures the parent directory exists.
 * @param {string} filePath - Absolute path to JSON file
 * @param {*} data - Data to serialize
 */
async function writeJsonFile(filePath, data) {
  await ensureDir(path.dirname(filePath));
  const content = JSON.stringify(data, null, 2) + '\n';
  await fsPromises.writeFile(filePath, content, 'utf-8');
}

/**
 * Check if a file exists.
 * @param {string} filePath - Absolute path
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 * @param {string} dirPath - Absolute path to directory
 */
async function ensureDir(dirPath) {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  fileExists,
  ensureDir
};
