// Redraws the user's sprites at the study's own pixel size and palette, so
// they sit in the room instead of on top of it. Each sprite is shrunk to the
// number of room pixels it should occupy, every pixel is snapped to a colour
// the room already uses (plus a few accents), and a one-pixel navy outline
// is drawn round it, the same as the room's.
//   node scripts/pixel-sprites.mjs      (after scripts/cut-art.mjs and build-study.py)
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";

// [name, width in room pixels, extra accent colours]
const SPRITES = [
  ["bust", 38, []],
  ["dragon", 32, []],
  ["watcher", 28, []],
  ["headphones", 30, ["#c9a45a", "#7a5a3a"]],
  ["d20", 20, []],
  ["note", 26, ["#f7e7a6", "#e9d27c"]],
];
const b64 = (f) => "data:image/png;base64," + readFileSync(f).toString("base64");
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
const sizes = {};
for (const [name, w, extra] of SPRITES) {
  const res = await page.evaluate(
    async (src, room, w, extra) => {
      const load = async (d) => { const i = new Image(); i.src = d; await i.decode(); return i; };
      const img = await load(src), rm = await load(room);
      // the room's colours
      const rc = document.createElement("canvas"); rc.width = rm.width; rc.height = rm.height;
      const rg = rc.getContext("2d"); rg.drawImage(rm, 0, 0);
      const rd = rg.getImageData(0, 0, rm.width, rm.height).data;
      const count = new Map();
      for (let i = 0; i < rd.length; i += 4) if (rd[i + 3] > 128) { const k = (rd[i] << 16) | (rd[i + 1] << 8) | rd[i + 2]; count.set(k, (count.get(k) || 0) + 1); }
      const pal = [...count.entries()].filter(([, n]) => n > 12).map(([k]) => [k >> 16, (k >> 8) & 255, k & 255]);
      // drop the room's greens and terracotta: the sprites are stone and paper
      const stone = pal.filter(([r, g, b]) => !(g > r + 12 && g > b) && !(r > g + 40 && r > b + 40));
      for (const h of ["#1b2b5a", "#3f5cab", "#fffbe6", ...extra]) stone.push([1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
      // shrink by averaging, in steps, so thin lines survive
      const h = Math.round((img.height / img.width) * w);
      let cur = img, cw = img.width, ch = img.height;
      while (cw / 2 > w) {
        const c = document.createElement("canvas"); cw = Math.round(cw / 2); ch = Math.round(ch / 2); c.width = cw; c.height = ch;
        const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(cur, 0, 0, cw, ch); cur = c;
      }
      const c = document.createElement("canvas"); c.width = w + 2; c.height = h + 2;
      const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(cur, 1, 1, w, h);
      const d = g.getImageData(0, 0, w + 2, h + 2), p = d.data, W = w + 2, H = h + 2;
      const solid = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        if (p[i * 4 + 3] < 236) { p[i * 4 + 3] = 0; continue; }
        solid[i] = 1;
        // a little more contrast first, so faces and folds keep their lines
        const v = [0, 1, 2].map((k) => Math.max(0, Math.min(255, (p[i * 4 + k] - 128) * 1.18 + 128)));
        let best = 0, bd = 1e9;
        stone.forEach((q, j) => { const e = 0.3 * (q[0] - v[0]) ** 2 + 0.59 * (q[1] - v[1]) ** 2 + 0.11 * (q[2] - v[2]) ** 2; if (e < bd) (bd = e), (best = j); });
        p[i * 4] = stone[best][0]; p[i * 4 + 1] = stone[best][1]; p[i * 4 + 2] = stone[best][2]; p[i * 4 + 3] = 255;
      }
      // the outline, in the gap just outside the shape
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (solid[i]) continue;
        if ((x > 0 && solid[i - 1]) || (x < W - 1 && solid[i + 1]) || (y > 0 && solid[i - W]) || (y < H - 1 && solid[i + W])) { p[i * 4] = 0x3f; p[i * 4 + 1] = 0x5c; p[i * 4 + 2] = 0xab; p[i * 4 + 3] = 255; }
      }
      g.putImageData(d, 0, 0);
      return { url: c.toDataURL("image/png"), w: W, h: H };
    },
    b64(`public/art/${name}.png`), b64("public/art/study.png"), w, extra
  );
  writeFileSync(`public/art/px/${name}.png`, Buffer.from(res.url.split(",")[1], "base64"));
  sizes[name] = [res.w, res.h];
  console.log("wrote", name, res.w, res.h);
}
writeFileSync("components/sprite-sizes.json", JSON.stringify(sizes, null, 1) + "\n");
await browser.close();
