import { createEditor } from './_editor.js';

const PLACEHOLDER = 'Paste text to analyze. Reports replace the content — use Undo to restore.';

const norm = (s) => s.replace(/\r\n?/g, '\n');
const RULE = ''.padEnd(48, '─');

// Human names for the marks people actually meet; anything else falls back
// to its codepoint.
const CHAR_NAMES = {
  '.': 'period', ',': 'comma', ';': 'semicolon', ':': 'colon',
  '!': 'exclamation mark', '?': 'question mark',
  "'": 'straight single quote', '"': 'straight double quote',
  '‘': 'left single quote', '’': 'right single quote / apostrophe',
  '“': 'left double quote', '”': 'right double quote',
  '„': 'low double quote', '‚': 'low single quote',
  '«': 'left guillemet', '»': 'right guillemet',
  '‹': 'left single guillemet', '›': 'right single guillemet',
  '-': 'hyphen-minus', '‐': 'hyphen', '‑': 'non-breaking hyphen',
  '–': 'en dash', '—': 'em dash', '―': 'horizontal bar', '−': 'minus sign',
  '…': 'ellipsis', '·': 'middle dot', '•': 'bullet',
  '(': 'left parenthesis', ')': 'right parenthesis',
  '[': 'left bracket', ']': 'right bracket',
  '{': 'left brace', '}': 'right brace',
  '/': 'slash', '\\': 'backslash', '|': 'vertical bar',
  '&': 'ampersand', '*': 'asterisk', '#': 'hash', '%': 'percent',
  '@': 'at sign', '_': 'underscore', '~': 'tilde', '`': 'backtick',
  '^': 'caret', '+': 'plus', '=': 'equals', '<': 'less-than', '>': 'greater-than',
  '$': 'dollar', '€': 'euro', '£': 'pound', '¥': 'yen',
  '¡': 'inverted exclamation', '¿': 'inverted question',
  '§': 'section sign', '¶': 'pilcrow', '†': 'dagger', '‡': 'double dagger',
  '°': 'degree', '′': 'prime', '″': 'double prime',
  '©': 'copyright', '®': 'registered', '™': 'trademark',
  '\u00A0': 'no-break space', '\u202F': 'narrow no-break space',
  '\u2009': 'thin space', '\u200A': 'hair space',
  '\u2002': 'en space', '\u2003': 'em space', '\u3000': 'ideographic space',
  '\u200B': 'zero-width space', '\u200C': 'zero-width non-joiner',
  '\u200D': 'zero-width joiner', '\u2060': 'word joiner',
  '\uFEFF': 'zero-width no-break space (BOM)', '\u00AD': 'soft hyphen',
  '\u2028': 'line separator', '\u2029': 'paragraph separator',
};

const codepoint = (c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
const nameOf = (c) => CHAR_NAMES[c] || codepoint(c);
// Invisible characters need a visible stand-in in reports.
const INVISIBLE = /[\p{Zs}\p{Cf}\p{Zl}\p{Zp}]/u;
const displayChar = (c) => (INVISIBLE.test(c) ? `⟨${codepoint(c)}⟩` : c);

const countChars = (text, re) => {
  const counts = new Map();
  for (const m of text.match(re) || []) counts.set(m, (counts.get(m) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

const countTable = (entries) => {
  const pad = Math.max(...entries.map(([, c]) => String(c).length));
  return entries.map(
    ([ch, c]) => `${String(c).padStart(pad, ' ')}×  ${displayChar(ch)}  ${nameOf(ch)}`
  );
};

export function punctuationReport(s) {
  const text = norm(s);
  const marks = text.match(/[\p{P}\p{S}]/gu) || [];
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = (text.match(/[.!?…]+['"’”)\]]*(?=\s|$)/g) || []).length;
  const commas = (text.match(/,/g) || []).length;
  const density = chars ? ((marks.length / chars) * 100).toFixed(1) : '0.0';
  const perSentence = (n) => (sentences ? (n / sentences).toFixed(1) : '—');

  const top = countChars(text, /[\p{P}\p{S}]/gu).slice(0, 15);
  return [
    'PunctuationWizard — Punctuation Report',
    RULE,
    `Characters:           ${chars.toLocaleString()}`,
    `Words:                ${words.toLocaleString()}`,
    `Sentences:            ${sentences.toLocaleString()}`,
    `Punctuation marks:    ${marks.length.toLocaleString()}`,
    `Unique marks:         ${new Set(marks).size.toLocaleString()}`,
    `Punctuation density:  ${density}% of characters`,
    `Commas per sentence:  ${perSentence(commas)}`,
    `Marks per sentence:   ${perSentence(marks.length)}`,
    '',
    top.length ? `Top marks` : 'No punctuation found.',
    ...(top.length ? [RULE, ...countTable(top)] : []),
  ].join('\n');
}

export function frequencyTable(s) {
  const entries = countChars(norm(s), /[\p{P}\p{S}]/gu);
  if (!entries.length) return 'No punctuation found.';
  return [
    `Punctuation frequency — ${entries.length} distinct marks`,
    RULE,
    ...countTable(entries),
  ].join('\n');
}

const lineOf = (text, index) => {
  let line = 1;
  for (let i = 0; i < index; i++) if (text[i] === '\n') line++;
  return line;
};

function checkPair(text, open, close) {
  const stack = [];
  const problems = [];
  let pairs = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === open) stack.push(i);
    else if (c === close) {
      if (stack.length) { stack.pop(); pairs++; }
      else problems.push(`stray '${close}' at line ${lineOf(text, i)}`);
    }
  }
  for (const i of stack) problems.push(`unclosed '${open}' at line ${lineOf(text, i)}`);
  return { pairs, problems };
}

export function balanceReport(s) {
  const text = norm(s);
  const out = ['Balance check', RULE];
  const pairs = [
    ['(', ')', 'Parentheses'],
    ['[', ']', 'Square brackets'],
    ['{', '}', 'Curly braces'],
    ['“', '”', 'Curly double quotes'],
    ['‘', '’', 'Curly single quotes'],
    ['«', '»', 'Guillemets'],
  ];
  for (const [open, close, label] of pairs) {
    const { pairs: n, problems } = checkPair(text, open, close);
    if (!n && !problems.length) continue;
    if (!problems.length) out.push(`✓ ${label} ${open} ${close} — balanced (${n} pair${n === 1 ? '' : 's'})`);
    else {
      out.push(`✗ ${label} ${open} ${close} — ${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
      for (const p of problems.slice(0, 5)) out.push(`    ${p}`);
      if (problems.length > 5) out.push(`    …and ${problems.length - 5} more`);
    }
  }
  // Symmetric marks can only be parity-checked. In-word apostrophes are not
  // quotes, so they're excluded from the single-quote count.
  const symmetric = [
    [/"/g, 'Straight double quotes'],
    [/(?<!\p{L})'|'(?!\p{L})/gu, 'Straight single quotes'],
    [/`/g, 'Backticks'],
  ];
  for (const [re, label] of symmetric) {
    const matches = [...text.matchAll(re)];
    if (!matches.length) continue;
    const n = matches.length;
    if (n % 2 === 0) out.push(`✓ ${label} — even count (${n})`);
    else out.push(`✗ ${label} — odd count (${n}), possibly unclosed; last at line ${lineOf(text, matches[n - 1].index)}`);
  }
  if (out.length === 2) return 'Balance check\n' + RULE + '\nNo brackets or quotes found.';
  return out.join('\n');
}

export function sentenceEndings(s) {
  const text = norm(s);
  const runs = text.match(/[.!?…]+(?=['"’”)\]]*(\s|$))/g) || [];
  const kinds = { period: 0, ellipsis: 0, exclamation: 0, question: 0, interrobang: 0, other: 0 };
  for (const r of runs) {
    if (r === '.') kinds.period++;
    else if (r === '…' || /^\.{2,}$/.test(r)) kinds.ellipsis++;
    else if (/^!+$/.test(r)) kinds.exclamation++;
    else if (/^\?+$/.test(r)) kinds.question++;
    else if (/^[!?]+$/.test(r)) kinds.interrobang++;
    else kinds.other++;
  }
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const unterminated = lines.filter((l) => !/[.!?…;:]['"’”)\]]*$/.test(l)).length;
  const row = (label, n) => `${String(n).padStart(5, ' ')}  ${label}`;
  return [
    `Sentence endings — ${runs.length} terminator run${runs.length === 1 ? '' : 's'}`,
    RULE,
    row('. period', kinds.period),
    row('! exclamation', kinds.exclamation),
    row('? question', kinds.question),
    row('?! mixed (interrobang style)', kinds.interrobang),
    row('… ellipsis', kinds.ellipsis),
    ...(kinds.other ? [row('other runs', kinds.other)] : []),
    '',
    `${unterminated} of ${lines.length} non-blank lines do not end with punctuation.`,
  ].join('\n');
}

export function unusualReport(s) {
  const text = norm(s);
  const entries = countChars(text, /[\u0080-\u{10FFFF}]/gu).filter(
    ([c]) => /[\p{P}\p{S}\p{Zs}\p{Cf}\p{Zl}\p{Zp}]/u.test(c)
  );
  if (!entries.length) return 'No unusual characters — the punctuation is all plain ASCII. ✓';
  const firstLine = (c) => lineOf(text, text.indexOf(c));
  const pad = Math.max(...entries.map(([, n]) => String(n).length));
  return [
    `Unusual punctuation & invisible characters — ${entries.length} distinct`,
    RULE,
    ...entries.map(
      ([c, n]) =>
        `${String(n).padStart(pad, ' ')}×  ${displayChar(c)}  ${codepoint(c)}  ${nameOf(c)} — first at line ${firstLine(c)}`
    ),
    '',
    'The Unicode Cleaner tool can normalize all of these.',
  ].join('\n');
}

const ACTIONS = [
  {
    label: 'Punctuation report',
    className: 'tw-btn tw-btn-primary',
    onClick: ({ getValue, setValue }) => setValue(punctuationReport(getValue())),
  },
  { label: 'Frequency table', onClick: ({ getValue, setValue }) => setValue(frequencyTable(getValue())) },
  { label: 'Check balance', title: 'Find unmatched brackets and quotes', onClick: ({ getValue, setValue }) => setValue(balanceReport(getValue())) },
  { label: 'Sentence endings', onClick: ({ getValue, setValue }) => setValue(sentenceEndings(getValue())) },
  { label: 'Unusual characters', title: 'Non-ASCII punctuation, exotic spaces, and invisibles', onClick: ({ getValue, setValue }) => setValue(unusualReport(getValue())) },
];

export const analyzer = {
  id: 'analyzer',
  navLabel: 'Analyzer',
  navIcon: '∑',
  title: 'Punctuation Analyzer',
  subtitle: 'Count, balance-check, and profile the punctuation in any text. Use Undo to restore the original.',
  actions: ACTIONS,
  render(container) {
    return createEditor({
      container,
      storageKey: 'pw::analyzer',
      placeholderText: PLACEHOLDER,
      buttons: ACTIONS,
      toolbarLeft: [
        {
          label: 'Copy',
          className: 'tw-btn tw-btn-primary',
          onClick: async ({ getValue }) => {
            try { await navigator.clipboard.writeText(getValue()); window.tw?.toast('Copied to clipboard'); }
            catch { window.tw?.toast('Copy failed'); }
          },
        },
      ],
      toolbarRight: [
        { label: 'Clear', className: 'tw-btn tw-btn-ghost', onClick: ({ setValue }) => setValue('') },
      ],
    });
  },
};
