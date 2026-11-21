/**
 * Deliberately small Markdown -> DOM renderer with per-block bidi.
 * User input is never inserted via innerHTML, evaluated, or parsed as HTML.
 * Supports headings, paragraphs, links, emphasis, lists, quotes, code and rules.
 */
export const MAX_MARKDOWN = 200_000;
const FENCE = /^\s*\x60{3,}([A-Za-z0-9_-]{0,20})\s*$/;
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const BULLET = /^\s{0,3}([-+*]|\d+[.)])\s+(.+)$/;
const STRONG_RTL = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFC]/;
const STRONG_LTR = /[A-Za-z\u00C0-\u024F\u0370-\u052F]/;
const LINK_PATTERN = /\[([^\]\n]{1,250})\]\(([^()\s]{1,1500})\)/y;
const CODE_PATTERN = /\x60([^\x60\n]*)\x60/y;
const BOLD_PATTERN = /(?:\*\*([^*\n]+)\*\*|__([^_\n]+)__)/y;
const ITALIC_PATTERN = /(?:\*([^*\n]+)\*|_([^_\n]+)_)/y;
const STRIKE_PATTERN = /~~([^~\n]+)~~/y;

function node(tag, text = null) {
  const element = document.createElement(tag);
  if (text !== null) element.textContent = text;
  return element;
}
function allowedUrl(raw) {
  try {
    const url = new URL(raw, location.href);
    if (['https:', 'http:', 'mailto:'].includes(url.protocol)) return url.href;
  } catch { /* Unsafe or invalid URL. */ }
  return null;
}
/**
 * Find first strong directionality for a block. Inline backticks are neutral.
 * Returns auto when no strong characters exist, allowing user-agent fallback.
 */
export function detectDirection(value) {
  if (typeof value !== 'string') return 'auto';
  const stripped = value.replace(/\x60[^\x60]*\x60/g, ' ');
  for (const char of stripped) {
    if (STRONG_RTL.test(char)) return 'rtl';
    if (STRONG_LTR.test(char)) return 'ltr';
  }
  return 'auto';
}
function direction(element, text, preference) {
  element.dir = preference === 'auto' ? detectDirection(text) : preference;
  element.classList.add('bidi-block');
  return element;
}

/** Inline rendering with safe text nodes and isolates for code and links. */
export function appendInline(target, input) {
  if (typeof input !== 'string') throw new TypeError('Inline content must be text.');
  let i = 0, text = '';
  const flush = () => {
    if (text) { target.append(document.createTextNode(text)); text = ''; }
  };
  while (i < input.length) {
    // Backslash escapes a punctuation character.
    if (input[i] === '\\' && i + 1 < input.length &&
        /[\\\x60*_{}\[\]()#+.!<>~-]/.test(input[i + 1])) {
      text += input[i + 1]; i += 2; continue;
    }
    let item = null, type = '';
    for (const [pattern, category] of [
      [CODE_PATTERN, 'code'], [LINK_PATTERN, 'link'],
      [BOLD_PATTERN, 'strong'], [STRIKE_PATTERN, 'del'],
      [ITALIC_PATTERN, 'em'],
    ]) {
      pattern.lastIndex = i;
      const match = pattern.exec(input);
      if (match) { item = match; type = category; break; }
    }
    if (!item) { text += input[i++]; continue; }
    flush();
    if (type === 'link') {
      const href = allowedUrl(item[2]);
      if (!href) target.append(document.createTextNode(item[0]));
      else {
        const a = node('a', item[1]);
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.dir = 'auto';
        target.append(a);
      }
    } else if (type === 'code') {
      const code = node('code', item[1]);
      code.dir = 'ltr';
      target.append(code);
    } else {
      const wrapper = node(type);
      wrapper.textContent = item[1] ?? item[2] ?? '';
      target.append(wrapper);
    }
    i += item[0].length;
  }
  flush();
}
const isBlank = line => !line.trim();
const isRule = line => /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
const isQuote = line => /^\s{0,3}>\s?/.test(line);
const isList = line => BULLET.test(line);
const isHeading = line => HEADING.test(line);
const isFence = line => FENCE.test(line);
const startsBlock = line => isBlank(line) || isHeading(line) || isRule(line) ||
  isQuote(line) || isList(line) || isFence(line);

/**
 * Create a DocumentFragment from Markdown, never interpreting HTML tags.
 * @param {string} markdown
 * @param {{direction?:'auto'|'rtl'|'ltr'}} options
 */
export function renderMarkdown(markdown, options = {}) {
  if (typeof markdown !== 'string' || markdown.length > MAX_MARKDOWN)
    throw new RangeError('Markdown content must not exceed 200,000 characters.');
  const pref = options.direction ?? 'auto';
  if (!['auto', 'rtl', 'ltr'].includes(pref)) throw new RangeError('Invalid direction.');
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const output = document.createDocumentFragment();
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }
    const fence = FENCE.exec(line);
    if (fence) {
      const lang = fence[1].toLowerCase();
      const content = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) content.push(lines[i++]);
      if (i < lines.length) i++;
      const pre = node('pre');
      const code = node('code', content.join('\n'));
      code.dir = 'ltr';
      if (lang) code.dataset.language = lang;
      pre.dir = 'ltr'; pre.append(code); output.append(pre);
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      const h = direction(node('h' + heading[1].length), heading[2], pref);
      appendInline(h, heading[2]);
      output.append(h); i++; continue;
    }
    if (isRule(line)) { output.append(node('hr')); i++; continue; }
    if (isQuote(line)) {
      const values = [];
      while (i < lines.length && isQuote(lines[i])) values.push(lines[i++].replace(/^\s{0,3}>\s?/, ''));
      const quote = direction(node('blockquote'), values.join(' '), pref);
      appendInline(quote, values.join(' '));
      output.append(quote);
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet) {
      const ordered = /^\d/.test(bullet[1]);
      const group = node(ordered ? 'ol' : 'ul');
      if (ordered) group.start = Number.parseInt(bullet[1], 10);
      const collected = [];
      while (i < lines.length) {
        const match = BULLET.exec(lines[i]);
        if (!match || /^\d/.test(match[1]) !== ordered) break;
        collected.push(match[2]); i++;
      }
      const wholeDir = pref === 'auto' ? detectDirection(collected.join(' ')) : pref;
      group.dir = wholeDir;
      for (const content of collected) {
        const li = direction(node('li'), content, pref);
        appendInline(li, content);
        group.append(li);
      }
      output.append(group);
      continue;
    }
    const paragraph = [line.trim()];
    i++;
    while (i < lines.length && !startsBlock(lines[i])) paragraph.push(lines[i++].trim());
    const joined = paragraph.join(' ');
    const p = direction(node('p'), joined, pref);
    appendInline(p, joined);
    output.append(p);
  }
  return output;
}
