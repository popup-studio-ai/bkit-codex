'use strict';

// Skill trigger patterns in 8 languages
const SKILL_TRIGGERS = {
  starter: {
    en: ['static site', 'static website', 'portfolio', 'landing page', 'html css', 'beginner', 'simple website'],
    ko: ['정적 웹', '포트폴리오', '랜딩 페이지', '초보자', '간단한 웹'],
    ja: ['静的サイト', 'ポートフォリオ', 'ランディングページ', '初心者'],
    zh: ['静态网站', '作品集', '落地页', '初学者'],
    es: ['sitio web estático', 'portafolio', 'página de destino', 'principiante'],
    fr: ['site statique', 'portfolio', 'page de destination', 'débutant'],
    de: ['statische Website', 'Portfolio', 'Landingpage', 'Anfänger'],
    it: ['sito web statico', 'portfolio', 'pagina di atterraggio', 'principiante']
  },
  dynamic: {
    en: ['login', 'signup', 'sign up', 'authentication', 'fullstack', 'full stack', 'database', 'backend', 'baas', 'bkend', 'api'],
    ko: ['로그인', '회원가입', '인증', '풀스택', '데이터베이스', '백엔드'],
    ja: ['ログイン', 'サインアップ', '認証', 'フルスタック', 'データベース'],
    zh: ['登录', '注册', '身份验证', '全栈', '数据库', '后端'],
    es: ['iniciar sesión', 'registro', 'autenticación', 'pila completa', 'base de datos'],
    fr: ['connexion', 'inscription', 'authentification', 'full stack', 'base de données'],
    de: ['Anmeldung', 'Registrierung', 'Authentifizierung', 'Full Stack', 'Datenbank'],
    it: ['accesso', 'registrazione', 'autenticazione', 'full stack', 'database']
  },
  enterprise: {
    en: ['microservices', 'kubernetes', 'k8s', 'terraform', 'docker', 'monorepo', 'aws', 'gcp', 'azure', 'infrastructure'],
    ko: ['마이크로서비스', '쿠버네티스', '테라폼', '도커', '모노레포', '인프라'],
    ja: ['マイクロサービス', 'クーバネティス', 'テラフォーム', 'ドッカー'],
    zh: ['微服务', '容器编排', '基础设施', '云原生'],
    es: ['microservicios', 'kubernetes', 'infraestructura', 'nube'],
    fr: ['microservices', 'kubernetes', 'infrastructure', 'cloud'],
    de: ['Microservices', 'Kubernetes', 'Infrastruktur', 'Cloud'],
    it: ['microservizi', 'kubernetes', 'infrastruttura', 'cloud']
  },
  'mobile-app': {
    en: ['mobile app', 'react native', 'flutter', 'expo', 'ios', 'android', 'mobile development'],
    ko: ['모바일 앱', '리액트 네이티브', '플러터', '모바일 개발'],
    ja: ['モバイルアプリ', 'リアクトネイティブ', 'フラッター', 'モバイル開発'],
    zh: ['移动应用', '移动开发', '手机应用'],
    es: ['aplicación móvil', 'desarrollo móvil'],
    fr: ['application mobile', 'développement mobile'],
    de: ['mobile App', 'mobile Entwicklung'],
    it: ['applicazione mobile', 'sviluppo mobile']
  }
};

// Agent trigger patterns
const AGENT_TRIGGERS = {
  'gap-detector': {
    en: ['verify', 'check compliance', 'gap analysis', 'compare design', 'match rate'],
    ko: ['검증', '갭 분석', '일치율', '설계 비교'],
    ja: ['検証', 'ギャップ分析', '一致率'],
    zh: ['验证', '差距分析', '匹配率'],
    es: ['verificar', 'análisis de brechas'],
    fr: ['vérifier', 'analyse des écarts'],
    de: ['verifizieren', 'Lückenanalyse'],
    it: ['verificare', 'analisi dei gap']
  },
  'pdca-iterator': {
    en: ['improve', 'iterate', 'fix gaps', 'auto-fix', 'refine'],
    ko: ['개선', '반복', '갭 수정', '자동 수정'],
    ja: ['改善', '反復', 'ギャップ修正'],
    zh: ['改进', '迭代', '修复差距'],
    es: ['mejorar', 'iterar', 'corregir'],
    fr: ['améliorer', 'itérer', 'corriger'],
    de: ['verbessern', 'iterieren', 'korrigieren'],
    it: ['migliorare', 'iterare', 'correggere']
  },
  'code-analyzer': {
    en: ['analyze', 'review', 'code review', 'code analysis', 'code quality'],
    ko: ['분석', '코드 리뷰', '코드 분석', '코드 품질'],
    ja: ['分析', 'コードレビュー', 'コード分析'],
    zh: ['分析', '代码审查', '代码分析'],
    es: ['analizar', 'revisión de código'],
    fr: ['analyser', 'revue de code'],
    de: ['analysieren', 'Code-Review'],
    it: ['analizzare', 'revisione del codice']
  },
  'report-generator': {
    en: ['report', 'generate report', 'completion report', 'summary'],
    ko: ['보고서', '리포트', '완료 보고', '요약'],
    ja: ['レポート', '報告書', '完了報告'],
    zh: ['报告', '完成报告', '摘要'],
    es: ['informe', 'resumen'],
    fr: ['rapport', 'résumé'],
    de: ['Bericht', 'Zusammenfassung'],
    it: ['rapporto', 'riepilogo']
  }
};

/**
 * Match text against skill trigger patterns.
 * @param {string} text
 * @returns {{ skill: string, confidence: number, language: string }[]}
 */
function matchSkillTrigger(text) {
  if (!text || typeof text !== 'string') return [];

  const lowerText = text.toLowerCase();
  const matches = [];

  for (const [skill, langPatterns] of Object.entries(SKILL_TRIGGERS)) {
    for (const [lang, patterns] of Object.entries(langPatterns)) {
      for (const pattern of patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
          const existing = matches.find(m => m.skill === skill);
          if (existing) {
            existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
          } else {
            matches.push({ skill, confidence: 0.7, language: lang });
          }
        }
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Match text against agent trigger patterns.
 * @param {string} text
 * @returns {{ agent: string, confidence: number, language: string }[]}
 */
function matchAgentTrigger(text) {
  if (!text || typeof text !== 'string') return [];

  const lowerText = text.toLowerCase();
  const matches = [];

  for (const [agent, langPatterns] of Object.entries(AGENT_TRIGGERS)) {
    for (const [lang, patterns] of Object.entries(langPatterns)) {
      for (const pattern of patterns) {
        if (lowerText.includes(pattern.toLowerCase())) {
          const existing = matches.find(m => m.agent === agent);
          if (existing) {
            existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
          } else {
            matches.push({ agent, confidence: 0.7, language: lang });
          }
        }
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get implicit trigger matches from text context.
 * @param {string} text
 * @returns {string[]} List of implicitly triggered skill names
 */
function getImplicitTriggers(text) {
  if (!text || typeof text !== 'string') return [];

  const triggers = [];
  const lower = text.toLowerCase();

  // File extension hints
  if (lower.includes('.tsx') || lower.includes('.jsx') || lower.includes('react')) {
    triggers.push('dynamic');
  }
  if (lower.includes('.html') || lower.includes('.css')) {
    triggers.push('starter');
  }
  if (lower.includes('dockerfile') || lower.includes('.yml') || lower.includes('.yaml')) {
    triggers.push('enterprise');
  }
  if (lower.includes('.swift') || lower.includes('.kt') || lower.includes('.dart')) {
    triggers.push('mobile-app');
  }

  return [...new Set(triggers)];
}

/**
 * Match multi-language trigger patterns from custom pattern set.
 * @param {string} text
 * @param {Object<string, string[]>} patterns - { lang: [patterns] }
 * @returns {{ matched: boolean, language: string, pattern: string }[]}
 */
function matchMultiLanguageTrigger(text, patterns) {
  if (!text || !patterns) return [];

  const lowerText = text.toLowerCase();
  const matches = [];

  for (const [lang, langPatterns] of Object.entries(patterns)) {
    for (const pattern of langPatterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        matches.push({ matched: true, language: lang, pattern });
      }
    }
  }

  return matches;
}

module.exports = {
  matchSkillTrigger,
  matchAgentTrigger,
  getImplicitTriggers,
  matchMultiLanguageTrigger
};
