import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makePost, renderBlocks, mediaExtension, MAX_FILE, verifyOwner, publishPost, github} from '../admin/core.mjs';
const draft = {title:'A trip: "雪"', date:'2026-10-01', summary:'<script>no</script> {{ secrets }}', id:'abcdef12'};
test('creates safe formatted post with media and automatic list metadata', () => {
  const image = {kind:'image',text:'A <view>',file:{name:'photo.png',type:'image/png',size:100}};
  const video = {kind:'video',text:'Skiing',file:{name:'clip.mp4',type:'video/mp4',size:100}};
  const post = makePost(draft,[{kind:'heading',text:'{% include secret %}'},{kind:'paragraph',text:'one\n\ntwo'},image,video]);
  assert.match(post.content,/adventure: true/);
  assert.match(post.content,/title: "A trip: \\"雪\\""/);
  assert.match(post.content,/&lt;script&gt;/);
  assert.ok(!post.content.includes('{%'));
  assert.ok(!post.content.includes('{{'));
  assert.match(post.content,/<video controls playsinline/);
  assert.match(post.content,/\/abcdef12-1.png/);
  assert.equal(post.paths.size,2);
  assert.match(post.path,/2026-10-01-a-trip-abcdef12.md$/);
});
test('rejects missing input and unsupported or oversized files', () => {
  assert.throws(() => makePost({...draft,title:''},[]),/title/);
  assert.throws(() => makePost(draft,[]),/story/);
  assert.throws(() => mediaExtension({name:'bad.svg',type:'image/svg+xml',size:10}),/choose/);
  assert.throws(() => mediaExtension({name:'big.mp4',type:'video/mp4',size:MAX_FILE+1}),/25 MB/);
  assert.throws(() => makePost(draft,Array.from({length:4},()=>({kind:'video',file:{type:'video/mp4',size:MAX_FILE}}))),/75 MB/);
});
test('renders lists and escapes executable markup in captions', () => {
  const html = renderBlocks([{kind:'list',text:'one\ntwo'},{kind:'image',text:'<img onerror="alert(1)">'}],()=>'/safe.png');
  assert.match(html,/<li>one<\/li><li>two<\/li>/);
  assert.match(html,/&lt;img/);
});
test('owner check rejects another account and accounts without push access', async () => {
  await assert.rejects(verifyOwner(async()=>({login:'someone'})),/Only/);
  await assert.rejects(verifyOwner(async path => path === '/user' ? {login:'thchrischoi'} : {permissions:{push:false}}),/write access/);
});
function fakeAPI({exists=false, conflict=false}={}) {
  const calls=[];
  const api = async (path,method='GET',body) => {
    calls.push({path,method,body});
    if(path.includes('/git/ref/')) return {object:{sha:'old'}};
    if(path.endsWith('/git/commits/old')) return {tree:{sha:'base'}};
    if(path.includes('/contents/')) {if(exists) return {sha:'existing'}; throw Object.assign(new Error('missing'),{status:404});}
    if(method === 'PATCH' && conflict) throw Object.assign(new Error('conflict'),{status:422});
    return {sha:method === 'PATCH' ? 'done' : 'new'};
  };
  return {api,calls};
}
test('publishes media and post atomically without replacing existing tree or forcing update', async () => {
  const {api,calls}=fakeAPI();
  const image={kind:'image',text:'',file:{type:'image/gif',name:'a.gif',size:2}};
  await publishPost(api,makePost(draft,[image]),async()=> 'R0lG');
  const tree = calls.find(c=>c.path.endsWith('/git/trees')).body;
  assert.equal(tree.base_tree,'base'); assert.equal(tree.tree.length,2);
  assert.equal(calls.at(-1).method,'PATCH'); assert.equal(calls.at(-1).body.force,false);
  assert.deepEqual(calls.find(c=>c.path.endsWith('/git/commits')).body.parents,['old']);
});
test('retry refuses duplicate draft and conflicting branch updates are surfaced', async () => {
  const post=makePost(draft,[{kind:'paragraph',text:'hello'}]);
  const duplicate=fakeAPI({exists:true});
  await assert.rejects(publishPost(duplicate.api,post),/already exists/);
  assert.ok(duplicate.calls.every(c=>c.method==='GET'));
  const conflict=fakeAPI({conflict:true});
  await assert.rejects(publishPost(conflict.api,post),/conflict/);
});
test('API uses GitHub only and reports authentication failure', async () => {
  const api = github('test-token',async (url, options)=>{
    assert.equal(url,'https://api.github.com/user');
    assert.equal(options.headers.Authorization,'Bearer test-token');
    assert.equal(options.redirect,'error'); return {ok:false,status:401};
  });
  await assert.rejects(api('/user'),/expired or invalid/);
});

test('GIF and video filenames work when file pickers omit or generalize MIME types',()=>{
 assert.equal(mediaExtension({name:'ANIMATION.GIF',type:'',size:30}),'gif');
 assert.equal(mediaExtension({name:'clip.MOV',type:'application/octet-stream',size:30}),'mov');
 assert.equal(mediaExtension({name:'track.GPX',type:'',size:30}),'gpx');
});
test('date range and gallery metadata round-trip with existing media and Unicode',async()=>{
 const {readStored}=await import('../admin/core.mjs');
 const items=[{kind:'image',src:'/images/old.jpg',text:'雪'},{kind:'image',src:'/images/old.gif',text:'A & B'}];
 const post=makePost({...draft,endDate:'2026-10-03'},[{kind:'row',items},{kind:'carousel',items}]);
 assert.match(post.content,/adventure_end_date: "2026-10-03"/);
 assert.match(post.content,/adventure-row/);assert.match(post.content,/adventure-carousel/);
 assert.equal(post.paths.size,0);
 assert.equal(readStored(post.content).stored.blocks[1].items[0].text,'雪');
 assert.throws(()=>makePost({...draft,endDate:'2026-09-01'},[{kind:'row',items}]),/End date/);
 assert.throws(()=>makePost({...draft,date:'2026-02-30'},[{kind:'row',items}]),/valid adventure date/);
 assert.throws(()=>makePost(draft,[{kind:'row',items:[...items,...items]}]),/2 or 3/);
});
test('updates preserve permalink and front matter; existing media is never uploaded again',async()=>{
 const post=makePost({...draft,path:'_pages/adventures/original.md',sha:'existing',permalink:'/adventures/original/',front:'layout: single\ncustom: keep\nheader:\n  image: /images/original.jpg\ntitle: old'},[{kind:'image',src:'/images/keep.gif',text:'Still here'}]);
 const {api,calls}=fakeAPI({exists:true});
 await publishPost(api,post,()=>assert.fail('Existing media must not upload'));
 assert.equal(post.url,'/adventures/original/');assert.equal(post.path,'_pages/adventures/original.md');
 assert.match(post.content,/custom: keep/);assert.match(post.content,/image: \/images\/original.jpg/);
 assert.equal((post.content.match(/^title:/gm)||[]).length,1);
 assert.ok(!calls.some(c=>c.path.endsWith('/git/blobs')));
 await assert.rejects(publishPost(fakeAPI({exists:true}).api,{...post,expectedSha:'stale'}),/changed since/);
});
test('map and route markup is constrained and validated',()=>{
 const post=makePost(draft,[{kind:'map',lat:36.5785,lon:-118.2923,text:'Summit'},{kind:'gpx',src:'/images/route.gpx',text:'Our route'}]);
 assert.match(post.content,/data-lat="36.5785"/);assert.match(post.content,/data-gpx="\/images\/route.gpx"/);
 assert.match(post.content,/Download GPX route/);
 assert.throws(()=>makePost(draft,[{kind:'map',lat:200,lon:0}]),/latitude/);
 assert.throws(()=>makePost(draft,[{kind:'image',src:'javascript:alert(1)'}]),/website/);
});
test('stalled requests time out and allow a retry instead of hanging forever',async()=>{
 const api=github('test',async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})))),5);
 await assert.rejects(api('/user'),/too long/);
});
test('map embeds accept supported providers and reject arbitrary frames',async()=>{
 const {mapEmbedURL}=await import('../admin/core.mjs');
 assert.equal(mapEmbedURL('https://www.google.com/maps/embed?pb=test'),'https://www.google.com/maps/embed?pb=test');
 const post=makePost(draft,[{kind:'map',embed:'https://www.openstreetmap.org/export/embed.html?bbox=1,2,3,4',text:'Location'}]);
 assert.match(post.content,/<iframe class="adventure-map-embed"/);
 assert.throws(()=>mapEmbedURL('https://evil.example/maps/embed'),/embed URL/);
 assert.throws(()=>mapEmbedURL('https://www.google.com.evil.example/maps/embed'),/embed URL/);
 assert.throws(()=>mapEmbedURL('javascript:alert(1)'),/embed URL/);
});
