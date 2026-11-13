import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('preview accessibility description remains outside the replaced preview DOM', () => {
  const help = html.indexOf('id="preview-help"');
  const preview = html.indexOf('id="preview"');
  const end = html.indexOf('id="workspace-status"', preview);
  assert.ok(help >= 0 && preview > help && end > preview);
  assert.equal(html.match(/id="preview-help"/g)?.length, 1);
  assert.match(html.slice(preview, end), /aria-describedby="preview-help"/);
  // renderPreview replaces #preview.innerHTML, so describedby's target must
  // not be nested inside the dynamically overwritten preview container.
  assert.doesNotMatch(html.slice(preview, end), /id="preview-help"/);
});
