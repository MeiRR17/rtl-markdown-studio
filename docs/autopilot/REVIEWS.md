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
