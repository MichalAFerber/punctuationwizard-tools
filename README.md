# punctuationwizard-tools

The browser-local punctuation & typography tools behind
[punctuationwizard.us](https://punctuationwizard.us) — free, MIT-licensed, and
dependency-free. Part of the wizard family alongside
[textwizard-tools](https://github.com/MichalAFerber/textwizard-tools). Every tool
runs entirely in the browser: no uploads, no accounts, no tracking.

## Tools

- **Punctuation Fixer** — spacing around marks, doubled `!!`/`??`, ellipses,
  terminal periods, sentence capitalization, Oxford commas.
- **Unicode Cleaner** — fullwidth/CJK punctuation, exotic spaces, and invisible
  characters normalized to plain ASCII.
- **Smart Quotes** — straight ↔ curly, single ↔ double, guillemets,
  apostrophes, and primes for measurements.
- **Dashes & Hyphens** — typewriter `--`, number ranges, spaced/unspaced em-dash
  styles, minus signs, and de-hyphenation of PDF line wraps.
- **Punctuation Remover** — strip everything, keep sentence enders, drop
  specific marks, or keep only the punctuation skeleton.
- **Punctuation Analyzer** — per-mark counts, bracket/quote balance checking,
  sentence-ending profiles, and unusual-character reports.
- **Symbol Copy** — click-to-copy reference of dashes, quotes, legal marks,
  currency, math symbols, arrows, and invisible characters.

## Layout

- `tools.js` — the tool catalog (names, categories, taglines, SEO metadata) and
  `repoUrlFor()` helper.
- `features/` — one ES module per tool (plus the shared `_editor.js` scaffold).
  Each exports a mount function the consuming site attaches to its tool page,
  and its pure text transforms (`transforms`, report functions, `GROUPS`) for
  reuse and testing.

## Used by

[punctuationwizard.us](https://punctuationwizard.us) consumes this repo as a
package (`punctuationwizard-tools`) and supplies the page shell, styling, and
mounting glue — including the `window.tw.toast` helper the feature modules
call, same as the rest of the wizard family.

## Contributing

Bug reports and tool requests are welcome as
[issues](https://github.com/MichalAFerber/punctuationwizard-tools/issues); pull
requests are welcome too. Keep tools dependency-free and browser-local —
nothing a tool does may leave the user's device.

## License

[MIT](LICENSE) © 2026 Michal Ferber
