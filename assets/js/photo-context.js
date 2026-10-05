// Discourage casual image saving without blocking text, navigation, or map menus.
document.addEventListener('contextmenu', event => {
  if (!(event.target instanceof Element)) return;
  const image = event.target.closest('img') || event.target.closest('a')?.querySelector('img');
  if (image && !image.closest('.leaflet-container')) event.preventDefault();
}, { capture: true });
