'use strict';
// Exercise the actual src/app.js editor wiring and classic renderer in a browser.
(() => {
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const status = document.getElementById('workspace-status');
  const results = document.getElementById('results');
  const tests = [];
  const check = (name, condition) => {
    tests.push((condition ? 'PASS: ' : 'FAIL: ') + name);
  };
  const input = markdown => {
    editor.value = markdown;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  };
  check('initial empty guidance', preview.textContent.includes('Start writing'));
  input('# שלום Hello\n\nEnglish עברית\n\n> שלום quote');
  check('typing updates all preview blocks immediately',
    preview.querySelectorAll('h1, p, blockquote').length === 4 &&
    preview.querySelector('h1')?.textContent === 'שלום Hello');
  check('heading and paragraph directions are independent',
    getComputedStyle(preview.querySelector('h1')).direction === 'rtl' &&
    getComputedStyle(preview.querySelector('p')).direction === 'ltr');
  check('quote wrapper and nested paragraph are RTL',
    getComputedStyle(preview.querySelector('blockquote')).direction === 'rtl' &&
    getComputedStyle(preview.querySelector('blockquote p')).direction === 'rtl');
  check('editor state updates character count and status',
    document.getElementById('editor-count').textContent.includes('characters') &&
    status.textContent === 'Preview up to date');
  input('<img src=x onerror=alert(1)>');
  check('untrusted markup stays escaped',
    preview.querySelector('img') === null &&
    preview.textContent.includes('<img src=x onerror=alert(1)>'));
  input('   ');
  check('clearing restores empty guidance',
    preview.textContent.includes('Start writing') &&
    status.textContent.includes('Ready to write'));
  input('Hello');
  editor.setSelectionRange(0, editor.value.length);
  document.querySelector('.toolbar button[data-insert="quote"]').click();
  check('toolbar Quote action updates source and preview',
    editor.value === '> Hello' &&
    preview.querySelector('blockquote')?.textContent === 'Hello' &&
    getComputedStyle(preview.querySelector('blockquote')).direction === 'ltr');
  const theme = document.getElementById('theme');
  theme.value = 'dark';
  theme.dispatchEvent(new Event('change', { bubbles: true }));
  check('theme switching keeps the editor and preview intact',
    document.body.dataset.theme === 'dark' &&
    preview.querySelector('blockquote')?.textContent === 'Hello');
  input('- שלום English\n- English עברית');
  const listItems = preview.querySelectorAll('li');
  check('list items resolve independent direction',
    listItems.length === 2 &&
    getComputedStyle(listItems[0]).direction === 'rtl' &&
    getComputedStyle(listItems[1]).direction === 'ltr');
  input('| שלום | English |\n| --- | --- |\n| English | עברית |');
  const headings = preview.querySelectorAll('th');
  const cells = preview.querySelectorAll('td');
  check('table cells resolve independent direction',
    headings.length === 2 && cells.length === 2 &&
    getComputedStyle(headings[0]).direction === 'rtl' &&
    getComputedStyle(headings[1]).direction === 'ltr' &&
    getComputedStyle(cells[0]).direction === 'ltr' &&
    getComputedStyle(cells[1]).direction === 'rtl');
  check('English editor chrome stays LTR',
    getComputedStyle(document.body).direction === 'ltr' &&
    getComputedStyle(document.querySelector('.toolbar')).direction === 'ltr');
  input('שלום first\nEnglish second');
  editor.setSelectionRange(0, editor.value.length);
  document.querySelector('.toolbar button[data-insert="quote"]').click();
  check('toolbar quotes every selected line',
    editor.value === '> שלום first\n> English second' &&
    preview.querySelectorAll('blockquote p').length === 1 &&
    preview.querySelector('blockquote')?.textContent.includes('English second') &&
    getComputedStyle(preview.querySelector('blockquote')).direction === 'rtl');
  input('שלום first');
  editor.setSelectionRange(4, 4);
  document.querySelector('.toolbar button[data-insert="quote"]').click();
  check('Quote at cursor quotes the complete current line',
    editor.value === '> שלום first' &&
    preview.querySelector('blockquote')?.textContent === 'שלום first');
  input('prefix One\nEnglish second\nuntouched third');
  editor.setSelectionRange(4, 19);
  document.querySelector('.toolbar button[data-insert="quote"]').click();
  check('partial multiline selection quotes complete touched lines only',
    editor.value === '> prefix One\n> English second\nuntouched third' &&
    preview.querySelector('blockquote')?.textContent.includes('English second'));
  input('first\nsecond\nthird');
  editor.setSelectionRange(2, 6);
  document.querySelector('.toolbar button[data-insert="quote"]').click();
  check('selection ending at next line start leaves that line untouched',
    editor.value === '> first\nsecond\nthird');
  const failures = tests.filter(line => line.startsWith('FAIL:')).length;
  results.textContent = tests.join('\n') + '\n' + failures + ' failures';
  results.dataset.failures = String(failures);
  results.dataset.executed = String(tests.length);
  document.title = (failures ? 'FAIL' : 'PASS') + ' — v4 live preview';
})();
