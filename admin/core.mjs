export const OWNER = 'thchrischoi';
export const REPO = `${OWNER}/${OWNER}.github.io`;
export const BRANCH = 'master';
export const MAX_FILE = 25 * 1024 * 1024;
export const MAX_TOTAL = 75 * 1024 * 1024;
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' };
export function mediaExtension(file) {
  const ext = extensions[file.type];
  if (!ext) throw new Error(`${file.name}: choose a JPG, PNG, GIF, WebP, MP4, or WebM file.`);
  if (!file.size || file.size > MAX_FILE) throw new Error(`${file.name}: files must be nonempty and no larger than 25 MB.`);
  return ext;
}
// Encode braces too: Jekyll evaluates Liquid before rendering HTML.
export function escapeHTML(value) {
  return String(value).replace(/[&<>"'{}]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','{':'&#123;','}':'&#125;'}[c]));
}
export function renderBlocks(blocks, urlFor) {
  return blocks.map(b => {
    const text = escapeHTML(b.text || '');
    if (b.kind === 'heading') return `<h2>${text}</h2>`;
    if (b.kind === 'list') return `<ul>${text.split('\n').filter(x => x.trim()).map(x => `<li>${x}</li>`).join('')}</ul>`;
    if (b.kind === 'paragraph') return text.split(/\n\s*\n/).filter(Boolean).map(x => `<p>${x.replace(/\n/g, '<br>')}</p>`).join('\n');
    const url = escapeHTML(urlFor(b));
    const media = b.kind === 'video' ? `<video controls playsinline preload="metadata" src="${url}"></video>` : `<img src="${url}" alt="${text}" loading="lazy">`;
    return `<figure>${media}${text ? `<figcaption>${text}</figcaption>` : ''}</figure>`;
  }).join('\n\n');
}
export function makePost(draft, blocks) {
  if (!draft.title.trim()) throw new Error('Give your adventure a title.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !Number.isFinite(Date.parse(draft.date))) throw new Error('Choose an adventure date.');
  if (!blocks.some(b => b.file || b.text?.trim())) throw new Error('Add a story or at least one photo or video.');
  const slug = draft.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'adventure';
  const id = `${draft.date}-${slug}-${draft.id}`;
  const files = blocks.filter(b => b.file);
  if (files.reduce((n, b) => n + b.file.size, 0) > MAX_TOTAL) throw new Error('Keep total attachments below 75 MB.');
  const paths = new Map(files.map((b, i) => [b, `images/adventures/${id}/${i + 1}.${mediaExtension(b.file)}`]));
  const cover = files.find(b => b.kind === 'image');
  const quote = v => JSON.stringify(v);
  const body = renderBlocks(blocks, b => '/' + paths.get(b));
  const content = `---\nlayout: single\ntitle: ${quote(draft.title.trim())}\npermalink: /adventures/${id}/\nadventure: true\nadventure_date: ${quote(draft.date)}\nexcerpt: ${quote(escapeHTML(draft.summary.trim()))}\ncover: ${quote(cover ? '/' + paths.get(cover) : '')}\nheader:\n  image: /images/BG_Home.png\n---\n\n<p><time datetime="${draft.date}">${draft.date}</time></p>\n${draft.summary.trim() ? `<p>${escapeHTML(draft.summary)}</p>\n` : ''}\n${body}\n`;
  return { path: `_pages/adventures/${id}.md`, content, paths, url: `/adventures/${id}/` };
}
export function github(token, fetcher = fetch) {
  return async (path, method = 'GET', body) => {
    const response = await fetcher(`https://api.github.com${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? {'Content-Type':'application/json'} : {}) },
      ...(body ? {body: JSON.stringify(body)} : {}), cache: 'no-store', redirect: 'error'
    });
    if (!response.ok) {
      const error = new Error(response.status === 401 ? 'Token expired or invalid. Lock the editor and unlock with a valid token.' : response.status === 403 || response.status === 404 ? 'GitHub denied access. Check repository selection, Contents: Read and write, and branch permissions.' : response.status === 409 || response.status === 422 ? 'The branch changed or GitHub rejected the update. Your draft is still here; try publishing again.' : `GitHub request failed (${response.status}). Your draft is still here.`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  };
}
export async function verifyOwner(api) {
  const user = await api('/user');
  if (user.login.toLowerCase() !== OWNER) throw new Error(`Only ${OWNER} can unlock this editor.`);
  const repo = await api(`/repos/${REPO}`);
  if (!repo.permissions?.push) throw new Error('This account does not have write access to the website repository.');
}
export async function publishPost(api, post, readBase64, progress = () => {}) {
  const root = `/repos/${REPO}`;
  const ref = await api(`${root}/git/ref/heads/${BRANCH}`);
  const parent = await api(`${root}/git/commits/${ref.object.sha}`);
  // Same draft ID survives retries, including an ambiguous network failure after publishing.
  try {
    const existing = await api(`${root}/contents/${post.path}?ref=${ref.object.sha}`);
    if (existing) throw new Error('This draft already exists on GitHub. Check the Adventures page before publishing again.');
  } catch (error) { if (error.status !== 404) throw error; }
  const tree = [];
  for (const [block, path] of post.paths) {
    progress(`Uploading attachment ${tree.length + 1} of ${post.paths.size}…`);
    const blob = await api(`${root}/git/blobs`, 'POST', {content: await readBase64(block.file), encoding: 'base64'});
    tree.push({path, mode:'100644', type:'blob', sha:blob.sha});
  }
  tree.push({path: post.path, mode:'100644', type:'blob', content:post.content});
  progress('Saving your adventure…');
  const next = await api(`${root}/git/trees`, 'POST', {base_tree:parent.tree.sha, tree});
  const commit = await api(`${root}/git/commits`, 'POST', {message:`Add adventure: ${post.path.split('/').pop()}`, tree:next.sha, parents:[ref.object.sha]});
  await api(`${root}/git/refs/heads/${BRANCH}`, 'PATCH', {sha:commit.sha, force:false});
  return commit.sha;
}
