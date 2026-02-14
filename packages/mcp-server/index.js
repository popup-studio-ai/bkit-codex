#!/usr/bin/env node
'use strict';

/**
 * bkit-codex MCP Server Entry Point
 *
 * STDIO transport: reads JSON-RPC 2.0 from stdin, writes to stdout.
 * All logging goes to stderr.
 */

const { createServer } = require('./src/server');

const server = createServer();

let buffer = '';

process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  // Process complete JSON-RPC messages (newline-delimited)
  let newlineIdx;
  while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIdx).trim();
    buffer = buffer.slice(newlineIdx + 1);

    if (!line) continue;

    try {
      const request = JSON.parse(line);
      server.handleRequest(request).then((response) => {
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      }).catch((err) => {
        console.error(`[bkit-mcp] Error handling request: ${err.message}`);
        if (request.id !== undefined) {
          const errorResponse = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32603,
              message: 'Internal error',
              data: err.message
            }
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      });
    } catch (parseErr) {
      console.error(`[bkit-mcp] JSON parse error: ${parseErr.message}`);
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: parseErr.message
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
});

process.stdin.on('end', () => {
  console.error('[bkit-mcp] stdin closed, shutting down');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error(`[bkit-mcp] Uncaught exception: ${err.message}`);
  process.exit(1);
});

console.error('[bkit-mcp] bkit-codex MCP server started (STDIO)');
