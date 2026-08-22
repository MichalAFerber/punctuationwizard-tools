import { createEditor } from './_editor.js';

const PLACEHOLDER =
  'Paste text copied from a doc, PDF, or chat — then normalize its exotic Unicode punctuation to plain ASCII.';

const norm = (s) => s.replace(/\r\n?/g, '\n');

// Zero-width and formatting characters that hide in copied text.
const INVISIBLES = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF\u00AD\u180E]/g;

// Every Unicode space that isn't the plain U+0020.
const EXOTIC_SPACES = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;

// CJK punctuation that the fullwidth codepoint shift doesn't cover.
const CJK_MAP = {
  '。': '.', '、': ',', '｡': '.', '､': ',',
  '「': '"', '」': '"', '『': "'", '』': "'",
  '《': '"', '》': '"', '〈': "'", '〉': "'",
  '【': '[', '】': ']', '〔': '[', '〕': ']',
  '・': '-', '･': '-', '〜': '~',
};
const CJK_RE = new RegExp(`[${Object.keys(CJK_MAP).join('')}]`, 'g');

const invisibles = (t) => t.replace(INVISIBLES, '');
const spaces = (t) => t.replace(/[\u2028\u2029]/g, '\n').replace(EXOTIC_SPACES, ' ');
// Fullwidth ！ｗｉｄｅ！ → !wide! (shift the FF01–FF5E block down to ASCII).
const fullwidth = (t) =>
  t
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(CJK_RE, (c) => CJK_MAP[c]);
const quotes = (t) =>
  t
    .replace(/«\s*/g, '"').replace(/\s*»/g, '"')
    .replace(/‹\s*/g, "'").replace(/\s*›/g, "'")
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"');
const dashes = (t) => t.replace(/[‐-―−⁃]/g, '-');
const ellipses = (t) => t.replace(/[…⋯]/g, '...');

export const transforms = {
  cleanAll: (s) => dashes(ellipses(quotes(fullwidth(spaces(invisibles(norm(s))))))),

  removeInvisibles: (s) => invisibles(norm(s)),
  spacesToAscii: (s) => spaces(norm(s)),
  fullwidthToAscii: (s) => fullwidth(norm(s)),
  quotesToAscii: (s) => quotes(norm(s)),
  dashesToAscii: (s) => dashes(norm(s)),
  ellipsesToAscii: (s) => ellipses(norm(s)),

  // `• item` / `– item` → `- item`, only at line starts.
  bulletsToHyphens: (s) => norm(s).replace(/^([ \t]*)[•‣▪▫◦∙·–—*][ \t]*/gm, '$1- '),
};

const ACTIONS = [
  { section: 'Everything' },
  {
    label: 'Clean to plain ASCII',
    className: 'tw-btn tw-btn-primary',
    title: 'Invisibles, spaces, fullwidth, quotes, dashes, and ellipses — all normalized in one pass',
    onClick: ({ getValue, setValue }) => {
      setValue(transforms.cleanAll(getValue()));
      window.tw?.toast('Normalized to plain ASCII');
    },
  },

  { section: 'One kind at a time' },
  { label: 'Remove invisible characters', title: 'Zero-width spaces, joiners, soft hyphens, BOMs, direction marks', onClick: ({ getValue, setValue }) => setValue(transforms.removeInvisibles(getValue())) },
  { label: 'Exotic spaces → space', title: 'NBSP, thin space, em space, ideographic space → a plain space', onClick: ({ getValue, setValue }) => setValue(transforms.spacesToAscii(getValue())) },
  { label: 'Fullwidth → ASCII', title: 'ｆｕｌｌｗｉｄｔｈ and CJK punctuation → ASCII equivalents', onClick: ({ getValue, setValue }) => setValue(transforms.fullwidthToAscii(getValue())) },
  { label: 'Smart quotes → straight', title: '“ ” ‘ ’ « » → " and \'', onClick: ({ getValue, setValue }) => setValue(transforms.quotesToAscii(getValue())) },
  { label: 'Dashes → hyphen', title: 'en/em/figure dashes and the minus sign → -', onClick: ({ getValue, setValue }) => setValue(transforms.dashesToAscii(getValue())) },
  { label: 'Ellipses → three dots', onClick: ({ getValue, setValue }) => setValue(transforms.ellipsesToAscii(getValue())) },

  { section: 'Lists' },
  { label: 'Bullets → hyphens', title: '• item → - item (line starts only)', onClick: ({ getValue, setValue }) => setValue(transforms.bulletsToHyphens(getValue())) },
];

export const unicodeCleaner = {
  id: 'unicode-cleaner',
  navLabel: 'Unicode Cleaner',
  navIcon: 'U+',
  title: 'Unicode Cleaner',
  subtitle: 'Normalize exotic Unicode punctuation, spaces, and invisible characters to plain ASCII.',
  actions: ACTIONS,
  render(container) {
    return createEditor({
      container,
      storageKey: 'pw::unicode-cleaner',
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
