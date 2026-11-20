// ?shot= scenes for screenshots: ?shot=editor shows the full app with a sample
// photo loaded; ?shot=cover shows the cover alone at export size.
// Query params: photo=boulevard|pier, caption, subtitle, layout, grade, size.
// Sets window.__shotReady once the scene is painted.

export async function initShots(api) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) {
    window.__shotReady = true;
    return;
  }
  await api.ready;

  const photo = params.get('photo');
  if (photo) {
    try {
      const img = await api.loadSample(photo);
      api.state.panels = api.state.panels.map(() => ({ img, ox: 0, oy: 0, zoom: 1 }));
    } catch {
      // keep the default photos
    }
  }
  const caption = params.get('caption');
  if (caption !== null) api.setCaption(caption);
  const subtitle = params.get('subtitle');
  if (subtitle !== null) api.setSubtitle(subtitle);
  const layout = params.get('layout');
  if (layout) api.setLayout(layout);
  const grade = params.get('grade');
  if (grade) api.setGrade(grade);
  const size = params.get('size');
  if (size) api.setSize(size);

  if (shot === 'cover') document.body.classList.add('shot-cover');
  api.render();
  // let the canvas paint before the screenshot lands
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
