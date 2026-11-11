// Cuts the user's artwork into site assets, with the flat cream background
// keyed out to transparent. Uses the installed Chrome (no image library).
//   node scripts/cut-art.mjs
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";

// [source, output, x, y, w, h]
const CUTS = [
  ["art-src/god-cards.png", "public/cards/zeus.png", 66, 22, 334, 460],
  ["art-src/god-cards.png", "public/cards/hera.png", 436, 22, 334, 460],
  ["art-src/god-cards.png", "public/cards/poseidon.png", 805, 22, 334, 460],
  ["art-src/god-cards.png", "public/cards/athena.png", 66, 498, 334, 494],
  ["art-src/god-cards.png", "public/cards/apollo.png", 436, 498, 334, 494],
  ["art-src/god-cards.png", "public/cards/artemis.png", 805, 498, 334, 494],
  ["art-src/god-cards.png", "public/cards/back.png", 1176, 282, 316, 452],
  ["art-src/bust.png", "public/art/bust.png", 30, 20, 1000, 1400],
  ["art-src/about-objects.png", "public/art/d20.png", 150, 170, 300, 300, [[0, 0]]],
  ["art-src/about-objects.png", "public/art/dragon.png", 550, 130, 370, 370, [[0, 0]]],
  ["art-src/about-objects.png", "public/art/note.png", 1040, 150, 400, 370, [[0, 0]]],
  ["art-src/about-objects.png", "public/art/headphones.png", 230, 550, 470, 350, [[0, 0]]],
  ["art-src/about-objects.png", "public/art/watcher.png", 830, 550, 380, 350, [[0, 0]]],
  ["art-src/water-statue.png", "public/art/water-statue.png", 140, 180, 730, 945, [[218, 517], [150, 470], [250, 600]]],
];

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
for (const [src, out, x, y, w, h, seeds = []] of CUTS) {
  const data = "data:image/png;base64," + readFileSync(src).toString("base64");
  const url = await page.evaluate(
    async (data, x, y, w, h, seeds) => {
      const img = new Image();
      img.src = data;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d");
      g.drawImage(img, -x, -y);
      const d = g.getImageData(0, 0, w, h);
      const p = d.data;
      // the background colour is whatever sits in the top-left corner
      const [br, bg, bb] = [p[0], p[1], p[2]];
      const near = (i) => Math.abs(p[i] - br) + Math.abs(p[i + 1] - bg) + Math.abs(p[i + 2] - bb) < 34;
      // flood from the edges, so cream inside the artwork is kept
      const seen = new Uint8Array(w * h);
      const stack = [];
      for (let i = 0; i < w; i++) stack.push(i, (h - 1) * w + i);
      for (let j = 0; j < h; j++) stack.push(j * w, j * w + w - 1);
      for (const [sx, sy] of seeds) stack.push(sy * w + sx);
      while (stack.length) {
        const k = stack.pop();
        if (seen[k] || !near(k * 4)) continue;
        seen[k] = 1;
        p[k * 4 + 3] = 0;
        const px = k % w;
        if (px > 0) stack.push(k - 1);
        if (px < w - 1) stack.push(k + 1);
        if (k >= w) stack.push(k - w);
        if (k < w * (h - 1)) stack.push(k + w);
      }
      // trim the pale fringe the cream background leaves round dark-edged art:
      // peel light pixels off the cut edge until the dark outline is reached
      for (let pass = 0; pass < (seeds.length ? 0 : 3); pass++) {
        const kill = [];
        for (let k = 0; k < w * h; k++) {
          if (p[k * 4 + 3] === 0) continue;
          const lum = (p[k * 4] * 3 + p[k * 4 + 1] * 6 + p[k * 4 + 2]) / 10;
          if (lum < 70) continue;
          const px = k % w;
          if ((px > 0 && p[(k - 1) * 4 + 3] === 0) || (px < w - 1 && p[(k + 1) * 4 + 3] === 0) || (k >= w && p[(k - w) * 4 + 3] === 0) || (k < w * (h - 1) && p[(k + w) * 4 + 3] === 0)) kill.push(k);
        }
        for (const k of kill) p[k * 4 + 3] = 0;
      }
      g.putImageData(d, 0, 0);
      return c.toDataURL("image/png");
    },
    data, x, y, w, h, seeds
  );
  writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
  console.log("wrote", out);
}
await browser.close();
