import { createEditor } from './_editor.js';

const PLACEHOLDER =
  'Paste text, then strip punctuation — all of it, or just the marks you pick below.';

const norm = (s) => s.replace(/\r\n?/g, '\n');

// Everything Unicode considers punctuation or a symbol.
const PUNCT = /[\p{P}\p{S}]/gu;

const tidySpaces = (t) =>
  t
    .split('\n')
    .map((l) => l.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/, ''))
    .join('\n');

// The keep-options shield in-word apostrophes/hyphens behind private-use
// placeholders so the removal regex can't see them.
function shield(t, { keepApostrophes, keepHyphens } = {}) {
  let out = t;
  if (keepApostrophes) {
    out = out.replace(/(?<=\p{L})'(?=\p{L})/gu, '\uE000');
    out = out.replace(/(?<=\p{L})\u2019(?=\p{L})/gu, '\uE001');
  }
  if (keepHyphens) out = out.replace(/(?<=\p{L})-(?=\p{L})/gu, '\uE002');
  return out;
}
const unshield = (t) =>
  t.replace(/\uE000/g, "'").replace(/\uE001/g, '\u2019').replace(/\uE002/g, '-');

export const transforms = {
  removeAll: (s, opts) => tidySpaces(unshield(shield(norm(s), opts).replace(PUNCT, ''))),

  punctToSpaces: (s, opts) => tidySpaces(unshield(shield(norm(s), opts).replace(PUNCT, ' '))),

  keepSentenceEnders: (s, opts) =>
    tidySpaces(
      unshield(shield(norm(s), opts).replace(PUNCT, (m) => ('.!?…'.includes(m) ? m : '')))
    ),

  removeCommas: (s) => norm(s).replace(/[,，、]/g, ''),

  removePeriods: (s) => norm(s).replace(/[.。]/g, ''),

  removeQuotes: (s, opts) =>
    unshield(shield(norm(s), opts).replace(/['"‘’“”„‟‚‛«»‹›]/g, '')),

  removeBracketChars: (s) => norm(s).replace(/[()\[\]{}⟨⟩〈〉《》「」『』【】〔〕]/g, ''),

  // Drops (asides) including the brackets; loops so nested ((cases)) unwind.
  removeParentheticals: (s) => {
    let t = norm(s);
    let prev;
    do {
      prev = t;
      t = t.replace(/[ \t]*\([^()\n]*\)/g, '');
    } while (t !== prev);
    return t;
  },

  // The inverse: drop the words, keep the punctuation skeleton.
  keepOnlyPunctuation: (s) =>
    tidySpaces(norm(s).replace(/[\p{L}\p{N}]+/gu, '')),
};

const ACTIONS = [
  { section: 'Remove' },
  {
    label: 'Remove all punctuation',
    className: 'tw-btn tw-btn-primary',
    title: 'Strip every Unicode punctuation mark and symbol',
    onClick: ({ getValue, setValue, optionState }) => {
      setValue(transforms.removeAll(getValue(), optionState));
      window.tw?.toast('Punctuation removed');
    },
  },
  { label: 'Punctuation → spaces', title: 'Replace each mark with a space (for tokenizing)', onClick: ({ getValue, setValue, optionState }) => setValue(transforms.punctToSpaces(getValue(), optionState)) },
  { label: 'Keep sentence enders', title: 'Strip everything except . ! ? …', onClick: ({ getValue, setValue, optionState }) => setValue(transforms.keepSentenceEnders(getValue(), optionState)) },

  { section: 'Specific marks' },
  { label: 'Remove commas', onClick: ({ getValue, setValue }) => setValue(transforms.removeCommas(getValue())) },
  { label: 'Remove periods', title: 'Ellipsis characters (…) survive', onClick: ({ getValue, setValue }) => setValue(transforms.removePeriods(getValue())) },
  { label: 'Remove quotes', title: 'Apostrophes inside words survive when the option is on', onClick: ({ getValue, setValue, optionState }) => setValue(transforms.removeQuotes(getValue(), optionState)) },
  { label: 'Remove bracket characters', title: 'Strip ( ) [ ] { } and CJK brackets — contents stay', onClick: ({ getValue, setValue }) => setValue(transforms.removeBracketChars(getValue())) },
  { label: 'Remove (parentheticals)', title: 'Drop parenthesized asides, brackets and all', onClick: ({ getValue, setValue }) => setValue(transforms.removeParentheticals(getValue())) },

  { section: 'Inverse' },
  { label: 'Keep only the punctuation', title: 'Drop the words — see the punctuation skeleton of the text', onClick: ({ getValue, setValue }) => setValue(transforms.keepOnlyPunctuation(getValue())) },
];

export const punctuationRemover = {
  id: 'punctuation-remover',
  navLabel: 'Punctuation Remover',
  navIcon: '⌫',
  title: 'Punctuation Remover',
  subtitle: 'Strip punctuation — all of it, or just the marks you pick.',
  actions: ACTIONS,
  render(container) {
    return createEditor({
      container,
      storageKey: 'pw::punctuation-remover',
      placeholderText: PLACEHOLDER,
      buttons: ACTIONS,
      options: [
        { key: 'keepApostrophes', label: 'Keep apostrophes inside words (don’t)' },
        { key: 'keepHyphens', label: 'Keep hyphens inside words (well-known)' },
      ],
      optionDefaults: { keepApostrophes: false, keepHyphens: false },
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
