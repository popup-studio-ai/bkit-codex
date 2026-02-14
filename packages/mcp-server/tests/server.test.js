'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../src/server');

describe('MCP Server', () => {
  it('should respond to initialize with protocol version and server info', async () => {
    const server = createServer();
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'test', version: '1.0.0' }
      }
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 1);
    assert.ok(response.result);
    assert.strictEqual(response.result.protocolVersion, '2024-11-05');
    assert.ok(response.result.serverInfo);
    assert.strictEqual(response.result.serverInfo.name, 'bkit-codex-mcp');
    assert.ok(response.result.capabilities);
    assert.ok(response.result.capabilities.tools);
  });

  it('should return 16 tools from tools/list', async () => {
    const server = createServer();
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 2);
    assert.ok(response.result);
    assert.ok(Array.isArray(response.result.tools));
    assert.strictEqual(response.result.tools.length, 16);

    // Verify each tool has required fields
    for (const tool of response.result.tools) {
      assert.ok(tool.name, `Tool missing name: ${JSON.stringify(tool)}`);
      assert.ok(tool.description, `Tool ${tool.name} missing description`);
      assert.ok(tool.inputSchema, `Tool ${tool.name} missing inputSchema`);
    }
  });

  it('should handle tools/call with bkit_init', async () => {
    const server = createServer();
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'bkit_init',
        arguments: { projectDir: '/tmp/test-project' }
      }
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 3);
    assert.ok(response.result);
    assert.ok(Array.isArray(response.result.content));
    assert.ok(response.result.content.length > 0);
    assert.strictEqual(response.result.content[0].type, 'text');
  });

  it('should return error for unknown method', async () => {
    const server = createServer();
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'unknown/method',
      params: {}
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 4);
    assert.ok(response.error);
    assert.strictEqual(response.error.code, -32601);
    assert.ok(response.error.message.includes('Method not found'));
  });

  it('should return error for unknown tool', async () => {
    const server = createServer();
    const response = await server.handleRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'nonexistent_tool',
        arguments: {}
      }
    });

    assert.strictEqual(response.jsonrpc, '2.0');
    assert.strictEqual(response.id, 5);
    assert.ok(response.result);
    assert.strictEqual(response.result.isError, true);
    assert.ok(response.result.content[0].text.includes('error'));
  });
});
