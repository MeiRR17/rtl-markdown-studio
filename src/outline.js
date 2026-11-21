/**
 * Extract a bounded document outline from the subset of Markdown supported by
 * this editor. Heading-looking lines inside fenced code are excluded.
 * Source offsets use UTF-16 indexes, compatible with textarea.selectionStart.
 */
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/u;
const FENCE = /^\s*\x60{3,}([A-Za-z0-9_-]{0,20})\s*$/u;
const MAX_DOCUMENT = 200_000;
const MAX_HEADINGS = 250;

/** @returns {{level:number,text:string,line:number,offset:number}[]} */
export function extractOutline(markdown) {
  if (typeof markdown !== 'string' || markdown.length > MAX_DOCUMENT) {
    throw new RangeError('Markdown must be text under 200,000 characters.');
  }
  const lines = markdown.split(/\r\n|\r|\n/u);
  const result = [];
  let insideFence = false;
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE.test(line)) insideFence = !insideFence;
    else if (!insideFence) {
      const match = HEADING.exec(line);
      if (match) {
        if (result.length >= MAX_HEADINGS) {
          throw new RangeError('The document outline supports up to 250 headings.');
        }
        result.push({
          level: match[1].length,
          text: match[2],
          line: i + 1,
          offset,
        });
      }
    }
    offset += line.length;
    // Count the original newline sequence's UTF-16 length.
    const newline = markdown.slice(offset).match(/^(?:\r\n|\r|\n)/u)?.[0] || '';
    offset += newline.length;
  }
  return result;
}
