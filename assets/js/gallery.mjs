/* Justified rows preserve each photo's native proportions. */
export function justifiedLayout(photos,width,gap=10,target=250){
 if(width<=0)return [];
 const result=[];let row=[],sum=0;
 const finish=last=>{
  if(!row.length)return;
  const fitted=(width-gap*(row.length-1))/sum;
  const height=last?Math.min(target,fitted):fitted;
  row.forEach(({index,ratio})=>result[index]={width:Math.max(1,ratio*height-.02),height});row=[];sum=0;
 };
 photos.forEach((p,index)=>{
  const ratio=p.width/p.height||1;
  row.push({index,ratio});sum+=ratio;
  if(sum*target+gap*(row.length-1)>=width)finish(false);
 });finish(true);return result;
}
export function initGallery(root=document){
 const grid=root.querySelector('#photo-grid'),dialog=root.querySelector('#gallery-viewer');if(!grid||!dialog)return;
 const tiles=Array.from(grid.querySelectorAll('.gallery-tile')),photos=tiles.map(t=>JSON.parse(t.dataset.photo));
 let active=0,opener=null;
 const draw=()=>{
  const p=photos[active],img=dialog.querySelector('#gallery-full-photo');img.src=tiles[active].querySelector('img').src;img.alt=p.name;
  dialog.querySelector('#gallery-photo-name').textContent=p.name;
  dialog.querySelector('#gallery-photo-description').textContent=p.description||'';
  dialog.querySelector('#gallery-photo-date').textContent=p.date?new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(p.date+'T00:00:00Z')):'Not specified';
  dialog.querySelector('#gallery-photo-count').textContent=`${active+1} / ${photos.length}`;
  dialog.querySelector('#gallery-photo-reference').textContent=`Photo reference · ${p.id}`;
  const tags=dialog.querySelector('#gallery-photo-tags');tags.replaceChildren(...p.tags.map(tag=>{const el=document.createElement('span');el.className='gallery-tag';el.textContent=tag;return el;}));
  dialog.querySelectorAll('.gallery-prev,.gallery-next').forEach(b=>b.disabled=photos.length<2);
 };
 tiles.forEach((tile,index)=>tile.addEventListener('click',()=>{active=index;opener=tile;draw();dialog.showModal();document.documentElement.classList.add('gallery-modal-open');}));
 const step=delta=>{active=(active+delta+photos.length)%photos.length;draw();};
 dialog.querySelector('.gallery-prev').onclick=()=>step(-1);dialog.querySelector('.gallery-next').onclick=()=>step(1);dialog.querySelector('.gallery-close').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{document.documentElement.classList.remove('gallery-modal-open');opener?.focus({preventScroll:true});});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1);}});
 for(const el of [grid,dialog])for(const type of ['contextmenu','dragstart'])el.addEventListener(type,e=>{if(e.target.closest('img,.gallery-tile'))e.preventDefault();});
 const layout=()=>{const width=grid.clientWidth;if(!width)return;const sizes=justifiedLayout(photos,width,10,width<600?160:260);tiles.forEach((tile,i)=>{tile.style.width=sizes[i].width+'px';tile.style.height=sizes[i].height+'px';tile.style.flex='0 0 '+sizes[i].width+'px';});};
 new ResizeObserver(layout).observe(grid);layout();
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initGallery());else initGallery();}
