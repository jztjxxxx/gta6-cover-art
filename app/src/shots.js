// Screenshot scenes for the entry, driven by the page's query string:
// ?shot=editor shows the full editor with a sample photo loaded;
// ?shot=cover shows the cover on its own at export size.
// Supported params: photo (boulevard|pier), caption, subtitle, layout,
// grade, frame, size. Signals window.__shotReady once the scene is painted.

const SCENE_STEPS = [
  ['photo', async (api, value) => {
    const img = await api.loadSample(value);
    api.state.panels = api.state.panels.map(() => ({ img, fx: 0.5, fy: 0.5, zoom: 1 }));
  }],
  ['caption', (api, value) => api.setCaption(value)],
  ['subtitle', (api, value) => api.setSubtitle(value)],
  ['layout', (api, value) => api.setLayout(value)],
  ['grade', (api, value) => api.setGrade(value)],
  ['frame', (api, value) => api.setFrame(value)],
  ['size', (api, value) => api.setSize(value)],
];

export async function runShotScene(api) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) {
    window.__shotReady = true;
    return;
  }
  await api.ready;

  for (const [name, apply] of SCENE_STEPS) {
    const value = params.get(name);
    if (value === null) continue;
    try {
      await apply(api, value);
    } catch {
      // A bad scene param never blocks the shot; keep the app's defaults.
    }
  }

  if (shot === 'cover') document.body.classList.add('shot-cover');
  api.render();
  // Let the canvas paint before the screenshot is taken.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
