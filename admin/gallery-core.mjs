import {REPO,BRANCH,mediaExtension,MAX_TOTAL} from './core.mjs';
export const GALLERY_PATH='_data/gallery.json';
export function photoExtension(file){const ext=mediaExtension(file);if(!['jpg','png','webp','gif'].includes(ext))throw new Error('Choose JPG, PNG, WebP, or GIF photos.');return ext;}
export function manifestFor(photos){
 const ids=new Set();
 if(photos.reduce((n,p)=>n+(p.file?.size||0),0)>MAX_TOTAL)throw new Error('Keep new uploads below 75 MB per save.');
 return {version:1,photos:photos.map(p=>{
  if(!/^[a-zA-Z0-9-]+$/.test(p.id)||ids.has(p.id))throw new Error('Each photo must have a unique ID.');ids.add(p.id);
  if(!p.name.trim())throw new Error('Give every photo a name before publishing.');
  if(!/^\/images\/gallery\/[a-zA-Z0-9-]+\.(jpg|png|gif|webp)$/.test(p.src))throw new Error('Invalid gallery photo path.');
  if(p.file)photoExtension(p.file);
  if(!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<1||p.height<1)throw new Error('A photo could not be decoded. Remove it and upload it again.');
  if(p.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date))||new Date(p.date).toISOString().slice(0,10)!==p.date))throw new Error(`Choose a valid date for ${p.name}.`);
  const tags=Array.isArray(p.tags)?p.tags:String(p.tags||'').split(',');
  return {id:p.id,src:p.src,width:p.width,height:p.height,name:p.name.trim(),description:String(p.description||'').trim(),date:p.date||'',tags:[...new Set(tags.map(t=>t.trim().toLowerCase()).filter(Boolean))]};
 })};
}
export function decodeFile(content){return new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
export async function loadGallery(api){
 try{const result=await api(`/repos/${REPO}/contents/${GALLERY_PATH}?ref=${BRANCH}`);const data=JSON.parse(decodeFile(result.content));if(data.version!==1||!Array.isArray(data.photos))throw new Error('Unsupported gallery format.');return {photos:data.photos,sha:result.sha};}
 catch(error){if(error.status===404)return {photos:[],sha:null};throw error;}
}
export async function saveGallery(api,photos,expectedSha,readBase64,progress=()=>{}){
 const manifest=manifestFor(photos),root=`/repos/${REPO}`;
 progress('Checking the latest gallery…');
 const head=await api(`${root}/git/ref/heads/${BRANCH}`),parent=await api(`${root}/git/commits/${head.object.sha}`);
 let existing=null;try{existing=await api(`${root}/contents/${GALLERY_PATH}?ref=${head.object.sha}`);}catch(error){if(error.status!==404)throw error;}
 if((existing?.sha||null)!==expectedSha)throw new Error('The gallery changed since you opened it. Keep this tab open and copy your unsaved details before reloading the latest gallery.');
 const entries=[],uploads=photos.filter(p=>p.file);
 for(const [i,p] of uploads.entries()){
  progress(`Uploading ${i+1} of ${uploads.length}: ${p.name}…`);
  const blob=await api(`${root}/git/blobs`,'POST',{encoding:'base64',content:await readBase64(p.file)});
  entries.push({path:p.src.slice(1),mode:'100644',type:'blob',sha:blob.sha});
 }
 progress('Saving photo details…');
 const metadata=await api(`${root}/git/blobs`,'POST',{encoding:'utf-8',content:JSON.stringify(manifest,null,2)+'\n'});
 entries.push({path:GALLERY_PATH,mode:'100644',type:'blob',sha:metadata.sha});
 const tree=await api(`${root}/git/trees`,'POST',{base_tree:parent.tree.sha,tree:entries});
 const commit=await api(`${root}/git/commits`,'POST',{message:'Update favourite photo gallery',tree:tree.sha,parents:[head.object.sha]});
 await api(`${root}/git/refs/heads/${BRANCH}`,'PATCH',{sha:commit.sha,force:false});
 return {photos:manifest.photos,sha:metadata.sha,commit:commit.sha};
}
