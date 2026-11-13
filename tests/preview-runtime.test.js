import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { renderMarkdown } from '../src/markdown.js';

// Execute the classic script exactly as the direct-file browser loads it.
const script = readFileSync(new URL('../src/preview-runtime.js', import.meta.url), 'utf8');
const browser = { window: {} };
runInNewContext(script, browser, { filename: 'preview-runtime.js' });

test('browser classic renderer agrees with canonical module for quote direction', () => {
 for (const markdown of [
  '> שלום quote', '> English שלום', '> (42) שלום',
  '> 123 ...', '> **שלום** English', '> [שלום](https://example.com) English',
  '> עברית first\n> English second'
 ]) {
  assert.equal(browser.window.RTLMarkdown.renderMarkdown(markdown), renderMarkdown(markdown));
 }
});

test('browser-rendered Hebrew-first blockquote places border on RTL start side', () => {
 const html = browser.window.RTLMarkdown.renderMarkdown('> שלום quote');
 assert.match(html, /^<blockquote dir="rtl"><p dir="auto">שלום quote<\/p><\/blockquote>$/);
 // CSS border-inline-start follows the blockquote's explicit direction.
 const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
 assert.match(css, /\.preview-content blockquote\s*\{[^}]*border-inline-start:/);
});

test('browser-rendered English and neutral blockquotes retain LTR wrapper', () => {
 assert.match(browser.window.RTLMarkdown.renderMarkdown('> English שלום'), /^<blockquote dir="ltr">/);
 assert.match(browser.window.RTLMarkdown.renderMarkdown('> 123 ...'), /^<blockquote dir="ltr">/);
});
