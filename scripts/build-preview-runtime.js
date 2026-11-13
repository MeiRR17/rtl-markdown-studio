#!/usr/bin/env node
// The file:// browser uses a classic script, while Node tests use ES modules.
// Build both renderers from the same canonical implementation to prevent drift.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const stripExports = source => source.replace(
  /^export (?=(?:async function|function|const|let|var|class)\b)/gm, '');
const direction = stripExports(read('src/direction.js'));
const markdown = stripExports(read('src/markdown.js')
  .replace(/^import[^\n]+\n/gm, ''));
const header = `/* v4 browser companion generated from src/direction.js and src/markdown.js.
 * Preserve direct file:// operation; keep source modules canonical for Node tests.
 */
(() => {
'use strict';
`;
const output = header + direction + '\n' + markdown +
  '\nwindow.RTLMarkdown = Object.freeze({ renderMarkdown, markdownToHtml });\n})();\n';
const path = resolve(root, 'src/preview-runtime.js');

if (process.argv.includes('--check')) {
  if (read('src/preview-runtime.js') !== output) {
    console.error('Preview runtime is stale. Run: node scripts/build-preview-runtime.js');
    process.exitCode = 1;
  } else {
    console.log('Preview runtime matches canonical Markdown and direction modules.');
  }
} else {
  writeFileSync(path, output);
  console.log('Regenerated src/preview-runtime.js from canonical modules.');
}
