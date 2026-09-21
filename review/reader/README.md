# Reader and Visualization Acceptance

Chapter-diagram acceptance is recorded in `acceptance.json`. Local development preview:
`http://127.0.0.1:8082/aposd2e-zh/`.

The subsequent source-grounded corrections and reference-navigation verification
are recorded in `../book-v16/README.md` and `../book-v16/findings.md`. Legacy note
numbers now link both ways, numbered section references resolve to stable anchors,
and the renamed chapter-9 heading retains old bookmarks. The original visualization
acceptance below remains historical evidence; the corrected reader was rebuilt and
rechecked across 300 page states, with 24 note roundtrips and existing interactions.

## Edition Introduction

The five introduction diagrams were removed at the user's request on 2026-09-21:
the user found them harder to understand. Their earlier rendering and interaction
checks did not demonstrate comprehension. The page references, 20 SVG variants,
metadata and dedicated generator were removed; the 50 chapter diagrams and
original-figure reproductions remain unchanged. The pre-removal source backup is
`/tmp/aposd-intro-retire.ckLZhl/before.tar`.

The contents table retains all 24 links. Its overview column now reads as a
continuous short introduction to the book. The former translation-notes and
glossary sections were removed from the introduction at the user's request;
internal terminology records and protected chapter content remain in place.

Removal was checked in simplified/traditional source and built HTML. The removed
SVG variants are absent from both public source and build output; introduction
pages render without the five diagrams. The subsequent code-coverage verification
also checked the introduction and its 24-row narrative contents table.

Prior figure-rendering artifacts in `/tmp/aposd-edition-gallery`,
`/tmp/aposd-edition-pages` and `/tmp/aposd-edition-interactions` are historical,
not acceptance of the removed diagrams.

## Scope

- VuePress and existing chapter URLs are preserved. Reading styles follow the
  local Software-Engineering-at-Google reference: restrained light/dark palettes,
  serif body text, chapter navigation, search and an in-page contents panel.
- All 12 original content-image resources have editable SVG reproductions,
  including the formula and warning flag. The cover remains the original raster.
  A persistent setting switches between original images and SVG reproductions.
- 50 explanatory diagrams cover all 22 chapters. Each has simplified/traditional
  Chinese and desktop/mobile versions: 200 teaching SVGs, plus 12 original vectors.
- All 60 Java/C/C++/Go-labelled code fences have source-locked Python teaching
  adaptations. The earlier 44-entry inventory incorrectly omitted 16 C/C++/Go
  fences, including `Buffer::allocAux` in chapter 18. Some Java-labelled source
  fences are actually C++ or mixed; their display labels disclose this.
  Original code remains available globally and per example. The code-block option
  does not rewrite code inside faithful original-figure reproductions.
- Original English excerpts and raster assets remain unchanged. Author errors
  remain in the body with the registered translator notes, not silent corrections.

## Review Results

The later code-coverage fix and its representation limits are recorded under
`Native-Language Coverage Fix` in `python-review.md`. Current static checks cover
60 source locks; use `browser.mjs --python` to additionally reject visible
unconverted C/C++/Go/Java fences in the rendered pages. The original Python fence
and the unlabelled design-document excerpt remain unchanged. The historical
44-entry review below is not evidence of complete book-wide code coverage.

The first 61 teaching drafts received independent decisions: 18 keep, 26 revise,
5 replace and 12 retire. Revisions used concrete states, caller obligations,
dependencies and counterexamples instead of generic boxed outlines. All 12 retired
IDs and their SVGs are absent from active manifests, public source and built output.
A bounded chapter-22 example replaced two retired closing flowcharts, yielding 50
active diagrams. This count is an outcome, not a quality score or quota.

All active simplified-Chinese diagrams have independent acceptance, with current
SVG hashes checked against the reports. Source questions, answers and insertion
anchors match the reviewed snapshot. Traditional conversion was reviewed separately:
2,589 text pairs, nine finding classes corrected, and 23 additional negative controls.

| Coverage | Final Content Evidence |
| --- | --- |
| Original figure reproductions | `original-figure-review.json`: 12 keep |
| Chapters 01-07 | `diagram-review-01-07-followup.json`: 16 accepted, 3 retired |
| Chapters 08-14 | `diagram-review-08-14-second.json`: 17 accepted, 5 retired |
| Chapters 15-21 | `diagram-review-15-21-second.json`: 16 accepted, 2 retired |
| Chapter 22 | `diagram-review-22-followup.json`: bounded replacement accepted |
| Traditional reader text | `traditional-reader-followup.json`: R1-R9 resolved |
| Python adaptations | `python-review.md`, Resolution Recheck: PY-01 through PY-03 resolved |

The extra body observation B1 in the traditional follow-up was corrected by the
narrow `程式碼透過檢查後才能提交` rule and an exact regression case. The book's
invariant occurrences in chapters 13, 17 and 21 were also checked against the
source definition and normalized to `不變條件`, without changing `不變數值/數量`.

No real-reader comprehension experiment was performed. The evidence supports
source fidelity, explanatory-design judgment and tested rendering/interaction,
not a measured learning gain or a claim of universal optimal readability.

## Technical Verification

| Check | Evidence |
| --- | --- |
| Source and anchors | 6 Node tests pass, including paragraph/code anchors and all 44 source hashes |
| Reader Python checks | 10 tests pass: teaching behavior, SVG markers and contextual conversion |
| Translation checks | 6 audit tests pass; protected-content check has zero failures; 25 traditional Markdown files synchronized |
| SVG assets | 212 XML/reference/accessibility checks pass; all source paragraph IDs resolve |
| SVG rendering | All 212 assets rendered in light/dark; zero text-bound, overlap or container-overflow candidates; independent and main-agent screenshot review |
| Production build | 76 pages render successfully |
| Full-page matrix | 300 states pass: 25 reading pages, 3 locales, 1440/390px, light/dark |
| Interaction flows | Figure/code switches, persistence, search, contents, locale change, SVG fit/zoom/download, raster zoom, keyboard focus/Escape |
| Resilience | Failed SVG fallback/retry, modal reload, corrupt preferences, reduced motion, dark 22px text at 320/600/900/1320px, cold mobile deep link, no-JavaScript body |
| Final scoped corrections | 24 chapter-13/17 states pass on Vite preview; rendered B1 wording and mixed-language labels asserted in the interaction suite |
| Development preview | Desktop/mobile smoke test passes without console errors; initial development HTML includes the favicon |

Browser evidence comes from Playwright using installed macOS Chrome, not physical
phones or every browser. Remote GitHub/Amazon links and authentication flows were
not audited. The existing English section remains the repository's public excerpts,
not a newly published copy of the complete EPUB.

Current exact render artifacts:

- `/tmp/aposd2e-viz-accepted`: final 212-asset gallery, SVG/CSS hashes and geometry.
- `/tmp/aposd2e-pages-accepted`: complete 300-state page matrix.
- `/tmp/aposd2e-final-vite-targeted`: final 24-state chapter-13/17 recheck.
- `/tmp/aposd2e-reader-interactions`: interaction screenshots and results.
- `/tmp/aposd2e-reader-resilience`: failure/recovery, breakpoint and deep-link results.
- `/tmp/aposd2e-final-evidence.mjs`: one-off audit checking all SC approval hashes,
  unchanged semantic metadata, original-vector hashes and actual retirements.

## Content Contracts

Teaching metadata is in `docs/.vuepress/reader/diagrams/chNN.json`. Each active item
has an ID, chapter, concrete question/answer, title/summary/alt, visual form, source
references, assets and an insertion anchor. Review history is retained, while
current `status: content-reviewed` and `review.accepted` identify the accepted
content judgment. Only view fields are shipped to the reader.

Supported anchors:

- `{ "section": "N.N", "placement": "end" }`: before the next peer heading.
- `{ "section": "N.N", "paragraph": 3 }`: after the numbered root-level paragraph;
  image paragraphs count and blockquotes do not.
- `{ "section": "intro", "paragraph": N }`: before the first h2, including a
  standalone subtitle in the paragraph count.
- `{ "afterFence": "ch18-f5" }`: after a root-level code fence, using the global
  all-fence ordinal, including quoted fences in the count.
- `{ "intro": true }` or `{ "end": true }`: introductory or closing placement.

SVGs use viewBox, title/desc and scoped IDs. Mobile layouts are reflowed, not merely
shrunk desktop figures. Static diagrams contain no scripts, external resources,
embedded raster or foreignObject. Directed paths are separate where each endpoint
needs a marker. These checks cover trusted repository assets, not arbitrary SVG
sanitization.

Original-vector metadata lives in `reader/figures/`. English labels, meaningful
geometry and source omissions are preserved. Fonts, stroke textures and tiny
flag contours are approximations; diagrams are not pixel-identical raster traces.
Wide original code figures scroll internally at legible size and have SVG zoom.

`localize.py` converts SVG text nodes and selected metadata fields using pinned
OpenCC and the shared contextual rules. It preserves identifiers, geometry and
Python code. Generated traditional files must not be edited manually.

## Reproduce

Use the pinned Python environment described in `review/translation/README.md`.

```sh
node --test review/reader/test_content.mjs
python -m unittest discover -s review/reader -p 'test_*.py'
python review/reader/localize.py --check
python review/reader/verify.py --complete --epub-blocks /path/to/original/blocks.json
python review/translation/audit.py check
python bin/zh-tw.py --check
npm run build
node review/reader/browser.mjs --gallery --output=/tmp/aposd-svg-check
node review/reader/browser.mjs --all-themes --output=/tmp/aposd-page-check
node review/reader/interactions.mjs
node review/reader/resilience.mjs
```

Browser scripts default to `http://127.0.0.1:8084/aposd2e-zh`; override with
`READER_URL`. They use the installed Chrome executable on macOS and put PNGs in
`/tmp` as QA artifacts, never as inline Codex visualization references.

Before the browser commands, keep the production preview running in another terminal:

```sh
node_modules/.bin/vite preview --outDir docs/.vuepress/dist --base /aposd2e-zh/ --host 127.0.0.1 --port 8084 --strictPort
```

The final scoped tests used Vite preview after the basic Python static server
produced intermittent connection resets. Error assertions remained enabled; the
failed attempts were not counted as passing evidence.

Do not run multiple VuePress dev/build processes sharing `.temp`. Start the
development preview only after production verification:

```sh
npm run dev -- --port 8082
```

Before versions are retained under `archive/round1`, `archive/ch22-before-followup`,
`archive/01-07-before-arrows` and `archive/08-14-before-main`, outside served assets.
Review reports and `revisions-*.json` record the actual decisions. Historical work
notes are in `history.md`. No commit, push or deployment was performed.
