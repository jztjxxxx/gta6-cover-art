// Vice City Cover Studio — app state, controls and export.
// Photos are read locally with FileReader; nothing is ever uploaded anywhere.

import { LAYOUTS, SIZES, panelRects, renderCover } from './render.js';
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
  size: 'square',
  panels: [],
  library: [],
  selected: 0,
};

let lastRects = [];
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

function newPanel(img) {
  return { img, ox: 0, oy: 0, zoom: 1 };
}

function rebuildPanels() {
  const count = LAYOUTS[state.layout].panels;
  const fallback = state.library[0] || null;
  const next = [];
  for (let i = 0; i < count; i++) {
    next.push(state.panels[i] && state.panels[i].img ? state.panels[i] : newPanel(fallback));
  }
  state.panels = next;
  if (state.selected >= count) state.selected = 0;
}

function render() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  // shot=cover renders the cover alone: no selection ring, like a real export
  const out = renderCover(ctx, size.w, size.h, state, { forExport: document.body.classList.contains('shot-cover') });
  lastRects = out.rects;
  zoomInput.value = String((state.panels[state.selected] || {}).zoom || 1);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setLayout(layout) {
  if (!LAYOUTS[layout]) return;
  state.layout = layout;
  rebuildPanels();
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === layout));
  render();
}

function setGrade(grade) {
  state.grade = grade;
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === grade));
  render();
}

function setSize(size) {
  if (!SIZES[size]) return;
  state.size = size;
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('on', b.dataset.size === size));
  render();
}

function setCaption(text) {
  state.caption = text || 'VICE CITY';
  captionInput.value = state.caption;
  render();
}

function setSubtitle(text) {
  state.subtitle = text || '';
  subtitleInput.value = state.subtitle;
  render();
}

async function addPhotoFile(file, { replace = false } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    setStatus('That file is not an image — pick a photo file.');
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
    state.panels[state.selected] = newPanel(img);
    setStatus('Panel photo replaced.');
  } else {
    const empty = state.panels.findIndex((p) => !p.img);
    if (empty >= 0) state.panels[empty] = newPanel(img);
    else state.panels[state.selected] = newPanel(img);
    setStatus(`Photo added — ${file.name}`);
  }
  render();
  return img;
}

async function exportPNG() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const octx = off.getContext('2d');
  renderCover(octx, size.w, size.h, state, { forExport: true });
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
  setStatus(`Saved ${name} · ${size.w} × ${size.h} PNG`);
  window.__lastExport = { name, width: size.w, height: size.h, bytes: blob.size };
  return { name, width: size.w, height: size.h, bytes: blob.size };
}

// ---------------------------------------------------------------- pointer: select + drag to pan

function canvasPoint(event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (canvas.width / r.width),
    y: (event.clientY - r.top) * (canvas.height / r.height),
  };
}

function hitPanel(p) {
  for (let i = lastRects.length - 1; i >= 0; i--) {
    const r = lastRects[i];
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
  render();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = canvasPoint(event);
  const panel = state.panels[state.selected];
  const rect = lastRects[state.selected];
  if (!panel || !rect || !panel.img) return;
  const iw = panel.img.naturalWidth;
  const ih = panel.img.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
  const overX = iw * scale - rect.w;
  const overY = ih * scale - rect.h;
  if (overX > 0) panel.ox = Math.max(-1, Math.min(1, drag.ox + ((p.x - drag.x) / overX) * 2));
  if (overY > 0) panel.oy = Math.max(-1, Math.min(1, drag.oy + ((p.y - drag.y) / overY) * 2));
  render();
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
  state.panels[state.selected] = newPanel(img);
  setStatus('Pier sample photo loaded into the selected panel.');
  render();
});
document.getElementById('btn-fillall').addEventListener('click', () => {
  const img = (state.panels[state.selected] || {}).img;
  if (!img) return;
  state.panels = state.panels.map(() => newPanel(img));
  setStatus('All panels now use the selected photo.');
  render();
});
zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  if (panel) {
    panel.zoom = Number(zoomInput.value);
    render();
  }
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value || 'VICE CITY'; render(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; render(); });
document.querySelectorAll('#layouts button').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('#grades button').forEach((b) => b.addEventListener('click', () => setGrade(b.dataset.grade)));
document.querySelectorAll('#sizes button').forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
document.getElementById('btn-export').addEventListener('click', exportPNG);

// ---------------------------------------------------------------- boot

async function boot() {
  try {
    const boulevard = await loadImage(SAMPLES.boulevard);
    const pier = await loadImage(SAMPLES.pier);
    state.library = [boulevard, pier];
    // default cover: boulevard hero, pier in the small panels
    state.panels = [newPanel(boulevard), newPanel(pier), newPanel(boulevard), newPanel(pier)];
    rebuildPanels();
    render();
    setStatus('Sample photo loaded — add your own photo, type a title, export.');
  } catch (err) {
    setStatus('Sample photo failed to load — add a photo to start.');
  }
  readyResolve();
  initShots(api);
}

const api = {
  state,
  render,
  ready,
  setLayout,
  setGrade,
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
