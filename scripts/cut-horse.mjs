// Cuts the Trojan-horse About section's artwork out of the user's sheets.
// The sheets have a transparent background with a stray coloured fringe left
// by background removal, so each cut is cleaned: faint pixels and the
// saturated blue/cyan/red fringe are dropped, tiny specks are removed, and
// (where asked) only the largest connected shape is kept, which also strips
// the motion marks drawn round the horse and the poses.
//   node scripts/cut-horse.mjs
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";

const P = "art-src/aditya-poses.png", F = "art-src/horse-fx.png", T = "art-src/horse-items.png", H = "art-src/trojan-horse.png";
// [source, name, x, y, w, h, keep: "main" = largest shape only, "all" = everything bigger than a speck]
const CUTS = [
  [H, "horse", 0, 0, 1448, 1086, "main"],
  [P, "peek", 40, 170, 450, 330, "main"], [P, "fall", 490, 60, 480, 420, "main"], [P, "look", 1040, 20, 250, 470, "main"],
  [P, "wave", 130, 500, 320, 570, "main"], [P, "read", 570, 500, 290, 570, "main"], [P, "shrug", 1010, 500, 390, 570, "main"],
  [F, "bubble", 160, 100, 600, 340, "main"], [F, "tent", 810, 80, 500, 370, "main"], [F, "cloud", 90, 470, 450, 230, "all"],
  [F, "shake", 610, 500, 340, 190, "all"], [F, "burst", 1020, 470, 330, 190, "all"], [F, "papers", 110, 730, 700, 290, "all"], [F, "hatch", 840, 720, 500, 300, "main"],
  [T, "laptop", 80, 20, 430, 390, "main"], [T, "d20", 580, 70, 290, 300, "main"], [T, "book", 960, 50, 430, 380, "main"],
  [T, "headphones", 100, 410, 360, 350, "main"], [T, "stack", 500, 420, 430, 330, "main"], [T, "scroll", 980, 440, 420, 270, "main"],
  [T, "sheets", 30, 740, 510, 340, "main"], [T, "envelope", 580, 790, 350, 250, "main"], [T, "checklist", 1000, 770, 370, 290, "main"],
];
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
const sizes = {};
for (const [src, name, x, y, w, h, keep] of CUTS) {
  const res = await page.evaluate(
    async (data, x, y, w, h, keep) => {
      const img = new Image(); img.src = data; await img.decode();
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d"); g.drawImage(img, -x, -y);
      const d = g.getImageData(0, 0, w, h), p = d.data, ok = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const r = p[i * 4], gg = p[i * 4 + 1], b = p[i * 4 + 2], a = p[i * 4 + 3];
        const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
        // the fringe is near-pure blue, cyan, magenta or red: far more saturated than any of the art
        const fringe = mx > 150 && mn < 40 && mx - mn > 170;
        ok[i] = a > 200 && !fringe ? 1 : 0;
      }
      // connected shapes
      const id = new Int32Array(w * h), size = [0];
      for (let s = 0; s < w * h; s++) {
        if (!ok[s] || id[s]) continue;
        const n = size.length; let cnt = 0; const st = [s]; id[s] = n;
        while (st.length) { const k = st.pop(); cnt++; const px = k % w;
          for (const q of [px > 0 ? k - 1 : -1, px < w - 1 ? k + 1 : -1, k - w, k + w]) if (q >= 0 && q < w * h && ok[q] && !id[q]) (id[q] = n), st.push(q); }
        size.push(cnt);
      }
      const big = size.indexOf(Math.max(...size));
      let x0 = w, y0 = h, x1 = 0, y1 = 0;
      for (let i = 0; i < w * h; i++) {
        const on = ok[i] && (keep === "main" ? id[i] === big : size[id[i]] > 60);
        if (!on) { p[i * 4 + 3] = 0; continue; }
        p[i * 4 + 3] = 255;
        const px = i % w, py = (i / w) | 0;
        if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
      g.putImageData(d, 0, 0);
      const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
      o.getContext("2d").drawImage(c, -x0, -y0);
      return { url: o.toDataURL("image/png"), w: o.width, h: o.height, x0, y0 };
    },
    "data:image/png;base64," + readFileSync(src).toString("base64"), x, y, w, h, keep
  );
  writeFileSync(`public/horse/${name}.png`, Buffer.from(res.url.split(",")[1], "base64"));
  sizes[name] = [res.w, res.h];
  if (name === "horse") console.log("horse offset", x + res.x0, y + res.y0);
}
writeFileSync("components/horse-sizes.json", JSON.stringify(sizes, null, 1) + "\n");
console.log(JSON.stringify(sizes));
await browser.close();
