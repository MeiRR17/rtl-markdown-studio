import { renderMarkdown, MAX_MARKDOWN } from './src/markdown.js';
import { extractOutline } from './src/outline.js';

const $ = id => document.getElementById(id);
const source = $('source');
const preview = $('preview');
const STORAGE = 'rtl-markdown-studio:draft:v1';
const PREF_DIR = 'rtl-markdown-studio:direction:v1';
const PREF_SIZE = 'rtl-markdown-studio:font-size:v1';
const tick = '\x60';
const EXAMPLE = [
  '# מסמך בעברית ו־English',
  '',
  'אפשר לכתוב **עברית**, *English* וגם קטעי קוד באותה פסקה.',
  '',
  '## רשימת משימות',
  '- בדיקת כיווניות של פסקאות',
  '- תמיכה בקישורים כמו [GitHub](https://github.com/MeiRR17)',
  '- הדגשת ' + tick + 'const value = 42;' + tick + ' בלי לשבור את כיוון הטקסט',
  '',
  '## English section',
  'This paragraph should stay left-to-right even inside a Hebrew document.',
  '',
  '> זהו ציטוט בעברית עם an English phrase.',
  '',
  tick.repeat(3) + 'js',
  'const greeting = "שלום עולם";',
  'console.log(greeting);',
  tick.repeat(3),
  '',
  '---',
  '',
  '## סיכום',
  'אפשר להוריד את המקור כ־Markdown או לייצא דף HTML בטוח.',
].join('\n');
let saveTimer = null;
let updated = false;
let editRevision = 0;
let fileImportRevision = 0;

function report(message, error = false) {
  $('message').textContent = message;
  $('message').className = 'message' + (error ? ' error' : '');
}
function readPreference(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; }
  catch { return fallback; }
}
function savePreference(key, value) {
  try { localStorage.setItem(key, value); }
  catch { report('שמירה בדפדפן אינה זמינה. מומלץ לייצא קובץ Markdown.', true); }
}
function saveDraft() {
  saveTimer = null;
  try {
    localStorage.setItem(STORAGE, source.value);
    $('draft-status').textContent = 'הטיוטה נשמרה בדפדפן';
  } catch {
    $('draft-status').textContent = 'טיוטה לא נשמרה';
    report('אחסון מקומי אינו זמין. שמור את המסמך בקובץ כדי למנוע אובדן מידע.', true);
  }
}
let headings = [];
function renderOutline() {
  const list = $('outline-items');
  list.replaceChildren();
  try {
    headings = extractOutline(source.value);
    $('outline-count').textContent = headings.length.toLocaleString('he-IL') + ' כותרות';
    if (!headings.length) {
      const empty = document.createElement('li');
      empty.className = 'outline-empty';
      empty.textContent = 'לא נמצאו כותרות Markdown במסמך.';
      list.append(empty);
      return;
    }
    const nodes = document.createDocumentFragment();
    headings.forEach((heading, index) => {
      const li = document.createElement('li');
      li.style.setProperty('--heading-level', String(heading.level - 1));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'outline-link';
      button.dir = 'auto';
      button.dataset.headingIndex = String(index);
      button.textContent = heading.text;
      button.title = 'שורה ' + heading.line;
      const line = document.createElement('small');
      line.textContent = 'שורה ' + heading.line;
      li.append(button, line);
      nodes.append(li);
    });
    list.append(nodes);
  } catch (error) {
    headings = [];
    $('outline-count').textContent = 'המבנה אינו זמין';
    const li = document.createElement('li');
    li.className = 'outline-empty';
    li.textContent = error.message;
    list.append(li);
  }
}
$('outline-items').addEventListener('click', event => {
  const button = event.target.closest('button[data-heading-index]');
  if (!button) return;
  const heading = headings[Number(button.dataset.headingIndex)];
  if (!heading) return;
  source.focus();
  source.setSelectionRange(heading.offset, heading.offset);
});

function updatePreview() {
  const input = source.value;
  renderOutline();
  $('statistics').textContent = input.length.toLocaleString('he-IL') + ' תווים';
  const words = input.trim().split(/\s+/u).filter(Boolean).length;
  $('word-count').textContent = words.toLocaleString('he-IL') + ' מילים';
  const direction = $('direction').value;
  try {
    const rendered = renderMarkdown(input, { direction });
    preview.replaceChildren(rendered);
    if (!preview.childNodes.length) {
      const placeholder = document.createElement('p');
      placeholder.textContent = 'התצוגה המקדימה תופיע כאן.';
      placeholder.dir = 'rtl';
      preview.append(placeholder);
    }
    report('');
    updated = true;
  } catch (error) {
    report(error.message, true);
    updated = false;
    preview.replaceChildren();
  }
}
function onInput() {
  editRevision++;
  $('draft-status').textContent = 'שומר טיוטה…';
  updatePreview();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 450);
}

function download(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function htmlExport() {
  if (!updated) throw new Error('המסמך ארוך מדי או אינו תקין לייצוא.');
  const style = [
    ':root{font-family:Arial,system-ui,sans-serif;line-height:1.8;color:#1a304a}',
    'body{max-width:900px;margin:40px auto;padding:20px;overflow-wrap:anywhere}',
    '.bidi-block{text-align:start;unicode-bidi:plaintext}',
    'pre,code{direction:ltr;unicode-bidi:isolate;font-family:ui-monospace,monospace}',
    'pre{overflow:auto;background:#15243b;color:#eef5ff;padding:16px;border-radius:8px}',
    'code{background:#edf2f9;padding:2px 5px;border-radius:4px}pre code{background:none;padding:0}',
    'blockquote{border-inline-start:4px solid #80a4e0;background:#f4f7fc;padding:10px 18px;margin:20px 0}',
    'a{color:#2d66df}hr{border:0;border-top:1px solid #dce5ef}',
    '@media print{body{margin:0;padding:0;max-width:none}}',
  ].join('');
  // preview.innerHTML is generated from safe DOM nodes, never from user input.
  return '<!doctype html><html lang="he" dir="auto"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Markdown export</title><style>' + style +
    '</style></head><body><main>' + preview.innerHTML + '</main></body></html>';
}
source.addEventListener('input', onInput);
source.addEventListener('keydown', event => {
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault();
    source.setRangeText('  ', source.selectionStart, source.selectionEnd, 'end');
    onInput();
  }
});
$('direction').addEventListener('change', () => {
  savePreference(PREF_DIR, $('direction').value);
  updatePreview();
});
$('font-size').addEventListener('change', () => {
  preview.classList.toggle('large', $('font-size').value === 'large');
  savePreference(PREF_SIZE, $('font-size').value);
});
$('download').addEventListener('click', () =>
  download('document.md', source.value, 'text/markdown;charset=utf-8'));
$('export-html').addEventListener('click', () => {
  try { download('document.html', htmlExport(), 'text/html;charset=utf-8'); }
  catch (error) { report(error.message, true); }
});
$('copy-html').addEventListener('click', async () => {
  if (!updated) { report('אין HTML תקין להעתקה.', true); return; }
  try {
    await navigator.clipboard.writeText(preview.innerHTML);
    report('קוד ה־HTML הועתק ללוח. אפשר להדביק אותו בעורך אחר.');
  } catch { report('הגישה ללוח ההעתקה נחסמה. אפשר לייצא קובץ HTML.', true); }
});
$('print').addEventListener('click', () => {
  if (!updated) { report('יש לתקן את המסמך לפני ההדפסה.', true); return; }
  window.print();
});
$('import').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  const request = ++fileImportRevision;
  const revision = editRevision;
  if (file.size > MAX_MARKDOWN) {
    report('קובץ גדול מדי. המגבלה היא 200KB.', true);
    return;
  }
  try {
    const contents = await file.text();
    // Never overwrite edits made while the browser was reading a file.
    if (request !== fileImportRevision) return;
    if (revision !== editRevision) {
      report('המסמך השתנה במהלך קריאת הקובץ. הייבוא בוטל כדי לשמור על העריכה החדשה.', true);
      return;
    }
    if (contents.length > MAX_MARKDOWN) throw new RangeError('הקובץ חורג ממגבלת התווים.');
    if (source.value.trim() && !confirm('הייבוא יחליף את המסמך הנוכחי. להמשיך?')) return;
    if (request !== fileImportRevision || revision !== editRevision) return;
    source.value = contents;
    onInput();
    saveDraft();
  } catch (error) {
    if (request === fileImportRevision) report('ייבוא נכשל: ' + error.message, true);
  }
});
$('sample').addEventListener('click', () => {
  if (source.value.trim() && source.value !== EXAMPLE &&
      !confirm('להחליף את המסמך הנוכחי בטקסט לדוגמה?')) return;
  source.value = EXAMPLE;
  onInput();
  saveDraft();
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    download('document.md', source.value, 'text/markdown;charset=utf-8');
  }
});
source.value = readPreference(STORAGE, EXAMPLE);
const savedDir = readPreference(PREF_DIR, 'auto');
$('direction').value = ['auto', 'rtl', 'ltr'].includes(savedDir) ? savedDir : 'auto';
const savedSize = readPreference(PREF_SIZE, 'regular');
$('font-size').value = savedSize === 'large' ? 'large' : 'regular';
preview.classList.toggle('large', $('font-size').value === 'large');
updatePreview();
