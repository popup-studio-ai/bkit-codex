'use strict';

const tools = {
  bkit_init: require('./init'),
  bkit_get_status: require('./get-status'),
  bkit_pre_write_check: require('./pre-write'),
  bkit_post_write: require('./post-write'),
  bkit_complete_phase: require('./complete'),
  bkit_pdca_plan: require('./pdca-plan'),
  bkit_pdca_design: require('./pdca-design'),
  bkit_pdca_analyze: require('./pdca-analyze'),
  bkit_pdca_next: require('./pdca-next'),
  bkit_analyze_prompt: require('./analyze-prompt'),
  bkit_classify_task: require('./classify'),
  bkit_detect_level: require('./detect-level'),
  bkit_select_template: require('./template'),
  bkit_check_deliverables: require('./deliverables'),
  bkit_memory_read: require('./memory-read'),
  bkit_memory_write: require('./memory-write')
};

/**
 * Get all tool definitions for tools/list response.
 * @returns {object[]}
 */
function getToolDefinitions() {
  return Object.values(tools).map(t => t.definition);
}

/**
 * Execute a tool by name.
 * @param {string} name - Tool name
 * @param {object} args - Tool arguments
 * @param {object} context - Server state (projectDir, etc.)
 * @returns {Promise<object>}
 */
async function executeToolCall(name, args, context) {
  const tool = tools[name];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.handler(args, context);
}

module.exports = { getToolDefinitions, executeToolCall };
