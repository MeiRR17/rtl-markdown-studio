/**
 * Plain-text direction helpers for individual Markdown blocks (no DOM dependency).
 *
 * In the browser, set dir="auto" independently on each rendered h1–h6 heading,
 * p paragraph, li list item, blockquote, and th/td table cell. The browser then
 * uses the first strong directional character in THAT element's content; a
 * heading, list item, quotation, or cell must not borrow another block's result.
 * Nested paragraphs within blockquotes also need their own dir="auto".
 * Keep the English application UI/toolbar and overall document LTR: do not put
 * dir="rtl" or dir="auto" on the editor chrome or the whole preview container.
 * Code blocks can be isolated as LTR separately when integrated in v4.
 *
 * Unlike dir="auto" (which inherits direction for text with no strong character),
 * classifyParagraphDirection explicitly returns "ltr" for neutral-only text.
 * This is deterministic and matches the intended English LTR preview context.
 */

const LETTER = /\p{L}/u;
// Modern Hebrew/Arabic and other common RTL scripts; numbers/marks are excluded
// by LETTER so Arabic-Indic digits and Hebrew vowel marks are not strong letters.
const RTL_SCRIPT = /[\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Hanifi_Rohingya}\p{Script=Yezidi}]/u;

/** Returns "rtl" or "ltr" for the first strong character, or null if none. */
export function firstStrongDirection(text) {
  for (const character of String(text ?? '')) {
    // Unicode directional marks are themselves strong; formatting overrides,
    // isolates, whitespace, punctuation and digits are not.
    if (character === '\u200f' || character === '\u061c') return 'rtl';
    if (character === '\u200e') return 'ltr';
    if (!LETTER.test(character)) continue;
    return RTL_SCRIPT.test(character) ? 'rtl' : 'ltr';
  }
  return null;
}

/** Resolves a paragraph's direction; empty/neutral/numeric-only text is LTR. */
export function classifyParagraphDirection(text) {
  return firstStrongDirection(text) ?? 'ltr';
}
