import test from 'node:test';
import assert from 'node:assert/strict';
import { firstStrongDirection, classifyParagraphDirection } from '../src/direction.js';

test('Hebrew-first and English-first paragraphs', () => {
  assert.equal(firstStrongDirection('שלום, world'), 'rtl');
  assert.equal(classifyParagraphDirection('Hello, עולם'), 'ltr');
  assert.equal(classifyParagraphDirection('עברית'), 'rtl');
  assert.equal(classifyParagraphDirection('English'), 'ltr');
});

test('first strong character wins even when the other language dominates', () => {
  assert.equal(classifyParagraphDirection('א and a long English explanation follows'), 'rtl');
  assert.equal(classifyParagraphDirection('A וטקסט עברי ארוך בהמשך'), 'ltr');
  assert.equal(classifyParagraphDirection('(123) — "שלום" and English'), 'rtl');
  assert.equal(classifyParagraphDirection('(123) — "Hello" ואז עברית'), 'ltr');
});

test('punctuation, whitespace, emoji and combining marks are not strong', () => {
  assert.equal(classifyParagraphDirection('...?! (שלום)'), 'rtl');
  assert.equal(classifyParagraphDirection(' \t\n… “Hello”'), 'ltr');
  assert.equal(classifyParagraphDirection('✨ 👩‍💻 — שלום'), 'rtl');
  assert.equal(classifyParagraphDirection('\u05b0\u05b8עולם'), 'rtl');
  assert.equal(firstStrongDirection('!? — ✓ 🧭'), null);
});

test('ASCII, Hebrew and Arabic-Indic digits do not decide direction', () => {
  assert.equal(classifyParagraphDirection('2026/11/12 - שלום'), 'rtl');
  assert.equal(classifyParagraphDirection('12345 67890 Hello'), 'ltr');
  assert.equal(classifyParagraphDirection('١٢٣ ٤٥٦ مرحبا'), 'rtl');
  assert.equal(firstStrongDirection('0 123 ٤٥٦ ０１２٣'), null);
  assert.equal(classifyParagraphDirection('0 123 ٤٥٦ ０１２٣'), 'ltr');
});

test('empty, nullish, neutral-only and numeric-only inputs default to LTR', () => {
  for (const value of ['', '   ', '\n\t', '-?!', '42,000.23', null, undefined]) {
    assert.equal(firstStrongDirection(value), null);
    assert.equal(classifyParagraphDirection(value), 'ltr');
  }
});

test('RTL scripts and explicit left/right directional marks', () => {
  assert.equal(classifyParagraphDirection('مرحبا world'), 'rtl');
  assert.equal(classifyParagraphDirection('ᎣᏏ مرحبا'), 'ltr');
  assert.equal(firstStrongDirection('\u200fEnglish'), 'rtl');
  assert.equal(firstStrongDirection('\u200eעברית'), 'ltr');
  assert.equal(firstStrongDirection('\u061cHello'), 'rtl');
});

test('Unicode code points and repeat calls are stable', () => {
  const text = '🧭 123 שלום and English';
  assert.equal(classifyParagraphDirection(text), 'rtl');
  assert.equal(classifyParagraphDirection(text), 'rtl');
  assert.equal(classifyParagraphDirection('𞤀 test'), 'rtl'); // Adlam letter
});
