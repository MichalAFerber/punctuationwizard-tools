// Click-to-copy reference of punctuation & typographic symbols. Doesn't use
// the shared editor because it's a grid, not a textarea.

const FILTER_KEY = 'pw::symbols::filter';

// [character, name] — plus a short on-button label for invisible characters.
export const GROUPS = [
  {
    name: 'Dashes & hyphens',
    symbols: [
      ['—', 'em dash'], ['–', 'en dash'], ['‐', 'hyphen'], ['‑', 'non-breaking hyphen'],
      ['−', 'minus sign'], ['―', 'horizontal bar'], ['⁓', 'swung dash'], ['~', 'tilde'],
    ],
  },
  {
    name: 'Quotes',
    symbols: [
      ['“', 'left double quote'], ['”', 'right double quote'],
      ['‘', 'left single quote'], ['’', 'right single quote / apostrophe'],
      ['„', 'low double quote'], ['‚', 'low single quote'],
      ['«', 'left guillemet'], ['»', 'right guillemet'],
      ['‹', 'left single guillemet'], ['›', 'right single guillemet'],
      ['"', 'straight double quote'], ["'", 'straight single quote'],
    ],
  },
  {
    name: 'Sentence & pause',
    symbols: [
      ['…', 'ellipsis'], ['¡', 'inverted exclamation'], ['¿', 'inverted question'],
      ['‽', 'interrobang'], ['·', 'middle dot'], ['•', 'bullet'],
      ['‣', 'triangular bullet'], ['◦', 'white bullet'], ['⁂', 'asterism'], ['※', 'reference mark'],
    ],
  },
  {
    name: 'Typographic',
    symbols: [
      ['¶', 'pilcrow'], ['§', 'section sign'], ['†', 'dagger'], ['‡', 'double dagger'],
      ['‖', 'double vertical line'], ['⁋', 'reversed pilcrow'],
      ['ª', 'feminine ordinal'], ['º', 'masculine ordinal'], ['ʹ', 'modifier prime'], ['ˆ', 'circumflex'],
    ],
  },
  {
    name: 'Legal & commerce',
    symbols: [
      ['©', 'copyright'], ['®', 'registered'], ['™', 'trademark'], ['℠', 'service mark'],
      ['℗', 'sound recording copyright'], ['№', 'numero'], ['℅', 'care of'],
      ['@', 'at sign'], ['&', 'ampersand'],
    ],
  },
  {
    name: 'Currency',
    symbols: [
      ['$', 'dollar'], ['€', 'euro'], ['£', 'pound'], ['¥', 'yen / yuan'], ['¢', 'cent'],
      ['₹', 'rupee'], ['₽', 'ruble'], ['₩', 'won'], ['₺', 'lira'], ['₴', 'hryvnia'],
      ['₪', 'shekel'], ['฿', 'baht'], ['₫', 'dong'], ['₿', 'bitcoin'],
    ],
  },
  {
    name: 'Math & measures',
    symbols: [
      ['±', 'plus-minus'], ['×', 'multiplication'], ['÷', 'division'], ['≠', 'not equal'],
      ['≈', 'approximately'], ['≤', 'less or equal'], ['≥', 'greater or equal'],
      ['°', 'degree'], ['′', 'prime (feet, minutes)'], ['″', 'double prime (inches, seconds)'],
      ['µ', 'micro'], ['‰', 'per mille'], ['∞', 'infinity'], ['√', 'square root'],
      ['½', 'one half'], ['¼', 'one quarter'], ['¾', 'three quarters'],
    ],
  },
  {
    name: 'Arrows',
    symbols: [
      ['→', 'right arrow'], ['←', 'left arrow'], ['↑', 'up arrow'], ['↓', 'down arrow'],
      ['↔', 'left-right arrow'], ['⇒', 'double right arrow'], ['⇐', 'double left arrow'],
      ['⇔', 'double left-right arrow'], ['↵', 'return'], ['⇥', 'tab'],
    ],
  },
  {
    name: 'Invisible characters',
    invisible: true,
    symbols: [
      ['\u00A0', 'no-break space', 'NBSP'],
      ['\u202F', 'narrow no-break space', 'NNBSP'],
      ['\u2009', 'thin space', 'THIN'],
      ['\u200A', 'hair space', 'HAIR'],
      ['\u2002', 'en space', 'EN SP'],
      ['\u2003', 'em space', 'EM SP'],
      ['\u200B', 'zero-width space', 'ZWSP'],
      ['\u200D', 'zero-width joiner', 'ZWJ'],
      ['\u200C', 'zero-width non-joiner', 'ZWNJ'],
      ['\u2060', 'word joiner', 'WJ'],
      ['\u00AD', 'soft hyphen', 'SHY'],
    ],
  },
];

const codepoint = (c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

export const symbols = {
  id: 'symbols',
  navLabel: 'Symbol Copy',
  navIcon: '¶',
  title: 'Symbol Copy',
  subtitle: 'Click any symbol to copy it to your clipboard.',
  render(container) {
    container.innerHTML = `
      <div class="sym-layout">
        <input type="search" class="tw-input sym-filter" data-filter
               placeholder="Filter symbols by name — dash, quote, arrow…" />
        <div data-groups></div>
      </div>
    `;
    const groupsEl = container.querySelector('[data-groups]');
    const filterInput = container.querySelector('[data-filter]');

    const sections = [];
    for (const group of GROUPS) {
      const section = document.createElement('section');
      section.className = 'sym-section';
      const heading = document.createElement('h2');
      heading.className = 'sym-section-title';
      heading.textContent = group.name;
      section.appendChild(heading);

      const grid = document.createElement('div');
      grid.className = 'sym-grid';
      const cells = [];
      for (const [char, name, shortLabel] of group.symbols) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = group.invisible ? 'sym-btn sym-btn-invisible' : 'sym-btn';
        btn.textContent = shortLabel || char;
        btn.title = `${name} — ${codepoint(char)}`;
        btn.dataset.search = `${name} ${shortLabel || ''} ${char}`.toLowerCase();
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(char);
            window.tw?.toast(`Copied ${shortLabel || char} (${name})`);
          } catch {
            window.tw?.toast('Copy failed');
          }
        });
        grid.appendChild(btn);
        cells.push(btn);
      }
      section.appendChild(grid);
      groupsEl.appendChild(section);
      sections.push({ section, cells });
    }

    function applyFilter() {
      const q = filterInput.value.trim().toLowerCase();
      for (const { section, cells } of sections) {
        let visible = 0;
        for (const btn of cells) {
          const show = !q || btn.dataset.search.includes(q);
          btn.hidden = !show;
          if (show) visible++;
        }
        section.hidden = visible === 0;
      }
      localStorage.setItem(FILTER_KEY, filterInput.value);
    }
    filterInput.value = localStorage.getItem(FILTER_KEY) || '';
    filterInput.addEventListener('input', applyFilter);
    applyFilter();
  },
};
