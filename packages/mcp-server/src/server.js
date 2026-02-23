'use strict';

const { getToolDefinitions, executeToolCall } = require('./tools');

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'bkit-codex-mcp';
const SERVER_VERSION = '1.0.1';

/**
 * Create a JSON-RPC 2.0 MCP server instance.
 */
function createServer() {
  const state = {
    initialized: false,
    projectDir: null
  };

  /**
   * Handle a JSON-RPC 2.0 request.
   * @param {object} request
   * @returns {Promise<object|null>} Response or null for notifications
   */
  async function handleRequest(request) {
    const { method, params, id } = request;

    // Notifications (no id) don't get responses
    if (id === undefined) {
      if (method === 'notifications/initialized') {
        state.initialized = true;
        console.error('[bkit-mcp] Client initialized');
      }
      return null;
    }

    try {
      const result = await dispatch(method, params || {});
      return {
        jsonrpc: '2.0',
        id,
        result
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: err.code || -32603,
          message: err.message || 'Internal error'
        }
      };
    }
  }

  /**
   * Dispatch a method call to the appropriate handler.
   */
  async function dispatch(method, params) {
    switch (method) {
      case 'initialize':
        return handleInitialize(params);

      case 'tools/list':
        return handleToolsList();

      case 'tools/call':
        return handleToolsCall(params);

      default: {
        const err = new Error(`Method not found: ${method}`);
        err.code = -32601;
        throw err;
      }
    }
  }

  function handleInitialize(params) {
    return {
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION
      },
      capabilities: {
        tools: {}
      }
    };
  }

  function handleToolsList() {
    return {
      tools: getToolDefinitions()
    };
  }

  async function handleToolsCall(params) {
    const { name, arguments: args } = params;

    if (!name) {
      const err = new Error('Missing tool name');
      err.code = -32602;
      throw err;
    }

    try {
      const result = await executeToolCall(name, args || {}, state);
      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: err.message })
          }
        ],
        isError: true
      };
    }
  }

  return { handleRequest, state };
}

module.exports = { createServer };
