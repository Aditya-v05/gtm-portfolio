// Trims the card artwork to the card itself. The cut-out cards keep a soft dark halo, stray slivers from the
// sheet they were cut from, and bits of the figures that spill past the frame. For each card this:
//   1. finds the orange frame and throws away everything outside it, with clean stepped corners
//   2. keeps the laurel that stands above the top edge
//   3. draws a hard edge round the card (a dark line, then the frame's own orange), so the cut is crisp on
//      the light page as well as the dark one
//   4. crops every card to the same margins, and notes where its name plate is (components/deck/plates.json),
//      so the project's name can be laid exactly over the god's
// Run it on freshly cut artwork (scripts/cut-art.mjs), not twice on the same files.
//   node scripts/trim-cards.mjs
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const DIR = "public/cards";
const TOP = 12; // rows kept above the frame, for the laurel
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
const plates = {};
for (const f of readdirSync(DIR).filter((n) => n.endsWith(".png"))) {
  const data = "data:image/png;base64," + readFileSync(`${DIR}/${f}`).toString("base64");
  const res = await page.evaluate(async (data, TOP, front) => {
    const img = new Image();
    img.src = data;
    await img.decode();
    const w = img.width, h = img.height;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, w, h), p = d.data;
    const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : p[(y * w + x) * 4 + 3]);
    // the frame's terracotta and its lighter face; never the dark ground or the halo
    const orange = (x, y) => { const i = (y * w + x) * 4; return p[i + 3] > 200 && p[i] > 150 && p[i] - p[i + 2] > 60 && p[i + 1] > 70; };
    const colRun = (x) => { let n = 0; for (let y = Math.round(h * 0.25); y < h * 0.75; y++) n += orange(x, y) ? 1 : 0; return n / (h * 0.5); };
    const rowRun = (y) => { let n = 0; for (let x = Math.round(w * 0.12); x < w * 0.88; x++) n += orange(x, y) ? 1 : 0; return n / (w * 0.76); };
    let l = 0, r = w - 1, t = 0, b = h - 1;
    while (l < w / 3 && colRun(l) < 0.7) l++;
    while (r > (2 * w) / 3 && colRun(r) < 0.7) r--;
    while (t < h / 3 && rowRun(t) < 0.45) t++;
    while (b > (2 * h) / 3 && rowRun(b) < 0.6) b--;
    // the frame's colour: the middle one of the left bar
    const bar = [];
    for (let y = Math.round(h * 0.3); y < h * 0.7; y += 3) { const i = (y * w + l + 2) * 4; bar.push([p[i], p[i + 1], p[i + 2]]); }
    bar.sort((a, c2) => a[0] + a[1] - c2[0] - c2[1]);
    const EDGE = bar[bar.length >> 1], INK = [42, 28, 20];

    // the card's shape: its frame box with corners cut in three-pixel steps
    const CH = 12, cx = (l + r) / 2, band = (r - l) * 0.19;
    const inside = (x, y) => {
      if (x < l || x > r || y < t || y > b) return false;
      const dx = Math.min(x - l, r - x), dy = Math.min(y - t, b - y);
      return Math.floor(dx / 3) * 3 + Math.floor(dy / 3) * 3 >= CH - 3;
    };
    const depth = (x, y) => { // how many pixels in from the card's edge, up to 5
      for (let k = 1; k <= 5; k++) if (!inside(x - k, y) || !inside(x + k, y) || !inside(x, y - k) || !inside(x, y + k) || !inside(x - k, y - k) || !inside(x + k, y - k) || !inside(x - k, y + k) || !inside(x + k, y + k)) return k;
      return 9;
    };
    const laurel = (x, y) => front && Math.abs(x - cx) < band && y < t + 8;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!inside(x, y)) {
        // the laurel may stand above the top edge, in the middle of the card
        if (!(laurel(x, y) && y >= t - TOP && p[i + 3] > 200)) p[i + 3] = 0;
        continue;
      }
      if (laurel(x, y)) continue; // leave the laurel and the gap in the frame under it alone
      const k = depth(x, y);
      if (k <= 5) { const col = k <= 2 ? INK : EDGE; p[i] = col[0]; p[i + 1] = col[1]; p[i + 2] = col[2]; p[i + 3] = 255; }
    }
    // the laurel's own halo above the frame: peel dark pixels off its outer edge
    for (let pass = 0; pass < 3 && front; pass++) {
      const kill = [];
      for (let y = Math.max(1, t - TOP); y < t; y++) for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (p[i + 3] === 0 || orange(x, y)) continue;
        if (!A(x - 1, y) || !A(x + 1, y) || !A(x, y - 1)) kill.push(i);
      }
      for (const i of kill) p[i + 3] = 0;
    }
    // the name plate: the pale bar near the foot of the card
    let plate = null;
    if (front) {
      const pale = (x, y) => { const i = (y * w + x) * 4; return p[i] > 225 && p[i + 1] > 165 && p[i + 2] > 95; };
      // judged at its two ends, clear of the lettering
      const W = r - l, ends = [];
      for (let x = Math.round(l + W * 0.17); x < l + W * 0.23; x++) ends.push(x, l + r - x);
      const rowPale = (y) => ends.filter((x) => pale(x, y)).length / ends.length;
      let y1 = b - 5, y0;
      while (y1 > b - 70 && rowPale(y1) < 0.7) y1--;
      y0 = y1;
      while (y0 > b - 90 && rowPale(y0 - 1) >= 0.7) y0--;
      const colPale = (x) => { let n = 0; for (let y = y0; y <= y1; y++) n += pale(x, y) ? 1 : 0; return n / (y1 - y0 + 1); };
      let x0 = l + 8, x1 = r - 8;
      while (x0 < cx && colPale(x0) < 0.6) x0++;
      while (x1 > cx && colPale(x1) < 0.6) x1--;
      plate = [x0 - 3, y0 - 3, x1 + 3, y1 + 3]; // out to the dark line round it
    }
    g.putImageData(d, 0, 0);
    const o = document.createElement("canvas");
    o.width = r - l + 1; o.height = b - t + 1 + TOP;
    o.getContext("2d").drawImage(c, l, t - TOP, o.width, o.height, 0, 0, o.width, o.height);
    const pc = (v, of) => +((v / of) * 100).toFixed(2);
    return {
      url: o.toDataURL("image/png"), size: [o.width, o.height],
      plate: plate && { left: pc(plate[0] - l, o.width), top: pc(plate[1] - t + TOP, o.height), width: pc(plate[2] - plate[0] + 1, o.width), height: pc(plate[3] - plate[1] + 1, o.height) },
    };
  }, data, TOP, f !== "back.png");
  writeFileSync(`${DIR}/${f}`, Buffer.from(res.url.split(",")[1], "base64"));
  if (res.plate) plates[f.replace(".png", "")] = res.plate;
  console.log(f.padEnd(14), res.size.join("x"), JSON.stringify(res.plate));
}
writeFileSync("components/deck/plates.json", JSON.stringify(plates, null, 2) + "\n");
await browser.close();
