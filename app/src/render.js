// Vice City Cover Studio — paints the poster cover on a canvas.
// The whole look lives here: neon backdrop, graded photo panels, a slatted
// sunset, palm silhouettes and the big condensed title. The editor in main.js
// only holds state and forwards it; export draws through this same function,
// so what you see is exactly what the PNG holds.

export const LAYOUTS = {
  hero3: { label: 'Hero + 3', panels: 4 },
  grid: { label: 'Poster grid', panels: 8 },
  full: { label: 'Full bleed', panels: 1 },
};

export const GRADES = {
  sunset: 'Neon Sunset',
  vice: 'Vice Nights',
  golden: 'Golden Hour',
  noir: 'Noir Gold',
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const FRAMES = {
  framed: 'Poster frame',
  edge: 'Edge to edge',
};

const FONT = "'Arial Narrow','Helvetica Neue',Arial,sans-serif";

// One table drives every grade: the backdrop sky, the tint washed over each
// photo, the blend mode for that tint, a flat wash on top, and the three
// colours the title lettering is filled with.
const GRADE_TABLE = {
  sunset: {
    sky: [[0, '#1d0640'], [0.42, '#6d28d9'], [0.68, '#db2777'], [1, '#f97316']],
    tint: { diagonal: false, stops: [[0, 'rgba(255,41,117,0.24)'], [0.5, 'rgba(124,58,237,0.12)'], [1, 'rgba(255,138,0,0.28)']], blend: 'overlay' },
    wash: 'rgba(255,110,40,0.08)',
    title: ['#ffe45e', '#ff8a1e', '#ff2e88'],
  },
  vice: {
    sky: [[0, '#02131f'], [0.4, '#155e75'], [0.7, '#86198f'], [1, '#f472b6']],
    tint: { diagonal: true, stops: [[0, 'rgba(34,211,238,0.22)'], [0.5, 'rgba(168,85,247,0.10)'], [1, 'rgba(236,72,153,0.26)']], blend: 'overlay' },
    wash: 'rgba(8,47,73,0.10)',
    title: ['#67e8f9', '#c084fc', '#ec4899'],
  },
  golden: {
    sky: [[0, '#1c0f02'], [0.42, '#7c2d12'], [0.7, '#ea580c'], [1, '#fbbf24']],
    tint: { diagonal: false, stops: [[0, 'rgba(251,191,36,0.18)'], [1, 'rgba(234,88,12,0.28)']], blend: 'soft-light' },
    wash: 'rgba(251,146,60,0.12)',
    title: ['#fef3c7', '#fbbf24', '#ea580c'],
  },
  noir: {
    sky: [[0, '#050505'], [0.45, '#1e1b4b'], [0.72, '#581c87'], [1, '#b45309']],
    tint: { diagonal: false, stops: [[0, 'rgba(10,10,25,0.34)'], [0.55, 'rgba(88,28,135,0.12)'], [1, 'rgba(245,158,11,0.22)']], blend: 'soft-light' },
    wash: 'rgba(245,200,90,0.09)',
    title: ['#fef9c3', '#facc15', '#b45309'],
  },
};

function gradeOf(name) {
  return GRADE_TABLE[name] || GRADE_TABLE.sunset;
}

// ------------------------------------------------------------ geometry

// Edge-to-edge mode drops the outer margin and the gutters entirely, so the
// panels run to the cover's edge. Framed mode keeps a poster margin.
function spacing(W, H, frame) {
  if (frame === 'edge') return { g: 0, m: 0 };
  const s = Math.min(W, H);
  return { g: Math.max(4, Math.round(s * 0.01)), m: Math.max(8, Math.round(s * 0.02)) };
}

/** Panel rectangles for a layout, in canvas pixels. The grid reserves its middle cell for the title. */
export function layoutRects(layout, W, H, frame) {
  const { g, m } = spacing(W, H, frame);
  if (layout === 'hero3') {
    const heroW = Math.round((W - 2 * m - g) * 0.58);
    const sideX = m + heroW + g;
    const sideW = W - m - sideX;
    const smallH = Math.floor((H - 2 * m - 2 * g) / 3);
    return [
      { x: m, y: m, w: heroW, h: H - 2 * m },
      { x: sideX, y: m, w: sideW, h: smallH },
      { x: sideX, y: m + smallH + g, w: sideW, h: smallH },
      { x: sideX, y: m + 2 * (smallH + g), w: sideW, h: smallH },
    ];
  }
  if (layout === 'grid') {
    const cw = (W - 2 * m - 2 * g) / 3;
    const ch = (H - 2 * m - 2 * g) / 3;
    const out = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue;
        out.push({
          x: Math.round(m + c * (cw + g)),
          y: Math.round(m + r * (ch + g)),
          w: Math.round(cw),
          h: Math.round(ch),
        });
      }
    }
    return out;
  }
  return [{ x: m, y: m, w: W - 2 * m, h: H - 2 * m }];
}

/** The grid layout's middle title cell, using the same geometry as layoutRects. */
export function titleCellRect(W, H, frame) {
  const { g, m } = spacing(W, H, frame);
  const cw = (W - 2 * m - 2 * g) / 3;
  const ch = (H - 2 * m - 2 * g) / 3;
  return {
    x: Math.round(m + cw + g),
    y: Math.round(m + ch + g),
    w: Math.round(cw),
    h: Math.round(ch),
  };
}

// ------------------------------------------------------------ grain

let grainPattern = null;
function grainTile(ctx) {
  if (grainPattern) return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = 96;
  tile.height = 96;
  const g = tile.getContext('2d');
  const data = g.createImageData(96, 96);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 22;
  }
  g.putImageData(data, 0, 0);
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

// ------------------------------------------------------------ grading

function gradePanel(ctx, rect, gradeName) {
  const grade = gradeOf(gradeName);
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const tint = grade.tint.diagonal
    ? ctx.createLinearGradient(x, y, x + w, y + h)
    : ctx.createLinearGradient(x, y, x, y + h);
  for (const [pos, colour] of grade.tint.stops) tint.addColorStop(pos, colour);
  ctx.globalCompositeOperation = grade.tint.blend;
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
  const shade = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.45,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.78,
  );
  shade.addColorStop(0, 'rgba(8,0,28,0)');
  shade.addColorStop(1, 'rgba(8,0,28,0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = grainTile(ctx);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ------------------------------------------------------------ photo

function paintPhoto(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (panel.z || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  // px/py run -1..1: where the photo sits inside its frame once zoomed in.
  const ox = (dw - rect.w) * (((panel.px || 0) + 1) / 2);
  const oy = (dh - rect.h) * (((panel.py || 0) + 1) / 2);
  ctx.drawImage(img, rect.x - ox, rect.y - oy, dw, dh);
}

// ------------------------------------------------------------ sun and palms

// A retro sun: a glowing disc with three slats cut out of its lower half,
// drawn on a scratch canvas so the cut-outs never erase the cover behind it.
function paintSun(ctx, cx, cy, r) {
  const s = Math.ceil(r * 2.4);
  const off = document.createElement('canvas');
  off.width = s;
  off.height = s;
  const o = off.getContext('2d');
  const ox = s / 2;
  const oy = s / 2;
  const glow = o.createRadialGradient(ox, oy, r * 0.1, ox, oy, r * 1.15);
  glow.addColorStop(0, 'rgba(255,240,150,0.95)');
  glow.addColorStop(0.5, 'rgba(255,140,60,0.8)');
  glow.addColorStop(0.8, 'rgba(255,46,136,0.4)');
  glow.addColorStop(1, 'rgba(255,46,136,0)');
  o.fillStyle = glow;
  o.beginPath();
  o.arc(ox, oy, r * 1.15, 0, Math.PI * 2);
  o.fill();
  const disc = o.createLinearGradient(ox, oy - r, ox, oy + r);
  disc.addColorStop(0, '#fff7ae');
  disc.addColorStop(0.55, '#ffb347');
  disc.addColorStop(1, '#ff2e88');
  o.fillStyle = disc;
  o.beginPath();
  o.arc(ox, oy, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  const slats = [[0.1, 0.05], [0.32, 0.07], [0.56, 0.1]];
  for (const [from, thick] of slats) {
    const y = oy + r * from;
    o.fillRect(ox - r - 2, y, r * 2 + 4, r * thick);
  }
  ctx.drawImage(off, cx - s / 2, cy - s / 2);
}

function leaf(ctx, cx, cy, angle, len, droop) {
  // One broad leaf: a curved spine with the two edges bowed out from it, so
  // it reads as a palm leaf and not a spike.
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  const half = len * 0.12;
  const tipX = cx + dx * len;
  const tipY = cy + dy * len + droop;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(
    cx + dx * len * 0.35 - nx * half, cy + dy * len * 0.35 - ny * half + droop * 0.15,
    tipX, tipY,
  );
  ctx.quadraticCurveTo(
    cx + dx * len * 0.6 + nx * half * 1.2, cy + dy * len * 0.6 + ny * half * 1.2 + droop * 0.7,
    cx, cy,
  );
  ctx.closePath();
  ctx.fill();
}

/** A palm silhouette drawn from canvas paths — no artwork copied in. */
export function drawPalm(ctx, x, y, s, flip, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.fillStyle = colour;
  // Trunk: wide at the base, tapering and leaning toward the crown.
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.quadraticCurveTo(-9, -70, 4, -128);
  ctx.quadraticCurveTo(10, -152, 24, -160);
  ctx.quadraticCurveTo(28, -156, 26, -148);
  ctx.quadraticCurveTo(16, -96, 12, 0);
  ctx.closePath();
  ctx.fill();
  const crownX = 24;
  const crownY = -158;
  const angles = [-2.9, -2.55, -2.2, -1.85, -1.5, -1.15, -0.8, -0.45, -0.1];
  const lens = [104, 128, 148, 162, 170, 162, 148, 128, 104];
  const droops = [66, 50, 34, 20, 12, 20, 34, 50, 66];
  for (let i = 0; i < angles.length; i++) leaf(ctx, crownX, crownY, angles[i], lens[i], droops[i]);
  // A small cluster of coconuts under the crown.
  ctx.beginPath();
  ctx.arc(crownX - 8, crownY + 6, 6, 0, Math.PI * 2);
  ctx.arc(crownX + 4, crownY + 9, 6, 0, Math.PI * 2);
  ctx.arc(crownX + 14, crownY + 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------ title lettering

function shrinkToFit(ctx, text, maxW, start) {
  let size = start;
  ctx.font = `900 ${size}px ${FONT}`;
  while (size > 10 && ctx.measureText(text).width * 0.8 > maxW) {
    size -= 4;
    ctx.font = `900 ${size}px ${FONT}`;
  }
  return size;
}

function paintTitleLine(ctx, text, cx, cy, size, maxW, gradeName) {
  const [c1, c2, c3] = gradeOf(gradeName).title;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.8, 1);
  ctx.font = `900 ${size}px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fill = ctx.createLinearGradient(-maxW / 2, 0, maxW / 2, 0);
  fill.addColorStop(0, c1);
  fill.addColorStop(0.5, c2);
  fill.addColorStop(1, c3);
  ctx.shadowColor = 'rgba(16,0,36,0.85)';
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.05;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#16042e';
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.strokeText(text, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
  // A short gradient rule under the line, echoing the sunset.
  const ruleW = Math.min(maxW * 0.42, size * 3.2);
  const rule = ctx.createLinearGradient(cx - ruleW / 2, 0, cx + ruleW / 2, 0);
  rule.addColorStop(0, c1);
  rule.addColorStop(0.5, c2);
  rule.addColorStop(1, c3);
  ctx.save();
  ctx.fillStyle = rule;
  ctx.fillRect(cx - ruleW / 2, cy + size * 0.62, ruleW, Math.max(2, size * 0.05));
  ctx.restore();
}

function paintTitle(ctx, caption, subtitle, area, gradeName) {
  const { x, y, w, h } = area;
  const maxW = w * 0.88;
  if (subtitle) {
    let subSize = Math.max(10, h * 0.12);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const subFont = (s) => {
      ctx.font = `700 ${s}px ${FONT}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(2, s * 0.2)}px`;
    };
    subFont(subSize);
    while (subSize > 8 && ctx.measureText(subtitle.toUpperCase()).width > maxW) {
      subSize -= 1;
      subFont(subSize);
    }
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(16,0,36,0.9)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.fillText(subtitle.toUpperCase(), x + w / 2, y + h * 0.12);
    ctx.restore();
  }
  const top = subtitle ? y + h * 0.18 : y;
  const roomH = subtitle ? h * 0.82 : h;
  const words = caption.toUpperCase();
  const size = shrinkToFit(ctx, words, maxW, roomH * 0.6);
  if (size >= roomH * 0.26 || !words.includes(' ')) {
    paintTitleLine(ctx, words, x + w / 2, top + roomH * 0.5, size, maxW, gradeName);
    return;
  }
  // Two lines: split the words as evenly as possible.
  const parts = words.split(/\s+/);
  let first = '';
  let second = '';
  for (const word of parts) {
    if ((first + ' ' + word).trim().length <= words.length / 2) first = (first + ' ' + word).trim();
    else second = (second + ' ' + word).trim();
  }
  if (!second) {
    second = first.slice(Math.ceil(first.length / 2));
    first = first.slice(0, Math.ceil(first.length / 2));
  }
  const s2 = Math.min(
    shrinkToFit(ctx, first, maxW, roomH * 0.38),
    shrinkToFit(ctx, second, maxW, roomH * 0.38),
  );
  paintTitleLine(ctx, first, x + w / 2, top + roomH * 0.3, s2, maxW, gradeName);
  paintTitleLine(ctx, second, x + w / 2, top + roomH * 0.7, s2, maxW, gradeName);
}

// ------------------------------------------------------------ the cover

/**
 * Paint the whole cover. Returns the panel rectangles (canvas pixels) so the
 * editor can hit-test a click. `forExport` leaves out the selection ring,
 * which only ever appears in the live preview.
 */
export function renderCover(ctx, W, H, state, opts = {}) {
  const { layout, grade, caption, subtitle, panels, frame } = state;
  const forExport = !!opts.forExport;
  const framed = frame !== 'edge';
  const gradeDef = gradeOf(grade);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  for (const [pos, colour] of gradeDef.sky) sky.addColorStop(pos, colour);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rects = layoutRects(layout, W, H, frame);
  const border = Math.max(3, Math.round(W * 0.004));

  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const panel = panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel && panel.img) paintPhoto(ctx, panel.img, rect, panel);
    else {
      ctx.fillStyle = '#341259';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    gradePanel(ctx, rect, grade);
    ctx.restore();
    if (framed) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = border;
      ctx.strokeRect(rect.x + border / 2, rect.y + border / 2, rect.w - border, rect.h - border);
      ctx.restore();
    }
    if (!forExport && state.selected === i) {
      ctx.save();
      ctx.strokeStyle = '#ffd319';
      ctx.lineWidth = Math.max(3, W * 0.005);
      ctx.strokeRect(rect.x - border, rect.y - border, rect.w + border * 2, rect.h + border * 2);
      ctx.strokeStyle = '#16042e';
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x - border - 2, rect.y - border - 2, rect.w + border * 2 + 4, rect.h + border * 2 + 4);
      ctx.restore();
    }
  }

  // One last wash over the whole poster, so the panels read as one image.
  ctx.save();
  ctx.globalAlpha = 0.1;
  gradePanel(ctx, { x: 0, y: 0, w: W, h: H }, grade);
  ctx.restore();

  const palmInk = 'rgba(22,4,46,0.92)';
  const { m } = spacing(W, H, frame);
  if (layout === 'grid') {
    const cell = titleCellRect(W, H, frame);
    const cellFill = ctx.createLinearGradient(cell.x, cell.y, cell.x, cell.y + cell.h);
    cellFill.addColorStop(0, '#ff2e88');
    cellFill.addColorStop(1, '#ff7a18');
    ctx.save();
    ctx.fillStyle = cellFill;
    ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
    paintSun(ctx, cell.x + cell.w / 2, cell.y + cell.h * 0.4, cell.h * 0.3);
    drawPalm(ctx, cell.x + cell.w * 0.05, cell.y + cell.h * 0.99, cell.h / 600, false, palmInk);
    drawPalm(ctx, cell.x + cell.w * 0.95, cell.y + cell.h * 0.99, cell.h / 600, true, palmInk);
    ctx.restore();
    if (framed) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = border;
      ctx.strokeRect(cell.x + border / 2, cell.y + border / 2, cell.w - border, cell.h - border);
      ctx.restore();
    }
    paintTitle(ctx, caption, subtitle, { x: cell.x, y: cell.y + cell.h * 0.28, w: cell.w, h: cell.h * 0.68 }, grade);
  } else {
    const bandH = Math.round(H * 0.2);
    const bandY = H - m - bandH;
    const scrim = ctx.createLinearGradient(0, bandY - bandH * 0.5, 0, H);
    scrim.addColorStop(0, 'rgba(16,0,36,0)');
    scrim.addColorStop(1, 'rgba(16,0,36,0.6)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, bandY - bandH * 0.5, W, H - bandY + bandH * 0.5);
    paintSun(ctx, W / 2, bandY + bandH * 0.55, bandH * 0.9);
    const palmScale = bandH / 185;
    drawPalm(ctx, W * 0.01, H - m + 4, palmScale, false, palmInk);
    drawPalm(ctx, W * 0.99, H - m + 4, palmScale, true, palmInk);
    paintTitle(ctx, caption, subtitle, { x: W * 0.14, y: bandY, w: W * 0.72, h: bandH }, grade);
  }

  return { rects };
}
