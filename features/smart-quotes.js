import { createEditor } from './_editor.js';

const PLACEHOLDER =
  "Paste text, then convert its quotes — straight, curly, guillemets — and fix apostrophes.";

const norm = (s) => s.replace(/\r\n?/g, '\n');

// Straight → typographic, in three passes: apostrophe-only cases first (so
// '90s and 'til don't get an opening quote), then doubles, then singles.
function straightToSmart(s) {
  return norm(s)
    // decade abbreviations: '90s → ’90s
    .replace(/'(?=\d0s\b)/g, '’')
    // clipped words that START with an apostrophe, not an opening quote
    .replace(/(^|[\s(\[{])'(?=(?:tis|twas|til|till|em|cause|bout|round|n)\b)/gi, '$1’')
    // doubles: opening after start/space/opening bracket/opening single
    .replace(/(^|[\s(\[{'‘])"/g, '$1“')
    .replace(/"/g, '”')
    // singles: opening after start/space/opening bracket/opening double
    .replace(/(^|[\s(\[{"“])'/g, '$1‘')
    .replace(/'/g, '’');
}

// In-word apostrophes (don’t, l’heure) must not be converted by the
// single↔double and quote-removal transforms. Same placeholder trick as the
// fixer: swap them out, transform, swap back.
function protectApostrophes(s, fn) {
  const shielded = s
    .replace(/(?<=\p{L})'(?=\p{L})/gu, '\uE000')
    .replace(/(?<=\p{L})’(?=\p{L})/gu, '\uE001');
  return fn(shielded).replace(/\uE000/g, "'").replace(/\uE001/g, '’');
}

export const transforms = {
  straightToSmart,

  smartToStraight: (s) =>
    norm(s)
      .replace(/«\s*/g, '"')
      .replace(/\s*»/g, '"')
      .replace(/‹\s*/g, "'")
      .replace(/\s*›/g, "'")
      .replace(/[‘’‚‛′]/g, "'")
      .replace(/[“”„‟″]/g, '"'),

  doubleToSingle: (s) => norm(s).replace(/"/g, "'").replace(/“/g, '‘').replace(/”/g, '’'),

  singleToDouble: (s) =>
    protectApostrophes(norm(s), (t) =>
      t.replace(/'/g, '"').replace(/‘/g, '“').replace(/’/g, '”')
    ),

  // French quotation marks with non-breaking spaces inside: « Bonjour ».
  // Straight quotes are disambiguated via straightToSmart first.
  toGuillemets: (s) =>
    straightToSmart(s).replace(/“\s*/g, '«\u00A0').replace(/\s*”/g, '\u00A0»'),

  fromGuillemets: (s) =>
    norm(s)
      .replace(/«\s*/g, '“')
      .replace(/\s*»/g, '”')
      .replace(/‹\s*/g, '‘')
      .replace(/\s*›/g, '’'),

  // Only the apostrophe cases: in-word, decades, clipped words, s' possessives.
  fixApostrophes: (s) =>
    norm(s)
      .replace(/(?<=\p{L})'(?=\p{L})/gu, '’')
      .replace(/'(?=\d0s\b)/g, '’')
      .replace(/(^|[\s(\[{])'(?=(?:tis|twas|til|till|em|cause|bout|round|n)\b)/gi, '$1’')
      .replace(/(?<=s)'(?=\s|$|[,.;:!?)\]])/g, '’'),

  // 5'10" → 5′10″ (feet/inches, minutes/seconds).
  primes: (s) => norm(s).replace(/(\d)['’]/g, '$1′').replace(/(\d)["”]/g, '$1″'),

  removeQuotes: (s) =>
    protectApostrophes(norm(s), (t) => t.replace(/['"‘’“”„‟‚‛«»‹›]/g, '')),
};

const ACTIONS = [
  { section: 'Convert' },
  {
    label: 'Straight → smart',
    className: 'tw-btn tw-btn-primary',
    title: '"quotes" → “quotes”, with apostrophes handled correctly',
    onClick: ({ getValue, setValue }) => {
      setValue(transforms.straightToSmart(getValue()));
      window.tw?.toast('Converted to smart quotes');
    },
  },
  { label: 'Smart → straight', title: '“quotes” and «quotes» → "quotes"', onClick: ({ getValue, setValue }) => setValue(transforms.smartToStraight(getValue())) },
  { label: 'Double → single', title: '"x" → \'x\' and “x” → ‘x’', onClick: ({ getValue, setValue }) => setValue(transforms.doubleToSingle(getValue())) },
  { label: 'Single → double', title: "'x' → \"x\" — apostrophes inside words are left alone", onClick: ({ getValue, setValue }) => setValue(transforms.singleToDouble(getValue())) },

  { section: 'French' },
  { label: 'Quotes → guillemets', title: '“Bonjour” → « Bonjour » with non-breaking spaces', onClick: ({ getValue, setValue }) => setValue(transforms.toGuillemets(getValue())) },
  { label: 'Guillemets → quotes', title: '« Bonjour » → “Bonjour”', onClick: ({ getValue, setValue }) => setValue(transforms.fromGuillemets(getValue())) },

  { section: 'Fix' },
  { label: 'Fix apostrophes', title: "don't → don’t, '90s → ’90s, dogs' → dogs’", onClick: ({ getValue, setValue }) => setValue(transforms.fixApostrophes(getValue())) },
  { label: 'Primes for measurements', title: '5\'10" → 5′10″', onClick: ({ getValue, setValue }) => setValue(transforms.primes(getValue())) },

  { section: 'Strip' },
  { label: 'Remove all quotes', title: 'Strip every quote mark — apostrophes inside words survive', onClick: ({ getValue, setValue }) => setValue(transforms.removeQuotes(getValue())) },
];

export const smartQuotes = {
  id: 'smart-quotes',
  navLabel: 'Smart Quotes',
  navIcon: '“”',
  title: 'Smart Quotes',
  subtitle: 'Convert between straight, curly, and French quotes — and fix apostrophes.',
  actions: ACTIONS,
  render(container) {
    return createEditor({
      container,
      storageKey: 'pw::smart-quotes',
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
