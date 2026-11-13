'use strict';
// Runs in a real browser, directly from file://, without npm or a test server.
(() => {
  const fixture = document.getElementById('fixture');
  const results = document.getElementById('results');
  const samples = [
    { markdown: '> שלום quote', direction: 'rtl', borderSide: 'right' },
    { markdown: '> English שלום', direction: 'ltr', borderSide: 'left' },
    { markdown: '> (42) שלום', direction: 'rtl', borderSide: 'right' },
    { markdown: '> 123 ...', direction: 'ltr', borderSide: 'left' },
    { markdown: '> [123](https://example.com) שלום', direction: 'rtl', borderSide: 'right' }
  ];
  const messages = [];
  for (const sample of samples) {
    try {
      fixture.innerHTML = window.RTLMarkdown.renderMarkdown(sample.markdown);
      const block = fixture.querySelector('blockquote');
      const paragraph = block?.querySelector('p');
      if (!block || !paragraph) throw new Error('Missing quote/paragraph');
      const computed = getComputedStyle(block);
      const paragraphStyle = getComputedStyle(paragraph);
      if (computed.direction !== sample.direction) {
        throw new Error('Computed direction: ' + computed.direction + ', expected ' + sample.direction);
      }
      if (paragraphStyle.direction !== sample.direction) {
        throw new Error('Nested paragraph direction: ' + paragraphStyle.direction);
      }
      const target = parseFloat(computed.getPropertyValue('border-' + sample.borderSide + '-width'));
      const opposite = sample.borderSide === 'left' ? 'right' : 'left';
      const other = parseFloat(computed.getPropertyValue('border-' + opposite + '-width'));
      if (!(target > 0) || other !== 0) {
        throw new Error('Border is on wrong side: ' + sample.borderSide + '=' + target + ', ' + opposite + '=' + other);
      }
      messages.push('PASS: ' + sample.markdown + ' (' + sample.direction + ')');
    } catch (error) {
      messages.push('FAIL: ' + sample.markdown + ' — ' + error.message);
    }
  }
  fixture.textContent = '';
  const failures = messages.filter(line => line.startsWith('FAIL:')).length;
  results.textContent = messages.join('\n') + '\n' + failures + ' failures';
  results.dataset.failures = String(failures);
  document.title = (failures ? 'FAIL' : 'PASS') + ' — v4 blockquote computed style';
})();
