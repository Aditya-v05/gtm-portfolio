// Trims the card artwork to the card itself. The cut-out cards keep a soft dark halo, stray slivers from the
// sheet they were cut from, and bits of the figures that spill past the frame. This finds each card's orange
// frame, throws away everything outside it (following the frame's own chamfered corners), keeps the laurel that
// stands above the top edge, and crops every card to the same margins so they all sit alike in a row.
// Safe to run again. Uses the installed Chrome (no image library).
//   node scripts/trim-cards.mjs
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const DIR = "public/cards";
const TOP = 12; // rows kept above the frame, for the laurel
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
for (const f of readdirSync(DIR).filter((n) => n.endsWith(".png"))) {
  const data = "data:image/png;base64," + readFileSync(`${DIR}/${f}`).toString("base64");
  const res = await page.evaluate(async (data, TOP, laurel) => {
    const img = new Image();
    img.src = data;
    await img.decode();
    const w = img.width, h = img.height;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, w, h), p = d.data;
    const A = (x, y) => p[(y * w + x) * 4 + 3];
    // the frame's terracotta and its lighter face; never the dark ground or the halo
    const orange = (x, y) => { const i = (y * w + x) * 4; return p[i + 3] > 200 && p[i] > 150 && p[i] - p[i + 2] > 60 && p[i + 1] > 70; };
    const colRun = (x) => { let n = 0; for (let y = Math.round(h * 0.25); y < h * 0.75; y++) n += orange(x, y) ? 1 : 0; return n / (h * 0.5); };
    const rowRun = (y) => { let n = 0; for (let x = Math.round(w * 0.12); x < w * 0.88; x++) n += orange(x, y) ? 1 : 0; return n / (w * 0.76); };
    let l = 0, r = w - 1, t = 0, b = h - 1;
    while (l < w / 3 && colRun(l) < 0.7) l++;
    while (r > (2 * w) / 3 && colRun(r) < 0.7) r--;
    while (t < h / 3 && rowRun(t) < 0.45) t++;
    while (b > (2 * h) / 3 && rowRun(b) < 0.6) b--;
    // corners: follow the frame's own chamfer, row by row
    const CZ = 16;
    for (let y = 0; y < h; y++) {
      let x0 = l, x1 = r;
      if (y < t || y > b) { x0 = w; x1 = -1; }
      else if (y < t + CZ || y > b - CZ) {
        while (x0 < l + CZ && !orange(x0, y)) x0++;
        while (x1 > r - CZ && !orange(x1, y)) x1--;
      }
      for (let x = 0; x < w; x++) {
        if (x >= x0 && x <= x1) continue;
        // the laurel may stand above the top edge, in the middle of the card
        if (laurel && y < t && y >= t - TOP && Math.abs(x - (l + r) / 2) < (r - l) * 0.2 && A(x, y) > 200) continue;
        p[(y * w + x) * 4 + 3] = 0;
      }
    }
    // the laurel's own halo: peel dark pixels off its outer edge
    for (let pass = 0; pass < 3 && laurel; pass++) {
      const kill = [];
      for (let y = Math.max(1, t - TOP); y < t; y++) for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (p[i + 3] === 0 || orange(x, y)) continue;
        if (!A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1)) kill.push(i);
      }
      for (const i of kill) p[i + 3] = 0;
    }
    g.putImageData(d, 0, 0);
    const o = document.createElement("canvas");
    o.width = r - l + 1; o.height = b - t + 1 + TOP;
    o.getContext("2d").drawImage(c, l, t - TOP, o.width, o.height, 0, 0, o.width, o.height);
    return { url: o.toDataURL("image/png"), box: [l, t, r, b], size: [o.width, o.height] };
  }, data, TOP, f !== "back.png");
  writeFileSync(`${DIR}/${f}`, Buffer.from(res.url.split(",")[1], "base64"));
  console.log(f.padEnd(14), "frame", res.box.join(","), "->", res.size.join("x"), (res.size[0] / res.size[1]).toFixed(4));
}
await browser.close();
