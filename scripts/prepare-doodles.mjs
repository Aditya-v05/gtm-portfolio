// Cuts the user's ballpoint doodles out of photographed sheets and saves each
// as an alpha mask in public/doodles/<name>.png. The page paints the mask
// with the theme's ink colour (CSS mask-image), so the real pen streaks and
// pressure survive as transparency, and the doodles recolour for the lamp
// theme. Ink is found by blueness, not darkness, which ignores shadows,
// folds and printed text showing through from the back of the page.
//
// Run: node scripts/prepare-doodles.mjs [--sheet]
// Boxes are in the coordinates of the sheet after `turn` is applied.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SHEETS = {
  "sheet-01": { file: "assets-src/doodles/sheet-01.png", turn: 90 },
};

// [name, sheet, x, y, w, h, rotate]
const DOODLES = [
  ["skeletron", "sheet-01", 99, 70, 308, 175, 0],
  ["cat-box", "sheet-01", 576, 17, 128, 146, 180],
  ["mushroom-head", "sheet-01", 919, 110, 99, 105, 0],
  ["eye-veins", "sheet-01", 151, 265, 116, 116, 0],
  ["grin-monster", "sheet-01", 370, 254, 145, 128, 180],
  ["cat-dragon", "sheet-01", 675, 175, 140, 151, 180],
  ["bill-cipher", "sheet-01", 983, 366, 111, 93, 180],
  ["one-up", "sheet-01", 733, 401, 116, 58, 180],
  ["box-robot", "sheet-01", 64, 471, 81, 87, 0],
  ["bat", "sheet-01", 477, 488, 64, 41, 0],
  ["eye-of-cthulhu", "sheet-01", 175, 558, 209, 134, 0],
  ["eater-of-worlds", "sheet-01", 576, 529, 221, 111, 0],
  ["shark", "sheet-01", 977, 541, 186, 87, 0],
  ["lemon-head", "sheet-01", 163, 704, 128, 111, 0],
  ["crown-guy", "sheet-01", 489, 692, 81, 105, 0],
  ["plantera-hooks", "sheet-01", 809, 698, 180, 105, 0],
];

const contact = process.argv.includes("--sheet");
mkdirSync("public/doodles", { recursive: true });

async function mask(name, sheetKey, x, y, w, h, rot) {
  const s = SHEETS[sheetKey];
  const pad = 6;
  const img = sharp(s.file).rotate(s.turn).extract({
    left: Math.max(0, x - pad),
    top: Math.max(0, y - pad),
    width: w + pad * 2,
    height: h + pad * 2,
  });
  const turned = await sharp(await img.png().toBuffer()).rotate(rot).resize({ width: (rot % 180 ? h : w) * 2 + pad * 4, kernel: "lanczos3" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = turned;
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    // ballpoint ink is strongly blue; paper, shadow and show-through are not
    const blue = b - (r + g) / 2;
    let a = (blue - 15) * 4.2;
    a = Math.max(0, Math.min(255, a));
    out[i * 4] = 40; out[i * 4 + 1] = 44; out[i * 4 + 2] = 140; out[i * 4 + 3] = a;
  }
  const png = sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 1 }).png();
  return png;
}

if (contact) {
  const tiles = [];
  for (const d of DOODLES) {
    const buf = await (await mask(...d)).resize({ width: 220, height: 160, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
    tiles.push(buf);
  }
  const cols = 4;
  await sharp({ create: { width: 240 * cols, height: 190 * Math.ceil(tiles.length / cols), channels: 4, background: "#ffffff" } })
    .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * 240 + 10, top: Math.floor(i / cols) * 190 + 10 })))
    .png()
    .toFile(process.argv[process.argv.indexOf("--sheet") + 1] || "doodles-contact.png");
  console.log("contact sheet written");
} else {
  // sizes go in a manifest so the page can reserve each doodle's space
  const manifest = {};
  for (const d of DOODLES) {
    const info = await (await mask(...d)).toFile(`public/doodles/${d[0]}.png`);
    manifest[d[0]] = { w: info.width, h: info.height };
  }
  writeFileSync("components/notebook/doodles.json", JSON.stringify(manifest, null, 2) + "\n");
  console.log("wrote", DOODLES.length, "doodles");
}
