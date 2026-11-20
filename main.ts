// Neon Strip Cover Studio — a gta6-cover-art-01 entry (round 2 rebuild),
// Node 22, standard library only. The entry program hands the app in: it
// walks app/ and screenshots/ beside this file, copies them file by file
// into /output, and writes /output/dossier.json — the summary the judge
// reads — with the vendored make.fun library.
//
// The app turns any photo plus a caption into GTA 6-style multi-panel
// poster art: a hero strip with three panels, a four-square grid or a
// full-bleed photo, in a neon grade (Neon Sunset, Vice Nights, Golden Hour
// or Noir Gold), with a poster frame or edge-to-edge panels, horizon bands,
// a ring sun, palm silhouettes and bold poster lettering, exported as a PNG
// in 1080 x 1080, 1080 x 1350 or 1920 x 1080. Its two sample photos
// (app/samples/) were made for make.fun with an image model and are free
// to use.
//
// Try it live: `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a directory tree one file at a time, creating folders as needed.
function copyTree(fromDir, toDir) {
  mkdirSync(toDir, { recursive: true });
  for (const name of readdirSync(fromDir)) {
    const from = join(fromDir, name);
    const to = join(toDir, name);
    if (statSync(from).isDirectory()) copyTree(from, to);
    else copyFileSync(from, to);
  }
}

mkdirSync(outDir, { recursive: true });
copyTree(join(here, 'app'), join(outDir, 'app'));
// screenshots/ goes in as-is: the gate reads the images, not their bytes.
if (existsSync(join(here, 'screenshots'))) {
  copyTree(join(here, 'screenshots'), join(outDir, 'screenshots'));
}

// The scorer's caps, from the kit's reference/gate.json. Only
// text_max_bytes shapes the dossier's bytes; the rest refuse exactly what
// the scorer would refuse: more than 4 screenshots, or one over 256 KiB;
// more than 993 files in app/, or 48 MiB of them in all; a path under app/
// over 1000 bytes. app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
