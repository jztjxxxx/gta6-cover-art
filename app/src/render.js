// Vice City Cover Studio — the cover painter.
// Everything is drawn on one canvas, so the PNG a user exports carries the
// whole look: neon backdrop, graded panels, palms, sun and title lettering.

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

const TITLE_FONT = "'Arial Narrow','Helvetica Neue',Arial,sans-serif";

/** Panel rectangles for a layout, in canvas pixels. The grid keeps its centre cell for the title. */
export function panelRects(layout, W, H) {
  const g = Math.max(4, Math.round(Math.min(W, H) * 0.012));
  const m = Math.max(8, Math.round(Math.min(W, H) * 0.022));
  if (layout === 'hero3') {
    const heroW = Math.round((W - 2 * m - g) * 0.62);
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
    const rects = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue;
        rects.push({
          x: Math.round(m + c * (cw + g)),
          y: Math.round(m + r * (ch + g)),
          w: Math.round(cw),
          h: Math.round(ch),
        });
      }
    }
    return rects;
  }
  return [{ x: m, y: m, w: W - 2 * m, h: H - 2 * m }];
}

/** The grid layout's centre title cell, using the same geometry as panelRects. */
export function titleCellRect(W, H) {
  const g = Math.max(4, Math.round(Math.min(W, H) * 0.012));
  const m = Math.max(8, Math.round(Math.min(W, H) * 0.022));
  const cw = (W - 2 * m - 2 * g) / 3;
  const ch = (H - 2 * m - 2 * g) / 3;
  return {
    x: Math.round(m + cw + g),
    y: Math.round(m + ch + g),
    w: Math.round(cw),
    h: Math.round(ch),
  };
}

// ---------------------------------------------------------------- film grain

let grainTile = null;
function grain(ctx) {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const g = tile.getContext('2d');
  const pixels = g.createImageData(128, 128);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    pixels.data[i] = v;
    pixels.data[i + 1] = v;
    pixels.data[i + 2] = v;
    pixels.data[i + 3] = 30;
  }
  g.putImageData(pixels, 0, 0);
  grainTile = ctx.createPattern(tile, 'repeat');
  return grainTile;
}

// ---------------------------------------------------------------- colour grades

const GRADE_TINTS = {
  sunset: [
    ['linear', 0, 'rgba(255,46,136,0.22)', 0.55, 'rgba(123,47,247,0.10)', 1, 'rgba(255,122,24,0.26)'],
    'overlay',
    'rgba(255,120,60,0.07)',
  ],
  vice: [
    ['diagonal', 0, 'rgba(0,229,255,0.20)', 0.5, 'rgba(123,47,247,0.08)', 1, 'rgba(255,0,128,0.24)'],
    'overlay',
    'rgba(0,60,90,0.08)',
  ],
  golden: [
    ['linear', 0, 'rgba(255,190,80,0.16)', 1, 'rgba(255,110,20,0.26)'],
    'soft-light',
    'rgba(255,170,40,0.10)',
  ],
  noir: [
    ['linear', 0, 'rgba(20,8,40,0.30)', 0.5, 'rgba(90,60,10,0.10)', 1, 'rgba(255,200,90,0.20)'],
    'soft-light',
    'rgba(255,205,110,0.08)',
  ],
};

const TITLE_GRADIENTS = {
  sunset: ['#ffd319', '#ff7a18', '#ff2e88'],
  vice: ['#7df9ff', '#b06bff', '#ff2e88'],
  golden: ['#fff3b0', '#ffb347', '#ff7a18'],
  noir: ['#f7e7b0', '#e8b64c', '#c98a1b'],
};

function gradeOverlay(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  const [tintSpec, blend, wash] = GRADE_TINTS[grade] || GRADE_TINTS.sunset;
  const [kind, ...stops] = tintSpec;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const tint = kind === 'diagonal'
    ? ctx.createLinearGradient(x, y, x + w, y + h)
    : ctx.createLinearGradient(x, y, x, y + h);
  for (let i = 0; i < stops.length; i += 2) tint.addColorStop(stops[i], stops[i + 1]);
  ctx.globalCompositeOperation = blend;
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  const vg = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.42,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(10,0,30,0)');
  vg.addColorStop(1, 'rgba(10,0,30,0.32)');
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grain(ctx);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ---------------------------------------------------------------- photo

function drawPhoto(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (dw - rect.w) * (((panel.ox || 0) + 1) / 2);
  const oy = (dh - rect.h) * (((panel.oy || 0) + 1) / 2);
  ctx.drawImage(img, rect.x - ox, rect.y - oy, dw, dh);
}

// ---------------------------------------------------------------- palms and sun

function frond(ctx, cx, cy, angle, len, droop) {
  // One wide, drooping leaf: base to tip along the frond direction, the two
  // edges bulging apart across it, so the leaf reads as a palm frond.
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const px = -dy;
  const py = dx;
  const w = len * 0.13;
  const tipX = cx + dx * len;
  const tipY = cy + dy * len + droop;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(
    cx + dx * len * 0.4 - px * w * 0.9, cy + dy * len * 0.4 - py * w * 0.9 + droop * 0.2,
    tipX, tipY,
  );
  ctx.quadraticCurveTo(
    cx + dx * len * 0.55 + px * w * 1.1, cy + dy * len * 0.55 + py * w * 1.1 + droop * 0.65,
    cx, cy,
  );
  ctx.closePath();
  ctx.fill();
}

/** A stylised palm silhouette drawn from canvas paths — no artwork copied in. */
export function drawPalm(ctx, x, y, s, flip, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.quadraticCurveTo(-6, -92, 20, -152);
  ctx.quadraticCurveTo(26, -156, 30, -150);
  ctx.quadraticCurveTo(14, -82, 13, 0);
  ctx.closePath();
  ctx.fill();
  const crownX = 25;
  const crownY = -150;
  const angles = [-2.75, -2.35, -1.95, -1.55, -1.15, -0.75, -0.35];
  const lens = [118, 142, 158, 166, 158, 142, 118];
  const droops = [58, 42, 26, 14, 26, 42, 58];
  for (let i = 0; i < angles.length; i++) frond(ctx, crownX, crownY, angles[i], lens[i], droops[i]);
  ctx.beginPath();
  ctx.arc(crownX - 6, crownY + 8, 7, 0, Math.PI * 2);
  ctx.arc(crownX + 8, crownY + 10, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSun(ctx, cx, cy, r) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r);
  glow.addColorStop(0, 'rgba(255,236,140,0.95)');
  glow.addColorStop(0.45, 'rgba(255,150,50,0.85)');
  glow.addColorStop(0.75, 'rgba(255,46,136,0.45)');
  glow.addColorStop(1, 'rgba(255,46,136,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- title lettering

function fitSize(ctx, text, maxW, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  while (size > 10 && ctx.measureText(text).width * 0.82 > maxW) {
    size -= 2;
    ctx.font = `900 ${size}px ${TITLE_FONT}`;
  }
  return size;
}

function drawTitleLine(ctx, text, cx, cy, size, maxW, grade) {
  const [c1, c2, c3] = TITLE_GRADIENTS[grade] || TITLE_GRADIENTS.sunset;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.82, 1);
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(-maxW / 2, 0, maxW / 2, 0);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, c3);
  ctx.shadowColor = 'rgba(20,0,40,0.85)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.05;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1c0533';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeText(text, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawTitle(ctx, caption, subtitle, area, grade) {
  const { x, y, w, h } = area;
  const pad = w * 0.06;
  const maxW = w - pad * 2;
  let subY = y + h * 0.14;
  if (subtitle) {
    let subSize = Math.max(10, h * 0.13);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const setSubFont = (s) => {
      ctx.font = `700 ${s}px ${TITLE_FONT}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(2, s * 0.22)}px`;
    };
    setSubFont(subSize);
    while (subSize > 8 && ctx.measureText(subtitle.toUpperCase()).width > maxW) {
      subSize -= 1;
      setSubFont(subSize);
    }
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(20,0,40,0.9)';
    ctx.shadowBlur = subSize * 0.25;
    ctx.fillText(subtitle.toUpperCase(), x + w / 2, subY);
    ctx.restore();
  }
  const top = subtitle ? y + h * 0.2 : y;
  const availH = subtitle ? h * 0.8 : h;
  const size = fitSize(ctx, caption.toUpperCase(), maxW, availH * 0.62);
  if (size >= availH * 0.24 || !caption.includes(' ')) {
    drawTitleLine(ctx, caption.toUpperCase(), x + w / 2, top + availH * 0.52, size, maxW, grade);
    return;
  }
  const words = caption.toUpperCase().split(/\s+/);
  let line1 = '';
  let line2 = '';
  for (const word of words) {
    if ((line1 + ' ' + word).trim().length <= caption.length / 2 + 1) line1 = (line1 + ' ' + word).trim();
    else line2 = (line2 + ' ' + word).trim();
  }
  if (!line2) line2 = line1.slice(Math.ceil(line1.length / 2));
  const s2 = Math.min(fitSize(ctx, line1, maxW, availH * 0.4), fitSize(ctx, line2, maxW, availH * 0.4));
  drawTitleLine(ctx, line1, x + w / 2, top + availH * 0.3, s2, maxW, grade);
  drawTitleLine(ctx, line2, x + w / 2, top + availH * 0.72, s2, maxW, grade);
}

// ---------------------------------------------------------------- the whole cover

/**
 * Paint the cover on ctx. Returns the panel rectangles (canvas pixels) so the
 * editor can hit-test clicks. `forExport` skips the selection ring, which is
 * only ever shown in the live preview.
 */
export function renderCover(ctx, W, H, state, opts = {}) {
  const { layout, grade, caption, subtitle, panels, frame } = state;
  const forExport = !!opts.forExport;
  const framed = frame !== 'edge';

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2b1055');
  bg.addColorStop(0.45, '#7b2ff7');
  bg.addColorStop(0.72, '#ff2e88');
  bg.addColorStop(1, '#ff7a18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const rects = panelRects(layout, W, H);
  const borderW = Math.max(3, Math.round(W * 0.004));

  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const panel = panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel && panel.img) drawPhoto(ctx, panel.img, rect, panel);
    else {
      ctx.fillStyle = '#3a1660';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    gradeOverlay(ctx, rect, grade);
    ctx.restore();
    if (framed) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = borderW;
      ctx.strokeRect(rect.x + borderW / 2, rect.y + borderW / 2, rect.w - borderW, rect.h - borderW);
      ctx.restore();
    }
    if (!forExport && state.selected === i) {
      ctx.save();
      ctx.strokeStyle = '#ffd319';
      ctx.lineWidth = Math.max(3, W * 0.005);
      ctx.setLineDash([Math.max(8, W * 0.012), Math.max(6, W * 0.008)]);
      ctx.strokeRect(rect.x - borderW, rect.y - borderW, rect.w + borderW * 2, rect.h + borderW * 2);
      ctx.restore();
    }
  }

  // One wash over everything, so the panels read as one poster.
  ctx.save();
  ctx.globalAlpha = 0.12;
  gradeOverlay(ctx, { x: 0, y: 0, w: W, h: H }, grade);
  ctx.restore();

  const palmColor = 'rgba(24,4,48,0.92)';
  const margin = Math.max(8, Math.round(Math.min(W, H) * 0.022));
  if (layout === 'grid') {
    const cell = titleCellRect(W, H);
    const cellGrad = ctx.createLinearGradient(cell.x, cell.y, cell.x, cell.y + cell.h);
    cellGrad.addColorStop(0, '#ff2e88');
    cellGrad.addColorStop(1, '#ff7a18');
    ctx.save();
    ctx.fillStyle = cellGrad;
    ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
    drawSun(ctx, cell.x + cell.w / 2, cell.y + cell.h * 0.42, cell.h * 0.34);
    drawPalm(ctx, cell.x + cell.w * 0.06, cell.y + cell.h * 0.99, cell.h / 560, false, palmColor);
    drawPalm(ctx, cell.x + cell.w * 0.94, cell.y + cell.h * 0.99, cell.h / 560, true, palmColor);
    ctx.restore();
    if (framed) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = borderW;
      ctx.strokeRect(cell.x + borderW / 2, cell.y + borderW / 2, cell.w - borderW, cell.h - borderW);
      ctx.restore();
    }
    drawTitle(ctx, caption, subtitle, { x: cell.x, y: cell.y + cell.h * 0.3, w: cell.w, h: cell.h * 0.66 }, grade);
  } else {
    const bandH = Math.round(H * 0.2);
    const bandY = H - margin - bandH;
    const scrim = ctx.createLinearGradient(0, bandY - bandH * 0.5, 0, H);
    scrim.addColorStop(0, 'rgba(20,0,40,0)');
    scrim.addColorStop(1, 'rgba(20,0,40,0.62)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, bandY - bandH * 0.5, W, H - bandY + bandH * 0.5);
    drawSun(ctx, W / 2, bandY + bandH * 0.55, bandH * 0.95);
    const palmS = bandH / 175;
    drawPalm(ctx, W * 0.008, H - margin + 4, palmS, false, palmColor);
    drawPalm(ctx, W * 0.992, H - margin + 4, palmS, true, palmColor);
    drawTitle(ctx, caption, subtitle, { x: W * 0.14, y: bandY, w: W * 0.72, h: bandH }, grade);
  }

  return { rects };
}
