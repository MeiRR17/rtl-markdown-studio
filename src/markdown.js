import { firstStrongDirection } from './direction.js';
/** Dependency-free Markdown renderer: untrusted input never becomes raw HTML. */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export function safeHref(raw) {
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
  // Index complete backtick runs once. Repeatedly scanning the remaining
  // string for each unmatched opening tick can make live preview quadratic.
  const codeRuns=new Map();
  for(const match of s.matchAll(/`+/g)){
    const length=match[0].length;
    if(!codeRuns.has(length))codeRuns.set(length,[]);
    codeRuns.get(length).push(match.index);
  }
  // Precompute nested link delimiters so incomplete Markdown never
  // rescans the remainder of the line for every unmatched '[' or '('.
  const closingBrackets=new Map(),openBrackets=[];
  for(let p=0;p<s.length;p++){
    if(s[p]==='\\'){p++;continue;}
    if(s[p]==='`'){
      // Code spans are literal link-label content: brackets inside them
      // must never close or nest a surrounding Markdown link label.
      let end=p+1;
      while(s[end]==='`')end++;
      const fullLength=end-p;
      let close=-1,matchedLength=0;
      for(let length=fullLength;length>0;length--){
        const runs=codeRuns.get(length)||[];
        let lo=0,hi=runs.length;
        while(lo<hi){
          const mid=(lo+hi)>>1;
          if(runs[mid]<end)lo=mid+1;
          else hi=mid;
        }
        if(lo<runs.length){close=runs[lo];matchedLength=length;break;}
      }
      if(close!==-1){p=close+matchedLength-1;continue;}
      p=end-1;continue;
    }
    if(s[p]==='[')openBrackets.push(p);
    else if(s[p]===']'&&openBrackets.length)
      closingBrackets.set(openBrackets.pop(),p);
  }
  const closingParens=new Map(),openParens=[];
  for(let p=0;p<s.length;p++){
    if(s[p]==='(')openParens.push(p);
    else if(s[p]===')'&&openParens.length)
      closingParens.set(openParens.pop(),p);
  }
  for(let i=0;i<s.length;) {
    const c=s[i];
    if(c==='\\' && i+1<s.length && /[\\`*_{}\[\]()#+.!>|~-]/.test(s[i+1])) {out+=esc(s[i+1]);i+=2;continue;}
    if(c==='`') {
      // Find the whole opening run only once. An unmatched long run may
      // contain a shorter suffix that has a real closing run; choose the
      // longest matching suffix without rescanning the same prefix.
      let runEnd=i+1;
      while(s[runEnd]==='`')runEnd++;
      const fullLength=runEnd-i;
      let close=-1,openLength=0;
      for(let length=fullLength;length>0;length--){
        const runs=codeRuns.get(length);
        if(!runs)continue;
        let lo=0,hi=runs.length;
        while(lo<hi){
          const mid=(lo+hi)>>1;
          if(runs[mid]<runEnd)lo=mid+1;
          else hi=mid;
        }
        if(lo<runs.length){close=runs[lo];openLength=length;break;}
      }
      if(close!==-1){
        out+='`'.repeat(fullLength-openLength);
        let codeText=s.slice(runEnd,close).replace(/\n/g,' ');
        if(codeText.startsWith(' ') && codeText.endsWith(' ') && codeText.trim())
          codeText=codeText.slice(1,-1);
        out+='<code>'+esc(codeText)+'</code>';
        i=close+openLength;continue;
      }
      out+=s.slice(i,runEnd);i=runEnd;continue;
    }
    if(c==='[') {
      const close=closingBrackets.get(i);
      const parenStart=close===undefined?-1:close+1;
      if(parenStart!==-1&&s[parenStart]==='('){
        const parenEnd=closingParens.get(parenStart);
        if(parenEnd!==undefined){
          const label=s.slice(i+1,close),href=safeHref(s.slice(parenStart+1,parenEnd));
          out+=href===null?inline(label,depth+1):'<a href="'+esc(href)+'">'+inline(label,depth+1)+'</a>';
          i=parenEnd+1;continue;
        }
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
// Direction must use visible characters: link destinations and Markdown
// delimiters do not contribute strong text to the rendered block.
const visibleInlineText = source => inline(source)
  .replace(/<[^>]*>/g, '')
  .replace(/&(?:amp|lt|gt|quot|#39);/g, entity =>
    ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"})[entity]);
// A neutral-only block must stay LTR even inside an RTL quotation.
const directionAttribute = text => ' dir="' +
  (firstStrongDirection(visibleInlineText(text)) ? 'auto' : 'ltr') + '"';
const quoteTextDirection = source =>
  firstStrongDirection(visibleInlineText(source)) ?? 'ltr';

// A backtick fence cannot have backticks in its info string. Without this
// check, an inline span like ```Use ``code`` here``` is mistaken for a code block.
const fence=s=>{
  const match=/^ {0,3}(`{3,}|~{3,})(.*)$/.exec(s);
  return match && (match[1][0] !== '`' || !match[2].includes('`'))
    ? match : null;
};
const heading=s=>/^ {0,3}(#{1,6})(?:[ \t]+(.*)|[ \t]*)$/.exec(s);
const quote=s=>/^ {0,3}>[ \t]?(.*)$/.exec(s);
const item=s=>/^( {0,3})([-+*]|\d{1,9}[.)])[ \t]+(.*)$/.exec(s);
const rule=s=>/^ {0,3}(?:\*\s*){3,}$|^ {0,3}(?:-\s*){3,}$|^ {0,3}(?:_\s*){3,}$/.test(s);
function cells(line){
  let out=[],v='',slash=false,codeFence=0;
  // Strip optional outer table pipes only when they are unescaped.
  // A final \\| is visible cell text, not the table's right border.
  let source=line.trim().replace(/^\|/,'');
  if(source.endsWith('|')){
    let backslashes=0;
    for(let k=source.length-2;k>=0&&source[k]==='\\';k--)backslashes++;
    if(backslashes%2===0)source=source.slice(0,-1);
  }
  // Count unescaped backtick runs once. A matching run later in the row
  // determines whether pipes belong to inline Code, without rescanning
  // the remainder of the row for every unmatched opener.
  const remaining=new Map();
  for(let k=0;k<source.length;){
    // All runs can close a code span; backslashes are literal inside it.
    // Escapes outside spans are handled in the second pass.

    if(source[k]!=='`'){k++;continue;}
    let end=k+1;
    while(source[end]==='`')end++;
    const length=end-k;
    remaining.set(length,(remaining.get(length)||0)+1);
    k=end;
  }
  for(let i=0;i<source.length;){
    const c=source[i];
    if(slash){
      if(c==='`'){
        let j=i+1;
        while(source[j]==='`')j++;
        // Only the first tick is escaped. Remaining adjacent ticks can
        // open a code span and must retain their own run-length count.
        const length=j-i;
        remaining.set(length,(remaining.get(length)||0)-1);
        if(length>1)remaining.set(length-1,(remaining.get(length-1)||0)+1);
      }
      v+='\\'+c;slash=false;i++;continue;
    }
    if(c==='\\' && !codeFence){slash=true;i++;continue;}
    if(c==='`'){
      let j=i+1;
      while(source[j]==='`')j++;
      const run=j-i;
      remaining.set(run,(remaining.get(run)||0)-1);
      if(!codeFence){
        if(remaining.get(run)>0)codeFence=run;
        else if(run>1){
          // Like inline(), an unmatched opener advances one tick and
          // retries the suffix. A shorter suffix may have a closing run.
          remaining.set(run-1,(remaining.get(run-1)||0)+1);
          v+='`';i++;continue;
        }
      }else if(codeFence===run)codeFence=0;
      v+=source.slice(i,j);i=j;continue;
    }
    if(c==='|'&&!codeFence){out.push(v.trim());v='';}
    else v+=c;
    i++;
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
      out.push('<pre dir="ltr"><code>'+esc(code.join('\n'))+'</code></pre>');continue;
    }
    const h=heading(line);
    if(h){const tag='h'+h[1].length;{const content=(h[2]??'').replace(/[ \t]+#+[ \t]*$/,'').trim();out.push('<'+tag+directionAttribute(content)+'>'+inline(content)+'</'+tag+'>');}i++;continue;}
    if(quote(line)){
      const q=[];while(i<lines.length&&quote(lines[i]))q.push(quote(lines[i++])[1]);
      out.push('<blockquote dir="'+quoteTextDirection(q.join(' '))+'">'+blocks(q,level+1)+'</blockquote>');continue;
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
export function renderMarkdown(md){return blocks(String(md??'').replace(/\r\n?/g,'\n').split('\n'));}
export const markdownToHtml=renderMarkdown;
