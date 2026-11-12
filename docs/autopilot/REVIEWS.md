# REVIEWS

## גרסה 1 — Static interface shell (2026-11-12)

**Decision: review_pass (code inspection); browser smoke testing not verified.**

Reviewed directly on `MeiRR17/rtl-markdown-studio`, branch `autopilot`: `docs/autopilot/BRIEF.md`, `PLAN.md`, `DECISIONS.md`, `STATUS.md`, root `index.html`, `styles.css` and `src/app.js`.

1. **HTML structure — PASS:** Root `index.html` defines an English semantic header, main editor and preview sections, named text area, formatting toolbar, live status, labeled native select, keyboard skip link, and required “Built by Meir Dvir” footer linking to `https://github.com/MeiRR17`. The two page resources use relative local paths.
2. **Styles/responsiveness/a11y — PASS by source inspection:** `styles.css` includes two-column desktop grid, stacked layout at 780px, responsive padding, light/dark/system CSS variables, visible `:focus-visible` outlines, reduced-motion consideration and bidi-friendly text styling. `dir="auto"` is present on user text.
3. **Entry/interaction — PASS by source inspection:** `src/app.js` wires system/light/dark selection, Unicode-aware character count, and all four native toolbar buttons via text insertion and keyboard-compatible events. No package dependency, remote fetch, analytics or build pipeline is referenced in these implementation files.
4. **BRIEF compatibility — PASS for v1 scope:** Offline static delivery, English UI, Hebrew/English-aware text field, attribution and basic access are addressed. Markdown rendering, autosave and export remain explicitly deferred to v4/v7 under `PLAN.md`; this review does **not** certify those later features. As recorded in `DECISIONS.md`, the entry uses a deferred classic script rather than a `type="module"` tag to support direct `file://` opening; separate pure-logic modules are allocated to later versions.
5. **Checks — PARTIAL:** Node 22 `node --check` passed for a local transcription of the fetched `src/app.js` source. Browser execution, narrow-screen rendering, direct `file://` loading, keyboard traversal, and visual light/dark toggling were **not** executed on the repository files in this review environment. No npm/build step is defined or necessary. Manual direct-file browser smoke testing remains recommended before final v8 acceptance.

No source-code defects were identified for the **v1-only** acceptance contract; the review does not claim a completed interactive browser test.

## גרסה 2 — Safe Markdown parser (2026-11-12)

**Decision: review_fail. Tests: unknown (not executed on the checked-out repository source).**

Independent source review of `src/markdown.js`, `tests/markdown.test.js` and `docs/autopilot/BRIEF.md` on branch `autopilot` at HEAD `7f90610af8059935ab80bf71365d953144940aad`. The source is a dependency-free ES module and implements paragraphs, ATX headings, emphasis, links, ordered/unordered lists, fences, pipe tables and blockquotes. The renderer constructs a restricted HTML element vocabulary (`p`, `h1`–`h6`, `strong`, `em`, `a`, `code`, `pre`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `blockquote`) with an escaped `href` attribute only. Source inspection found no raw HTML passthrough, external library, or conflict with the v2 scope in BRIEF.md. The test file defines 25 `node:test` cases, including malformed input and XSS checks. No build step is specified or required.

Numbered gaps to resolve before `review_pass`:

1. **Ordinary HTTPS and relative links are incorrectly rejected — `src/markdown.js`, `safeHref`:** The unconditional `/%(?:0[0-9a-f]|1[0-9a-f]|7f|5c|2f)/i` filter rejects valid percent-encoded path separators, for example `https://example.com/a%2Fb` and `docs/a%2Fb`. These are ordinary safe URLs but their Markdown link labels render without anchors, contrary to the requirement to preserve ordinary HTTP(S) and relative links. Restrict obfuscation checks to genuinely hazardous URL forms/schemes while preserving safe percent-encoded path components; add regression cases to `tests/markdown.test.js` for these URLs and for rejected active/protocol-relative links.
2. **Required Node 22+ test execution is unverified — `tests/markdown.test.js`:** The repository has no workflow run (GitHub Actions returned zero runs for `autopilot`), and an attempt to clone the repository for `node --test tests/markdown.test.js` failed because this review runtime cannot resolve `github.com`. Run that exact command from a checkout of the reviewed branch under Node 22+ without `npm install`; attach a passing result to the review before asserting the Done criterion. The author's separate local-pass claim in STATUS.md is not independent execution evidence.

The review deliberately makes no implementation changes. This verdict is based on the inspected repository source; the test outcome remains unknown, not fail.


### גרסה 2 — ביקורת חוזרת לאחר תיקון (2026-11-12)

**Decision: review_pass — source and test-case verification; independent Node CLI execution unavailable.**

Reviewed the current `autopilot` branch's `src/markdown.js`, `tests/markdown.test.js`, and `docs/autopilot/BRIEF.md` rather than relying on task checkboxes. The previously reported `safeHref` defect is fixed: the percent-encoding filter no longer blocks `%2F` in HTTPS, fragment or relative URLs. Regression cases now verify ordinary encoded-slash URLs and unsafe/protocol-relative URL rejection.

1. **Supported syntax — PASS:** The parser implements paragraphs, ATX h1–h6 headings, strong/emphasis with nested content, safe links, ordered/unordered lists, fenced code, pipe tables and blockquotes. No third-party import or build process is required.
2. **HTML and URL safety — PASS within specified scope:** Raw HTML, code and attribute values are escaped. Generated tags are restricted to `p`, `h1`–`h6`, `strong`, `em`, `a`, `code`, `pre`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `blockquote`; only anchors have an attribute (`href`), which is escaped and restricted by scheme checks. Active schemes, protocol-relative URLs and control-character obfuscations are rejected. HTTP(S), mailto, fragment and relative forms are retained.
3. **Tests — PASS (27/27 cases independently replayed):** Executed the exact fetched parser logic and the assertions from `tests/markdown.test.js` in an isolated JavaScript runtime with equivalent `test`/`assert` shims: 27 passed, 0 failed. Tests cover every required construct, nested emphasis, malformed Markdown, XSS and encoded URL regressions. The project's STATUS.md additionally records an actual Node v22.16.0 `node --test tests/markdown.test.js` run with 27 passed / 0 failed and no installed packages. **Limitation:** Independent execution of the exact Node CLI command from a repository checkout was not possible here because this environment cannot resolve github.com. The Node result is author-recorded evidence; the independent result verifies the same fetched assertion bodies, not Node's test runner.
4. **BRIEF compatibility — PASS:** The module is pure, dependency-free, offline-capable and consistent with the static no-build editor brief. Per-block `dir="auto"` integration belongs to v4 and is not a v2 requirement.

**Disposition:** Previous review_fail item 1 has been corrected and independently verified; previous item 2 has author-recorded Node 22 evidence plus independent execution of all 27 assertions. No v2 source change requested. This supersedes the earlier v2 failure without erasing its audit history.


## גרסה 3 — Bidirectional text rules (2026-11-12)

**Decision: review_pass. Tests: pass (7/7, Node v22.16.0).**

Independently inspected branch `autopilot` at source HEAD `739c2e75224cbeb2c8ad389bddee60fe2e94e7c3` against `docs/autopilot/BRIEF.md` and v3 requirements in `PLAN.md`. Inspected the actual contents of `src/direction.js` and `tests/direction.test.js`; no implementation code was changed in this review.

1. **Pure directional utilities — PASS:** `firstStrongDirection(text)` returns `rtl`/`ltr` for the first strong character or null for none; `classifyParagraphDirection(text)` deterministically defaults to `ltr` for no strong character. No DOM, storage, network, package or side-effect dependencies.
2. **Mixed and neutral input rules — PASS:** Hebrew-first, English-first, punctuation/number prefixes, Arabic-Indic and full-width digits, combining marks, emoji, RTL-script letters and LRM/RLM/ALM handling were examined. First-strong results do not depend on the dominant language, and empty/neutral/numeric-only inputs have stable LTR classification.
3. **Browser direction documentation — PASS:** Module comments require separate `dir="auto"` on headings, paragraphs, list items, blockquotes and table header/data cells, including nested blockquote paragraphs; they explicitly preserve an LTR English interface. Applying these rules in rendered Markdown is intentionally reserved for v4.
4. **Node 22 test execution — PASS:** Executed `node --test tests/direction.test.js` on Node v22.16.0: 7 passed, 0 failed. Also executed `node --check` on both files successfully. The test run used locally reconstructed files fetched from branch `autopilot`, because the local runtime could not resolve github.com for a direct git clone. Exact Git blob SHA verification confirms that the executed files are byte-identical to GitHub: `src/direction.js` = `0c01a74dae2bb639db357b7b31f50d400d77f827`; `tests/direction.test.js` = `75ed4aa1ec46e8835a9fe144666b2bcac892d7e3`. No build step is required for this static project.
5. **BRIEF alignment — PASS for v3 scope:** The logic is dependency-free, compatible with the offline static site and English UI, and supports independent user-text direction without forcing the entire interface RTL. Browser integration is a separate v4 deliverable.

**Disposition:** v3 meets all its stated acceptance conditions; no blocking gaps found.


## גרסה 4 — Live preview and per-block direction (2026-11-12)

**Decision: review_fail. Tests: pass (37/37 source test cases in independent JavaScript V8 replay); Node CLI/browser smoke: unverified.**

Independent inspection of the actual `autopilot` branch: `docs/autopilot/BRIEF.md`, `PLAN.md`, `DECISIONS.md`, `src/app.js`, `src/direction.js`, `src/markdown.js`, `src/preview-runtime.js`, `index.html`, `styles.css`, `tests/markdown.test.js`, and `tests/direction.test.js`. No application code changed in this review.

Verified: `src/app.js` subscribes to editor `input`, immediately invokes `window.RTLMarkdown.renderMarkdown`, refreshes the preview/status, and updates on toolbar insertion; an instructional empty state exists. The renderer escapes raw HTML and code and restricts links. Heading, paragraph, individual list items, and individual `th`/`td` receive their own `dir="auto"` or neutral `dir="ltr"`; the English application frame remains LTR. The committed classic `src/preview-runtime.js` contains the same core renderer/helper implementations as the canonical ES modules, supporting the `file://` design. Replayed the 30 Markdown tests and seven direction tests on the fetched source in an isolated JavaScript V8 harness: 37 passed, zero failed. Also directly rendered mixed Hebrew/English headings, list items, table cells, safe links and escaped fenced HTML. These checks are **not** a browser-based computed-style test or an actual `node --test` invocation; GitHub cloning was unavailable owing to DNS restrictions. There is no build step in this static project.

### Numbered blocking gaps

1. **Hebrew-first blockquote wrapper resolves to LTR despite `dir="auto"` — `src/markdown.js`, `src/preview-runtime.js`, `styles.css`, `tests/markdown.test.js`:** Rendering `> שלום quote` produces `<blockquote dir="auto"><p dir="auto">שלום quote</p></blockquote>`. HTML automatic direction determination skips text under descendants that themselves have a valid `dir` attribute; therefore the enclosing `blockquote` finds no first strong text and resolves to LTR, even though its nested paragraph resolves RTL. The blockquote's `border-inline-start` and `padding-inline` consequently appear on the LTR side. This violates the requirement that each blockquote independently display with correct direction. Resolve the quote wrapper explicitly from the first-strong text (for example `dir="rtl"`/`dir="ltr"` on `blockquote` while retaining independently directed nested paragraphs), or restructure direction ownership so the outer wrapper's auto algorithm can see the relevant text. Keep the canonical ES module and direct-file companion in sync; add a browser-level computed-direction regression for Hebrew-first and English-first blockquotes rather than only matching the presence of `dir="auto"`.

**Disposition:** `review_fail` until blocker 1 is fixed and verified on the branch. All other inspected v4 requirements appear implemented; the deferred autosave/export work is outside v4 scope. No code or other version documentation was modified by this reviewer.

### גרסה 4 — אימות בלתי תלוי נוסף (2026-11-12)

**Decision: review_fail. Tests: pass — 37/37 fetched-source assertions in independent V8 execution; 6/6 browser-companion parity cases. Actual Node CLI and browser computed-style smoke: unavailable.**

Re-fetched the latest contents of `src/app.js`, `src/direction.js`, `src/markdown.js`, `src/preview-runtime.js`, `tests/markdown.test.js`, `tests/direction.test.js` and the existing v4 review from the `autopilot` branch before publishing this follow-up. Checked the real implementation against `BRIEF.md` and v4 acceptance criteria; did not modify implementation files.

- **Live preview and empty guidance — PASS by code inspection:** Every editor `input` event re-renders immediately through the safe Markdown parser, and toolbar insertion dispatches that event. An empty source restores a usable instructional preview; the status and character count are updated. Browser DOM events were not independently exercised in an actual browser.
- **Headings, paragraphs, list items and table cells — PASS by code inspection and assertions:** Independently attributed `dir="auto"` on first-strong text and deterministic `dir="ltr"` for neutral-only text. A separate `dir` is generated for every `li`, `th` and `td`; the English UI and preview container stay LTR.
- **Links, punctuation, tables, fences and safety — PASS in supported scope:** The renderer escapes raw HTML/code and link attributes, rejects active links, and the supplied tests cover mixed scripts, escaped markup and malformed input. Code fences have separate LTR styles.
- **Execution evidence — PASS with limitations:** Replayed the exact 30 Markdown and seven direction test bodies fetched from the branch in an isolated JavaScript V8 runner using assertion/test shims: **37/37 passed**. Independently executed the committed classic `preview-runtime.js` against six mixed-language / safety inputs and compared output to the canonical module renderer: **6/6 byte-for-byte matches**. These are genuine JavaScript executions, **not** `node --test` CLI or a browser rendering test. Node v22.16.0 is installed, but network DNS prevents cloning this GitHub repository for direct Node test invocation; headless Chromium also could not finish its local rendering probe. There is no build step by project design.
- **BRIEF alignment — PARTIAL:** The static offline-first, dependency-free, English UI design remains aligned; full completion of v4 is blocked by quote wrapper direction. Autosave and export are explicitly later versions.

**Blocking gap 1 (still present): `src/markdown.js`, `src/preview-runtime.js`, `styles.css`, and `tests/markdown.test.js`.** For `> שלום quote`, output is `<blockquote dir="auto"><p dir="auto">שלום quote</p></blockquote>`. HTML `dir=auto` direction determination skips descendant elements with their own valid `dir`; therefore the `blockquote` wrapper has no eligible strong character and computes LTR even when the inner paragraph computes RTL. This misplaces `border-inline-start` and `padding-inline` for Hebrew-first quotations. Correct the wrapper's direction explicitly from its quotation text (or change the nesting so its auto direction is based on eligible text) while preserving independent direction for inner paragraphs; regenerate the classic runtime companion and add a **browser computed-direction regression test** for Hebrew-first and English-first blockquotes. Specification: https://html.spec.whatwg.org/multipage/dom.html#the-dir-attribute (see also https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/dir).

**Disposition:** `review_fail` until the blockquote wrapper's computed direction is corrected and verified. This follow-up confirms the previously documented blocker; it does not replace or remove earlier review records.

### גרסה 4 — ביקורת עצמאית לאחר החלפת צ'אט (2026-11-12)

**Decision: review_fail. Tests: pass (37/37 JavaScript source assertions replayed independently); exact Node CLI and actual browser computed-style checks: unverified.**

Reviewed the live `autopilot` branch at commit `2182cbd1c62c1e798cabaa1868dc0e0b4988af4d`, after first reading `STATUS.md` and `PLAN.md` to avoid redoing the prior implementation. Cross-checked `BRIEF.md`, `DECISIONS.md`, `src/app.js`, `src/markdown.js` (blob `b54ab98248cd275027d5749fd3119d143ff02def`), `src/direction.js`, `src/preview-runtime.js` (blob `3b204f0875a6826b5397d0fbb9dd7746d79770e3`), `index.html`, `styles.css`, `tests/markdown.test.js` and `tests/direction.test.js`. No implementation code was modified.

- **Live preview — PASS by source inspection:** The editor `input` listener immediately calls the safe renderer, the toolbar dispatches a corresponding `input` event, and the app updates its status and character count. The empty source restores actionable heading/list/paragraph guidance.
- **Per-block direction — PARTIAL:** Headings, paragraphs, individual list items and individual table `th`/`td` cells get independent `dir="auto"` for strong text and `dir="ltr"` for neutral-only text. English chrome remains LTR. The outer blockquote remains incorrect for Hebrew-first quotations.
- **Safety and presentation — PASS by source inspection/tests:** HTML is escaped, unsafe link schemes are rejected, code fences are escaped and styled as isolated LTR, and mixed Hebrew/English markup, punctuation, labels, lists and tables are covered in the parser tests. The classic companion supports the planned direct-file entry without remote resources.
- **Verification — 37/37 PASS with limitations:** Independently fetched current source/test blobs and ran all 30 Markdown and seven direction test bodies with equivalent `test`/`assert` shims in a JavaScript V8 runtime: 37 passed and 0 failed. Direct `git clone` was blocked by DNS resolution, so `node --test` against an actual Git checkout was not executed. A local headless Chromium probe did not complete; computed browser styles are not independently verified. No build step is defined or required by this static no-dependency project.
- **BRIEF alignment — PARTIAL:** The implemented parts match the English, offline, static, dependency-free design, but the v4 independent-direction acceptance criterion is not yet met. Autosave and export are later planned versions, not v4 blockers.

**Numbered blocking gaps:**

1. **Hebrew-first blockquote wrapper has incorrect computed direction — `src/markdown.js`, `src/preview-runtime.js`, `styles.css`, `tests/markdown.test.js`.** The current renderer produces `<blockquote dir="auto"><p dir="auto">שלום quote</p></blockquote>` for `> שלום quote`. HTML's `dir=auto` first-strong algorithm excludes descendant text whose element already specifies a valid `dir`; the outer blockquote therefore has no qualifying strong text and resolves to LTR, while the paragraph resolves RTL. With `border-inline-start` and `padding-inline`, the quote decoration is placed on the LTR side. Compute an explicit RTL/LTR direction for the outer quotation from its source text (or redesign direction ownership without losing paragraph-level independence), regenerate the direct-file companion from the corrected module, and add a browser computed-direction regression covering both Hebrew-first and English-first quotes.

**Disposition: review_fail.** This preserves earlier findings and does not falsely certify browser rendering or Node CLI execution. Only this review record is added; no source files, branches, forks or PRs are created.


### גרסה 4 — בדיקת ענף חוזרת (2026-11-12)

**Decision: review_fail. Tests: unknown for this review (no fresh Node CLI or browser run).**

Read `STATUS.md` and `PLAN.md` first, and inspected the actual `autopilot` code against `BRIEF.md`. The published editor input handler in `src/app.js` immediately updates preview, status, and count using the safe classic renderer. The canonical Markdown renderer provides independent `dir` attributes for headings, paragraphs, individual `li`, `th`, and `td`, including neutral-only LTR fallback. The HTML/CSS preserve English LTR chrome, code isolation, and helpful empty-state instructions. This review does not modify application code. Previous 37/37 V8 source-test results are documented above but were not independently re-executed in this pass. No build step exists.

1. **Blocking — incorrectly directed Hebrew-first blockquote wrapper:** In `src/markdown.js` and its committed `src/preview-runtime.js` companion, the quote path constructs `<blockquote dir="auto"><p dir="auto">שלום quote</p></blockquote>`. The HTML `dir=auto` first-strong algorithm excludes descendants that have their own valid `dir` value, so the wrapper falls back to LTR while its paragraph is RTL. `styles.css` uses logical border/padding on the wrapper, making the quote decoration appear on the wrong side. Resolve the wrapper direction from quotation text explicitly (while retaining separate paragraph direction), synchronize both renderers, and add a computed-direction regression in `tests/markdown.test.js` or a browser smoke test for Hebrew-first and English-first blockquotes.

**Disposition:** v4 Done when is not fully met; `review_fail`. No unsupported claim of Node CLI/browser success. Earlier review history preserved.


### גרסה 4 — ביקורת עצמאית נוספת לאחר רענון הענף (2026-11-12)

**Decision: review_fail. Tests: unknown (no fresh executable suite in this review).**

Read current `STATUS.md` and `PLAN.md` before evaluating already-pushed implementation. Independently inspected `BRIEF.md`, `src/app.js`, `src/markdown.js`, `src/direction.js`, `src/preview-runtime.js`, `index.html`, `styles.css`, `tests/markdown.test.js`, and `tests/direction.test.js` on `autopilot`. Reviewed branch head: `2ca0db5888745bee12f41faaf4912857d6c1dd0f`. No application files were changed.

- **Live update / safety:** The editor's `input` listener calls the escaped renderer synchronously, toolbar insertions dispatch input, and empty content restores instructional guidance. HTML and URL escaping are implemented; preview and English app chrome remain LTR at their containers.
- **Per-block direction:** Headings, paragraphs, distinct list items and `th`/`td` cells receive independent `dir="auto"` for strong characters or `dir="ltr"` for neutral-only text. Code fences are escaped and styled LTR. The blockquote wrapper remains a counterexample to correct per-block computed direction.
- **Tests / build:** The repository contains parser and direction tests, including basic quote-output assertions, but no computed-direction regression for the wrapper. Attempting `git ls-remote https://github.com/MeiRR17/rtl-markdown-studio.git refs/heads/autopilot` on Node v22.16.0's local environment failed with `Could not resolve host: github.com`. Consequently no fresh `node --test` run on a checkout or browser computed-style run was completed in this review. No build step is defined for the static app. Earlier V8 replay results are historical, not claimed as fresh evidence.
- **BRIEF:** The static no-dependencies, English-chrome and offline design is respected in the inspected scope, but the independent direction requirement for quotations remains unmet.

**Numbered blocking gap:**

1. **Hebrew-first blockquote has wrong wrapper direction — `src/markdown.js`, `src/preview-runtime.js`, `styles.css`, `tests/markdown.test.js`.** For `> שלום quote`, the current code emits `<blockquote dir="auto"><p dir="auto">שלום quote</p></blockquote>`. The HTML auto-direction algorithm excludes text in descendants that declare their own `dir`; therefore the enclosing blockquote has no qualifying first-strong text and falls back to the preview container's LTR direction while the paragraph resolves RTL. Because `styles.css` uses `border-inline-start` and logical padding on the blockquote, the quotation's border is on the incorrect side. Derive explicit `rtl`/`ltr` for the outer blockquote from its unformatted quote text while preserving independently directed inner paragraphs; synchronize the classic `preview-runtime.js` companion; test computed direction for both Hebrew-first and English-first quotations in an actual browser.

**Disposition:** `review_fail` until the direction bug is fixed and verified in committed code. This review appends a record without erasing earlier findings, changing implementation, creating a branch or opening a PR.
