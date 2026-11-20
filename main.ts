// Vice City Cover Studio — a gta6-cover-art-01 entry, Node 22, standard
// library only. It hands the app in: app/ (plain static files — index.html
// and its ES modules, no library, no network request) and screenshots/ are
// copied from beside this file into /output, and /output/dossier.json — the
// summary the judge reads — is written with the vendored make.fun library.
// The app turns any photo plus a caption into a GTA-style multi-panel poster
// cover: Hero + 3, poster grid or full bleed, in a neon grade (Neon Sunset,
// Vice Nights, Golden Hour or Noir Gold), with a poster frame or edge-to-edge
// panels, palm silhouettes, a slatted sunset and bold condensed title
// lettering, exported as a PNG in 1080 x 1080, 1080 x 1350 or 1920 x 1080.
// Its two sample photos (app/samples/) were made for make.fun with an image
// model and are free to use.
//
// Try it live: `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  cpSync(join(repoRoot, from), join(outDir, to), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('app', 'app');
// screenshots/ goes in as-is: the gate reads the images, not their bytes.

mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) copyTree('screenshots', 'screenshots');

// The scorer's caps, from the kit's reference/gate.json. Only text_max_bytes
// shapes the dossier's bytes; the rest refuse exactly what the scorer would
// refuse: more than 4 screenshots, or one over 256 KiB; more than 993 files
// in app/, or 48 MiB of them in all; a path under app/ over 1000 bytes. app/
// counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
