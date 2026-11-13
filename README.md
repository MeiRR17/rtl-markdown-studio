# rtl-markdown-studio
A Markdown editor with live preview that gets mixed Hebrew/English text right

## Live preview development (v4)

The app opens directly from `index.html` without a build server. The classic
`src/preview-runtime.js` is generated from the canonical ES modules
`src/direction.js` and `src/markdown.js`; **do not edit it by hand**.

After changing either source module, run:

```sh
node scripts/build-preview-runtime.js
node scripts/build-preview-runtime.js --check
node --test tests/*.test.js
```

The `--check` command is read-only and fails when the generated browser
companion is stale. GitHub Actions runs it before the Node regression suite.
Use Node.js 22 or later.
