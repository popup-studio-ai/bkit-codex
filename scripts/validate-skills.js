#!/usr/bin/env node
'use strict';

/**
 * Validate all SKILL.md files in .agents/skills/
 *
 * Checks:
 * - YAML frontmatter exists and parses correctly
 * - name field exists and is <= 64 chars
 * - description field exists and is <= 1024 chars
 * - Directory name matches skill name
 * - agents/openai.yaml exists and parses
 *
 * Exit code 1 if any validation fails.
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '.agents', 'skills');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};

  // Simple YAML parser for flat and multi-line string fields
  let currentKey = null;
  let currentValue = '';
  let inMultiline = false;

  for (const line of yaml.split('\n')) {
    if (!inMultiline) {
      const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
      if (kvMatch) {
        // Save previous key if any
        if (currentKey) {
          result[currentKey] = currentValue.trim();
        }

        currentKey = kvMatch[1];
        const value = kvMatch[2];

        if (value === '|' || value === '>') {
          inMultiline = true;
          currentValue = '';
        } else {
          currentValue = value;
          inMultiline = false;
        }
      }
    } else {
      // Multiline: indented lines belong to current key
      if (line.match(/^\s+/) || line === '') {
        currentValue += (currentValue ? '\n' : '') + line.trimStart();
      } else {
        // End of multiline block
        if (currentKey) {
          result[currentKey] = currentValue.trim();
        }
        inMultiline = false;

        const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
        if (kvMatch) {
          currentKey = kvMatch[1];
          const value = kvMatch[2];
          if (value === '|' || value === '>') {
            inMultiline = true;
            currentValue = '';
          } else {
            currentValue = value;
          }
        }
      }
    }
  }

  // Save last key
  if (currentKey) {
    result[currentKey] = currentValue.trim();
  }

  return result;
}

function validateYamlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Basic check: file is non-empty and looks like YAML
    if (!content.trim()) return 'File is empty';
    if (content.includes('\t')) return 'Contains tabs (invalid YAML)';
    return null;
  } catch (err) {
    return err.message;
  }
}

function main() {
  let hasErrors = false;
  let total = 0;
  let passed = 0;

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error('ERROR: Skills directory not found:', SKILLS_DIR);
    process.exit(1);
  }

  const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  console.log(`Found ${skillDirs.length} skill directories\n`);

  for (const dirName of skillDirs) {
    total++;
    const errors = [];
    const skillDir = path.join(SKILLS_DIR, dirName);
    const skillFile = path.join(skillDir, 'SKILL.md');

    // Check SKILL.md exists
    if (!fs.existsSync(skillFile)) {
      errors.push('Missing SKILL.md');
    } else {
      const content = fs.readFileSync(skillFile, 'utf8');

      // Check frontmatter exists
      if (!content.startsWith('---')) {
        errors.push('Missing YAML frontmatter');
      } else {
        const fm = parseFrontmatter(content);
        if (!fm) {
          errors.push('Failed to parse YAML frontmatter');
        } else {
          // Check name field
          if (!fm.name) {
            errors.push('Missing "name" field in frontmatter');
          } else {
            if (fm.name.length > 64) {
              errors.push(`"name" exceeds 64 chars (${fm.name.length})`);
            }
            if (fm.name !== dirName) {
              errors.push(`Directory name "${dirName}" does not match frontmatter name "${fm.name}"`);
            }
          }

          // Check description field
          if (!fm.description) {
            errors.push('Missing "description" field in frontmatter');
          } else if (fm.description.length > 1024) {
            errors.push(`"description" exceeds 1024 chars (${fm.description.length})`);
          }
        }
      }
    }

    // Check agents/openai.yaml
    const yamlFile = path.join(skillDir, 'agents', 'openai.yaml');
    if (!fs.existsSync(yamlFile)) {
      errors.push('Missing agents/openai.yaml');
    } else {
      const yamlErr = validateYamlFile(yamlFile);
      if (yamlErr) {
        errors.push(`agents/openai.yaml: ${yamlErr}`);
      }
    }

    if (errors.length > 0) {
      hasErrors = true;
      console.log(`FAIL: ${dirName}`);
      for (const err of errors) {
        console.log(`  - ${err}`);
      }
    } else {
      passed++;
      console.log(`OK:   ${dirName}`);
    }
  }

  console.log(`\nResults: ${passed}/${total} passed`);

  if (hasErrors) {
    process.exit(1);
  }
}

main();
