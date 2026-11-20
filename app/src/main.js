// Vice City Cover Studio — editor: state, controls, panel panning, export.
// Photos are read on the machine with FileReader and never leave this page.
// All drawing lives in render.js; this file only decides what to draw.

import { FRAMES, GRADES, LAYOUTS, SIZES, renderCover } from './render.js';
import { initShots } from './shots.js';

const el = {
  canvas: document.getElementById('cover'),
  status: document.getElementById('status'),
  caption: document.getElementById('caption'),
  subtitle: document.getElementById('subtitle'),
  zoom: document.getElementById('zoom'),
  addFile: document.getElementById('file-add'),
  replaceFile: document.getElementById('file-replace'),
};
const ctx = el.canvas.getContext('2d');

const SAMPLE_FILES = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

// One photo per panel slot; px/py pan the photo inside its frame (-1..1),
// z zooms it. library keeps every photo the user has loaded this session.
const cover = {
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

let currentRects = [];
let resolveReady;
const ready = new Promise((resolve) => { resolveReady = resolve; });

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

function freshPanel(img) {
  return { img, px: 0, py: 0, z: 1 };
}

function resizePanels() {
  const wanted = LAYOUTS[cover.layout].panels;
  const fallback = cover.library[0] || null;
  const next = [];
  for (let i = 0; i < wanted; i++) {
    next.push(cover.panels[i] && cover.panels[i].img ? cover.panels[i] : freshPanel(fallback));
  }
  cover.panels = next;
  if (cover.selected >= wanted) cover.selected = 0;
}

function draw() {
  const size = SIZES[cover.size];
  if (el.canvas.width !== size.w || el.canvas.height !== size.h) {
    el.canvas.width = size.w;
    el.canvas.height = size.h;
  }
  // Cover-only shot mode paints exactly like an export: no selection ring.
  const out = renderCover(ctx, size.w, size.h, cover, {
    forExport: document.body.classList.contains('shot-cover'),
  });
  currentRects = out.rects;
  const picked = cover.panels[cover.selected];
  el.zoom.value = String((picked && picked.z) || 1);
}

function notify(text) {
  el.status.textContent = text;
}

function highlight(groupId, key, value) {
  document.querySelectorAll(`#${groupId} button`).forEach((b) => {
    b.classList.toggle('on', b.dataset[key] === value);
  });
}

function applyLayout(layout) {
  if (!LAYOUTS[layout]) return;
  cover.layout = layout;
  resizePanels();
  highlight('layouts', 'layout', layout);
  draw();
}

function applyGrade(grade) {
  if (!GRADES[grade]) return;
  cover.grade = grade;
  highlight('grades', 'grade', grade);
  draw();
}

function applyFrame(frame) {
  if (!FRAMES[frame]) return;
  cover.frame = frame;
  highlight('frames', 'frame', frame);
  draw();
}

function applySize(size) {
  if (!SIZES[size]) return;
  cover.size = size;
  highlight('sizes', 'size', size);
  draw();
}

function applyCaption(text) {
  cover.caption = text || 'VICE CITY';
  el.caption.value = cover.caption;
  draw();
}

function applySubtitle(text) {
  cover.subtitle = text || '';
  el.subtitle.value = cover.subtitle;
  draw();
}

async function readFileAsImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
  return loadImage(dataUrl);
}

async function addPhoto(file, { replace = false } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    notify('That file is not an image — pick a photo file.');
    return null;
  }
  const img = await readFileAsImage(file);
  cover.library.push(img);
  if (replace) {
    cover.panels[cover.selected] = freshPanel(img);
    notify('Panel photo replaced.');
  } else {
    const free = cover.panels.findIndex((p) => !p.img);
    if (free >= 0) cover.panels[free] = freshPanel(img);
    else cover.panels[cover.selected] = freshPanel(img);
    notify(`Photo added — ${file.name}`);
  }
  draw();
  return img;
}

async function exportPNG() {
  const size = SIZES[cover.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off.getContext('2d'), size.w, size.h, cover, { forExport: true });
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const name = `cover-${size.w}x${size.h}.png`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  notify(`Saved ${name} · ${size.w} × ${size.h} PNG`);
  window.__lastExport = { name, width: size.w, height: size.h, bytes: blob.size };
  return { name, width: size.w, height: size.h, bytes: blob.size };
}

// ------------------------------------------------- pointer: pick a panel, drag its photo

function toCanvas(event) {
  const r = el.canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (el.canvas.width / r.width),
    y: (event.clientY - r.top) * (el.canvas.height / r.height),
  };
}

function panelAt(p) {
  for (let i = currentRects.length - 1; i >= 0; i--) {
    const r = currentRects[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
  }
  return -1;
}

let pan = null;
el.canvas.addEventListener('pointerdown', (event) => {
  const p = toCanvas(event);
  const i = panelAt(p);
  if (i < 0) return;
  cover.selected = i;
  el.canvas.setPointerCapture(event.pointerId);
  pan = { x: p.x, y: p.y, px: cover.panels[i].px, py: cover.panels[i].py };
  draw();
});
el.canvas.addEventListener('pointermove', (event) => {
  if (!pan) return;
  const p = toCanvas(event);
  const panel = cover.panels[cover.selected];
  const rect = currentRects[cover.selected];
  if (!panel || !rect || !panel.img) return;
  const iw = panel.img.naturalWidth;
  const ih = panel.img.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * panel.z;
  const slackX = iw * scale - rect.w;
  const slackY = ih * scale - rect.h;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  if (slackX > 0) panel.px = clamp(pan.px + ((p.x - pan.x) / slackX) * 2);
  if (slackY > 0) panel.py = clamp(pan.py + ((p.y - pan.y) / slackY) * 2);
  draw();
});
el.canvas.addEventListener('pointerup', () => { pan = null; });
el.canvas.addEventListener('pointercancel', () => { pan = null; });

// ------------------------------------------------- wire the controls

function bindSeg(groupId, key, fn) {
  document.querySelectorAll(`#${groupId} button`).forEach((b) => {
    b.addEventListener('click', () => fn(b.dataset[key]));
  });
}

document.getElementById('btn-add').addEventListener('click', () => el.addFile.click());
document.getElementById('btn-replace').addEventListener('click', () => el.replaceFile.click());
el.addFile.addEventListener('change', (e) => { addPhoto(e.target.files[0]); e.target.value = ''; });
el.replaceFile.addEventListener('change', (e) => { addPhoto(e.target.files[0], { replace: true }); e.target.value = ''; });
document.getElementById('btn-sample').addEventListener('click', async () => {
  const img = await loadImage(SAMPLE_FILES.pier);
  cover.library.push(img);
  cover.panels[cover.selected] = freshPanel(img);
  notify('Pier sample photo loaded into the selected panel.');
  draw();
});
document.getElementById('btn-fillall').addEventListener('click', () => {
  const img = (cover.panels[cover.selected] || {}).img;
  if (!img) return;
  cover.panels = cover.panels.map(() => freshPanel(img));
  notify('All panels now use the selected photo.');
  draw();
});
el.zoom.addEventListener('input', () => {
  const panel = cover.panels[cover.selected];
  if (panel) {
    panel.z = Number(el.zoom.value);
    draw();
  }
});
el.caption.addEventListener('input', () => { cover.caption = el.caption.value || 'VICE CITY'; draw(); });
el.subtitle.addEventListener('input', () => { cover.subtitle = el.subtitle.value; draw(); });
bindSeg('layouts', 'layout', applyLayout);
bindSeg('grades', 'grade', applyGrade);
bindSeg('frames', 'frame', applyFrame);
bindSeg('sizes', 'size', applySize);
document.getElementById('btn-export').addEventListener('click', exportPNG);

// ------------------------------------------------- boot

async function start() {
  try {
    const [boulevard, pier] = await Promise.all([
      loadImage(SAMPLE_FILES.boulevard),
      loadImage(SAMPLE_FILES.pier),
    ]);
    cover.library = [boulevard, pier];
    // Opening cover: boulevard as the hero, pier in the small panels.
    cover.panels = [freshPanel(boulevard), freshPanel(pier), freshPanel(boulevard), freshPanel(pier)];
    resizePanels();
    draw();
    notify('Sample photo loaded — add your own photo, type a title, export.');
  } catch (err) {
    notify('Sample photo failed to load — add a photo to start.');
  }
  resolveReady();
  initShots(api);
}

const api = {
  state: cover,
  render: draw,
  ready,
  setLayout: applyLayout,
  setGrade: applyGrade,
  setFrame: applyFrame,
  setSize: applySize,
  setCaption: applyCaption,
  setSubtitle: applySubtitle,
  loadSample: async (name) => {
    const img = await loadImage(SAMPLE_FILES[name] || SAMPLE_FILES.boulevard);
    if (!cover.library.includes(img)) cover.library.push(img);
    return img;
  },
  exportPNG,
};

window.__coverApp = api;
window.__shotReady = false;

start();
