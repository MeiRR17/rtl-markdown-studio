# rtl-markdown-studio

A Markdown editor with live preview that gets mixed Hebrew/English text right.

## What to build
A split-screen Markdown editor with a live preview that handles right-to-left and mixed Hebrew/English text correctly: each paragraph, list item and table cell gets the right direction automatically. Includes a tested Markdown-to-HTML converter written from scratch (headings, emphasis, links, lists, code blocks, tables, blockquotes), autosave, and export to a standalone HTML file.

## Stack and form
- A static web app: plain HTML, CSS and JavaScript, no build step and no npm dependencies. It runs by opening index.html at the repository root, which is also how GitHub Pages serves it.
- Works offline, keeps the person's data only in localStorage, sends nothing anywhere, no analytics or trackers.
- Looks finished and modern: a clean responsive layout (phone and desktop), light and dark theme, keyboard accessible, proper focus states.
- Right-to-left aware: Hebrew text displays correctly (dir="auto" on user text), and the interface itself is in English.
- Pure logic lives in its own ES module files with unit tests run by `node --test` (Node 22+), so the core is tested without a browser.
- A small footer on the page: "Built by Meir Dvir" linking to [https://github.com/MeiRR17](https://github.com/MeiRR17).

## Publishing (this repository is public, part of Meir Dvir's portfolio)
- README.md in English: the name, a one-line pitch, why it exists, features, quick start, usage examples, how to run the tests, project structure, and a final "Author" section: "Built by Meir Dvir · [https://github.com/MeiRR17](https://github.com/MeiRR17)".
- LICENSE: MIT, copyright 2026 Meir Dvir.
- Keep it small and complete: a finished, polished tool is better than a large unfinished one. No placeholder sections, no fake screenshots, no "coming soon".
- No secrets, keys or personal data anywhere in the repository.
