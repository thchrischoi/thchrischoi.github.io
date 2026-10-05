import {github,verifyOwner,MAX_TOTAL} from './core.mjs';
import {photoExtension,loadGallery,saveGallery} from './gallery-core.mjs';
const $=id=>document.getElementById(id);let api=null,photos=[],sha=null,dirty=false,busy=false,loaded=false;
function status(message){$('status').textContent=message;$('save-status').textContent=message;}
function working(value){busy=value;document.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=value);}
function render(){
 const list=$('photo-list');list.replaceChildren();
 if(!photos.length){const p=document.createElement('p');p.textContent='Your collection is empty. Add your first photographs above.';list.append(p);}
 photos.forEach((p,index)=>{
  const card=document.createElement('section');card.className='gallery-card';
  const left=document.createElement('div'),img=document.createElement('img');img.src=p.preview||p.src;img.alt=p.name;img.draggable=false;left.append(img);
  const ref=document.createElement('p');ref.className='hint';ref.textContent='Photo reference: '+p.id;left.append(ref);
  const fields=document.createElement('div');
  for(const [key,label,type] of [['name','Photo name','text'],['description','Description','textarea'],['date','Date taken (optional)','date'],['tags','Tags (comma separated)','text']]){
   const id=p.id+'-'+key,l=document.createElement('label');l.htmlFor=id;l.textContent=label;
   const input=document.createElement(type==='textarea'?'textarea':'input');input.id=id;if(type!=='textarea')input.type=type;else input.rows=3;
   input.value=Array.isArray(p[key])?p[key].join(', '):p[key]||'';input.addEventListener('input',()=>{p[key]=input.value;dirty=true;if(key==='name')img.alt=input.value;});fields.append(l,input);
  }
  const actions=document.createElement('div');actions.className='toolbar';
  for(const [label,action,disabled] of [['Move up',()=>move(index,-1),index===0],['Move down',()=>move(index,1),index===photos.length-1],['Remove',()=>{if(!confirm('Remove this photo from the gallery?'))return;if(p.preview)URL.revokeObjectURL(p.preview);photos.splice(index,1);dirty=true;render();},false]]){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.className='secondary';b.disabled=disabled;b.onclick=action;actions.append(b);
  }fields.append(actions);card.append(left,fields);list.append(card);
 });
}
function move(index,delta){[photos[index],photos[index+delta]]=[photos[index+delta],photos[index]];dirty=true;render();}
$('unlock').onclick=async()=>{working(true);try{api=github($('token').value.trim());await verifyOwner(api);if(!loaded){const result=await loadGallery(api);photos=result.photos;sha=result.sha;loaded=true;}$('token').value='';$('login').hidden=true;$('studio').hidden=false;status('Gallery unlocked.');render();}catch(e){api=null;status(e.message);}finally{working(false);render();}};
$('lock').onclick=()=>{api=null;$('studio').hidden=true;$('login').hidden=false;status('Locked. Unsaved drafts remain in this tab.');};
$('photos').onchange=async()=>{
 working(true);const added=[];try{
  const files=Array.from($('photos').files);if(files.reduce((n,f)=>n+f.size,photos.reduce((n,p)=>n+(p.file?.size||0),0))>MAX_TOTAL)throw new Error('Keep new uploads below 75 MB per save.');
  for(const file of files){const ext=photoExtension(file),preview=URL.createObjectURL(file),id=crypto.randomUUID();const p={id,src:`/images/gallery/${id}.${ext}`,name:file.name.replace(/\.[^.]+$/,'').replace(/[_-]/g,' '),description:'',date:'',tags:[],file,preview};added.push(p);const img=new Image();img.src=preview;await img.decode();p.width=img.naturalWidth;p.height=img.naturalHeight;}
  photos.push(...added);dirty=true;status(`${added.length} photo(s) added to your draft. Add details, then publish.`);render();
 }catch(e){added.forEach(p=>URL.revokeObjectURL(p.preview));status(e.message);}finally{$('photos').value='';working(false);render();}
};
function base64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('Could not read photo.'));reader.readAsDataURL(file);});}
$('save').onclick=async()=>{working(true);try{const result=await saveGallery(api,photos,sha,base64,status);const previews=new Map(photos.map(p=>[p.id,p.preview]));photos=result.photos.map(p=>({...p,preview:previews.get(p.id)}));sha=result.sha;dirty=false;status('Published to GitHub. Your gallery updates when GitHub Pages finishes building, usually within a few minutes.');render();}catch(e){status(e.message+' If the connection dropped during publishing, check GitHub before retrying.');}finally{working(false);render();}};
window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
