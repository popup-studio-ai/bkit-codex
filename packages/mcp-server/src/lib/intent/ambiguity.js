'use strict';

const MAGIC_WORDS = ['!hotfix', '!prototype', '!bypass'];

const TECHNICAL_TERMS = [
  'function', 'class', 'component', 'module', 'api', 'endpoint',
  'database', 'table', 'schema', 'migration', 'deploy', 'build',
  'test', 'import', 'export', 'interface', 'type', 'const',
  'async', 'await', 'promise', 'callback', 'middleware', 'route',
  'controller', 'service', 'repository', 'model', 'view',
  'webpack', 'vite', 'npm', 'yarn', 'docker', 'git'
];

const FILE_PATH_PATTERN = /(?:\/[\w.-]+)+(?:\.\w+)?|[\w.-]+\/[\w.-]+/;

/**
 * Calculate ambiguity score for a text prompt.
 * Higher score = more ambiguous, needs clarification.
 * @param {string} text
 * @returns {number} Score 0-100
 */
function calculateAmbiguityScore(text) {
  if (!text || typeof text !== 'string') return 100;

  // Magic word bypass
  for (const magic of MAGIC_WORDS) {
    if (text.includes(magic)) return 0;
  }

  let score = 0;
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/).filter(w => w.length > 0);

  // +20: No specific nouns (very short or vague)
  if (words.length < 3) {
    score += 20;
  }

  // +20: Undefined scope (no clear boundaries)
  const scopeWords = ['all', 'everything', 'entire', 'whole', 'any', 'some', 'maybe'];
  const hasScopeAmbiguity = scopeWords.some(w => lowerText.includes(w));
  if (hasScopeAmbiguity) {
    score += 20;
  }

  // +30: Multiple interpretations (contains ambiguous verbs without context)
  const ambiguousVerbs = ['make', 'do', 'create', 'build', 'fix', 'change', 'update', 'improve'];
  const ambiguousVerbCount = ambiguousVerbs.filter(v => words.includes(v)).length;
  if (ambiguousVerbCount > 0 && words.length < 5) {
    score += 30;
  }

  // +30: Context conflict (contradictory or unclear signals)
  const conflictPairs = [
    ['simple', 'complex'],
    ['quick', 'thorough'],
    ['small', 'large'],
    ['frontend', 'backend']
  ];
  for (const [a, b] of conflictPairs) {
    if (lowerText.includes(a) && lowerText.includes(b)) {
      score += 30;
      break;
    }
  }

  // -30: Contains file path
  if (FILE_PATH_PATTERN.test(text)) {
    score -= 30;
  }

  // -20: Contains technical terms
  const techTermCount = TECHNICAL_TERMS.filter(t => lowerText.includes(t)).length;
  if (techTermCount >= 2) {
    score -= 20;
  } else if (techTermCount === 1) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine if the ambiguity score requires clarification.
 * @param {number} score
 * @returns {boolean}
 */
function needsClarification(score) {
  return score >= 50;
}

/**
 * Generate clarifying questions based on detected ambiguity.
 * @param {string} text
 * @param {Array<{skill: string}>} triggers - Matched triggers
 * @returns {string[]}
 */
function generateClarifyingQuestions(text, triggers) {
  const questions = [];

  if (!text || text.trim().length < 10) {
    questions.push('Could you provide more details about what you want to build?');
  }

  if (triggers && triggers.length > 1) {
    const skillNames = triggers.map(t => t.skill).join(', ');
    questions.push(`Your request matches multiple categories (${skillNames}). Which best describes your project?`);
  }

  if (triggers && triggers.length === 0) {
    questions.push('What type of project is this? (static website, fullstack app, mobile app, enterprise system)');
  }

  const lowerText = (text || '').toLowerCase();
  if (!lowerText.includes('page') && !lowerText.includes('feature') &&
      !lowerText.includes('component') && !lowerText.includes('api')) {
    questions.push('What specific feature or component should I focus on?');
  }

  if (questions.length === 0) {
    questions.push('Could you clarify the scope and expected outcome?');
  }

  return questions;
}

/**
 * Check if text contains magic words that bypass ambiguity.
 * @param {string} text
 * @returns {{ hasMagicWord: boolean, word: string|null }}
 */
function checkMagicWords(text) {
  if (!text) return { hasMagicWord: false, word: null };

  for (const word of MAGIC_WORDS) {
    if (text.includes(word)) {
      return { hasMagicWord: true, word };
    }
  }

  return { hasMagicWord: false, word: null };
}

module.exports = {
  calculateAmbiguityScore,
  needsClarification,
  generateClarifyingQuestions,
  checkMagicWords
};
