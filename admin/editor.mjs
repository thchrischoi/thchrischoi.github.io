import {MAX_TOTAL, mediaExtension, makePost, renderBlocks, escapeHTML, github, verifyOwner, publishPost} from './core.mjs';
const $ = id => document.getElementById(id);
let api = null, busy = false, dirty = false, published = false;
const blocks = [];
const draftId = crypto.randomUUID().slice(0, 8);
const today = new Date();
$('date').value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
const status = message => { $('status').textContent = message; };
const draft = () => ({title:$('title').value, date:$('date').value, summary:$('summary').value, id:draftId});
function markDirty() { dirty = true; $('preview').hidden = true; }
function action(label, callback, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = label; button.className = 'secondary'; button.disabled = disabled;
  button.addEventListener('click', callback); return button;
}
function draw() {
  $('blocks').replaceChildren();
  blocks.forEach((block, index) => {
    const box = document.createElement('div'); box.className = 'block';
    const row = document.createElement('div'); row.className = 'row';
    const name = document.createElement('strong'); name.textContent = `${index+1}. ${block.kind}`;
    const actions = document.createElement('div'); actions.className = 'row';
    const move = offset => { [blocks[index], blocks[index+offset]] = [blocks[index+offset], blocks[index]]; markDirty(); draw(); };
    actions.append(action('↑', () => move(-1), index === 0), action('↓', () => move(1), index === blocks.length-1), action('Remove', () => {if(block.url) URL.revokeObjectURL(block.url); blocks.splice(index,1); markDirty(); draw();}));
    actions.children[0].setAttribute('aria-label',`Move section ${index+1} up`);
    actions.children[1].setAttribute('aria-label',`Move section ${index+1} down`);
    actions.children[2].setAttribute('aria-label',`Remove section ${index+1}`);
    row.append(name, actions); box.append(row);
    if (block.file) {
      const media = document.createElement(block.kind === 'video' ? 'video' : 'img');
      media.src = block.url;
      if(block.kind === 'video') {media.controls = true; media.preload = 'metadata';} else media.alt = block.text;
      box.append(media);
    }
    const label = document.createElement('label'); label.htmlFor = `block-${block.id}`;
    label.textContent = block.file ? 'Caption / image description' : block.kind === 'list' ? 'List items (one per line)' : 'Text';
    const field = document.createElement(block.kind === 'heading' || block.file ? 'input' : 'textarea');
    field.id = label.htmlFor; field.value = block.text;
    if(field.tagName === 'TEXTAREA') field.rows = 5;
    field.addEventListener('input', () => {block.text = field.value; markDirty();});
    box.append(label, field); $('blocks').append(box);
  });
}
function add(kind) {blocks.push({id:crypto.randomUUID(), kind, text:''}); markDirty(); draw(); $('blocks').lastElementChild.querySelector('input,textarea').focus();}
document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => add(button.dataset.add)));
$('fields').addEventListener('input', markDirty);
$('unlock').addEventListener('click', async () => {
  const token = $('token').value.trim();
  if (!token) return status('Paste your private GitHub token first.');
  $('unlock').disabled = true; status('Checking owner access…');
  try {
    const client = github(token); await verifyOwner(client); api = client;
    $('token').value = ''; $('login').hidden = true; $('studio').hidden = false;
    status('Editor unlocked. Your token is held only in this tab.');
    if (!blocks.length && !published) {add('paragraph'); dirty = false;}
  } catch(error) {status(error.message); $('token').value = '';}
  finally {$('unlock').disabled = false;}
});
$('lock').addEventListener('click', () => {api = null; $('studio').hidden = true; $('login').hidden = false; status('Locked. Your draft remains in this tab until you close or reload it.');});
$('media').addEventListener('change', () => {
  try {
    const files = Array.from($('media').files);
    files.forEach(mediaExtension);
    if (files.reduce((n,f) => n+f.size, blocks.reduce((n,b) => n+(b.file?.size || 0),0)) > MAX_TOTAL) throw new Error('Keep total attachments below 75 MB.');
    files.forEach(file => blocks.push({id:crypto.randomUUID(),kind:file.type.startsWith('video/')?'video':'image',file,url:URL.createObjectURL(file),text:''}));
    markDirty(); draw(); status(`${files.length} attachment(s) added.`);
  } catch(error) {status(error.message);}
  finally {$('media').value = '';}
});
$('preview-button').addEventListener('click', () => {
  $('preview-content').innerHTML = `<h1>${escapeHTML($('title').value || 'Untitled adventure')}</h1><p>${escapeHTML($('date').value)}</p><p>${escapeHTML($('summary').value)}</p>${renderBlocks(blocks, b => b.url)}`;
  $('preview').hidden = false; $('preview').scrollIntoView({behavior:'smooth'});
});
function readBase64(file) {
  return new Promise((resolve,reject) => {const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(new Error('Unable to read attachment. Please reattach it.')); reader.readAsDataURL(file);});
}
$('publish').addEventListener('click', async () => {
  if (!api || busy || published) return;
  let post;
  try {post = makePost(draft(), blocks);} catch(error) {return status(error.message);}
  busy = true; $('fields').disabled = true; $('publish').disabled = true; $('lock').disabled = true;
  try {
    await publishPost(api, post, readBase64, status);
    published = true; dirty = false;
    status('Saved to GitHub! Your adventure will appear after GitHub Pages rebuilds. ');
    const link = document.createElement('a'); link.href = post.url; link.textContent = 'Open adventure'; $('status').append(link);
    $('publish').textContent = 'Published';
    const another = document.createElement('a'); another.href = './'; another.textContent = 'Start another adventure'; $('studio').append(another);
  } catch(error) {status(error.message + ' If the connection dropped while saving, check GitHub before retrying.');}
  finally {busy = false; $('fields').disabled = published; $('publish').disabled = published; $('lock').disabled = false;}
});
window.addEventListener('beforeunload', event => {if(dirty || busy) {event.preventDefault(); event.returnValue = '';}});
