# DECISIONS

- **2026-11-12 — Architecture:** Static root `index.html` with plain CSS and JavaScript ES modules; no npm packages, build step, trackers, network services or remote assets.
- **2026-11-12 — Safety:** Treat Markdown raw HTML as untrusted text, escape content and HTML attributes, and allowlist link protocols. All source drafts stay in localStorage. Exported HTML is self-contained without executable scripts.
- **2026-11-12 — Directionality:** The English application chrome stays LTR; user-authored rendered block text, each list item and each table cell gets independently resolved direction, using `dir="auto"` and first-strong-character behavior. Code remains legible with appropriate isolation.
- **2026-11-12 — Parallel development:** v1/v2/v3/v5/v6 may proceed independently in disjoint files. v4 and v7 are deliberate integration barriers; v8 is the release gate.
- **2026-11-12 — Git workflow:** Commit directly to existing `autopilot` only; no PR, new branch or fork; refresh the head and avoid overwriting concurrent work.
