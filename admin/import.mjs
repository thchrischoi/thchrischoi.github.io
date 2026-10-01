import {readStored,field} from './core.mjs';
const decode=text=>{const doc=new DOMParser().parseFromString(`<body>${text}</body>`,'text/html');return doc.body.textContent;};
export function loadPost(source,path,sha) {
 const {front,body,stored}=readStored(source);
 const base={front,path,sha,permalink:field(front,'permalink'),cover:field(front,'cover')};
 if(stored) return {draft:{...base,...stored},blocks:stored.blocks};
 const draft={...base,title:field(front,'title'),date:field(front,'adventure_date'),endDate:field(front,'adventure_end_date'),summary:decode(field(front,'excerpt')||'')};
 // Version-one posts consist only of the following generated HTML elements.
 if(/^\s*<p><time datetime=/.test(body)) {
  const doc=new DOMParser().parseFromString(body,'text/html'),nodes=Array.from(doc.body.children),blocks=[];
  nodes.shift();
  if(draft.summary && nodes[0]?.tagName==='P' && nodes[0].textContent===draft.summary) nodes.shift();
  let complete=true;
  for(const el of nodes) {
   if(el.tagName==='P') {
    if(el.querySelector(':not(br)')) {complete=false;break;}
    el.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));blocks.push({kind:'paragraph',text:el.textContent});
   } else if(el.tagName==='H2') blocks.push({kind:'heading',text:el.textContent});
   else if(el.tagName==='UL') blocks.push({kind:'list',text:Array.from(el.children,x=>x.textContent).join('\n')});
   else if(el.tagName==='FIGURE') {
    const media=el.querySelector('img,video');if(!media) {complete=false;break;}
    blocks.push({kind:media.tagName==='IMG'?'image':'video',src:media.getAttribute('src'),text:el.querySelector('figcaption')?.textContent||media.getAttribute('alt')||''});
   } else {complete=false;break;}
  }
  if(complete) return {draft,blocks};
 }
 // Keep hand-authored Markdown byte-for-byte instead of lossy conversion.
 return {draft:{...draft,summary:''},blocks:[{kind:'source',text:body}]};
}
