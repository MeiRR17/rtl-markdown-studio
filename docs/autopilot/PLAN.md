# PLAN
מטרה: ליצור עורך Markdown סטטי, מהוקצע, נגיש ופרטי, עם תצוגה חיה התומכת בעברית ובאנגלית מעורבות, שמירה אוטומטית וייצוא HTML עצמאי.

## v1 — Static interface shell
repo: MeiRR17/rtl-markdown-studio
after: none
- [x] Create root `index.html` with semantic English-language editor, preview, toolbar, theme control, status text and linked author footer; use only relative local assets and native controls.
- [x] Create `styles.css` with polished responsive two-pane desktop layout, usable stacked mobile layout, light/dark palettes, visible keyboard focus, and bidirectional-friendly typography.
- [x] Create `src/app.js` as the browser entry module to wire accessible initial controls and theme choice without any external dependency.
Done when: `index.html` opens directly as a styled, responsive, keyboard-navigable local page with working light/dark control and the required footer; no remote requests, npm or build step are needed.

## v2 — Safe Markdown parser
repo: MeiRR17/rtl-markdown-studio
after: none
- [x] Implement a from-scratch pure Markdown-to-HTML ES module in `src/markdown.js` supporting paragraphs, ATX headings, bold/italic emphasis, safe links, ordered/unordered lists, fenced code blocks, pipe tables and blockquotes.
- [x] Escape raw HTML and code content, escape attribute values, and reject active/unsafe link schemes while preserving ordinary http(s), mailto, fragment and relative links.
- [x] Add `tests/markdown.test.js` using `node:test` for every supported construct, nested/combined inline content, malformed input and XSS regressions.
Done when: `node --test tests/markdown.test.js` passes on Node 22+ without installed packages and generated markup uses only safe supported elements and attributes.

## v3 — Bidirectional text rules
repo: MeiRR17/rtl-markdown-studio
after: none
- [x] Create `src/direction.js` with pure utilities that classify paragraph-level text direction using the first strong directional character and handle neutral/numeric-only text deterministically.
- [x] Create `tests/direction.test.js` covering Hebrew-first, English-first, mixed strings, punctuation, digits and empty inputs.
- [x] Specify in module comments how the browser's `dir="auto"` behavior applies separately to headings, paragraphs, list items, blockquotes and table cells without forcing the English interface RTL.
Done when: `node --test tests/direction.test.js` passes on Node 22+ and module behavior is deterministic for mixed Hebrew/English and neutral-only inputs.

## v4 — Live preview and per-block direction
repo: MeiRR17/rtl-markdown-studio
after: v1, v2, v3
- [ ] Connect editor input to the parser from `src/app.js` so the preview updates immediately and safely for every edit; provide meaningful empty-state guidance rather than placeholder sections.
- [ ] Integrate `src/direction.js` in `src/markdown.js` (or its rendering boundary) so each rendered heading, paragraph, list item, blockquote and `th`/`td` independently receives `dir="auto"` or an equivalent correct computed direction.
- [ ] Update `index.html`, `styles.css` and parser tests as necessary to ensure mixed-direction text, punctuation, link labels, lists, tables and code fences render legibly without changing English UI flow.
Done when: editing supported Markdown immediately changes an HTML preview and different Hebrew-first/English-first blocks—including separate list items and table cells—display with independently correct direction.

## v5 — Local autosave core
repo: MeiRR17/rtl-markdown-studio
after: none
- [ ] Implement `src/storage.js` as pure/testable storage helpers with an injected Storage-compatible interface, a namespaced key, safe load/save and graceful handling of unavailable or quota-limited localStorage.
- [ ] Add `tests/storage.test.js` for new drafts, replacement, malformed persisted data and exceptions; never send or persist user content outside localStorage.
Done when: `node --test tests/storage.test.js` passes on Node 22+ without a browser or packages and module failures return safe results rather than crashing.

## v6 — Standalone HTML export core
repo: MeiRR17/rtl-markdown-studio
after: none
- [ ] Implement `src/export.js` as a pure ES module that produces a complete UTF-8 HTML document from safe rendered Markdown with embedded responsive typography and bidirectional styles.
- [ ] Keep exported HTML entirely self-contained (no network dependencies, external assets, scripts or trackers), preserving per-block direction and safely escaping title/document metadata.
- [ ] Add `tests/export.test.js` for document structure, Hebrew/English content, direction markers, safe metadata and absence of external references.
Done when: `node --test tests/export.test.js` passes on Node 22+ and the generated string is a standalone offline HTML page.

## v7 — Autosave, export and interaction integration
repo: MeiRR17/rtl-markdown-studio
after: v4, v5, v6
- [ ] Connect debounced autosave and reliable reload restoration to `src/app.js`, including a visible save state, storage-error messaging and no lost keystrokes.
- [ ] Wire an explicit Export HTML control to the pure exporter, `Blob` and object-URL download; clean up object URLs and ensure the exported document matches preview content.
- [ ] Finalize theme persistence, mobile editor/preview operation and keyboard usability in `index.html`, `styles.css` and `src/app.js`; preserve readable focus states and accessible labels.
Done when: typed content survives reload offline, exported HTML opens offline with correct bidirectional formatting, light/dark selection works, and every primary action is keyboard accessible.

## v8 — Portfolio release and acceptance
repo: MeiRR17/rtl-markdown-studio
after: v7
- [ ] Replace root `README.md` with a complete English portfolio README: name, one-line pitch, motivation, features, quick start, usage examples, `node --test` instructions, project structure and final Author section with the exact attribution link.
- [ ] Add root `LICENSE` containing the full MIT license with copyright 2026 Meir Dvir.
- [ ] Execute `node --test` (Node 22+) and manually smoke-check direct `index.html` opening, narrow/wide layouts, keyboard flow, both themes, mixed-direction blocks, reload and offline HTML export; fix any defects before marking complete.
- [ ] Inspect committed files for secrets, personal data, trackers, external requests, placeholder copy, fake screenshots and unnecessary dependencies; keep GitHub Pages root-path compatibility.
Done when: `node --test` passes on Node 22+, direct-file and GitHub Pages root delivery require no build, all BRIEF features work offline, README/LICENSE meet attribution requirements and no known release-blocking issue remains.
