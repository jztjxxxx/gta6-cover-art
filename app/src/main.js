// Neon Strip Cover Studio — editor: state, controls, panel dragging, export.
// Photos are read on the machine with FileReader and never leave this page.
// All painting lives in render.js; this file only decides what to paint.
//
// A panel keeps a focal point (fx, fy in 0..1) and a zoom: dragging moves the
// focal point, so the photo slides inside its frame instead of jumping.

import { FRAMES, GRADES, LAYOUTS, SIZES, paintCover } from './render.js';
import { runShotScene } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

const SAMPLES = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

// One slot per panel; shelf holds every photo loaded in this session.
const studio = {
  title: 'VICE CITY',
  tagline: 'WELCOME BACK TO',
  layout: 'hero3',
  grade: 'sunset',
  frame: 'framed',
  size: 'square',
  panels: [],
  shelf: [],
  active: 0,
};

let panelRects = [];
let readyResolve;
const ready = new Promise((resolve) => { readyResolve = resolve; });

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('failed to load ' + src));
    img.src = src;
  });
}

function makePanel(img) {
  return { img, fx: 0.5, fy: 0.5, zoom: 1 };
}

// Grow or shrink the panel list to the layout's panel count, keeping any
// photo the user already placed in a slot that still exists.
function fitPanels() {
  const count = LAYOUTS[studio.layout].panels;
  const first = studio.shelf[0] || null;
  const next = [];
  for (let i = 0; i < count; i++) {
    next.push(studio.panels[i] && studio.panels[i].img ? studio.panels[i] : makePanel(first));
  }
  studio.panels = next;
  if (studio.active >= count) studio.active = 0;
}

function repaint() {
  const size = SIZES[studio.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const shotMode = document.body.classList.contains('shot-cover');
  const out = paintCover(ctx, size.w, size.h, studio, { forExport: shotMode });
  panelRects = out.rects;
  const picked = studio.panels[studio.active];
  $('zoom').value = String((picked && picked.zoom) || 1);
}

function say(text) {
  $('status').textContent = text;
}

function mark(groupId, key, value) {
  document.querySelectorAll(`#${groupId} button`).forEach((b) => {
    b.classList.toggle('on', b.dataset[key] === value);
  });
}

function setLayout(layout) {
  if (!LAYOUTS[layout]) return;
  studio.layout = layout;
  fitPanels();
  mark('layouts', 'layout', layout);
  repaint();
}

function setGrade(grade) {
  if (!GRADES[grade]) return;
  studio.grade = grade;
  mark('grades', 'grade', grade);
  repaint();
}

function setFrame(frame) {
  if (!FRAMES[frame]) return;
  studio.frame = frame;
  mark('frames', 'frame', frame);
  repaint();
}

function setSize(size) {
  if (!SIZES[size]) return;
  studio.size = size;
  mark('sizes', 'size', size);
  repaint();
}

function setTitle(text) {
  studio.title = text || 'VICE CITY';
  $('caption').value = studio.title;
  repaint();
}

function setTagline(text) {
  studio.tagline = text || '';
  $('subtitle').value = studio.tagline;
  repaint();
}

async function readFileImage(file) {
  const url = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
  return loadImage(url);
}

async function addPhoto(file, { replace = false } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    say('Pick an image file.');
    return null;
  }
  const img = await readFileImage(file);
  studio.shelf.push(img);
  if (replace) {
    studio.panels[studio.active] = makePanel(img);
    say('Selected panel photo replaced.');
  } else {
    const empty = studio.panels.findIndex((p) => !p.img);
    if (empty >= 0) studio.panels[empty] = makePanel(img);
    else studio.panels[studio.active] = makePanel(img);
    say(`Photo added — ${file.name}`);
  }
  repaint();
  return img;
}

async function exportPNG() {
  const size = SIZES[studio.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  paintCover(off.getContext('2d'), size.w, size.h, studio, { forExport: true });
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

// ------------------------------------------------- pointer: pick a panel, drag its photo

function canvasPoint(event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (canvas.width / r.width),
    y: (event.clientY - r.top) * (canvas.height / r.height),
  };
}

function panelAtPoint(p) {
  for (let i = panelRects.length - 1; i >= 0; i--) {
    const r = panelRects[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const p = canvasPoint(event);
  const i = panelAtPoint(p);
  if (i < 0) return;
  studio.active = i;
  canvas.setPointerCapture(event.pointerId);
  const panel = studio.panels[i];
  drag = { x: p.x, y: p.y, fx: panel.fx, fy: panel.fy };
  repaint();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = canvasPoint(event);
  const panel = studio.panels[studio.active];
  const rect = panelRects[studio.active];
  if (!panel || !rect || !panel.img) return;
  const iw = panel.img.naturalWidth;
  const ih = panel.img.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
  const slackX = iw * scale - rect.w;
  const slackY = ih * scale - rect.h;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  if (slackX > 0) panel.fx = clamp01(drag.fx - (p.x - drag.x) / slackX);
  if (slackY > 0) panel.fy = clamp01(drag.fy - (p.y - drag.y) / slackY);
  repaint();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// ------------------------------------------------- wire the controls

function bindChoices(groupId, key, fn) {
  document.querySelectorAll(`#${groupId} button`).forEach((b) => {
    b.addEventListener('click', () => fn(b.dataset[key]));
  });
}

$('btn-add').addEventListener('click', () => $('file-add').click());
$('btn-replace').addEventListener('click', () => $('file-replace').click());
$('file-add').addEventListener('change', (e) => { addPhoto(e.target.files[0]); e.target.value = ''; });
$('file-replace').addEventListener('change', (e) => { addPhoto(e.target.files[0], { replace: true }); e.target.value = ''; });
$('btn-sample').addEventListener('click', async () => {
  const img = await loadImage(SAMPLES.pier);
  studio.shelf.push(img);
  studio.panels[studio.active] = makePanel(img);
  say('Pier sample photo loaded into the selected panel.');
  repaint();
});
$('btn-fillall').addEventListener('click', () => {
  const img = (studio.panels[studio.active] || {}).img;
  if (!img) return;
  studio.panels = studio.panels.map(() => makePanel(img));
  say('All panels now use the selected photo.');
  repaint();
});
$('zoom').addEventListener('input', () => {
  const panel = studio.panels[studio.active];
  if (panel) {
    panel.zoom = Number($('zoom').value);
    repaint();
  }
});
$('caption').addEventListener('input', () => { studio.title = $('caption').value || 'VICE CITY'; repaint(); });
$('subtitle').addEventListener('input', () => { studio.tagline = $('subtitle').value; repaint(); });
bindChoices('layouts', 'layout', setLayout);
bindChoices('grades', 'grade', setGrade);
bindChoices('frames', 'frame', setFrame);
bindChoices('sizes', 'size', setSize);
document.querySelectorAll('.export-btn').forEach((b) => b.addEventListener('click', exportPNG));

// ------------------------------------------------- boot

async function start() {
  try {
    const [boulevard, pier] = await Promise.all([
      loadImage(SAMPLES.boulevard),
      loadImage(SAMPLES.pier),
    ]);
    studio.shelf = [boulevard, pier];
    // Opening cover: boulevard as the hero, pier in the strip panels.
    studio.panels = [makePanel(boulevard), makePanel(pier), makePanel(boulevard), makePanel(pier)];
    fitPanels();
    repaint();
    say('Sample photo loaded — add your own photo, type a title, export.');
  } catch {
    say('Sample photo failed to load — add a photo to start.');
  }
  readyResolve();
  runShotScene(api);
}

const api = {
  state: studio,
  render: repaint,
  ready,
  setLayout,
  setGrade,
  setFrame,
  setSize,
  setCaption: setTitle,
  setSubtitle: setTagline,
  loadSample: async (name) => {
    const img = await loadImage(SAMPLES[name] || SAMPLES.boulevard);
    if (!studio.shelf.includes(img)) studio.shelf.push(img);
    return img;
  },
  exportPNG,
};

window.__coverApp = api;
window.__shotReady = false;

start();
