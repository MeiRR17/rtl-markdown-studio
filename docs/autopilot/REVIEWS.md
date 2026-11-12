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
