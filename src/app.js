/* Browser entry point. A classic script works on file:// where module imports are restricted. */
(() => {
  'use strict';
  const editor = document.querySelector('#editor');
  const theme = document.querySelector('#theme');
  const count = document.querySelector('#editor-count');
  const status = document.querySelector('#workspace-status');
  const toolbar = document.querySelector('.toolbar');
  if (!editor || !theme || !count || !status || !toolbar) return;
  const snippets = {
    heading: { prefix: '## ', fallback: 'Heading', suffix: '' },
    list: { prefix: '- ', fallback: 'List item', suffix: '' },
    quote: { prefix: '> ', fallback: 'Quoted text', suffix: '' },
    code: { prefix: '`', fallback: 'code', suffix: '`' }
  };
  const updateCount = () => {
    const length = Array.from(editor.value).length;
    count.textContent = `${length} ${length === 1 ? 'character' : 'characters'}`;
  };
  const applyTheme = value => {
    const selected = ['system', 'light', 'dark'].includes(value) ? value : 'system';
    document.body.dataset.theme = selected;
    theme.value = selected;
  };
  theme.addEventListener('change', () => applyTheme(theme.value));
  editor.addEventListener('input', updateCount);
  toolbar.addEventListener('click', event => {
    const button = event.target.closest('button[data-insert]');
    if (!button || !toolbar.contains(button)) return;
    const snippet = snippets[button.dataset.insert];
    if (!snippet) return;
    const start = editor.selectionStart, end = editor.selectionEnd;
    const selected = editor.value.slice(start, end) || snippet.fallback;
    editor.setRangeText(`${snippet.prefix}${selected}${snippet.suffix}`, start, end, 'select');
    editor.focus();
    editor.setSelectionRange(start + snippet.prefix.length, start + snippet.prefix.length + selected.length);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    status.textContent = `${button.textContent.trim()} inserted · Preview rendering not yet enabled`;
  });
  applyTheme('system');
  updateCount();
})();
