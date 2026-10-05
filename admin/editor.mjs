import {MAX_TOTAL,REPO,BRANCH,mediaExtension,isVideo,allMedia,makePost,renderBlocks,escapeHTML,github,verifyOwner,publishPost,field,splitSource} from './core.mjs?v=photo-controls-2';
import {loadPost} from './import.mjs';
import {initMedia,parseGPX} from './media.mjs?v=photo-controls-2';
const $=id=>document.getElementById(id);
let api=null,busy=false,dirty=false,published=false,blocks=[],editing={},draftId=crypto.randomUUID().slice(0,8);
const today=new Date();$('date').value=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
function status(message) {for(const id of ['status','publish-status']) $(id).textContent=message;}
function markDirty(){dirty=true;$('preview').hidden=true;}
const draft=()=>({...editing,title:$('title').value,date:$('date').value,endDate:$('date-range').checked?$('end-date').value:'',summary:$('summary').value,id:draftId});
function action(label,callback,disabled=false){const b=document.createElement('button');b.type='button';b.textContent=label;b.className='secondary';b.disabled=disabled;b.onclick=callback;return b;}
function input(box,label,value,onchange,{multiline=false,type='text'}={}){
 const id='input-'+crypto.randomUUID(),l=document.createElement('label'),field=document.createElement(multiline?'textarea':'input');
 l.htmlFor=id;l.textContent=label;field.id=id;field.value=value??'';
 if(multiline)field.rows=5;else field.type=type;
 field.oninput=()=>{onchange(field.value);markDirty();};box.append(l,field);return field;
}
function dispose(block){for(const media of allMedia([block]))if(media.url)URL.revokeObjectURL(media.url);}
function drawMedia(box,media){
 const el=document.createElement(media.kind==='video'?'video':'img');el.src=media.url||media.src;
 if(media.kind==='video'){el.controls=true;el.preload='metadata';}else el.alt=media.text||'';
 box.append(el);input(box,'Caption / image description',media.text,v=>media.text=v);
}
function draw(){
 $('blocks').replaceChildren();
 blocks.forEach((block,index)=>{
  const box=document.createElement('div');box.className='block';
  const row=document.createElement('div');row.className='row';
  const name=document.createElement('strong');name.textContent=`${index+1}. ${block.kind==='row'?'Side-by-side photos':block.kind}`;
  const buttons=document.createElement('div');buttons.className='row';
  const move=offset=>{[blocks[index],blocks[index+offset]]=[blocks[index+offset],blocks[index]];markDirty();draw();};
  buttons.append(action('↑',()=>move(-1),index===0),action('↓',()=>move(1),index===blocks.length-1),action('Remove',()=>{dispose(block);blocks.splice(index,1);markDirty();draw();}));
  buttons.children[0].setAttribute('aria-label',`Move section ${index+1} up`);buttons.children[1].setAttribute('aria-label',`Move section ${index+1} down`);
  row.append(name,buttons);box.append(row);
  if(block.kind==='image'){
   const label=document.createElement('label');label.className='select-photo';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!block.selected;checkbox.onchange=()=>{block.selected=checkbox.checked;};label.append(checkbox,' Select photo for grouping');box.append(label);
   drawMedia(box,block);
  }else if(block.kind==='video') drawMedia(box,block);
  else if(block.items){
   const group=document.createElement('div');group.className='group-editor';
   block.items.forEach((item,i)=>{
    const card=document.createElement('div');drawMedia(card,item);
    card.append(action('←',()=>{[block.items[i-1],block.items[i]]=[item,block.items[i-1]];markDirty();draw();},i===0),action('→',()=>{[block.items[i+1],block.items[i]]=[item,block.items[i+1]];markDirty();draw();},i===block.items.length-1),action('Remove photo',()=>{dispose(item);block.items.splice(i,1);markDirty();draw();}));group.append(card);
   });box.append(group);
   const picker=document.createElement('input');picker.type='file';picker.multiple=true;picker.setAttribute('aria-label','Add photos to this group');picker.onchange=()=>attach(picker.files,block.kind,block);box.append(picker);
   box.append(action('Ungroup photos',()=>{blocks.splice(index,1,...block.items);markDirty();draw();}));
   input(box,'Group caption',block.text,v=>block.text=v);
  }else if(block.kind==='map'){
   input(box,'Map caption',block.text,v=>block.text=v);input(box,'Embed URL or iframe (optional; replaces coordinates)',block.embed,v=>{const iframe=new DOMParser().parseFromString(v,'text/html').querySelector('iframe');block.embed=iframe?.getAttribute('src')||v.trim();});input(box,'Latitude (for example 36.5785)',block.lat,v=>block.lat=v);input(box,'Longitude (for example -118.2923)',block.lon,v=>block.lon=v);input(box,'Zoom (1–19)',block.zoom||12,v=>block.zoom=Math.max(1,Math.min(19,Number(v))),{type:'number'});
   const hint=document.createElement('p');hint.className='hint';hint.textContent='Paste a Google Maps / OpenStreetMap embed URL or iframe, OR enter coordinates below it. Preview to check the map.';box.append(hint);
  }else if(block.kind==='gpx'){
   const p=document.createElement('p');p.textContent=block.file?.name||'Existing GPX route (reused on save)';box.append(p);input(box,'Route caption',block.text,v=>block.text=v);
  }else input(box,block.kind==='source'?'Original Markdown / HTML (preserved; edit here)':block.kind==='list'?'List items (one per line)':'Text',block.text,v=>block.text=v,{multiline:block.kind!=='heading'});
  $('blocks').append(box);
 });
}
function add(kind){blocks.push({kind,text:'',...(kind==='map'?{lat:'',lon:'',zoom:12}:{})});markDirty();draw();$('blocks').lastElementChild.querySelector('input,textarea')?.focus();}
async function attach(fileList,layout='individual',group=null){
 try{
  const files=Array.from(fileList);if(!files.length)return;
  const exts=files.map(mediaExtension);
  if(layout!=='individual'&&exts.some(e=>isVideo(e)||e==='gpx'))throw new Error('Photo rows and carousels support photos and GIFs only. Add videos separately.');
  if(layout==='row'&&(files.length+(group?.items.length||0)>3||(!group&&files.length<2)))throw new Error('Choose 2 or 3 photos for a side-by-side row.');
  if(layout==='carousel'&&!group&&files.length<2)throw new Error('Choose at least 2 photos for a carousel.');
  if(files.reduce((n,f)=>n+f.size,allMedia(blocks).reduce((n,b)=>n+(b.file?.size||0),0))>MAX_TOTAL)throw new Error('Keep total new attachments below 75 MB.');
  // Validate every GPX before changing the draft.
  for(let i=0;i<files.length;i++)if(exts[i]==='gpx')parseGPX(await files[i].text());
  const added=files.map((file,i)=>({kind:exts[i]==='gpx'?'gpx':isVideo(exts[i])?'video':'image',file,url:URL.createObjectURL(file),text:''}));
  if(group)group.items.push(...added);else if(layout==='individual')blocks.push(...added);else blocks.push({kind:layout,items:added,text:''});
  markDirty();draw();status(`${files.length} file(s) added. ${exts.some(e=>['mov','m4v'].includes(e))?'MOV/M4V playback depends on its codec. MP4 (H.264) is the most compatible.':''}`);
 }catch(error){status(error.message);}finally{$('media').value='';}
}
function groupSelected(kind){
 const selected=blocks.filter(b=>b.kind==='image'&&b.selected);
 if(selected.length<2||kind==='row'&&selected.length>3)return status(kind==='row'?'Select 2 or 3 individual photos first.':'Select at least 2 individual photos first.');
 const index=blocks.indexOf(selected[0]);selected.forEach(b=>delete b.selected);
 blocks=blocks.filter(b=>!selected.includes(b));blocks.splice(index,0,{kind,items:selected,text:''});markDirty();draw();status('Photos grouped. Use Ungroup photos to split them again.');
}
document.querySelectorAll('[data-add]').forEach(button=>button.onclick=()=>add(button.dataset.add));
$('group-row').onclick=()=>groupSelected('row');$('group-carousel').onclick=()=>groupSelected('carousel');
$('media').onchange=()=>attach($('media').files,$('media-layout').value);
$('date-range').onchange=()=>{$('end-date-wrap').hidden=!$('date-range').checked;markDirty();};
$('fields').addEventListener('input',markDirty);
const decodeFile=value=>new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g,'')),c=>c.charCodeAt(0)));
async function listPosts(){
 const files=await api(`/repos/${REPO}/contents/_pages/adventures?ref=${BRANCH}`);
 $('post-list').replaceChildren(new Option('Choose a published post…',''));
 for(const file of files.filter(f=>f.name.endsWith('.md'))) $('post-list').append(new Option(file.name.replace(/\.md$/,'').replace(/[-_]/g,' '),file.path));
}
async function openPost(path){
 if(dirty&&!confirm('Discard the unsaved draft in this tab and open this post?'))return;
 setBusy(true);status('Loading published post…');
 try{
  if(!/^_pages\/adventures\/[^/]+\.md$/.test(path))throw new Error('Choose an adventure post.');
  const result=await api(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`);
  const loaded=loadPost(decodeFile(result.content),path,result.sha);
  blocks.forEach(dispose);blocks=loaded.blocks;editing=loaded.draft;draftId=crypto.randomUUID().slice(0,8);published=false;dirty=false;
  $('title').value=editing.title;$('date').value=editing.date;$('summary').value=editing.summary;$('end-date').value=editing.endDate||'';$('date-range').checked=!!editing.endDate;$('end-date-wrap').hidden=!editing.endDate;
  $('publish').textContent='Save changes';$('preview').hidden=true;$('post-link').replaceChildren();draw();
  status('Editing published post. Existing media is reused. Your changes go live only when you save.');
 }catch(error){status(error.message);}finally{setBusy(false);}
}
$('load-post').onclick=()=>{if($('post-list').value)openPost($('post-list').value);else status('Choose a post first.');};
$('new-post').onclick=()=>{if(dirty&&!confirm('Discard the unsaved draft and start a new post?'))return;dirty=false;location.href='./';};
$('unlock').onclick=async()=>{
 const token=$('token').value.trim();if(!token)return status('Paste your private GitHub token first.');
 $('unlock').disabled=true;status('Checking owner access…');
 try{
  const client=github(token);await verifyOwner(client);api=client;$('token').value='';$('login').hidden=true;$('studio').hidden=false;
  status('Editor unlocked.');if(!blocks.length&&!published){add('paragraph');dirty=false;}
  await listPosts();const requested=new URLSearchParams(location.search).get('edit');if(requested&&!editing.path)await openPost(requested);
 }catch(error){status(error.message);$('token').value='';}finally{$('unlock').disabled=false;}
};
$('lock').onclick=()=>{api=null;$('studio').hidden=true;$('login').hidden=false;status('Locked. Draft remains in this tab until you close or reload it.');};
$('preview-button').onclick=()=>{
 try {makePost(draft(),blocks);} catch(error){return status(error.message);}
 $('preview-content').innerHTML=`<h1>${escapeHTML($('title').value)}</h1><p>${escapeHTML($('date').value)}${$('date-range').checked?' – '+escapeHTML($('end-date').value):''}</p><p>${escapeHTML($('summary').value)}</p>${renderBlocks(blocks,b=>b.url||b.src,{preview:true})}`;
 $('preview').hidden=false;initMedia($('preview-content'));$('preview').scrollIntoView({behavior:'smooth'});
};
function readBase64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('Unable to read attachment. Please reattach it.'));reader.readAsDataURL(file);});}
function setBusy(value){busy=value;$('fields').disabled=value||published;for(const id of ['publish','lock','load-post','new-post','post-list'])$(id).disabled=value||(id==='publish'&&published);$('publish').setAttribute('aria-busy',String(value));}
$('publish').onclick=async()=>{
 if(!api||busy||published)return;
 let post;try{if($('date-range').checked&&!$('end-date').value)throw new Error('Choose an end date.');post=makePost(draft(),blocks);}catch(error){return status(error.message);}
 setBusy(true);$('publish').textContent='Publishing…';
 try{
  await publishPost(api,post,readBase64,status);published=true;dirty=false;
  status('Saved to GitHub! Upload complete. Allow about 1–2 minutes for the website to rebuild.');
  const link=document.createElement('a');link.href=post.url;link.target='_blank';link.rel='noopener';link.textContent='Open published adventure';$('post-link').replaceChildren(link);
  $('publish').textContent='Published ✓';$('publish-status').scrollIntoView({behavior:'smooth',block:'center'});
  await listPosts();
 }catch(error){status(error.message);$('publish').textContent=editing.path?'Save changes':'Publish adventure';}finally{setBusy(false);}
};
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
