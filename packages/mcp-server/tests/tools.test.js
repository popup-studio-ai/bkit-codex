'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { getToolDefinitions } = require('../src/tools');

/**
 * Expected tool names in the order they are registered.
 */
const EXPECTED_TOOLS = [
  'bkit_init',
  'bkit_get_status',
  'bkit_pre_write_check',
  'bkit_post_write',
  'bkit_complete_phase',
  'bkit_pdca_plan',
  'bkit_pdca_design',
  'bkit_pdca_analyze',
  'bkit_pdca_next',
  'bkit_analyze_prompt',
  'bkit_classify_task',
  'bkit_detect_level',
  'bkit_select_template',
  'bkit_check_deliverables',
  'bkit_memory_read',
  'bkit_memory_write'
];

describe('MCP Tool Definitions', () => {
  const tools = getToolDefinitions();

  it('should export exactly 16 tools', () => {
    assert.strictEqual(tools.length, 16, `Expected 16 tools but got ${tools.length}`);
  });

  it('should contain all expected tool names', () => {
    const names = tools.map(t => t.name);
    for (const expected of EXPECTED_TOOLS) {
      assert.ok(
        names.includes(expected),
        `Missing tool: ${expected}. Found: ${names.join(', ')}`
      );
    }
  });

  it('should have no duplicate tool names', () => {
    const names = tools.map(t => t.name);
    const unique = new Set(names);
    assert.strictEqual(
      unique.size,
      names.length,
      `Duplicate tool names found: ${names.filter((n, i) => names.indexOf(n) !== i).join(', ')}`
    );
  });

  // Individual tool definition tests
  for (const expectedName of EXPECTED_TOOLS) {
    describe(`Tool: ${expectedName}`, () => {
      const tool = tools.find(t => t.name === expectedName);

      it('should exist in tool definitions', () => {
        assert.ok(tool, `Tool ${expectedName} not found in definitions`);
      });

      it('should have a non-empty name', () => {
        assert.ok(tool, `Tool ${expectedName} not found`);
        assert.strictEqual(typeof tool.name, 'string');
        assert.ok(tool.name.length > 0, 'Tool name must not be empty');
      });

      it('should have a non-empty description', () => {
        assert.ok(tool, `Tool ${expectedName} not found`);
        assert.strictEqual(typeof tool.description, 'string');
        assert.ok(
          tool.description.length > 10,
          `Tool ${expectedName} description too short: "${tool.description}"`
        );
      });

      it('should have a valid inputSchema', () => {
        assert.ok(tool, `Tool ${expectedName} not found`);
        assert.ok(tool.inputSchema, `Tool ${expectedName} missing inputSchema`);
        assert.strictEqual(
          typeof tool.inputSchema,
          'object',
          `Tool ${expectedName} inputSchema must be an object`
        );
      });

      it('should have inputSchema with type "object"', () => {
        assert.ok(tool, `Tool ${expectedName} not found`);
        assert.strictEqual(
          tool.inputSchema.type,
          'object',
          `Tool ${expectedName} inputSchema.type must be "object"`
        );
      });

      it('should have inputSchema with properties object', () => {
        assert.ok(tool, `Tool ${expectedName} not found`);
        assert.ok(
          tool.inputSchema.properties && typeof tool.inputSchema.properties === 'object',
          `Tool ${expectedName} inputSchema must have a properties object`
        );
      });

      it('should have inputSchema.required as an array if present', () => {
        assert.ok(tool, `Tool ${expectedName} not found`);
        if (tool.inputSchema.required !== undefined) {
          assert.ok(
            Array.isArray(tool.inputSchema.required),
            `Tool ${expectedName} inputSchema.required must be an array`
          );
        }
      });

      it('should only list known properties in required', () => {
        assert.ok(tool, `Tool ${expectedName} not found`);
        if (Array.isArray(tool.inputSchema.required)) {
          const propNames = Object.keys(tool.inputSchema.properties);
          for (const req of tool.inputSchema.required) {
            assert.ok(
              propNames.includes(req),
              `Tool ${expectedName} requires unknown property "${req}". ` +
              `Known: ${propNames.join(', ')}`
            );
          }
        }
      });

      it('should have string type for each property description', () => {
        assert.ok(tool, `Tool ${expectedName} not found`);
        for (const [propName, propDef] of Object.entries(tool.inputSchema.properties)) {
          if (propDef.description !== undefined) {
            assert.strictEqual(
              typeof propDef.description,
              'string',
              `Tool ${expectedName} property "${propName}" description must be a string`
            );
          }
        }
      });
    });
  }
});

describe('Tool Definition Consistency', () => {
  const tools = getToolDefinitions();

  it('should have all tool names starting with "bkit_"', () => {
    for (const tool of tools) {
      assert.ok(
        tool.name.startsWith('bkit_'),
        `Tool "${tool.name}" does not follow naming convention (must start with "bkit_")`
      );
    }
  });

  it('should have descriptions shorter than 500 characters', () => {
    for (const tool of tools) {
      assert.ok(
        tool.description.length < 500,
        `Tool "${tool.name}" description is too long (${tool.description.length} chars)`
      );
    }
  });

  it('should have no tool with empty properties', () => {
    for (const tool of tools) {
      const propCount = Object.keys(tool.inputSchema.properties).length;
      assert.ok(
        propCount > 0,
        `Tool "${tool.name}" has zero properties in inputSchema`
      );
    }
  });
});
