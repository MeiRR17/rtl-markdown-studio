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
  '> עברית first\n> English second',
  '> [123](https://example.com) שלום', '> & שלום'
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

test('browser companion matches neutral-link direction in RTL quotation', () => {
 const examples = [
  '> שלום\n> \n> [123](https://english.example)',
  '[123](https://שלום.example)',
  '[שלום](https://example.com)'
 ];
 for (const source of examples)
  assert.equal(browser.window.RTLMarkdown.renderMarkdown(source), renderMarkdown(source));
 assert.match(browser.window.RTLMarkdown.renderMarkdown(examples[0]), /<p dir="ltr"><a /);
});

test('browser and canonical renderers agree on variable-length inline Code fences', () => {
 const samples = [
  '`` `code` ``',
  '```Use ``code`` here```',
  '```js\nhello\n```'
 ];
 for (const source of samples)
  assert.equal(browser.window.RTLMarkdown.renderMarkdown(source), renderMarkdown(source));
 assert.match(renderMarkdown(samples[1]), /<p dir="auto"><code>Use ``code`` here<\/code><\/p>/);
 assert.match(renderMarkdown(samples[2]), /^<pre><code>hello<\/code><\/pre>$/);
});

test('browser companion preserves table pipes within double-backtick spans', () => {
 const source='| A | B |\n| --- | --- |\n| ``a|b`` | שלום |';
 const html=browser.window.RTLMarkdown.renderMarkdown(source);
 assert.equal(html,renderMarkdown(source));
 assert.match(html, /<td dir="auto"><code>a\|b<\/code><\/td>/);
 assert.equal((html.match(/<td /g)||[]).length,2);
});

test('browser companion matches exact inline Code backtick runs', () => {
 for (const input of ['`a``b`','``a```b``','``a`b``']) {
  assert.equal(browser.window.RTLMarkdown.renderMarkdown(input), renderMarkdown(input));
  const table='| A | B |\n| --- | --- |\n| '+input+' | שלום |';
  assert.equal(browser.window.RTLMarkdown.renderMarkdown(table), renderMarkdown(table));
 }
});

test('browser companion preserves escaped trailing pipes in Hebrew table cells', () => {
 for (const cell of ['שלום\\|','שלום\\\\|','שלום |','שלום\\| |']) {
  const md='| Name | Note |\n| --- | --- |\n| English | '+cell;
  assert.equal(browser.window.RTLMarkdown.renderMarkdown(md),renderMarkdown(md),cell);
 }
});

test('browser companion matches table scan with many unpaired runs', () => {
 const irregular = Array.from({length: 48}, (_, i) => '`'.repeat(i+1)+'x').join(' ');
 const markdown = '| A | B |\n| --- | --- |\n| '+irregular+' | שלום |';
 assert.equal(browser.window.RTLMarkdown.renderMarkdown(markdown), renderMarkdown(markdown));
 assert.equal((renderMarkdown(markdown).match(/<td /g) || []).length, 2);
});

test('browser companion keeps literal backslashes in table Code spans', () => {
 for(const code of ['`a\\|b`','``a\\|b``','`a|b`']) {
  const input='| A | B |\n| --- | --- |\n| '+code+' | שלום |';
  const html=browser.window.RTLMarkdown.renderMarkdown(input);
  assert.equal(html,renderMarkdown(input));
  assert.equal((html.match(/<td /g)||[]).length,2,code);
 }
});

test('browser companion keeps escaped first tick and a code span in one table cell', () => {
 for (const code of ['\\``a|b`','\\```a|b``']) {
  const source='| A | B |\n| --- | --- |\n| '+code+' | שלום |';
  const html=browser.window.RTLMarkdown.renderMarkdown(source);
  assert.equal(html,renderMarkdown(source),code);
  assert.equal((html.match(/<td /g)||[]).length,2,code);
 }
});

test('browser companion matches fallback to shorter unmatched Code opener', () => {
 for (const cell of ['``x|y`','```x|y``','\\``a|b`']) {
  const markdown='| A | B |\n| --- | --- |\n| '+cell+' | שלום |';
  const html=browser.window.RTLMarkdown.renderMarkdown(markdown);
  assert.equal(html,renderMarkdown(markdown),cell);
  assert.equal((html.match(/<td /g)||[]).length,2,cell);
 }
});

test('browser companion isolates nested fenced Code LTR in RTL quote', () => {
 const source='> שלום\n> ```js\n> const value = (1 + 2);\n> ```';
 const html=browser.window.RTLMarkdown.renderMarkdown(source);
 assert.equal(html,renderMarkdown(source));
 assert.match(html, /<blockquote dir="rtl">/);
 assert.match(html, /<pre dir="ltr"><code>const value = \(1 \+ 2\);<\/code><\/pre>/);
});
