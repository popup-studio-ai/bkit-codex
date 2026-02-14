'use strict';

const { detectLanguage } = require('../lib/intent/language');
const { matchSkillTrigger, matchAgentTrigger, getImplicitTriggers } = require('../lib/intent/trigger');
const { calculateAmbiguityScore, needsClarification, generateClarifyingQuestions, checkMagicWords } = require('../lib/intent/ambiguity');
const { readPdcaStatus } = require('../lib/pdca/status');
const { checkPlanExists, checkDesignExists } = require('../lib/pdca/automation');

/**
 * bkit_analyze_prompt - Analyze user prompt for intent detection.
 */
async function handler(args, context) {
  const projectDir = context.projectDir;
  const prompt = args.prompt;

  if (!prompt) return { error: 'prompt is required' };

  // 1. Detect language
  const language = detectLanguage(prompt);

  // 2. Check magic words
  const magicCheck = checkMagicWords(prompt);

  // 3. Match skill triggers
  const skillMatches = matchSkillTrigger(prompt);
  const agentMatches = matchAgentTrigger(prompt);
  const implicitTriggers = getImplicitTriggers(prompt);

  // 4. Calculate ambiguity
  const ambiguityScore = magicCheck.hasMagicWord ? 0 : calculateAmbiguityScore(prompt);
  const clarificationNeeded = needsClarification(ambiguityScore);

  // 5. Detect feature intent
  const featureIntent = detectFeatureIntent(prompt);

  // 6. Build PDCA recommendation
  let pdcaRecommendation = null;
  if (projectDir && featureIntent.feature) {
    const feature = featureIntent.feature;
    const hasPlan = await checkPlanExists(projectDir, feature);
    const hasDesign = await checkDesignExists(projectDir, feature);
    const status = await readPdcaStatus(projectDir);
    const featureStatus = status.features[feature];

    if (!featureStatus && !hasPlan) {
      pdcaRecommendation = `No plan document found. Suggest: $pdca plan ${feature}`;
    } else if (hasPlan && !hasDesign) {
      pdcaRecommendation = `Plan exists but no design. Suggest: $pdca design ${feature}`;
    } else if (hasDesign) {
      pdcaRecommendation = `Design exists. Reference during implementation.`;
    }
  }

  // 7. Build suggested action
  let suggestedAction = 'Proceed with the request';
  if (clarificationNeeded) {
    suggestedAction = 'Ask clarifying questions before proceeding';
  } else if (skillMatches.length > 0) {
    suggestedAction = `Use ${skillMatches[0].skill} skill`;
  } else if (featureIntent.feature) {
    suggestedAction = `Check PDCA status for ${featureIntent.feature} feature`;
  }

  // 8. Generate clarifying questions if needed
  let clarifyingQuestions = [];
  if (clarificationNeeded) {
    clarifyingQuestions = generateClarifyingQuestions(prompt, skillMatches);
  }

  return {
    language,
    intent: {
      type: featureIntent.type,
      feature: featureIntent.feature,
      confidence: featureIntent.confidence
    },
    triggers: {
      skills: skillMatches.map(m => m.skill),
      agents: agentMatches.map(m => m.agent),
      implicit: implicitTriggers,
      keywords: [...skillMatches.map(m => m.skill), ...implicitTriggers]
    },
    ambiguity: {
      score: ambiguityScore,
      needsClarification: clarificationNeeded,
      magicWord: magicCheck.word
    },
    clarifyingQuestions,
    suggestedAction,
    pdcaRecommendation
  };
}

/**
 * Detect feature intent from prompt text.
 */
function detectFeatureIntent(prompt) {
  if (!prompt) return { type: 'unknown', feature: null, confidence: 0 };

  const lower = prompt.toLowerCase();

  // Feature request patterns
  const featurePatterns = [
    /(?:create|build|implement|add|make|develop)\s+(?:a\s+)?([a-z][a-z0-9-]*(?:\s+[a-z0-9-]+){0,2})/i,
    /(?:만들|구현|추가|개발)\S*\s+([가-힣a-z0-9-]+)/i,
    /feature[:\s]+([a-z][a-z0-9-]+)/i
  ];

  for (const pattern of featurePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const feature = match[1].trim().toLowerCase().replace(/\s+/g, '-');
      return { type: 'feature_request', feature, confidence: 0.8 };
    }
  }

  // Bug fix patterns
  const bugPatterns = [/fix\s+/, /bug\s+/, /error\s+/, /버그/, /수정/, /バグ/, /修复/];
  for (const pattern of bugPatterns) {
    if (pattern.test(lower)) {
      return { type: 'bug_fix', feature: null, confidence: 0.6 };
    }
  }

  // Question patterns
  const questionPatterns = [/how\s+(to|do|can)/, /what\s+(is|are)/, /why\s+/, /어떻게/, /무엇/];
  for (const pattern of questionPatterns) {
    if (pattern.test(lower)) {
      return { type: 'question', feature: null, confidence: 0.7 };
    }
  }

  return { type: 'general', feature: null, confidence: 0.5 };
}

const definition = {
  name: 'bkit_analyze_prompt',
  description: 'Analyze user prompt to detect intent, match skill/agent triggers, and check ambiguity. Supports 8 languages (en, ko, ja, zh, es, fr, de, it).',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: "User's input text to analyze"
      }
    },
    required: ['prompt']
  }
};

module.exports = { handler, definition };
