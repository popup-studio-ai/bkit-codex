'use strict';

const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it'];

// European language keyword patterns
const EUROPEAN_PATTERNS = {
  es: ['hola', 'crear', 'página', 'sitio', 'aplicación', 'usuario', 'diseño', 'planificar', 'analizar', 'informe'],
  fr: ['bonjour', 'créer', 'page', 'site', 'application', 'utilisateur', 'conception', 'planifier', 'analyser', 'rapport'],
  de: ['hallo', 'erstellen', 'Seite', 'Webseite', 'Anwendung', 'Benutzer', 'Entwurf', 'Planung', 'analysieren', 'Bericht'],
  it: ['ciao', 'creare', 'pagina', 'sito', 'applicazione', 'utente', 'progettazione', 'pianificare', 'analizzare', 'rapporto']
};

/**
 * Detect the primary language of the text.
 * Uses Unicode ranges for CJK languages and keyword patterns for European languages.
 * @param {string} text
 * @returns {string} Language code: en, ko, ja, zh, es, fr, de, it
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';

  // Korean: Hangul syllables
  const koreanCount = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  // Japanese: Hiragana + Katakana
  const japaneseCount = (text.match(/[\u3040-\u30FF]/g) || []).length;
  // CJK Unified Ideographs (shared by Chinese and Japanese)
  const cjkCount = (text.match(/[\u4E00-\u9FFF]/g) || []).length;

  // If Korean characters dominate
  if (koreanCount > 0 && koreanCount >= japaneseCount && koreanCount >= cjkCount) {
    return 'ko';
  }

  // If Japanese kana exists, it's Japanese (even with CJK)
  if (japaneseCount > 0) {
    return 'ja';
  }

  // CJK without Japanese kana = Chinese
  if (cjkCount > 0) {
    return 'zh';
  }

  // Check European languages by keyword matching
  const lowerText = text.toLowerCase();
  let bestLang = 'en';
  let bestScore = 0;

  for (const [lang, keywords] of Object.entries(EUROPEAN_PATTERNS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  // Require at least 2 keyword matches to avoid false positives
  if (bestScore >= 2) {
    return bestLang;
  }

  return 'en';
}

/**
 * Get the list of supported languages.
 * @returns {string[]}
 */
function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}

module.exports = {
  detectLanguage,
  getSupportedLanguages
};
