import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMarkdown, markdownToHtml, safeHref} from '../src/markdown.js';
// Retain v2 structure assertions; v4 direction assertions below cover new attributes.
const md = source => renderMarkdown(source).replace(/ dir="(?:auto|ltr|rtl)"/g, '');
const cases=[
['paragraph','hello\nworld','<p>hello world</p>'],
['headings','# One\n## **Two**\n###### Six','<h1>One</h1>\n<h2><strong>Two</strong></h2>\n<h6>Six</h6>'],
['emphasis','**bold** *italic* and _other_','<p><strong>bold</strong> <em>italic</em> and <em>other</em></p>'],
['nested markup','**bold and *italic***','<p><strong>bold and <em>italic</em></strong></p>'],
['links combined','[**Docs**](https://example.com/a?x=1&y=2)','<p><a href="https://example.com/a?x=1&amp;y=2"><strong>Docs</strong></a></p>'],
['unordered list','- one\n- **two**','<ul><li>one</li><li><strong>two</strong></li></ul>'],
['ordered list','1. first\n2. second','<ol><li>first</li><li>second</li></ol>'],
['fenced code','```js\n<img src=x>\n```','<pre><code>&lt;img src=x&gt;</code></pre>'],
['tilde fence','~~~\na & b\n~~~','<pre><code>a &amp; b</code></pre>'],
['table','| Name | Note |\n| --- | --- |\n| אבג | **yes** |','<table><thead><tr><th>Name</th><th>Note</th></tr></thead><tbody><tr><td>אבג</td><td><strong>yes</strong></td></tr></tbody></table>'],
['blockquote','> quoted\n> *text*','<blockquote><p>quoted <em>text</em></p></blockquote>'],
['blockquote formatting','> **safe**','<blockquote><p><strong>safe</strong></p></blockquote>'],
['inline code','Here `<b>x</b>`','<p>Here <code>&lt;b&gt;x&lt;/b&gt;</code></p>'],
['HTML literal','<script>alert(1)</script>','<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>'],
['malformed emphasis','an **open','<p>an **open</p>'],
['malformed link','[bad](missing','<p>[bad](missing</p>'],
['unterminated fence','```\n<script>','<pre><code>&lt;script&gt;</code></pre>'],
['escaped pipes','| a\\|b | c |\n| --- | --- |\n| 1 | 2 |','<table><thead><tr><th>a|b</th><th>c</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'],
['multiple blocks','# Title\n\nParagraph\n\n- a','<h1>Title</h1>\n<p>Paragraph</p>\n<ul><li>a</li></ul>'],
];
for(const [name,input,expected] of cases)test(name,()=>assert.equal(md(input),expected));
test('alias and purity',()=>{assert.equal(markdownToHtml('A'),'<p dir="auto">A</p>');assert.equal(md('A'),md('A'));});
test('safe links',()=>{for(const href of ['https://example.com','http://example.com','mailto:a@b.com','#part','./file','../file','/doc','docs/page'])assert.equal(safeHref(href),href);});
test('dangerous schemes and obfuscation',()=>{
 for(const href of ['javascript:alert(1)','data:text/html,x','vbscript:x','//evil.example','java&#x73;cript:evil','java\tscript:evil','https://site/%0aevil','file:///etc/passwd'])
  assert.equal(md('[click]('+href+')'),'<p>click</p>',href);
});
test('attribute escaping',()=>assert.equal(md('[x](https://e.test/?a="&b=\'x\')'),'<p><a href="https://e.test/?a=&quot;&amp;b=&#39;x&#39;">x</a></p>'));
test('XSS across blocks',()=>{
 const html=md('# <img src=x onerror=alert(1)>\n\n- <svg onload=alert(1)>\n\n| A |\n| --- |\n| <iframe> |\n\n> <script>bad</script>');
 for(const tag of ['img','svg','iframe','script'])assert.doesNotMatch(html,new RegExp('<'+tag+'\\b','i'));
 assert.match(html,/&lt;script&gt;/);
});
test('empty input',()=>{assert.equal(md(''),'');assert.equal(md(null),'');});
test('percent-encoded slashes remain valid in HTTPS and relative URLs',()=>{
  for(const href of ['https://example.com/a%2Fb','https://example.com/a%2fb?q=1','/docs/a%2Fb','./a%2Fb','../a%2Fb','folder%2Ffile.md','#part%2Ftwo']) {
    assert.equal(safeHref(href),href);
    assert.equal(md('[go]('+href+')'),'<p><a href="'+href+'">go</a></p>');
  }
});
test('encoded slash cannot bypass unsafe schemes or protocol-relative checks',()=>{
  for(const href of ['javascript:%2F%2Fevil','data:text/html,%2F%2F','//evil.example/path%2Ffile'])assert.equal(safeHref(href),null);
});

test('independent direction for headings paragraphs quotes and list items', () => {
 const html=renderMarkdown('# שלום Hello\n## Hello שלום\n\n(42) עברית\n\n> שלום quote\n\n- English ראשון\n- עברית second');
 assert.match(html, /<h1 dir="auto">שלום Hello<\/h1>/);
 assert.match(html, /<h2 dir="auto">Hello שלום<\/h2>/);
 assert.match(html, /<blockquote dir="auto"><p dir="auto">שלום quote<\/p><\/blockquote>/);
 assert.match(html, /<ul><li dir="auto">English ראשון<\/li><li dir="auto">עברית second<\/li><\/ul>/);
});
test('independent table cells and neutral text', () => {
 const html=renderMarkdown('| שלום | English | 123 |\n| --- | --- | --- |\n| Hello עברית | עברית English | ... |');
 assert.match(html, /<th dir="auto">שלום<\/th><th dir="auto">English<\/th><th dir="ltr">123<\/th>/);
 assert.match(html, /<td dir="auto">Hello עברית<\/td><td dir="auto">עברית English<\/td><td dir="ltr">\.\.\.<\/td>/);
});
test('safe links markup and code fences with direction', () => {
 const html=renderMarkdown('[שלום](https://example.com?q=1) and English\n\n```html\n<script>alert(1)</script>\n```');
 assert.match(html, /<p dir="auto"><a href="https:\/\/example.com\?q=1">שלום<\/a> and English<\/p>/);
 assert.match(html, /<pre><code>&lt;script&gt;alert\(1\)&lt;\/script&gt;<\/code><\/pre>/);
 assert.doesNotMatch(html, /<script>/);
});
