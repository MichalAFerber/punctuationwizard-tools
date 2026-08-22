import { createEditor } from './_editor.js';

const PLACEHOLDER =
  'Paste text with messy punctuation — then fix spacing, doubled marks, ellipses, and sentence endings.';

const norm = (s) => s.replace(/\r\n?/g, '\n');

// Spacing fixes must not reach inside URLs, emails, or HTML entities
// (mailto:x@y.com, &amp;, https://a.com/b,c). Swap them for private-use
// placeholders, run the transform, and swap them back.
function protectTokens(s, fn) {
  const saved = [];
  const shielded = s.replace(
    /\bhttps?:\/\/[^\s<>"')\]]+|\bwww\.[^\s<>"')\]]+|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+|&#?\w+;/g,
    (m) => {
      saved.push(m);
      return `\uE000${saved.length - 1}\uE001`;
    }
  );
  return fn(shielded).replace(/\uE000(\d+)\uE001/g, (_, i) => saved[+i]);
}

// The building blocks below take already-normalized text (LF line endings)
// so fixAll can run them as one pipeline inside a single protectTokens pass.

// `word ,` → `word,` — also eats NBSP before a mark.
const spaceBefore = (t) => t.replace(/[ \t\u00A0]+([,.;:!?…])/g, '$1');

// `( padded )` → `(padded)`.
const bracketInner = (t) => t.replace(/([(\[{]) +/g, '$1').replace(/ +([)\]}])/g, '$1');

const spaceAfter = (t) =>
  t
    // comma/semicolon glued to a letter or opening quote/bracket (1,000 is untouched)
    .replace(/([,;])(?=[\p{L}"'“‘(\[])/gu, '$1 ')
    // ! and ? glued to a letter, digit, or opening quote/bracket
    .replace(/([!?])(?=[\p{L}\p{N}"'“‘(\[])/gu, '$1 ')
    // colon glued to a letter — `note:this`; skips `::` so code like std::vector survives
    .replace(/(?<!:):(?=\p{L})/gu, ': ')
    // sentence boundary glued together: `end.Next` → `end. Next` (acronyms like U.S.A. are untouched)
    .replace(/(\p{Ll})\.(?=\p{Lu})/gu, '$1. ')
    // ellipsis glued to the next sentence: `wait...go` / `wait…go`
    .replace(/(\.{3}|…)(?=\p{L})/gu, '$1 ');

// `end.  Next` → `end. Next` (any run of 2+ spaces after a sentence ender).
const oneSpaceAfterSentence = (t) => t.replace(/([.!?…]['"’”)\]]?) {2,}(?=\S)/g, '$1 ');

// `!!!` → `!`, `??` → `?`, `,,` → `,` — only runs of the SAME mark, so a
// deliberate `?!` survives. Periods are handled by fixEllipses instead.
const collapseRepeats = (t) => t.replace(/([!?])\1+/g, '$1').replace(/([,;])\1+/g, '$1');

// `. . .` and 4+ dots → `...`; a stray `..` → `.`.
const fixEllipses = (t) =>
  t
    .replace(/\.(?:[ \t]+\.)+/g, (m) => '.'.repeat((m.match(/\./g) || []).length))
    .replace(/\.{4,}/g, '...')
    .replace(/(?<!\.)\.\.(?!\.)/g, '.');

// Collapse internal runs of spaces, preserving leading indentation.
const collapseSpaces = (t) =>
  t
    .split('\n')
    .map((l) => {
      const indent = (l.match(/^[ \t]*/) || [''])[0];
      return indent + l.slice(indent.length).replace(/[ \t]{2,}/g, ' ');
    })
    .join('\n');

// Exported for reuse and tests; each entry takes and returns a string.
export const transforms = {
  fixAll: (s) =>
    protectTokens(norm(s), (t) =>
      collapseSpaces(
        oneSpaceAfterSentence(spaceAfter(bracketInner(spaceBefore(collapseRepeats(fixEllipses(t))))))
      )
    ),

  spaceBeforeMarks: (s) => spaceBefore(norm(s)),
  spaceAfterMarks: (s) => protectTokens(norm(s), spaceAfter),
  bracketInnerSpaces: (s) => bracketInner(norm(s)),
  oneSpaceAfterSentence: (s) => oneSpaceAfterSentence(norm(s)),
  collapseRepeats: (s) => collapseRepeats(norm(s)),
  fixEllipses: (s) => fixEllipses(norm(s)),

  ellipsisToDots: (s) => norm(s).replace(/…/g, '...'),
  dotsToEllipsis: (s) => norm(s).replace(/\.{3,}/g, '…'),

  // Add a period to lines that end in a letter or digit (handy for bullet lists).
  endLinesWithPeriods: (s) =>
    norm(s)
      .split('\n')
      .map((l) => l.replace(/([\p{L}\p{N}])[ \t]*$/u, '$1.'))
      .join('\n'),

  // Strip a single trailing period per line (an ellipsis is left alone).
  stripTrailingPeriods: (s) =>
    norm(s)
      .split('\n')
      .map((l) => l.replace(/(?<!\.)\.[ \t]*$/, ''))
      .join('\n'),

  // Uppercase the first letter after ., !, ?, or … — nothing else is touched.
  capitalizeSentences: (s) =>
    norm(s).replace(/(^|[.!?…]['"’”)\]]?\s+)(\p{Ll})/gu, (_, p, c) => p + c.toUpperCase()),

  // `A, B and C` → `A, B, and C`. Heuristic — it matches list shapes, not grammar.
  addOxfordCommas: (s) =>
    norm(s).replace(/,\s+([^,\n;:.!?]+?)\s+(and|or)(?=\s)/g, ', $1, $2'),

  // `A, B, and C` → `A, B and C` (drops the comma before and/or).
  removeOxfordCommas: (s) => norm(s).replace(/,(\s+(?:and|or)\b)/g, '$1'),
};

const ACTIONS = [
  { section: 'Spacing' },
  {
    label: 'Fix everything',
    className: 'tw-btn tw-btn-primary',
    title: 'Run all spacing, repeat, and ellipsis fixes in one pass',
    onClick: ({ getValue, setValue }) => {
      setValue(transforms.fixAll(getValue()));
      window.tw?.toast('Punctuation fixed');
    },
  },
  { label: 'Remove space before marks', title: 'word , → word,', onClick: ({ getValue, setValue }) => setValue(transforms.spaceBeforeMarks(getValue())) },
  { label: 'Add space after marks', title: 'word,word → word, word (numbers and URLs are left alone)', onClick: ({ getValue, setValue }) => setValue(transforms.spaceAfterMarks(getValue())) },
  { label: 'One space between sentences', title: 'Collapse double spaces after sentence enders', onClick: ({ getValue, setValue }) => setValue(transforms.oneSpaceAfterSentence(getValue())) },
  { label: 'Unpad brackets', title: '( padded ) → (padded)', onClick: ({ getValue, setValue }) => setValue(transforms.bracketInnerSpaces(getValue())) },

  { section: 'Doubles & ellipses' },
  { label: 'Collapse repeated marks', title: '!!! → !, ?? → ?, ,, → , (a deliberate ?! survives)', onClick: ({ getValue, setValue }) => setValue(transforms.collapseRepeats(getValue())) },
  { label: 'Fix ellipses', title: '. . . and .... → ...; a stray .. → .', onClick: ({ getValue, setValue }) => setValue(transforms.fixEllipses(getValue())) },
  { label: '… → three dots', onClick: ({ getValue, setValue }) => setValue(transforms.ellipsisToDots(getValue())) },
  { label: 'Three dots → …', onClick: ({ getValue, setValue }) => setValue(transforms.dotsToEllipsis(getValue())) },

  { section: 'Sentence endings' },
  { label: 'End lines with periods', title: 'Add a period to lines ending in a letter or digit', onClick: ({ getValue, setValue }) => setValue(transforms.endLinesWithPeriods(getValue())) },
  { label: 'Strip trailing periods', title: 'Remove the period at the end of each line (ellipses survive)', onClick: ({ getValue, setValue }) => setValue(transforms.stripTrailingPeriods(getValue())) },
  { label: 'Capitalize sentences', title: 'Uppercase the first letter after ., !, ?, …', onClick: ({ getValue, setValue }) => setValue(transforms.capitalizeSentences(getValue())) },

  { section: 'Commas' },
  { label: 'Add Oxford commas', title: 'A, B and C → A, B, and C — heuristic, review the result', onClick: ({ getValue, setValue }) => setValue(transforms.addOxfordCommas(getValue())) },
  { label: 'Remove Oxford commas', title: 'A, B, and C → A, B and C — heuristic, review the result', onClick: ({ getValue, setValue }) => setValue(transforms.removeOxfordCommas(getValue())) },
];

export const punctuationFixer = {
  id: 'punctuation-fixer',
  navLabel: 'Punctuation Fixer',
  navIcon: '!?',
  title: 'Punctuation Fixer',
  subtitle: 'Fix spacing, doubled marks, ellipses, and sentence endings.',
  actions: ACTIONS,
  render(container) {
    return createEditor({
      container,
      storageKey: 'pw::punctuation-fixer',
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
