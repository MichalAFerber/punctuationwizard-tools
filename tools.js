// Single source of truth for the PunctuationWizard tool catalog: drives the
// site's landing-page cards, per-tool pages, SEO metadata, and sitemap. The
// behavior for each tool lives in the matching features/<id>.js module (see
// `repoPath` for exceptions), mounted client-side by the consuming site
// (punctuationwizard.app).

export const tools = [
  {
    id: 'punctuation-fixer',
    name: 'Punctuation Fixer',
    icon: '!?',
    color: '#6366f1',
    category: 'Fix',
    tagline: 'Fix spacing, doubled marks, ellipses, and sentence endings.',
    description: 'Fix spacing around punctuation, collapse doubled marks, normalize ellipses, add or strip terminal periods, capitalize after sentence ends, and manage Oxford commas.',
    keywords: ['fix punctuation', 'punctuation corrector', 'space after comma', 'double punctuation', 'oxford comma', 'fix ellipsis'],
  },
  {
    id: 'unicode-cleaner',
    name: 'Unicode Cleaner',
    icon: 'U+',
    color: '#06b6d4',
    category: 'Fix',
    tagline: 'Normalize exotic Unicode punctuation to plain ASCII.',
    description: 'Convert fullwidth and CJK punctuation, exotic spaces, smart quotes, dashes, and ellipses to plain ASCII — and remove invisible characters like zero-width spaces.',
    keywords: ['unicode to ascii', 'remove zero width space', 'fullwidth to halfwidth', 'invisible characters', 'normalize punctuation', 'remove hidden characters'],
  },
  {
    id: 'smart-quotes',
    name: 'Smart Quotes',
    icon: '“”',
    color: '#8b5cf6',
    category: 'Convert',
    tagline: 'Convert between straight, curly, and French quotes.',
    description: 'Convert straight quotes to typographic curly quotes and back, switch single and double quotes, convert to guillemets, fix apostrophes, and use primes for measurements.',
    keywords: ['smart quotes', 'curly quotes', 'straight quotes converter', 'guillemets', 'apostrophe fixer', 'prime symbol'],
  },
  {
    id: 'dashes',
    name: 'Dashes & Hyphens',
    icon: '—',
    color: '#f59e0b',
    category: 'Convert',
    tagline: 'Convert between hyphens, en dashes, em dashes, and minus signs.',
    description: 'Convert typewriter double hyphens to real dashes, use en dashes in number ranges, restyle em dashes spaced or unspaced, swap em dashes for commas, and normalize every dash back to a hyphen.',
    keywords: ['em dash', 'en dash', 'hyphen converter', 'minus sign', 'remove em dashes', 'em dash to comma'],
  },
  {
    id: 'punctuation-remover',
    name: 'Punctuation Remover',
    icon: '⌫',
    color: '#ef4444',
    category: 'Strip',
    tagline: 'Strip punctuation — all of it, or just the marks you pick.',
    description: 'Remove all punctuation and symbols, keep sentence enders, strip specific marks like commas or quotes, drop parentheticals, or keep only the punctuation.',
    keywords: ['remove punctuation', 'strip punctuation', 'remove commas', 'remove quotes', 'remove special characters'],
  },
  {
    id: 'analyzer',
    name: 'Punctuation Analyzer',
    icon: '∑',
    color: '#14b8a6',
    category: 'Inspect',
    tagline: 'Count every mark, check balance, and spot unusual characters.',
    description: 'Count every punctuation mark, check that brackets and quotes are balanced, profile how sentences end, and list unusual Unicode punctuation hiding in your text.',
    keywords: ['punctuation counter', 'unbalanced brackets', 'unmatched parentheses', 'punctuation frequency', 'find smart quotes'],
  },
  {
    id: 'symbols',
    name: 'Symbol Copy',
    icon: '¶',
    color: '#ec4899',
    category: 'Reference',
    tagline: 'Click any punctuation or typographic symbol to copy it.',
    description: 'Browse dashes, quotes, legal marks, currency, math symbols, arrows, and invisible characters — click any of them to copy, with a filter to find marks by name.',
    keywords: ['em dash copy', 'copy paste symbols', 'special characters', 'section sign', 'degree symbol', 'non breaking space'],
  },
];

// Category display order for the landing page.
export const categories = ['Fix', 'Convert', 'Strip', 'Inspect', 'Reference'];

export const toolsById = Object.fromEntries(tools.map((t) => [t.id, t]));

// Where each tool's source lives in the repo (open-source discoverability).
export const REPO = 'https://github.com/MichalAFerber/punctuationwizard-tools';
const REPO_BLOB = `${REPO}/blob/main/`;
// repoPath: null → the tool's UI lives in the consuming site, so link the repo root.
export const repoUrlFor = (tool) =>
  tool.repoPath === null ? REPO : REPO_BLOB + (tool.repoPath || `features/${tool.id}.js`);
