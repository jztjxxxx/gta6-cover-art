# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/jztjxxxx/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/jztjxxxx/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo into a GTA 6-style multi-panel poster cover, entirely offline in the browser. Pick a photo from your machine, type a caption, choose a layout, a neon grade and a frame, and export a PNG — no upload, no account, no network at all.

The cover is drawn on canvas, so the export carries the full look: a neon-sunset backdrop, palm-silhouette framing, a glowing sun behind bold condensed title lettering, and a colour grade baked into every panel. Three layouts (Hero + 3, Poster grid, Full bleed), four grades (Neon Sunset, Vice Nights, Golden Hour, Noir Gold), a poster frame or edge-to-edge panels, and three export sizes (1080 × 1080, 1080 × 1350, 1920 × 1080). Each panel can hold a different photo, or one photo can fill them all; click a panel to select it, drag inside it to move the photo, and use the zoom slider to crop.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Or try it live: `node serve.ts`, then open http://localhost:8080.

## How to use it

1. **Photo** — the cover opens with a sample photo already loaded. Click "Add photo…" to use your own, or "Replace" to swap the selected panel's photo. "Fill all panels with this photo" puts one photo everywhere.
2. **Title** — type a caption (and an optional subtitle). The lettering auto-fits so it never overflows.
3. **Layout** — Hero + 3 (big hero panel, three stacked small panels), Poster grid (nine panels with a title block), or Full bleed (one photo, title band).
4. **Grade** — Neon Sunset (pink / purple / orange), Vice Nights (teal / magenta), Golden Hour (warm amber), or Noir Gold (dark purple with gold lettering).
5. **Frame** — Poster frame (white borders, the classic poster look) or Edge to edge (panels run to the cover's edge).
6. **Export size** — 1080 × 1080, 1080 × 1350, or 1920 × 1080, then **Export PNG**. The file downloads as `cover-<width>x<height>.png`.

Everything runs locally: photos are read with FileReader, the two sample photos in `app/samples/` are bundled with the app, and the page makes no network requests.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7t04rwmb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
