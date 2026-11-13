/* Browser entry point. A classic script works on file:// where module imports are restricted. */
(() => {
  'use strict';
  const editor = document.querySelector('#editor');
  const theme = document.querySelector('#theme');
  const count = document.querySelector('#editor-count');
  const status = document.querySelector('#workspace-status');
  const toolbar = document.querySelector('.toolbar');
  const preview = document.querySelector('#preview');
  if (!editor || !theme || !count || !status || !toolbar || !preview) return;
  const snippets = {
    heading: { prefix: '## ', fallback: 'Heading', suffix: '' },
    list: { prefix: '- ', fallback: 'List item', suffix: '' },
    quote: { prefix: '> ', fallback: 'Quoted text', suffix: '' },
    code: { prefix: '`', fallback: 'code', suffix: '`' }
  };
  const emptyHTML = preview.innerHTML;
  const renderPreview = () => {
    const value = editor.value;
    if (!value.trim()) {
      preview.innerHTML = emptyHTML;
      status.textContent = 'Ready to write · Add Markdown to see its live preview';
      return;
    }
    if (!window.RTLMarkdown || typeof window.RTLMarkdown.renderMarkdown !== 'function') {
      preview.textContent = 'Preview unavailable. Reload this local page.';
      status.textContent = 'Preview unavailable';
      return;
    }
    // The parser escapes raw HTML and only emits allowlisted safe elements.
    // If rendering fails, never display stale preview HTML as up to date.
    try {
      preview.innerHTML = window.RTLMarkdown.renderMarkdown(value);
      status.textContent = 'Preview up to date';
    } catch {
      preview.textContent = 'Preview unavailable. Check the Markdown input.';
      status.textContent = 'Preview unavailable';
    }
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
  editor.addEventListener('input', () => { updateCount(); renderPreview(); });
  toolbar.addEventListener('click', event => {
    const button = event.target.closest('button[data-insert]');
    if (!button || !toolbar.contains(button)) return;
    const snippet = snippets[button.dataset.insert];
    if (!snippet) return;
    const start = editor.selectionStart, end = editor.selectionEnd;
    const isBlockAction = ['quote', 'heading', 'list'].includes(button.dataset.insert);
    if (isBlockAction && editor.value.length) {
      // Block markers belong at line starts, including for a mid-line caret
      // and partially selected lines. Do not touch a next line when the
      // selection ends exactly at its start.
      const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
      const lastTouched = Math.max(start, end - 1);
      const lineBreak = editor.value.indexOf('\n', lastTouched);
      const lineEnd = lineBreak === -1 ? editor.value.length : lineBreak;
      const selectedLines = editor.value.slice(lineStart, lineEnd);
      // A collapsed caret on a blank line should create a usable heading/list
      // placeholder; blank separators in a multi-line selection stay blank.
      const blankCaret = start === end && !selectedLines.trim();
      const replacement = blankCaret
        ? snippet.prefix + snippet.fallback
        : selectedLines.split('\n').map(line =>
          line.trim() || button.dataset.insert === 'quote'
            ? snippet.prefix + line : line).join('\n');
      editor.setRangeText(replacement, lineStart, lineEnd, 'select');
      editor.focus();
      editor.setSelectionRange(lineStart, lineStart + replacement.length);
    } else {
      const selected = editor.value.slice(start, end) || snippet.fallback;
      // Inline Code must use a fence longer than backtick runs in the selection.
      // Otherwise an existing backtick prematurely closes the generated span.
      const runs = button.dataset.insert === 'code' ? (selected.match(/`+/g) || []) : [];
      const fence = button.dataset.insert === 'code'
        ? '`'.repeat(runs.reduce((max, run) => Math.max(max, run.length), 0) + 1)
        : snippet.prefix;
      const suffix = button.dataset.insert === 'code' ? fence : snippet.suffix;
      // Padding keeps a selected edge backtick from merging with the fence.
      const pad = button.dataset.insert === 'code' &&
        (selected.startsWith('`') || selected.endsWith('`'));
      const inner = pad ? ' ' + selected + ' ' : selected;
      editor.setRangeText(`${fence}${inner}${suffix}`, start, end, 'select');
      editor.focus();
      editor.setSelectionRange(start + fence.length + (pad ? 1 : 0),
        start + fence.length + (pad ? 1 : 0) + selected.length);
    }
    editor.dispatchEvent(new Event('input', { bubbles: true }));

  });
  applyTheme('system');
  updateCount();
  renderPreview();
})();
