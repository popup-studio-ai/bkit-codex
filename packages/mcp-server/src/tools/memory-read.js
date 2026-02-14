'use strict';

const path = require('path');
const { readJsonFile, fileExists } = require('../lib/core/file');
const { getCache, setCache } = require('../lib/core/cache');

const MEMORY_FILE = 'docs/.bkit-memory.json';

function getDefaultMemory() {
  return {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    data: {}
  };
}

/**
 * bkit_memory_read - Read from session memory.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const key = args.key;
  const memoryPath = path.join(projectDir, MEMORY_FILE);

  // Check cache first
  const cacheKey = 'memory';
  let memory = getCache(cacheKey);

  if (!memory) {
    if (await fileExists(memoryPath)) {
      try {
        memory = await readJsonFile(memoryPath);
      } catch (err) {
        console.error(`[bkit] Failed to read memory: ${err.message}`);
        memory = getDefaultMemory();
      }
    } else {
      memory = getDefaultMemory();
    }
    setCache(cacheKey, memory, 5000);
  }

  if (key) {
    const value = memory.data[key];
    return {
      key,
      value: value !== undefined ? value : null,
      exists: value !== undefined
    };
  }

  return {
    version: memory.version,
    lastUpdated: memory.lastUpdated,
    data: memory.data,
    keys: Object.keys(memory.data)
  };
}

const definition = {
  name: 'bkit_memory_read',
  description: 'Read from bkit session memory (docs/.bkit-memory.json). Read a specific key or get all memory.',
  inputSchema: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Memory key to read. Omit to get all memory.'
      }
    }
  }
};

module.exports = { handler, definition };
