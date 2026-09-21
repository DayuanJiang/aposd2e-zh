# Historical Reader Checkpoints

These are historical progress notes. See `README.md` for current acceptance.
Pending statements below describe their checkpoint, not the current status.

## Scope and Current State

The reader retains VuePress, existing routes, original Markdown and raster figures.
The new presentation follows the local Software-Engineering-at-Google reader.
The ch04 pilot has working desktop/mobile layouts, theme and font controls,
original/Python examples, chapter search, local contents, and SVG zoom/download.
Pilot fixes: heading-anchor colors, DOM-derived contents, narrow-screen code margins,
and a real favicon. Full-book acceptance remains pending.

The current request adds two independent layers:

- Faithful vector reproductions of all 12 original content-image resources
  (including the formula and warning icon). The cover remains the supplied raster.
  Original files remain available through a persistent original/vector preference.
- Section-level explanatory diagrams throughout all 22 chapters, followed by
  independent source-grounded agent review and actual revisions.

No real-reader comprehension experiment has been performed. Agent judgments,
static checks, screenshots, and interaction tests are separate evidence categories.

## Teaching Diagram Contract

Metadata lives in `docs/.vuepress/reader/diagrams/chNN.json`, an array per chapter.
Each item has `id` (`chNN-topic`), `chapter`, `title`, `question`, `answer`,
`summary`, `alt`, `kind`, `desktop`, `mobile`, `anchor`, `sources`, and `status`.
`anchor` is `{ "section": "N.N", "placement": "end" }` or `{ "intro": true }`.
It refers to the existing numbered heading, never a translated heading string.
Section-end diagrams follow the argument they explain, before the next heading.
For closer placement, use `{ "section": "N.N", "paragraph": 3 }`: the 1-based
root-level paragraph ordinal within that section, excluding blockquotes. Image
paragraphs count. `{ "section": "intro", "paragraph": N }` addresses paragraphs
before the first level-2 heading (including a standalone subtitle).
Use the Markdown token stream to select the intended paragraph in both locales;
do not guess the ordinal from blank lines. `{ "end": true }` is chapter end.
`{ "afterFence": "ch18-f5" }` inserts immediately after a root-level code fence,
using the same all-fence ordinal as the example inventory (including quoted fences
in the count). Quoted fences cannot be insertion targets.
`sources` contains concrete section/EPUB paragraph references and the reasoning
supported by those passages. Teaching inventions must be explicitly identified.
Retired items are removed from the active metadata, not merely marked disabled.

Assets live in `docs/.vuepress/public/diagrams/chNN-topic.svg` and
`chNN-topic-mobile.svg`. Preserve editable SVG source; no embedded raster, script,
event attributes, external resources, or `foreignObject`.
Use scoped IDs, viewBox, title/desc, and chapter-specific markers.
Use the existing semantic CSS variables with standalone fallback colors.
Desktop is normally 680 units wide; mobile normally 360, with genuinely reflowed
geometry and readable labels, not just a scaled desktop chart.
Diagrams must reveal a relation, contrast, decision, dependency, or trace.
More diagrams are useful only when each answers a different concrete question.

## Original Figure Contract

Metadata lives in `docs/.vuepress/reader/figures/*.json`, arrays are allowed.
Each entry has `id` (original numeric filename), `original` (filename with extension),
`vector` (`/figures/NNNNN.svg`), `alt`, `kind` (`figure`, `formula`, or `icon`),
`width`, `height` (SVG viewBox), `source`, and `fidelityNotes`.
Assets live in `docs/.vuepress/public/figures/NNNNN.svg`.
Preserve all meaningful original labels, links, arrows, relative geometry and
qualitative curves. Do not repair author claims silently. Keep English labels
where they occur in the original; Chinese captions remain in the body.
Do not infer quantitative values from qualitative curves.
Original figures may remain horizontally scrollable/zoomable at legible size on
mobile, because faithfully reproducing their layout is different from rewriting
the explanatory teaching layer.

## Acceptance Still Required

1. Inventory and source comparison for every recreated original figure.
2. Independent per-diagram keep/revise/replace/retire review.
3. Implemented review decisions, with recoverable pre-review copies.
4. Static XML/reference/source checks and production build.
5. All chapters and diagrams checked in desktop/mobile, light/dark rendering.
6. Original/vector switch, code modes, search/navigation, modal interactions,
   persistence, failed loads and fallback behavior.
7. Translation protection audit and generated traditional Chinese synchronization.

## Implementation Checkpoint

- 61 teaching diagrams across all 22 chapters; 122 simplified-Chinese desktop/mobile
  SVGs are present. Per-chapter counts range from 2 to 5, based on distinct questions.
  These are drafts, not an accepted retention target.
- All 12 original content resources have editable SVG reproductions. First geometry
  review caught clipping in 00010/11/12/14; their author added margins and relaxed
  HTTP line spacing without changing labels or relationships. Independent fidelity
  review is still in progress.
- Original/vector preference defaults to SVG, persists, and falls back to raster on
  failed image load. Original files and Markdown references remain unchanged.
- Shared SVG modal supports zoom, fit, download, Escape and focus restoration for
  both teaching and recreated original figures. Wide original code figures keep
  a legible internal scrolling width. Modal is client-only to avoid teleport-to-body
  SSR hydration mismatch found during production-page testing; retest pending.
- 4 Node tests pass for anchor placement and all 44 original/Python source locks.
  Static verifier checked 134 SVGs, all source paragraph IDs, and 44 Python ASTs.
  These checks do not establish semantic fidelity, visual readability or learning.
- Production builds render 76 pages. Development servers were stopped before
  production browser QA to prevent shared temporary-directory contention.
  Build preview is currently served locally on port 8084 under `/aposd2e-zh/`.
  Server liveness must be rechecked after a context transition.
- `localize.py` is prepared for deterministic traditional-Chinese labels; run only
  after draft authors finish to avoid simultaneous metadata writes.
- `browser.mjs --gallery` captures every SVG layout in light/dark and flags text
  bounds/overlap candidates for manual adjudication. `browser.mjs` checks all
  simplified/traditional chapter pages in desktop/mobile.
- `interactions.mjs` exercises figure toggles, raster/vector modal behavior,
  download, preferences, code modes, search, local contents and mobile overflow.
  No complete passing run yet after integration.

## Commands

```sh
node --test review/reader/test_content.mjs
python review/reader/localize.py
python review/reader/localize.py --check
python review/reader/verify.py --complete --epub-blocks /path/to/original/blocks.json
python review/translation/audit.py check
python bin/zh-tw.py --check
npm run build
READER_URL=http://127.0.0.1:8084/aposd2e-zh node review/reader/browser.mjs
node review/reader/browser.mjs --gallery
node review/reader/interactions.mjs
```

Use the pinned OpenCC environment from translation QA for Python commands.
Browser scripts require the installed Chrome executable on macOS and store images
under `/tmp` solely as QA artifacts, never as Codex inline-visualization references.

## Independent Review and Revision Checkpoint

The main independent round reviewed all 61 first drafts:
18 keep, 26 revise, 5 replace, 12 retire. See `diagram-review-01-07.json`,
`diagram-review-08-14.json`, and `diagram-review-15-22.json`.
The latter two reports use a `records` array; the first is directly an array.
Reviewers read all their source chapters, SVGs and desktop/mobile light/dark sheets.
Several late author edits differed from the initial snapshot; those differences
were reported rather than treating stale screenshots as current evidence.

All 12 retired IDs are now absent from the active manifests. There are currently
50 active diagrams, including a newly designed bounded chapter-22 example. This
count is an intermediate state, not a retention quota or completion claim.
Chapter 01-07, 08-14 and 15-21 writers are implementing the main review decisions;
their second independent passes and final integration checks remain pending.
Do not run `localize.py` while these writers are still editing metadata.

Recoverable first drafts are in `/tmp/aposd2e-viz-review-round1/{metadata,assets}`.
Some unique earlier 08-14 versions are also in `review/reader/archive/`, outside
the served public directory. Original book images have never been removed.

Chapter 22's two general-purpose flowcharts were retired. The replacement
`ch22-startup-contract` received its own independent revise verdict, then a keep
verdict after clarifying desired requirements versus assumptions and identifying
the configuration input. Its mobile height was reduced without shrinking the
event labels. Exact evidence:

- `diagram-review-22-replacement.json`: initial replacement findings.
- `diagram-review-22-followup.json`: all required findings resolved, exact hashes.
- `/tmp/aposd2e-ch22-before-followup`: recoverable initial replacement.
- `/tmp/aposd2e-ch22-followup`: current paired screenshots and SVG/CSS hashes.
- `revisions-22.json`: actual removal/replacement/follow-up actions.

The 12 original vector reproductions independently received keep verdicts in
`original-figure-review.json`. The review's mobile interaction gap was subsequently
covered by main-agent production tests, not retroactively attributed to the reviewer.

### Technical Evidence So Far

- One production pass checked 88 chapter views: all 22 chapters, simplified and
  traditional pages, 1440px and 390px. All expected teaching diagrams and every
  original-image replacement were present; no broken images, duplicate IDs,
  document overflow, console errors or HTTP errors. This pass predates the main
  explanatory revisions and does not accept the current final content.
- `interactions.mjs` passed original/vector toggle and persistence, native raster
  zoom, vector zoom/fit/download, Escape/focus restoration, code modes, search,
  local contents, locale change and mobile wide-figure scrolling.
- The SSR hydration defect was fixed with `ClientOnly` around modal teleports.
  Screenshot review then found oversized Python notes and an unreadable transient
  theme frame; note specificity and synchronized background switching were fixed,
  and the interaction test passed again with explicit style assertions.
- Node tests now total 5, including paragraph-level insertion anchors.
- Python example review found 1 P2 and 2 P3 issues; all were resolved by accurate
  notes/labels without changing the teaching code. `python-review.md` contains
  independent resolution checks, and `test_examples.py` passes 4 runtime tests.
- `browser.mjs` has since been expanded to all 25 reading pages in all three
  locales (150 desktop/mobile views; 300 with `--all-themes`). This expanded suite
  has not run yet. It also checks current chapter navigation, which may expose a
  root `/index.html` versus `/` normalization issue; verify rather than assume.
- `resilience.mjs` is newly prepared but not run: failed SVG fallback/retry,
  modal reload, corrupt preferences, reduced-motion raster zoom, large text at
  four breakpoints, and JavaScript-disabled reading.
- Formula display is enlarged, and failed vector images now remount on toggling
  to permit retry. These most recent changes still need final production retest.

### Remaining Acceptance

1. Receive all three revision batches, inspect real changes, and rerender with
   unique output directories plus recorded input hashes.
2. Run independent second passes against the revised files, resolving findings
   rather than accepting only the authors' own review statuses.
3. Regenerate traditional SVG text/metadata/Python notes and check their geometry,
   source-language equivalence and paragraph anchors.
4. Update interaction fixtures away from retired `ch04-depth`; use a retained
   diagram such as `ch04-common-path`.
5. Run complete static/translation checks, production build, expanded page and
   resilience suites; inspect the final screenshots and fix all actionable issues.
6. Verify retired assets are absent from both public source and built output.
7. Restart one development preview server after production checks, avoiding two
   VuePress processes sharing `.temp`. No commits, pushes or deployment requested.

The production preview process on port 8084 serves `/tmp/aposd2e-preview`, whose
`aposd2e-zh` symlink points at `docs/.vuepress/dist`. It currently shows the older
pre-main-revision build and must not be represented as the accepted final version.
