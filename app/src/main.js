// Vice City Cover Studio — editor state, controls, pointer panning and export.
// Photos are read locally with FileReader and never leave this page.

import { FRAMES, GRADES, LAYOUTS, SIZES, renderCover } from './render.js';
import { initShots } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const zoomInput = document.getElementById('zoom');

const SAMPLES = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

const state = {
  caption: 'VICE CITY',
  subtitle: 'WELCOME BACK TO',
  layout: 'hero3',
  grade: 'sunset',
  frame: 'framed',
  size: 'square',
  panels: [],
  library: [],
  selected: 0,
};

let panelRects = [];
let readyResolve;
const ready = new Promise((resolve) => { readyResolve = resolve; });

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

function makePanel(img) {
  return { img, ox: 0, oy: 0, zoom: 1 };
}

function syncPanels() {
  const count = LAYOUTS[state.layout].panels;
  const fallback = state.library[0] || null;
  const next = [];
  for (let i = 0; i < count; i++) {
    next.push(state.panels[i] && state.panels[i].img ? state.panels[i] : makePanel(fallback));
  }
  state.panels = next;
  if (state.selected >= count) state.selected = 0;
}

function paint() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  // shot=cover paints the cover alone: no selection ring, exactly like an export
  const out = renderCover(ctx, size.w, size.h, state, {
    forExport: document.body.classList.contains('shot-cover'),
  });
  panelRects = out.rects;
  const selected = state.panels[state.selected];
  zoomInput.value = String((selected && selected.zoom) || 1);
}

function say(text) {
  statusEl.textContent = text;
}

function markOn(selector, attr, value) {
  document.querySelectorAll(selector).forEach((b) => {
    b.classList.toggle('on', b.dataset[attr] === value);
  });
}

function setLayout(layout) {
  if (!LAYOUTS[layout]) return;
  state.layout = layout;
  syncPanels();
  markOn('#layouts button', 'layout', layout);
  paint();
}

function setGrade(grade) {
  if (!GRADES[grade]) return;
  state.grade = grade;
  markOn('#grades button', 'grade', grade);
  paint();
}

function setFrame(frame) {
  if (!FRAMES[frame]) return;
  state.frame = frame;
  markOn('#frames button', 'frame', frame);
  paint();
}

function setSize(size) {
  if (!SIZES[size]) return;
  state.size = size;
  markOn('#sizes button', 'size', size);
  paint();
}

function setCaption(text) {
  state.caption = text || 'VICE CITY';
  captionInput.value = state.caption;
  paint();
}

function setSubtitle(text) {
  state.subtitle = text || '';
  subtitleInput.value = state.subtitle;
  paint();
}

async function addPhotoFile(file, { replace = false } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    say('That file is not an image — pick a photo file.');
    return null;
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
  const img = await loadImage(dataUrl);
  state.library.push(img);
  if (replace) {
    state.panels[state.selected] = makePanel(img);
    say('Panel photo replaced.');
  } else {
    const empty = state.panels.findIndex((p) => !p.img);
    if (empty >= 0) state.panels[empty] = makePanel(img);
    else state.panels[state.selected] = makePanel(img);
    say(`Photo added — ${file.name}`);
  }
  paint();
  return img;
}

async function exportPNG() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off.getContext('2d'), size.w, size.h, state, { forExport: true });
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const name = `cover-${size.w}x${size.h}.png`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  say(`Saved ${name} · ${size.w} × ${size.h} PNG`);
  window.__lastExport = { name, width: size.w, height: size.h, bytes: blob.size };
  return { name, width: size.w, height: size.h, bytes: blob.size };
}

// ---------------------------------------------------------------- pointer: pick a panel, drag to pan its photo

function canvasPoint(event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (canvas.width / r.width),
    y: (event.clientY - r.top) * (canvas.height / r.height),
  };
}

function hitPanel(p) {
  for (let i = panelRects.length - 1; i >= 0; i--) {
    const r = panelRects[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const p = canvasPoint(event);
  const i = hitPanel(p);
  if (i < 0) return;
  state.selected = i;
  canvas.setPointerCapture(event.pointerId);
  drag = { x: p.x, y: p.y, ox: state.panels[i].ox, oy: state.panels[i].oy };
  paint();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = canvasPoint(event);
  const panel = state.panels[state.selected];
  const rect = panelRects[state.selected];
  if (!panel || !rect || !panel.img) return;
  const iw = panel.img.naturalWidth;
  const ih = panel.img.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
  const overX = iw * scale - rect.w;
  const overY = ih * scale - rect.h;
  if (overX > 0) panel.ox = Math.max(-1, Math.min(1, drag.ox + ((p.x - drag.x) / overX) * 2));
  if (overY > 0) panel.oy = Math.max(-1, Math.min(1, drag.oy + ((p.y - drag.y) / overY) * 2));
  paint();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// ---------------------------------------------------------------- controls

document.getElementById('btn-add').addEventListener('click', () => document.getElementById('file-add').click());
document.getElementById('btn-replace').addEventListener('click', () => document.getElementById('file-replace').click());
document.getElementById('file-add').addEventListener('change', (e) => { addPhotoFile(e.target.files[0]); e.target.value = ''; });
document.getElementById('file-replace').addEventListener('change', (e) => { addPhotoFile(e.target.files[0], { replace: true }); e.target.value = ''; });
document.getElementById('btn-sample').addEventListener('click', async () => {
  const img = await loadImage(SAMPLES.pier);
  state.library.push(img);
  state.panels[state.selected] = makePanel(img);
  say('Pier sample photo loaded into the selected panel.');
  paint();
});
document.getElementById('btn-fillall').addEventListener('click', () => {
  const img = (state.panels[state.selected] || {}).img;
  if (!img) return;
  state.panels = state.panels.map(() => makePanel(img));
  say('All panels now use the selected photo.');
  paint();
});
zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  if (panel) {
    panel.zoom = Number(zoomInput.value);
    paint();
  }
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value || 'VICE CITY'; paint(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; paint(); });
document.querySelectorAll('#layouts button').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('#grades button').forEach((b) => b.addEventListener('click', () => setGrade(b.dataset.grade)));
document.querySelectorAll('#frames button').forEach((b) => b.addEventListener('click', () => setFrame(b.dataset.frame)));
document.querySelectorAll('#sizes button').forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
document.getElementById('btn-export').addEventListener('click', exportPNG);

// ---------------------------------------------------------------- boot

async function boot() {
  try {
    const boulevard = await loadImage(SAMPLES.boulevard);
    const pier = await loadImage(SAMPLES.pier);
    state.library = [boulevard, pier];
    // Opening cover: boulevard in the hero panel, pier in the small ones.
    state.panels = [makePanel(boulevard), makePanel(pier), makePanel(boulevard), makePanel(pier)];
    syncPanels();
    paint();
    say('Sample photo loaded — add your own photo, type a title, export.');
  } catch (err) {
    say('Sample photo failed to load — add a photo to start.');
  }
  readyResolve();
  initShots(api);
}

const api = {
  state,
  render: paint,
  ready,
  setLayout,
  setGrade,
  setFrame,
  setSize,
  setCaption,
  setSubtitle,
  loadSample: async (name) => {
    const img = await loadImage(SAMPLES[name] || SAMPLES.boulevard);
    if (!state.library.includes(img)) state.library.push(img);
    return img;
  },
  exportPNG,
};

window.__coverApp = api;
window.__shotReady = false;

boot();
