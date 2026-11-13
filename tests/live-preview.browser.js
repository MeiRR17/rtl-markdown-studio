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
  const failures = tests.filter(line => line.startsWith('FAIL:')).length;
  results.textContent = tests.join('\n') + '\n' + failures + ' failures';
  results.dataset.failures = String(failures);
  results.dataset.executed = String(tests.length);
  document.title = (failures ? 'FAIL' : 'PASS') + ' — v4 live preview';
})();
