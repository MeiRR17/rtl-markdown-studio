/* v4 browser companion generated from src/direction.js and src/markdown.js.
 * Preserve direct file:// operation; keep source modules canonical for Node tests.
 */
(() => {
'use strict';
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
function firstStrongDirection(text) {
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
function classifyParagraphDirection(text) {
  return firstStrongDirection(text) ?? 'ltr';
}

/** Dependency-free Markdown renderer: untrusted input never becomes raw HTML. */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function safeHref(raw) {
  const v=String(raw).trim();
  if (!v || /[\x00-\x1f\x7f-\x9f\\]/.test(v)) return null;
  const decoded=v.replace(/&#(?:x([0-9a-f]+)|([0-9]+));?/gi,(_,h,d)=>{const n=parseInt(h??d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}).replace(/&colon;/gi,':').replace(/&tab;/gi,'\t').replace(/&newline;/gi,'\n');
  if (/[\x00-\x20\x7f-\x9f\\]/.test(decoded) || /^\/\//.test(decoded) || /%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(decoded)) return null;
  const protocol=/^([a-z][a-z0-9+.-]*):/i.exec(decoded);
  if (protocol && !/^(https?|mailto)$/i.test(protocol[1])) return null;
  if (!protocol && /^[^/?#]*:/.test(decoded)) return null;
  return v;
}
function inline(s, depth=0) {
  if(depth>16) return esc(s);
  let out=''; s=String(s);
  for(let i=0;i<s.length;) {
    const c=s[i];
    if(c==='\\' && i+1<s.length && /[\\`*_{}\[\]()#+.!>|~-]/.test(s[i+1])) {out+=esc(s[i+1]);i+=2;continue;}
    if(c==='`') {
      const mark=/^`+/.exec(s.slice(i))[0], end=s.indexOf(mark,i+mark.length);
      if(end!==-1){out+='<code>'+esc(s.slice(i+mark.length,end).replace(/\n/g,' '))+'</code>';i=end+mark.length;continue;}
    }
    if(c==='[') {
      let j=i+1,n=1;
      while(j<s.length && n) {if(s[j]==='\\'){j+=2;continue;}if(s[j]==='[')n++;if(s[j]===']')n--;j++;}
      if(!n && s[j]==='('){
        let k=j+1,p=1;
        while(k<s.length&&p){if(s[k]==='(')p++;if(s[k]===')')p--;k++;}
        if(!p){const label=s.slice(i+1,j-1),href=safeHref(s.slice(j+1,k-1));out+=href===null?inline(label,depth+1):'<a href="'+esc(href)+'">'+inline(label,depth+1)+'</a>';i=k;continue;}
      }
    }
    if(c==='*'||c==='_') {
      const mark=s.startsWith(c+c,i)?c+c:c;
      let end=s.indexOf(mark,i+mark.length);
      if(mark.length===2)while(end!==-1&&s[end+2]===c)end=s.indexOf(mark,end+1);
      if(end>i+mark.length && !(c==='_' && /[\p{L}\p{N}]/u.test(s[i-1]??'') && /[\p{L}\p{N}]/u.test(s[i+mark.length]??''))){
        const tag=mark.length===2?'strong':'em';
        out+='<'+tag+'>'+inline(s.slice(i+mark.length,end),depth+1)+'</'+tag+'>';i=end+mark.length;continue;
      }
    }
    out+=esc(c);i++;
  }
  return out;
}
// Browser dir=auto uses visible first-strong text, independently for each block.
// A deterministic LTR fallback prevents numeric-only text inheriting RTL context.
const directionAttribute = text => ' dir="' + (firstStrongDirection(text) ? 'auto' : 'ltr') + '"';
const fence=s=>/^ {0,3}(`{3,}|~{3,})(.*)$/.exec(s);
const heading=s=>/^ {0,3}(#{1,6})(?:[ \t]+(.*)|[ \t]*)$/.exec(s);
const quote=s=>/^ {0,3}>[ \t]?(.*)$/.exec(s);
const item=s=>/^( {0,3})([-+*]|\d{1,9}[.)])[ \t]+(.*)$/.exec(s);
const rule=s=>/^ {0,3}(?:\*\s*){3,}$|^ {0,3}(?:-\s*){3,}$|^ {0,3}(?:_\s*){3,}$/.test(s);
function cells(line){
  let out=[],v='',slash=false,code=false;
  for(const c of line.trim().replace(/^\|/,'').replace(/\|$/,'')){
    if(slash){v+='\\'+c;slash=false;continue;}
    if(c==='\\'){slash=true;continue;}
    if(c==='`')code=!code;
    if(c==='|'&&!code){out.push(v.trim());v='';}else v+=c;
  }
  if(slash)v+='\\';
  out.push(v.trim());return out;
}
function table(lines,i){
  if(i+1>=lines.length||!lines[i].includes('|'))return null;
  const h=cells(lines[i]),d=cells(lines[i+1]);
  return h.length&&h.length===d.length&&d.every(c=>/^:?-{3,}:?$/.test(c))?h:null;
}
function begins(lines,i){return !!(fence(lines[i])||heading(lines[i])||quote(lines[i])||(item(lines[i])&&!rule(lines[i]))||table(lines,i));}
function blocks(lines,level=0){
  if(level>12)return '<p'+directionAttribute(lines.join(' '))+'>'+inline(lines.join(' '))+'</p>';
  const out=[];
  for(let i=0;i<lines.length;){
    const line=lines[i];
    if(!line.trim()){i++;continue;}
    const f=fence(line);
    if(f){
      const code=[],mark=f[1];i++;
      const end=new RegExp('^ {0,3}'+(mark[0]==='`'?'`':'~')+'{'+mark.length+',}[ \\t]*$');
      while(i<lines.length&&!end.test(lines[i]))code.push(lines[i++]);
      if(i<lines.length)i++;
      out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');continue;
    }
    const h=heading(line);
    if(h){const tag='h'+h[1].length;{const content=(h[2]??'').replace(/[ \t]+#+[ \t]*$/,'').trim();out.push('<'+tag+directionAttribute(content)+'>'+inline(content)+'</'+tag+'>');}i++;continue;}
    if(quote(line)){
      const q=[];while(i<lines.length&&quote(lines[i]))q.push(quote(lines[i++])[1]);
      out.push('<blockquote dir="'+(firstStrongDirection(q.join(' ')) ?? 'ltr')+'">'+blocks(q,level+1)+'</blockquote>');continue;
    }
    const headers=table(lines,i);
    if(headers){
      i+=2;const body=[];
      while(i<lines.length&&lines[i].trim()&&lines[i].includes('|'))body.push(cells(lines[i++]));
      const head='<thead><tr>'+headers.map(x=>'<th'+directionAttribute(x)+'>'+inline(x)+'</th>').join('')+'</tr></thead>';
      const rows=body.length?'<tbody>'+body.map(row=>'<tr>'+headers.map((_,k)=>'<td'+directionAttribute(row[k]??'')+'>'+inline(row[k]??'')+'</td>').join('')+'</tr>').join('')+'</tbody>':'';
      out.push('<table>'+head+rows+'</table>');continue;
    }
    const first=item(line);
    if(first&&!rule(line)){
      const ordered=/\d/.test(first[2][0]),li=[];
      while(i<lines.length){
        const it=item(lines[i]);if(!it||/\d/.test(it[2][0])!==ordered||rule(lines[i]))break;
        const text=[it[3]];i++;
        while(i<lines.length&&/^ {2,}\S/.test(lines[i])&&!item(lines[i]))text.push(lines[i++].trim());
        li.push('<li'+directionAttribute(text.join(' '))+'>'+inline(text.join(' '))+'</li>');
      }
      const tag=ordered?'ol':'ul';out.push('<'+tag+'>'+li.join('')+'</'+tag+'>');continue;
    }
    const p=[line.trim()];i++;
    while(i<lines.length&&lines[i].trim()&&!begins(lines,i))p.push(lines[i++].trim());
    out.push('<p'+directionAttribute(p.join(' '))+'>'+inline(p.join(' '))+'</p>');
  }
  return out.join('\n');
}
/** Produce safe, supported HTML fragment from any Markdown input. */
function renderMarkdown(md){return blocks(String(md??'').replace(/\r\n?/g,'\n').split('\n'));}
const markdownToHtml=renderMarkdown;

window.RTLMarkdown = Object.freeze({ renderMarkdown, markdownToHtml });
})();
