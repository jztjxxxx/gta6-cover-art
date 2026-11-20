# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/jztjxxxx/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/jztjxxxx/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Strip Cover Studio: a fully offline web app that turns any photo into a GTA 6-style multi-panel poster cover. Add a photo from your machine, write a title, pick a layout, a neon grade and a frame, and export a PNG — no upload, no account, no network at all.

Everything is drawn on canvas, so the exported PNG carries the full look: a neon sky, horizon bands in the grade's colours, a ring sun, palm silhouettes, a colour grade baked into every panel, and bold poster lettering with a hard offset shadow. Three layouts (Hero strip + 3, Four square, Full bleed), four grades (Neon Sunset, Vice Nights, Golden Hour, Noir Gold), a poster frame or edge-to-edge panels, and three export sizes (1080 × 1080, 1080 × 1350, 1920 × 1080). Each panel takes its own photo, or one photo can fill them all; click a panel to pick it, drag inside it to move the photo, and use the zoom slider to crop.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Or try it live: `node serve.ts`, then open http://localhost:8080.

## How to use it

1. **Photo** — the cover opens with a sample photo already in place. Click "Add photo…" to use your own, or "Replace selected panel…" to swap the picked panel's photo. "Fill every panel with selected photo" puts one photo everywhere.
2. **Words** — type a title and an optional tagline. The tagline rides on a dark pill above the title, and the title shrinks to fit, so it never overflows.
3. **Layout** — Hero strip + 3 (one wide hero strip across the top, three panels in a row beneath it), Four square (four panels over a full-width title band), or Full bleed (a single photo with the title band on top).
4. **Grade** — Neon Sunset (pink / purple / orange), Vice Nights (teal / magenta), Golden Hour (warm amber), or Noir Gold (dark violet with gold lettering).
5. **Frame** — Poster frame (a thick dark border with a thin gold rule) or Edge to edge (the panels run to the cover's edge).
6. **Export size** — 1080 × 1080, 1080 × 1350, or 1920 × 1080, then **Export PNG**. The file downloads as `cover-<width>x<height>.png`.

It all runs locally: photos are read with FileReader, the two sample photos in `app/samples/` ship with the app, and the page makes no network requests.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7t04rwmb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
