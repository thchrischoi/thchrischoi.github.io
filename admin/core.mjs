export const OWNER='thchrischoi', REPO=`${OWNER}/${OWNER}.github.io`, BRANCH='master';
export const MAX_FILE=25*1024*1024, MAX_TOTAL=75*1024*1024;
const types={'image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov','video/x-m4v':'m4v'};
export function mediaExtension(file) {
  const suffix=file.name?.split('.').pop().toLowerCase();
  const ext=({jpeg:'jpg',jpg:'jpg',png:'png',gif:'gif',webp:'webp',mp4:'mp4',webm:'webm',mov:'mov',m4v:'m4v',gpx:'gpx'})[suffix] || types[file.type];
  if(!ext) throw new Error(`${file.name}: choose JPG, PNG, GIF, WebP, MP4, WebM, MOV, M4V, or GPX.`);
  if(!file.size || file.size>MAX_FILE) throw new Error(`${file.name}: files must be nonempty and no larger than 25 MB.`);
  return ext;
}
export function mapEmbedURL(value) {
 let url;try{url=new URL(value);}catch{throw new Error('Paste a valid Google Maps or OpenStreetMap embed URL.');}
 const allowed=(url.hostname==='www.google.com'&&/^\/maps\/embed(?:\/|$)/.test(url.pathname))||(url.hostname==='www.openstreetmap.org'&&url.pathname==='/export/embed.html');
 if(url.protocol!=='https:'||!allowed||url.username||url.password)throw new Error('Use the HTTPS embed URL from Google Maps Share → Embed a map, or OpenStreetMap Share → HTML.');
 return url.href;
}
export const isVideo=ext=>['mp4','webm','mov','m4v'].includes(ext);
export const allMedia=blocks=>blocks.flatMap(b=>b.items || (['image','video','gpx'].includes(b.kind)?[b]:[]));
export function escapeHTML(value) {return String(value).replace(/[&<>"'{}]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','{':'&#123;','}':'&#125;'}[c]));}
export function safeSrc(src) {if(!/^\/(?!\/)/.test(src) && !/^blob:/.test(src)) throw new Error('Media must belong to this website.'); return escapeHTML(src);}
export function encodeData(value) {return btoa(Array.from(new TextEncoder().encode(JSON.stringify(value)),b=>String.fromCharCode(b)).join(''));}
export function decodeData(value) {return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value),c=>c.charCodeAt(0))));}
export function renderBlocks(blocks,urlFor=b=>b.src,{preview=false}={}) {
 const photo=b=>`<figure><button type="button" class="adventure-photo" aria-label="Expand photo: ${escapeHTML(b.text||'Photo')}"><img src="${safeSrc(urlFor(b))}" alt="${escapeHTML(b.text||'')}" loading="lazy" draggable="false"></button>${b.text?`<figcaption>${escapeHTML(b.text)}</figcaption>`:''}</figure>`;
 return blocks.map(b=>{
  const text=escapeHTML(b.text||'');
  if(b.kind==='source') return preview?`<pre class="source-preview">${text}</pre>`:b.text;
  if(b.kind==='heading') return `<h2>${text}</h2>`;
  if(b.kind==='list') return `<ul>${text.split('\n').filter(x=>x.trim()).map(x=>`<li>${x}</li>`).join('')}</ul>`;
  if(b.kind==='paragraph') return text.split(/\n\s*\n/).filter(Boolean).map(x=>`<p>${x.replace(/\n/g,'<br>')}</p>`).join('\n');
  if(b.kind==='image') return photo(b);
  if(b.kind==='row' || b.kind==='carousel') return `<section class="adventure-gallery adventure-${b.kind}" aria-label="${b.kind==='row'?'Photo row':'Photo carousel'}">${b.kind==='carousel'?'<div class="gallery-controls"><button type="button" data-slide="-1" aria-label="Previous photo">←</button><span class="slide-count" aria-live="polite"></span><button type="button" data-slide="1" aria-label="Next photo">→</button></div>':''}<div class="gallery-track">${b.items.map(photo).join('')}</div>${text?`<p>${text}</p>`:''}</section>`;
  if(b.kind==='video') return `<figure><video controls playsinline preload="metadata" src="${safeSrc(urlFor(b))}"></video>${text?`<figcaption>${text}</figcaption>`:''}<p class="media-fallback"><a href="${safeSrc(urlFor(b))}">Open / download video</a></p></figure>`;
  if(b.kind==='map' && b.embed) return `<figure><iframe class="adventure-map-embed" src="${escapeHTML(mapEmbedURL(b.embed))}" title="${text||'Embedded map'}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><figcaption>${text}</figcaption></figure>`;
  if(b.kind==='map') return `<figure><div class="adventure-map" data-lat="${Number(b.lat)}" data-lon="${Number(b.lon)}" data-zoom="${Number(b.zoom)||12}" role="region" aria-label="Map: ${text}"></div><figcaption>${text}</figcaption></figure>`;
  if(b.kind==='gpx') return `<figure><div class="adventure-map" data-gpx="${safeSrc(urlFor(b))}" role="region" aria-label="GPX route: ${text}"></div><figcaption>${text} <a href="${safeSrc(urlFor(b))}" download>Download GPX route</a></figcaption></figure>`;
  throw new Error('Unsupported story section.');
 }).join('\n\n');
}
export function splitSource(source) {
 const match=source.replace(/\r\n/g,'\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
 if(!match) throw new Error('Post is missing its front matter.');
 return {front:match[1],body:match[2]};
}
export function field(front,key) {
 const value=front.match(new RegExp('^'+key+':\\s*(.*)$','m'))?.[1]?.trim() || '';
 try {return JSON.parse(value);} catch {return value.replace(/^'(.*)'$/,'$1').replace(/''/g,"'");}
}
export function readStored(source) {
 const {front,body}=splitSource(source);
 const marker=body.match(/<!-- adventure-editor:v2 ([A-Za-z0-9+/=]+) -->/);
 return {front,body,stored:marker?decodeData(marker[1]):null};
}
function validDate(value) {return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function makePost(draft,blocks) {
 if(!draft.title.trim()) throw new Error('Give your adventure a title.');
 if(!validDate(draft.date)) throw new Error('Choose a valid adventure date.');
 if(draft.endDate && (!validDate(draft.endDate)||draft.endDate<draft.date)) throw new Error('End date must be on or after the start date.');
 if(!blocks.some(b=>b.file||b.src||b.items?.length||b.text?.trim()||b.kind==='map')) throw new Error('Add a story or at least one photo or video.');
 for(const b of blocks) {
  if(b.kind==='row' && (b.items.length<2||b.items.length>3)) throw new Error('Side-by-side rows need 2 or 3 photos.');
  if(b.kind==='carousel' && b.items.length<2) throw new Error('Carousels need at least 2 photos.');
  if(b.items?.some(i=>i.kind!=='image')) throw new Error('Photo groups support images and GIFs only.');
  if(b.kind==='map' && b.embed) mapEmbedURL(b.embed);
  if(b.kind==='map' && !b.embed && (String(b.lat).trim()===''||String(b.lon).trim()===''||!Number.isFinite(Number(b.lat))||!Number.isFinite(Number(b.lon))||Math.abs(Number(b.lat))>85.0511||Math.abs(Number(b.lon))>180)) throw new Error('Enter valid map latitude (-85 to 85) and longitude (-180 to 180).');
 }
 const slug=draft.title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'adventure';
 const id=draft.path?draft.path.split('/').pop().replace(/\.md$/,''):`${draft.date}-${slug}-${draft.id}`;
 const media=allMedia(blocks), files=media.filter(b=>b.file);
 if(files.reduce((n,b)=>n+b.file.size,0)>MAX_TOTAL) throw new Error('Keep total attachments below 75 MB.');
 const paths=new Map(files.map((b,i)=>[b,`images/adventures/${id}/${draft.id}-${i+1}.${mediaExtension(b.file)}`]));
 const urlFor=b=>b.file?'/'+paths.get(b):b.src;
 const storedBlocks=blocks.map(b=>{
  const clean=i=>{const {file,url,selected,...rest}=i; return {...rest,...(file?{src:urlFor(i)}:{})};};
  return {...clean(b),...(b.items?{items:b.items.map(clean)}:{})};
 });
 const cover=media.find(b=>b.kind==='image');
 const permalink=draft.permalink||`/adventures/${id}/`;
 const dates=`<p><time datetime="${draft.date}">${draft.date}</time>${draft.endDate&&draft.endDate!==draft.date?` – <time datetime="${draft.endDate}">${draft.endDate}</time>`:''}</p>`;
 const values={title:draft.title.trim(),permalink,adventure:true,adventure_date:draft.date,adventure_end_date:draft.endDate||'',excerpt:escapeHTML(draft.summary.trim()),cover:cover?urlFor(cover):(draft.cover||'')};
 let front=draft.front||'layout: single\nheader:\n  image: /images/BG_Home.png';
 for(const [key,value] of Object.entries(values)) {
  const re=new RegExp('^'+key+':[^\\n]*(?:\\n[ \\t]+[^\\n]*)*','m');
  const line=`${key}: ${JSON.stringify(value)}`;
  front=re.test(front)?front.replace(re,()=>line):front+'\n'+line;
 }
 const stored={version:2,title:draft.title.trim(),date:draft.date,endDate:draft.endDate||'',summary:draft.summary,blocks:storedBlocks};
 const content=`---\n${front}\n---\n\n${dates}\n${draft.summary.trim()?`<p>${escapeHTML(draft.summary)}</p>\n`:''}\n${renderBlocks(blocks,urlFor)}\n\n<!-- adventure-editor:v2 ${encodeData(stored)} -->\n`;
 return {path:draft.path||`_pages/adventures/${id}.md`,content,paths,url:permalink,expectedSha:draft.sha};
}
export function github(token,fetcher=fetch,timeout=120000) {
 return async(path,method='GET',body)=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try {
   const response=await fetcher(`https://api.github.com${path}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',redirect:'error',signal:controller.signal});
   if(!response.ok) {const error=new Error(response.status===401?'Token expired or invalid. Lock and unlock with a valid token.':response.status===403||response.status===404?'GitHub denied access. Check repository selection and Contents: Read and write.':response.status===409||response.status===422?'The branch changed or GitHub rejected the update. Your draft is still here; try again.':`GitHub request failed (${response.status}). Your draft is still here.`);error.status=response.status;throw error;}
   return await response.json();
  } catch(error) {if(error.name==='AbortError') throw new Error('GitHub took too long to respond. Your draft is safe in this tab. Check your published post before retrying.');throw error;} finally {clearTimeout(timer);}
 };
}
export async function verifyOwner(api) {const user=await api('/user');if(user.login.toLowerCase()!==OWNER) throw new Error(`Only ${OWNER} can unlock this editor.`);const repo=await api(`/repos/${REPO}`);if(!repo.permissions?.push) throw new Error('This account does not have write access to the website repository.');}
export async function publishPost(api,post,readBase64,progress=()=>{}) {
 const root=`/repos/${REPO}`;
 progress('Checking the latest version…');
 const ref=await api(`${root}/git/ref/heads/${BRANCH}`),parent=await api(`${root}/git/commits/${ref.object.sha}`);
 let existing=null;
 try {existing=await api(`${root}/contents/${post.path}?ref=${ref.object.sha}`);} catch(error) {if(error.status!==404) throw error;}
 if(post.expectedSha) {if(existing?.sha!==post.expectedSha) throw new Error('This post changed since you opened it. Copy your changes, then reload the post before saving.');}
 else if(existing) throw new Error('This draft already exists on GitHub. Open it from Edit published post.');
 const tree=[];
 for(const [block,path] of post.paths) {progress(`Uploading attachment ${tree.length+1} of ${post.paths.size}: ${block.file.name}…`);const blob=await api(`${root}/git/blobs`,'POST',{content:await readBase64(block.file),encoding:'base64'});tree.push({path,mode:'100644',type:'blob',sha:blob.sha});}
 tree.push({path:post.path,mode:'100644',type:'blob',content:post.content});
 progress('Saving your adventure…');
 const next=await api(`${root}/git/trees`,'POST',{base_tree:parent.tree.sha,tree});
 const commit=await api(`${root}/git/commits`,'POST',{message:`${post.expectedSha?'Edit':'Add'} adventure: ${post.path.split('/').pop()}`,tree:next.sha,parents:[ref.object.sha]});
 await api(`${root}/git/refs/heads/${BRANCH}`,'PATCH',{sha:commit.sha,force:false});return commit.sha;
}
