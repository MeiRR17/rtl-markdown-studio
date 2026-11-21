/**
 * Exact literal document search. UTF-16 offsets map directly to textarea
 * selection ranges for Hebrew, English, emoji and mixed-direction documents.
 * Search is local, does not interpret regex, and never changes source text.
 */
const MAX_DOCUMENT = 200_000;
const MAX_QUERY = 120;
const MAX_MATCHES = 500;

export function findLiteralMatches(source, needle) {
  if (typeof source !== 'string' || source.length > MAX_DOCUMENT ||
      typeof needle !== 'string' || needle.length > MAX_QUERY) {
    throw new RangeError('Document or search query exceeds the supported length.');
  }
  if (!needle) return { positions: [], truncated: false };
  const positions = [];
  let from = 0;
  while (from <= source.length - needle.length) {
    const index = source.indexOf(needle, from);
    if (index === -1) break;
    if (positions.length === MAX_MATCHES) return { positions, truncated: true };
    positions.push({ start: index, end: index + needle.length });
    // Advance a single UTF-16 unit so overlapping literal matches are found.
    from = index + 1;
  }
  return { positions, truncated: false };
}

export function nextMatchIndex(positions, selectionStart, reverse = false) {
  if (!Array.isArray(positions) || !positions.length) return -1;
  if (!Number.isInteger(selectionStart) || selectionStart < 0) {
    throw new RangeError('Selection position must be a non-negative UTF-16 offset.');
  }
  if (reverse) {
    for (let i = positions.length - 1; i >= 0; i--) {
      if (positions[i].start < selectionStart) return i;
    }
    return positions.length - 1;
  }
  const i = positions.findIndex(match => match.start > selectionStart);
  return i < 0 ? 0 : i;
}
