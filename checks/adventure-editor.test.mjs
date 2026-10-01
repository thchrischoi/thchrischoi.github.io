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
  assert.match(post.content,/\/1.png/);
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
