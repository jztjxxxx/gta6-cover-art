// Neon Strip Cover Studio — paints the poster cover on a canvas.
// The whole look lives here: a neon sky, graded photo panels, horizon
// bands, a ring sun, arc-drawn palm silhouettes and bold poster lettering
// with a hard offset shadow. The editor in main.js only holds state and
// forwards it; export draws through this same function, so what you see is
// exactly what the PNG holds.
//
// Layouts are strips, not columns: hero3 puts one wide hero strip across
// the top with three panels in a row beneath it; grid is four squares over
// a full-width title band; full is one photo with the title band on top.

export const LAYOUTS = {
  hero3: { label: 'Hero strip + 3', panels: 4 },
  grid: { label: 'Four square', panels: 4 },
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

const TITLE_FONT = "Impact, 'Arial Black', 'Helvetica Neue', sans-serif";
const BODY_FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

// One table drives every grade: the backdrop sky, the wash colour blended
// in 'color' mode over each photo, a warm sheen screened across the top,
// the three horizon-band stripes, and the title ink, outline and sun core.
const GRADE_TABLE = {
  sunset: {
    sky: [[0, '#2a0a4d'], [0.45, '#7c1d6e'], [0.75, '#e0218a'], [1, '#ff7a18']],
    wash: { colour: '#ff2e88', alpha: 0.3 },
    sheen: { colour: '#ffb347', alpha: 0.2 },
    band: ['#ffd319', '#ff7a18', '#ff2e88'],
    titleInk: '#fff3b0',
    titleOutline: '#1a0533',
    sunCore: '#ffe45e',
  },
  vice: {
    sky: [[0, '#02131f'], [0.45, '#0e7490'], [0.75, '#7e22ce'], [1, '#ec4899']],
    wash: { colour: '#22d3ee', alpha: 0.28 },
    sheen: { colour: '#f0abfc', alpha: 0.18 },
    band: ['#67e8f9', '#a855f7', '#ec4899'],
    titleInk: '#e0faff',
    titleOutline: '#04121f',
    sunCore: '#a5f3fc',
  },
  golden: {
    sky: [[0, '#2b1503'], [0.45, '#92400e'], [0.75, '#ea580c'], [1, '#fbbf24']],
    wash: { colour: '#f59e0b', alpha: 0.3 },
    sheen: { colour: '#fef3c7', alpha: 0.22 },
    band: ['#fef3c7', '#fbbf24', '#ea580c'],
    titleInk: '#fffbeb',
    titleOutline: '#451a03',
    sunCore: '#fde68a',
  },
  noir: {
    sky: [[0, '#000000'], [0.45, '#1e1b4b'], [0.75, '#4c1d95'], [1, '#b45309']],
    wash: { colour: '#facc15', alpha: 0.26 },
    sheen: { colour: '#e9d5ff', alpha: 0.16 },
    band: ['#fef9c3', '#facc15', '#b45309'],
    titleInk: '#fef9c3',
    titleOutline: '#0a0a0a',
    sunCore: '#fde047',
  },
};

function gradeOf(name) {
  return GRADE_TABLE[name] || GRADE_TABLE.sunset;
}

// ------------------------------------------------------------ geometry

// Edge-to-edge mode drops the outer margin and the gutters entirely, so the
// panels run to the cover's edge. Framed mode keeps a poster margin.
function gaps(W, H, frame) {
  if (frame === 'edge') return { g: 0, m: 0 };
  const u = Math.max(4, Math.round(Math.min(W, H) * 0.014));
  return { g: u, m: u * 2 };
}

function bandHeight(H) {
  return Math.round(H * 0.2);
}

/** Panel rectangles for a layout, in canvas pixels. */
export function panelRects(layout, W, H, frame) {
  const { g, m } = gaps(W, H, frame);
  if (layout === 'hero3') {
    const heroH = Math.round((H - 2 * m - g) * 0.58);
    const stripY = m + heroH + g;
    const stripH = H - m - stripY;
    const cw = Math.floor((W - 2 * m - 2 * g) / 3);
    return [
      { x: m, y: m, w: W - 2 * m, h: heroH },
      { x: m, y: stripY, w: cw, h: stripH },
      { x: m + cw + g, y: stripY, w: cw, h: stripH },
      { x: m + 2 * (cw + g), y: stripY, w: W - m - (m + 2 * (cw + g)), h: stripH },
    ];
  }
  if (layout === 'grid') {
    const bandH = bandHeight(H);
    const areaH = H - 2 * m - g - bandH;
    const cw = (W - 2 * m - g) / 2;
    const ch = (areaH - g) / 2;
    return [
      { x: m, y: m, w: Math.round(cw), h: Math.round(ch) },
      { x: Math.round(m + cw + g), y: m, w: Math.round(cw), h: Math.round(ch) },
      { x: m, y: Math.round(m + ch + g), w: Math.round(cw), h: Math.round(ch) },
      { x: Math.round(m + cw + g), y: Math.round(m + ch + g), w: Math.round(cw), h: Math.round(ch) },
    ];
  }
  return [{ x: m, y: m, w: W - 2 * m, h: H - 2 * m }];
}

/** The title band rectangle for a layout, in canvas pixels. */
export function titleBandRect(layout, W, H, frame) {
  const { g, m } = gaps(W, H, frame);
  const bandH = bandHeight(H);
  if (layout === 'grid') {
    return { x: m, y: H - m - bandH, w: W - 2 * m, h: bandH };
  }
  if (layout === 'full') {
    return { x: m, y: m, w: W - 2 * m, h: bandH };
  }
  // hero3: the band sits across the bottom of the hero strip.
  const heroH = Math.round((H - 2 * m - g) * 0.58);
  return { x: m, y: m + heroH - bandH, w: W - 2 * m, h: bandH };
}

// ------------------------------------------------------------ grain

// Deterministic grain: the same seeded speckle on every run, so an export
// matches its preview pixel for pixel.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainPattern = null;
function grainTile(ctx) {
  if (grainPattern) return grainPattern;
  const rand = mulberry32(20261120);
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const g = tile.getContext('2d');
  const data = g.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = (rand() * 255) | 0;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 18;
  }
  g.putImageData(data, 0, 0);
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

// ------------------------------------------------------------ grading

function gradePhoto(ctx, rect, gradeName) {
  const grade = gradeOf(gradeName);
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // Wash the photo toward the grade's hue, keeping its own light and dark.
  ctx.globalCompositeOperation = 'color';
  ctx.globalAlpha = grade.wash.alpha;
  ctx.fillStyle = grade.wash.colour;
  ctx.fillRect(x, y, w, h);
  // A warm sheen across the top, then shade pooling at the bottom.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = grade.sheen.alpha;
  const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.55);
  sheen.addColorStop(0, grade.sheen.colour);
  sheen.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(x, y + h * 0.55, x, y + h);
  shade.addColorStop(0, 'rgba(10,0,30,0)');
  shade.addColorStop(1, 'rgba(10,0,30,0.38)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grainTile(ctx);
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ------------------------------------------------------------ photo

// Cover-fit by focal point: fx/fy (0..1) pick which part of the photo the
// frame shows once the photo is zoomed past it.
function paintPhotoFit(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const sx = (panel.fx ?? 0.5) * (dw - rect.w);
  const sy = (panel.fy ?? 0.5) * (dh - rect.h);
  ctx.drawImage(img, rect.x - sx, rect.y - sy, dw, dh);
}

// ------------------------------------------------------------ sun, bands and palms

// A ring sun: a glowing halo, a thick stroked ring and a bright core.
function paintRingSun(ctx, cx, cy, r, coreColour) {
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.5);
  glow.addColorStop(0, 'rgba(255,220,120,0.55)');
  glow.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(3, r * 0.16);
  ctx.strokeStyle = coreColour;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  const core = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r * 0.55);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(1, coreColour);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Three stacked stripes in the grade's colours, along the band's top edge.
function paintHorizonBands(ctx, x, y, w, colours) {
  const stripeH = Math.max(3, Math.round(w * 0.006));
  colours.forEach((colour, i) => {
    ctx.fillStyle = colour;
    ctx.fillRect(x, y + i * stripeH, w, stripeH);
  });
}

/** A palm silhouette drawn from canvas paths — no artwork copied in. */
export function drawPalm(ctx, x, y, s, flip, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  // Trunk: a filled sliver that leans right as it rises.
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(-12, -80, 2, -140);
  ctx.quadraticCurveTo(6, -158, 16, -166);
  ctx.lineTo(24, -160);
  ctx.quadraticCurveTo(14, -90, 12, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds: arcs fanning out from the crown, each one a single stroke.
  const crownX = 20;
  const crownY = -164;
  const fronds = [
    { r: 96, a0: Math.PI * 1.05, a1: Math.PI * 1.55 },
    { r: 116, a0: Math.PI * 1.15, a1: Math.PI * 1.7 },
    { r: 128, a0: Math.PI * 1.3, a1: Math.PI * 1.85 },
    { r: 128, a0: Math.PI * 1.45, a1: Math.PI * 1.95 },
    { r: 112, a0: Math.PI * 1.6, a1: Math.PI * 2.05 },
    { r: 88, a0: Math.PI * 1.75, a1: Math.PI * 2.2 },
  ];
  ctx.lineWidth = 9;
  for (const f of fronds) {
    ctx.beginPath();
    ctx.arc(crownX, crownY, f.r, f.a0, f.a1);
    ctx.stroke();
  }
  // A small cluster of coconuts under the crown.
  ctx.beginPath();
  ctx.arc(crownX - 6, crownY + 8, 7, 0, Math.PI * 2);
  ctx.arc(crownX + 6, crownY + 10, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------ title lettering

function fitTitleSize(ctx, text, maxW, start) {
  let size = start;
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  while (size > 12 && ctx.measureText(text).width > maxW) {
    size -= 4;
    ctx.font = `900 ${size}px ${TITLE_FONT}`;
  }
  return size;
}

function paintTitleLine(ctx, text, cx, cy, size, gradeName) {
  const grade = gradeOf(gradeName);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(1, size * 0.04)}px`;
  ctx.lineJoin = 'round';
  // Hard offset shadow first: the same letters, shifted, in outline colour.
  ctx.fillStyle = grade.titleOutline;
  ctx.fillText(text, cx + size * 0.05, cy + size * 0.06);
  ctx.strokeStyle = grade.titleOutline;
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = grade.titleInk;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function paintCaption(ctx, title, tagline, band, gradeName) {
  const grade = gradeOf(gradeName);
  const { x, y, w, h } = band;
  const cx = x + w / 2;
  const maxW = w * 0.6;
  let titleY = y + h * 0.52;
  let titleH = h * 0.62;
  if (tagline) {
    // The tagline rides on a dark pill above the title.
    const pillH = Math.max(16, h * 0.2);
    const pillY = y + h * 0.08;
    ctx.save();
    ctx.font = `700 ${Math.max(10, pillH * 0.55)}px ${BODY_FONT}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(2, pillH * 0.14)}px`;
    const tw = ctx.measureText(tagline.toUpperCase()).width;
    const pillW = tw + pillH * 1.4;
    ctx.fillStyle = 'rgba(16,0,36,0.72)';
    ctx.beginPath();
    ctx.roundRect(cx - pillW / 2, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = grade.band[0];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagline.toUpperCase(), cx, pillY + pillH / 2 + 1);
    ctx.restore();
    titleY = y + h * 0.58;
    titleH = h * 0.56;
  }
  const words = title.toUpperCase();
  const size = fitTitleSize(ctx, words, maxW, titleH * 0.85);
  if (size >= titleH * 0.42 || !words.includes(' ')) {
    paintTitleLine(ctx, words, cx, titleY, size, gradeName);
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
    second = first;
    first = '';
  }
  const s2 = Math.min(
    fitTitleSize(ctx, first, maxW, titleH * 0.44),
    fitTitleSize(ctx, second, maxW, titleH * 0.44),
  );
  if (first) paintTitleLine(ctx, first, cx, y + h * 0.4, s2, gradeName);
  paintTitleLine(ctx, second, cx, y + h * (first ? 0.8 : 0.58), s2, gradeName);
}

// ------------------------------------------------------------ the cover

/**
 * Paint the whole cover. Returns the panel rectangles (canvas pixels) so
 * the editor can hit-test a click. `forExport` leaves out the selection
 * outline, which only ever appears in the live preview.
 */
export function paintCover(ctx, W, H, state, opts = {}) {
  const { layout, grade, title, tagline, panels, frame } = state;
  const forExport = !!opts.forExport;
  const gradeDef = gradeOf(grade);
  const { m } = gaps(W, H, frame);

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  for (const [pos, colour] of gradeDef.sky) sky.addColorStop(pos, colour);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rects = panelRects(layout, W, H, frame);
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const panel = panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel && panel.img) paintPhotoFit(ctx, panel.img, rect, panel);
    else {
      ctx.fillStyle = '#2a1150';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    gradePhoto(ctx, rect, grade);
    ctx.restore();
    if (!forExport && state.active === i) {
      ctx.save();
      ctx.setLineDash([Math.max(6, W * 0.008), Math.max(6, W * 0.008)]);
      ctx.strokeStyle = '#ffd319';
      ctx.lineWidth = Math.max(3, W * 0.004);
      ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.restore();
    }
  }

  const band = titleBandRect(layout, W, H, frame);
  // A dark scrim across the band, so the lettering always reads.
  ctx.save();
  const scrim = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  scrim.addColorStop(0, 'rgba(16,0,36,0.12)');
  scrim.addColorStop(1, 'rgba(16,0,36,0.78)');
  ctx.fillStyle = scrim;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  paintHorizonBands(ctx, band.x, band.y, band.w, gradeDef.band);
  ctx.restore();

  const sunLeft = layout === 'grid';
  const sunX = sunLeft ? band.x + band.w * 0.09 : band.x + band.w * 0.9;
  paintRingSun(ctx, sunX, band.y + band.h * 0.46, band.h * 0.34, gradeDef.sunCore);

  const palmInk = 'rgba(16,4,46,0.95)';
  // Small enough that the crown and fronds stay inside the title band
  // instead of spilling over the photos above it.
  const palmScale = band.h / 300;
  const palmBase = layout === 'full' ? H - m + 2 : band.y + band.h;
  drawPalm(ctx, band.x + band.w * 0.015, palmBase, palmScale, false, palmInk);
  drawPalm(ctx, band.x + band.w * 0.985, palmBase, palmScale, true, palmInk);

  paintCaption(ctx, title, tagline, band, grade);

  // Poster frame: a thick dark border with a thin gold rule inside it.
  if (frame !== 'edge' && m > 0) {
    ctx.save();
    ctx.strokeStyle = '#16042e';
    ctx.lineWidth = m;
    ctx.strokeRect(m / 2, m / 2, W - m, H - m);
    ctx.strokeStyle = gradeDef.band[0];
    ctx.lineWidth = Math.max(2, m * 0.12);
    ctx.strokeRect(m + m * 0.2, m + m * 0.2, W - 2 * (m + m * 0.2), H - 2 * (m + m * 0.2));
    ctx.restore();
  }

  // A last grain wash over the whole poster, so the panels read as one image.
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = grainTile(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  return { rects };
}
