import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

// Run the real classic application entry point with a minimal event-aware DOM.
// Browser computed-style assertions remain in live-preview.browser.js.
function mount(source = '') {
  const listeners = new Map();
  const subscribe = (element, type, handler) => {
    listeners.set(element + ':' + type, handler);
  };
  const editor = {
    value: source,
    selectionStart: source.length,
    selectionEnd: source.length,
    addEventListener(type, callback) { subscribe('editor', type, callback); },
    setRangeText(replacement, start, end) {
      this.value = this.value.slice(0, start) + replacement + this.value.slice(end);
      this.selectionStart = start + replacement.length;
      this.selectionEnd = this.selectionStart;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    focus() { this.focused = true; },
    dispatchEvent(event) { listeners.get('editor:' + event.type)?.(event); }
  };
  const theme = {
    value: 'system',
    addEventListener(type, callback) { subscribe('theme', type, callback); }
  };
  const count = { textContent: '' };
  const status = { textContent: '' };
  const preview = { innerHTML: '<p>Empty editor guidance</p>', textContent: '' };
  const buttons = Object.fromEntries(['heading', 'list', 'quote', 'code'].map(name =>
    [name, { dataset: { insert: name }, closest() { return this; } }]));
  const toolbar = {
    addEventListener(type, callback) { subscribe('toolbar', type, callback); },
    contains(target) { return Object.values(buttons).includes(target); }
  };
  const elements = {
    '#editor': editor, '#theme': theme, '#editor-count': count,
    '#workspace-status': status, '.toolbar': toolbar, '#preview': preview
  };
  const document = {
    body: { dataset: {} },
    querySelector(selector) { return elements[selector]; }
  };
  const window = {
    RTLMarkdown: {
      renderMarkdown(markdown) { return '<rendered>' + markdown + '</rendered>'; }
    }
  };
  class Event {
    constructor(type, options) {
      this.type = type;
      this.bubbles = !!options?.bubbles;
    }
  }
  runInNewContext(script, { document, window, Event }, { filename: 'src/app.js' });
  const input = value => {
    editor.value = value;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const quote = (start, end = start) => {
    editor.setSelectionRange(start, end);
    listeners.get('toolbar:click')({ target: buttons.quote });
  };
  const changeTheme = value => {
    theme.value = value;
    listeners.get('theme:change')();
  };
  return { editor, theme, count, status, preview, document, input, quote, changeTheme, buttons,
    click(name, start, end = start) {
      editor.setSelectionRange(start, end);
      listeners.get('toolbar:click')({ target: buttons[name] });
    }
  };
}

test('input renders immediately and restores empty-state guidance', () => {
  const app = mount();
  assert.match(app.preview.innerHTML, /Empty editor guidance/);
  app.input('שלום English');
  assert.equal(app.preview.innerHTML, '<rendered>שלום English</rendered>');
  assert.equal(app.status.textContent, 'Preview up to date');
  app.input('   ');
  assert.match(app.preview.innerHTML, /Empty editor guidance/);
  assert.match(app.status.textContent, /Ready to write/);
});

test('Quote formats an entire line when the caret is inside it', () => {
  const app = mount('שלום world');
  app.quote(4);
  assert.equal(app.editor.value, '> שלום world');
  assert.equal(app.preview.innerHTML, '<rendered>> שלום world</rendered>');
  assert.equal(app.editor.focused, true);
});

test('Quote formats partially selected lines but not the untouched next line', () => {
  const app = mount('first line\nsecond line\nthird line');
  app.quote(3, 17);
  assert.equal(app.editor.value, '> first line\n> second line\nthird line');
  assert.equal(app.editor.selectionStart, 0);
  assert.equal(app.editor.selectionEnd, '> first line\n> second line'.length);
  assert.equal(app.count.textContent, Array.from(app.editor.value).length + ' characters');
});

test('Quote excludes a following line when selection ends at its start', () => {
  const app = mount('first\nsecond\nthird');
  app.quote(2, 6);
  assert.equal(app.editor.value, '> first\nsecond\nthird');
});

test('Quote handles empty documents and blank interior lines', () => {
  const empty = mount('');
  empty.quote(0);
  assert.equal(empty.editor.value, '> Quoted text');
  const app = mount('a\n\nb');
  app.quote(0, app.editor.value.length);
  assert.equal(app.editor.value, '> a\n> \n> b');
});

test('Heading and List apply at line starts for a mid-line caret', () => {
  const heading = mount('Hello world');
  heading.click('heading', 3);
  assert.equal(heading.editor.value, '## Hello world');
  assert.equal(heading.preview.innerHTML, '<rendered>## Hello world</rendered>');
  const list = mount('שלום list');
  list.click('list', 3);
  assert.equal(list.editor.value, '- שלום list');
});

test('List formatting respects full touched lines and an exclusive end boundary', () => {
  const app = mount('One\nTwo\nThree');
  app.click('list', 2, 6);
  assert.equal(app.editor.value, '- One\n- Two\nThree');
  assert.equal(app.editor.selectionStart, 0);
  assert.equal(app.editor.selectionEnd, '- One\n- Two'.length);
  const other = mount('First\nSecond');
  other.click('list', 1, 6);
  assert.equal(other.editor.value, '- First\nSecond');
});

test('Heading and List preserve empty separators while Quote keeps them', () => {
  const source = 'Alpha\n\nBeta';
  for (const [action, expected] of [
    ['heading', '## Alpha\n\n## Beta'],
    ['list', '- Alpha\n\n- Beta'],
    ['quote', '> Alpha\n> \n> Beta']
  ]) {
    const app = mount(source);
    app.click(action, 0, source.length);
    assert.equal(app.editor.value, expected, action);
  }
});

test('Heading and List create placeholders at a caret on an empty line', () => {
  for (const [action, fallback] of [
    ['heading', '## Heading'],
    ['list', '- List item']
  ]) {
    const app = mount('Existing\n\nLast');
    app.click(action, 9);
    assert.equal(app.editor.value, 'Existing\n' + fallback + '\nLast');
    assert.equal(app.editor.selectionStart, 9);
    assert.equal(app.editor.selectionEnd, 9 + fallback.length);
  }
});

test('Whitespace-only lines are empty for Heading/List, not for Quote', () => {
  const source = 'Alpha\n   \nBeta';
  for (const [action, expected] of [
    ['heading', '## Alpha\n   \n## Beta'],
    ['list', '- Alpha\n   \n- Beta'],
    ['quote', '> Alpha\n>    \n> Beta']
  ]) {
    const app = mount(source);
    app.click(action, 0, source.length);
    assert.equal(app.editor.value, expected, action);
  }
  for (const [action, expected] of [
    ['heading', 'Existing\n## Heading\nLast'],
    ['list', 'Existing\n- List item\nLast']
  ]) {
    const app = mount('Existing\n   \nLast');
    app.click(action, 10);
    assert.equal(app.editor.value, expected);
  }
});

test('Inline Code toolbar remains selection-local', () => {
  const app = mount('Hello');
  app.click('code', 0, 5);
  assert.equal(app.editor.value, '`Hello`');
});

test('other toolbar snippets and theme selection keep working', () => {
  const app = mount('Hello');
  app.click('heading', 0, 5);
  assert.equal(app.editor.value, '## Hello');
  app.changeTheme('dark');
  assert.equal(app.theme.value, 'dark');
  assert.equal(app.document.body.dataset.theme, 'dark');
  assert.equal(app.preview.innerHTML, '<rendered>## Hello</rendered>');
});
