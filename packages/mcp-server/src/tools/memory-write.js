'use strict';

const path = require('path');
const { readJsonFile, writeJsonFile, fileExists } = require('../lib/core/file');
const { invalidateCache } = require('../lib/core/cache');

const MEMORY_FILE = 'docs/.bkit-memory.json';

function getDefaultMemory() {
  return {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    data: {}
  };
}

/**
 * bkit_memory_write - Write to session memory.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  if (!projectDir) {
    return { error: 'Session not initialized. Call bkit_init first.' };
  }

  const { key, value } = args;
  if (!key) return { error: 'key is required' };
  if (value === undefined) return { error: 'value is required' };

  const memoryPath = path.join(projectDir, MEMORY_FILE);

  // Read existing memory
  let memory;
  if (await fileExists(memoryPath)) {
    try {
      memory = await readJsonFile(memoryPath);
    } catch {
      memory = getDefaultMemory();
    }
  } else {
    memory = getDefaultMemory();
  }

  // Update the value
  memory.data[key] = value;
  memory.lastUpdated = new Date().toISOString();

  // Write back
  await writeJsonFile(memoryPath, memory);

  // Invalidate cache
  invalidateCache('memory');

  return {
    key,
    value,
    written: true,
    lastUpdated: memory.lastUpdated
  };
}

const definition = {
  name: 'bkit_memory_write',
  description: 'Write to bkit session memory (docs/.bkit-memory.json). Persists across sessions.',
  inputSchema: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Memory key'
      },
      value: {
        description: 'Value to store (any JSON-serializable type)'
      }
    },
    required: ['key', 'value']
  }
};

module.exports = { handler, definition };
