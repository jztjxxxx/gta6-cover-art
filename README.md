# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/jztjxxxx/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/jztjxxxx/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice City Cover Studio: a fully offline web app that turns any photo into a GTA 6-style multi-panel poster cover. Add a photo from your machine, write a caption, pick a layout, a neon grade and a frame, and export a PNG — no upload, no account, no network at all.

Everything is drawn on canvas, so the exported PNG carries the full look: a neon sky, a slatted retro sun, palm silhouettes, a colour grade baked into every panel, and bold condensed title lettering with a sunset rule underneath. Three layouts (Hero + 3, Poster grid, Full bleed), four grades (Neon Sunset, Vice Nights, Golden Hour, Noir Gold), a poster frame or edge-to-edge panels, and three export sizes (1080 × 1080, 1080 × 1350, 1920 × 1080). Each panel takes its own photo, or one photo can fill them all; click a panel to pick it, drag inside it to move the photo, and use the zoom slider to crop.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Or try it live: `node serve.ts`, then open http://localhost:8080.

## How to use it

1. **Photo** — the cover opens with a sample photo already in place. Click "Add photo…" to use your own, or "Replace" to swap the picked panel's photo. "Fill all panels with this photo" puts one photo everywhere.
2. **Title** — type a caption and an optional subtitle. The lettering shrinks to fit, so it never overflows.
3. **Layout** — Hero + 3 (one big hero panel, three small ones stacked beside it), Poster grid (eight panels around a title block), or Full bleed (a single photo with a title band).
4. **Grade** — Neon Sunset (pink / purple / orange), Vice Nights (teal / magenta), Golden Hour (warm amber), or Noir Gold (dark violet with gold lettering).
5. **Frame** — Poster frame (white borders, the classic poster look) or Edge to edge (the panels run to the cover's edge).
6. **Export size** — 1080 × 1080, 1080 × 1350, or 1920 × 1080, then **Export PNG**. The file downloads as `cover-<width>x<height>.png`.

It all runs locally: photos are read with FileReader, the two sample photos in `app/samples/` ship with the app, and the page makes no network requests.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7t04rwmb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
