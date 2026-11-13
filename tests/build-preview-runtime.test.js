import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const script = readFileSync(join(root, 'scripts/build-preview-runtime.js'), 'utf8');

function fixture(callback) {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-preview-generator-'));
  try {
    mkdirSync(join(dir, 'src'));
    mkdirSync(join(dir, 'scripts'));
    writeFileSync(join(dir, 'scripts/build-preview-runtime.js'), script);
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
    writeFileSync(join(dir, 'src/direction.js'), [
      'export const firstStrongDirection = () => "rtl";',
      '// export remains in comments',
      'const label = "export inside a string";'
    ].join('\n') + '\n');
    writeFileSync(join(dir, 'src/markdown.js'), [
      "import { firstStrongDirection } from './direction.js';",
      'export function renderMarkdown() { return "export must stay in strings"; }',
      'export const markdownToHtml = renderMarkdown;'
    ].join('\n') + '\n');
    const run = (...args) => spawnSync(process.execPath,
      [join(dir, 'scripts/build-preview-runtime.js'), ...args],
      { encoding: 'utf8', timeout: 10000 });
    callback({ dir, run });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('preview generator preserves literal export text and strips declarations', () => {
  fixture(({ dir, run }) => {
    const generated = run();
    assert.equal(generated.status, 0, generated.stderr);
    const content = readFileSync(join(dir, 'src/preview-runtime.js'), 'utf8');
    assert.match(content, /\/\/ export remains in comments/);
    assert.match(content, /"export inside a string"/);
    assert.match(content, /"export must stay in strings"/);
    assert.match(content, /const firstStrongDirection/);
    assert.match(content, /function renderMarkdown/);
    assert.doesNotMatch(content, /^export (?:const|function)/m);
    assert.equal(run('--check').status, 0);
  });
});

test('preview generator check fails read-only after source drift', () => {
  fixture(({ dir, run }) => {
    assert.equal(run().status, 0);
    const runtime = join(dir, 'src/preview-runtime.js');
    const unchanged = readFileSync(runtime, 'utf8');
    const source = join(dir, 'src/markdown.js');
    writeFileSync(source, readFileSync(source, 'utf8') + '// changed\n');
    const checked = run('--check');
    assert.notEqual(checked.status, 0);
    assert.match(checked.stderr, /stale/i);
    assert.equal(readFileSync(runtime, 'utf8'), unchanged);
  });
});
