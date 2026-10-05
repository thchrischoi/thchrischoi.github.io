// Discourage casual image saving without blocking text, navigation, or map menus.
function isPhotoTarget(target) {
  if (!(target instanceof Element)) return false;
  const image = target.closest('img') || target.closest('a, .adventure-photo')?.querySelector('img');
  return image && !image.closest('.leaflet-container');
}
for (const type of ['contextmenu', 'dragstart']) {
  document.addEventListener(type, event => {
    if (isPhotoTarget(event.target)) event.preventDefault();
  }, { capture: true });
}
