export function parseGPX(xml) {
 if(/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('GPX must not contain a document type or entity declarations.');
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='gpx') throw new Error('This is not a valid GPX file.');
 const elements=name=>Array.from(doc.getElementsByTagNameNS('*',name));
 let segments=elements('trkseg').map(el=>Array.from(el.getElementsByTagNameNS('*','trkpt')));
 if(!segments.length) segments=elements('rte').map(el=>Array.from(el.getElementsByTagNameNS('*','rtept')));
 if(!segments.length) segments=[elements('wpt')];
 segments=segments.map(points=>points.map(p=>{
  const rawLat=p.getAttribute('lat'),rawLon=p.getAttribute('lon'),lat=Number(rawLat),lon=Number(rawLon);
  if(rawLat===null||rawLon===null||rawLat.trim()===''||rawLon.trim()===''||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) throw new Error('GPX contains invalid coordinates.');
  return [lat,lon];
 })).filter(points=>points.length);
 if(!segments.length) throw new Error('No track, route, or waypoint coordinates found in this GPX file.');
 // Bound rendering work while retaining segment endpoints; download retains full original GPX.
 const count=segments.reduce((n,s)=>n+s.length,0),step=Math.max(1,Math.ceil(count/10000));
 return segments.map(s=>s.filter((_,i)=>i===0||i===s.length-1||i%step===0));
}
let lightbox;
function showPhoto(links,index) {
 if(!lightbox) {
  lightbox=document.createElement('dialog');lightbox.className='adventure-lightbox';
  lightbox.innerHTML='<button type="button" class="lightbox-close" aria-label="Close expanded photo">Close ×</button><div class="lightbox-stage"><button type="button" data-step="-1" aria-label="Previous expanded photo">←</button><img alt=""><button type="button" data-step="1" aria-label="Next expanded photo">→</button></div><p aria-live="polite"></p>';
  document.body.append(lightbox);lightbox.querySelector('.lightbox-close').onclick=()=>lightbox.close();
  lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
 }
 const update=()=>{const a=links[index];lightbox.querySelector('img').src=a.href;lightbox.querySelector('img').alt=a.querySelector('img').alt;lightbox.querySelector('p').textContent=`${index+1} / ${links.length} — ${a.querySelector('img').alt}`;};
 const advance=step=>{index=(index+step+links.length)%links.length;update();};
 lightbox.querySelectorAll('[data-step]').forEach(b=>{b.disabled=links.length<2;b.onclick=()=>advance(Number(b.dataset.step));});
 lightbox.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();advance(e.key==='ArrowLeft'?-1:1);}};
 update();if(!lightbox.open)lightbox.showModal();
}
export function initMedia(root=document) {
 root.querySelectorAll('.adventure-photo:not([data-ready])').forEach(a=>{a.dataset.ready='true';a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const group=a.closest('.adventure-gallery');const links=group?Array.from(group.querySelectorAll('.adventure-photo')):[a];showPhoto(links,links.indexOf(a));},{capture:true});});
 root.querySelectorAll('.adventure-carousel:not([data-ready])').forEach(gallery=>{
  gallery.dataset.ready='true';const track=gallery.querySelector('.gallery-track'),slides=Array.from(track.children),count=gallery.querySelector('.slide-count');
  const current=()=>Math.max(0,Math.min(slides.length-1,Math.round(track.scrollLeft/Math.max(1,track.clientWidth))));
  const update=()=>{count.textContent=`${current()+1} / ${slides.length}`;};
  gallery.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>slides[(current()+Number(b.dataset.slide)+slides.length)%slides.length].scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'}));
  track.addEventListener('scroll',update,{passive:true});update();
 });
 root.querySelectorAll('.adventure-map:not([data-ready])').forEach(async el=>{
  el.dataset.ready='true';
  try {
   if(!window.L) throw new Error('Map library could not load.');
   let segments;
   if(el.dataset.gpx) {
    const url=new URL(el.dataset.gpx,location.href);
    if(url.origin!==location.origin) throw new Error('Route must be hosted on this website.');
    const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error('Route file could not load.');
    segments=parseGPX(await response.text());
   }
   const map=L.map(el,{scrollWheelZoom:false});
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
   if(segments){const route=L.polyline(segments,{color:'#216a50',weight:4}).addTo(map);map.fitBounds(route.getBounds(),{padding:[24,24],maxZoom:15});}
   else {const center=[Number(el.dataset.lat),Number(el.dataset.lon)];map.setView(center,Number(el.dataset.zoom)||12);L.circleMarker(center,{radius:7,color:'#216a50',fillOpacity:.8}).addTo(map);}
   L.control.scale().addTo(map);
   const observer=new ResizeObserver(()=>{if(!el.isConnected){observer.disconnect();map.remove();}else map.invalidateSize();});observer.observe(el);
  } catch(error) {el.textContent=`Map unavailable: ${error.message} You can still download the route below.`;}
 });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>initMedia());else initMedia();
