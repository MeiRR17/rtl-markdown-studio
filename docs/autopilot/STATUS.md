# STATUS

Overall: **Planning complete; implementation not started.** Branch: `autopilot`. Repository initially contained only a minimal `README.md`; no application implementation, tests, license or release evidence was present when this plan was created. All eight versions are pending, with **0/8 completed**. No implementation tests have been run.

## v1 — Static interface shell
Done: Added root `index.html` (semantic English controls, editor, formatting toolbar, preview guidance, theme selector, live status, linked author footer), `styles.css` (light/dark/system palettes, desktop two-pane layout, stacked mobile rules, focus visibility and bidi-friendly text) and `src/app.js` (theme switching, character count and keyboard-operable Markdown insertion controls). All three files have been committed to `autopilot`.
Verification: JavaScript syntax check passed on Node 22. Static assets are all relative; no packages, build system or remote resources are required. Automated browser smoke testing was attempted but the execution environment blocked navigation to both file:// and localhost, so interactive browser acceptance remains unverified in this environment.
Remaining: No implementation tasks for v1; direct-file browser smoke check is deferred to a browser without this environment restriction.
State: implemented; browser smoke unverified.

## v2 — Safe Markdown parser
Done: Implemented `src/markdown.js`, a dependency-free ES module exposing `renderMarkdown`, `markdownToHtml`, and `safeHref`; covers paragraphs, ATX headings, emphasis, safe links, ordered/unordered lists, fenced code blocks, pipe tables and blockquotes with HTML and attribute escaping. Added `tests/markdown.test.js` with 27 Node tests, including XSS and malformed-input cases.
Review remediation (2026-11-12): Fixed `safeHref` so valid percent-encoded slashes (`%2F` / `%2f`) survive in HTTPS, relative and fragment URLs. Two new regression tests verify accepted paths and continued rejection of dangerous schemes/protocol-relative links.
Verification: Actual `node --test tests/markdown.test.js` on a reconstructed checkout of the v2 files, Node v22.16.0, 27 passed / 0 failed, no installed packages. `node --check src/markdown.js` also passed. No build command or build configuration exists: this is a static no-build project. Direct GitHub cloning failed locally due to DNS, so the checkout was reconstructed from the connector-fetched branch files; the exact command was not run on a git-cloned tree.
Remaining: No v2 implementation tasks; reviewer may independently repeat tests from GitHub.
State: version implemented and patched; Node 22 tests pass; awaiting independent review.

## v3 — Bidirectional text rules
Done: Added pure ES module `src/direction.js` with `firstStrongDirection` (first Unicode strong RTL/LTR character or null) and `classifyParagraphDirection` (deterministic LTR fallback for empty, punctuation-only and numeric-only text). It handles Hebrew/English mixtures, common RTL scripts, Unicode combining marks, emoji, Arabic-Indic digits, and explicit LRM/RLM/ALM markers. Module comments specify independent browser `dir="auto"` placement for headings, paragraphs, list items, blockquotes and table cells while retaining LTR English interface chrome. Added `tests/direction.test.js` with seven independent test cases.
Verification: On Node v22.16.0, `node --test tests/direction.test.js` passed 7/7 with 0 failures; `node --check` passed for both files. No build command is defined or needed for this dependency-free static site. Direct GitHub cloning from the local test environment failed due to blocked DNS; the byte-identical test/source files were validated against their Git blob SHAs before publication.
Remaining: No v3 implementation tasks. Integration into Markdown rendering and browser preview belongs to v4.
State: implemented, tested and committed to `autopilot`.

## v4 — Live preview and per-block direction
Done: The editor immediately renders safely escaped Markdown through the offline-compatible classic browser runtime. Per-block heading, paragraph, list-item and table-cell direction is preserved; neutral content falls back to LTR, English application chrome stays LTR. **Review-fail remediation (2026-11-13):** Both the canonical ES-module renderer and the direct-file browser runtime now resolve the blockquote wrapper to an explicit first-strong `dir="rtl"` or `dir="ltr"` rather than `dir="auto"`. The nested paragraph keeps its own direction attribute. This lets the existing logical `border-inline-start` styling draw the quote border on the proper side.
Verification: Six Hebrew-first, English-first, markup-containing and neutral-only quote cases passed in a V8 JavaScript functional harness, with exact parity between canonical and browser renderers. Extended `tests/markdown.test.js`, added `tests/preview-runtime.test.js` covering runtime parity, and published `tests/blockquote.browser.html` / `tests/blockquote.browser.js`, a direct-file, dependency-free real-browser regression that asserts computed quote/paragraph direction and the physical side of the logical border for Hebrew-first, English-first, punctuation-first and neutral quotations. These tests were committed but a full `node --test` execution and real browser visual smoke check are **not verified** in this environment (GitHub clone unavailable due to DNS). No build configuration or build step exists; the application is served as static files.
Remaining: Execute `node --test` on Node 22+ and open `tests/blockquote.browser.html` in Chromium/Firefox to verify all four computed-style checks report PASS; those executions are not claimed here.
State: v4 implementation complete and published to `autopilot`; outstanding external execution evidence documented.

## v5 — Local autosave core
Done: Storage interface, failure handling and test cases specified.
Remaining: `src/storage.js`, `tests/storage.test.js` and verified test results.
State: pending.

## v6 — Standalone HTML export core
Done: Self-contained export contract and safety tests specified.
Remaining: `src/export.js`, `tests/export.test.js` and verified test results.
State: pending.

## v7 — Autosave, export and interaction integration
Done: Integration boundaries and acceptance criterion defined.
Remaining: Autosave/reload, export download, theme persistence and accessible mobile interactions; requires v4, v5 and v6.
State: pending.

## v8 — Portfolio release and acceptance
Done: Publication requirements and release checks specified.
Remaining: Complete English README, MIT LICENSE, Node 22+ test run, manual offline/responsive/accessibility checks and repository hygiene inspection; requires v7.
State: pending.

## Coordination
Only `autopilot` is used; do not open PRs or create forks/other branches. Independent v1, v2, v3, v5 and v6 may be executed concurrently **only** because their file paths do not overlap. Re-read the latest branch head before writing or pushing; preserve other chats' work. Each implementation owner must update its own completed checkboxes in PLAN.md and report grounded progress in STATUS.md after pushing, without reverting concurrent changes. A version is complete only when its Done when condition is verified in committed code.
