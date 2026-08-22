import { createEditor } from './_editor.js';

const PLACEHOLDER =
  'Paste text, then convert its dashes — typewriter --, ranges, em-dash styles, or back to plain hyphens.';

const norm = (s) => s.replace(/\r\n?/g, '\n');

export const transforms = {
  // The typewriter convention: --- → em dash, -- → en dash.
  typewriter: (s) => norm(s).replace(/---/g, '—').replace(/--/g, '–'),

  // Markdown-author convention: any -- run is an em dash.
  doubleToEm: (s) => norm(s).replace(/-{2,}/g, '—'),

  // 1990-2020 → 1990–2020. Heuristic — phone numbers and ISO dates match too.
  numberRanges: (s) => norm(s).replace(/(\d)\s*[-‐]\s*(?=\d)/g, '$1–'),

  // A hyphen used as a dash: `word - word` → `word—word`.
  spacedHyphenToEm: (s) => norm(s).replace(/(\S) +- +(?=\S)/g, '$1—'),

  emToEn: (s) => norm(s).replace(/\s*—\s*/g, ' – '),
  enToEm: (s) => norm(s).replace(/\s+–\s+/g, '—').replace(/–/g, '—'),

  spaceEms: (s) => norm(s).replace(/\s*—\s*/g, ' — '),
  unspaceEms: (s) => norm(s).replace(/\s*—\s*/g, '—'),

  // The de-em-dash-ification move: `word — word` → `word, word`.
  emToComma: (s) =>
    norm(s)
      .replace(/\s*—\s*/g, ', ')
      .replace(/, ([,.;:!?])/g, '$1')
      .replace(/, $/gm, '.')
      .replace(/^, /gm, ''),

  // −5 → for math contexts; only ahead of a digit, after a space/paren/operator.
  minusSigns: (s) => norm(s).replace(/(^|[\s(=+±])-(?=[\d.])/gm, '$1−'),

  // Every Unicode dash back to the plain keyboard hyphen.
  allToHyphen: (s) => norm(s).replace(/[‐-―−﹘﹣－]/g, '-'),

  // PDF-copy repair: `exam-\nple` → `example`.
  unhyphenateWraps: (s) => norm(s).replace(/(\p{Ll})-\n(\p{Ll})/gu, '$1$2'),

  removeSoftHyphens: (s) => s.replace(/\u00AD/g, ''),

  removeEmEn: (s) => norm(s).replace(/ ?[—–] ?/g, ' ').replace(/[ \t]{2,}/g, ' '),
};

const ACTIONS = [
  { section: 'Typewriter' },
  {
    label: '--- → em, -- → en',
    className: 'tw-btn tw-btn-primary',
    title: 'The typewriter convention: triple hyphen → em dash, double → en dash',
    onClick: ({ getValue, setValue }) => {
      setValue(transforms.typewriter(getValue()));
      window.tw?.toast('Dashes converted');
    },
  },
  { label: '-- → em dash', title: 'Any run of two or more hyphens → —', onClick: ({ getValue, setValue }) => setValue(transforms.doubleToEm(getValue())) },
  { label: 'Spaced hyphen → em dash', title: 'word - word → word—word', onClick: ({ getValue, setValue }) => setValue(transforms.spacedHyphenToEm(getValue())) },

  { section: 'Style' },
  { label: 'Space em dashes', title: 'word—word → word — word', onClick: ({ getValue, setValue }) => setValue(transforms.spaceEms(getValue())) },
  { label: 'Unspace em dashes', title: 'word — word → word—word', onClick: ({ getValue, setValue }) => setValue(transforms.unspaceEms(getValue())) },
  { label: 'Em → spaced en dash', title: 'word—word → word – word (British style)', onClick: ({ getValue, setValue }) => setValue(transforms.emToEn(getValue())) },
  { label: 'En → em dash', title: 'word – word → word—word', onClick: ({ getValue, setValue }) => setValue(transforms.enToEm(getValue())) },
  { label: 'Em dashes → commas', title: 'word — word → word, word', onClick: ({ getValue, setValue }) => setValue(transforms.emToComma(getValue())) },

  { section: 'Numbers' },
  { label: 'Ranges → en dash', title: '1990-2020 → 1990–2020 — careful with phone numbers and dates', onClick: ({ getValue, setValue }) => setValue(transforms.numberRanges(getValue())) },
  { label: 'Hyphens → minus signs', title: '-5 → −5 (the real U+2212 minus)', onClick: ({ getValue, setValue }) => setValue(transforms.minusSigns(getValue())) },

  { section: 'Cleanup' },
  { label: 'All dashes → hyphen', title: 'Every en/em/figure dash and minus → the keyboard hyphen', onClick: ({ getValue, setValue }) => setValue(transforms.allToHyphen(getValue())) },
  { label: 'Un-hyphenate line wraps', title: 'Rejoin words split across lines by PDF hyphenation', onClick: ({ getValue, setValue }) => setValue(transforms.unhyphenateWraps(getValue())) },
  { label: 'Remove soft hyphens', title: 'Strip invisible U+00AD soft hyphens', onClick: ({ getValue, setValue }) => setValue(transforms.removeSoftHyphens(getValue())) },
  { label: 'Remove em/en dashes', onClick: ({ getValue, setValue }) => setValue(transforms.removeEmEn(getValue())) },
];

export const dashes = {
  id: 'dashes',
  navLabel: 'Dashes & Hyphens',
  navIcon: '—',
  title: 'Dashes & Hyphens',
  subtitle: 'Convert between hyphens, en dashes, em dashes, and minus signs.',
  actions: ACTIONS,
  render(container) {
    return createEditor({
      container,
      storageKey: 'pw::dashes',
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
