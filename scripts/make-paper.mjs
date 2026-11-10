// Generates the notebook's crumpled art-paper sheets as WebP images.
//
// Crumpled paper is a surface of small flat facets meeting at sharp creases.
// We build it as a jittered triangle mesh: random points on a loose grid,
// each with a random height, split into triangles. Every facet is lit by one
// low side light (a desk lamp or a window), so its shade depends on which way
// it tilts. Two meshes, one coarse and one fine, are layered for big folds
// and small crinkles, and a little grain adds the art-paper tooth.
//
// Run: node scripts/make-paper.mjs [name]
// The user's own photographed paper can replace these later: drop images in
// public/paper/ with the same names.
import sharp from "sharp";

const W = 1400;
const H = 1400;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// one mesh layer: adds per-pixel shade into `acc`. With `tile` the mesh
// wraps around the edges, so the sheet repeats with no visible seam.
function mesh(acc, r, cellWanted, relief, flatCentre, tile) {
  const cols = Math.max(2, Math.round(W / cellWanted));
  const rows = Math.max(2, Math.round(H / cellWanted));
  const cw = W / cols, ch = H / rows;
  const base = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + (r() - 0.5) * 0.9) * cw;
      const y = (j + (r() - 0.5) * 0.9) * ch;
      // flatter in the middle, where text sits (cover only: breaks tiling)
      let edge = 1;
      if (!tile) {
        const dx = (x / W - 0.5) * 2, dy = (y / H - 0.5) * 2;
        edge = Math.min(1, flatCentre + (1 - flatCentre) * Math.hypot(dx, dy) * 0.85);
      }
      base.push([x, y, (r() - 0.5) * relief * cw * edge]);
    }
  }
  // vertex (i, j) for i in 0..cols, j in 0..rows, wrapping to the base grid
  const V = (i, j) => {
    const b = base[(j % rows) * cols + (i % cols)];
    return [b[0] + (i >= cols ? W : 0), b[1] + (j >= rows ? H : 0), b[2]];
  };
  // light from the upper left, fairly low
  const L = [-0.5, -0.62, 0.6];
  const ln = Math.hypot(...L);
  const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
  const flatLit = lz; // how a perfectly flat facet is lit
  const tri = (a, b, c) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const n = Math.hypot(nx, ny, nz) || 1;
    const shade = (nx * lx + ny * ly + nz * lz) / n - flatLit;
    const x0 = Math.floor(Math.min(a[0], b[0], c[0]));
    const x1 = Math.ceil(Math.max(a[0], b[0], c[0]));
    const y0 = Math.floor(Math.min(a[1], b[1], c[1]));
    const y1 = Math.ceil(Math.max(a[1], b[1], c[1]));
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (!d) return;
    for (let y = y0; y <= y1; y++) {
      const yy = ((y % H) + H) % H;
      for (let x = x0; x <= x1; x++) {
        const w1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / d;
        const w2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / d;
        const w3 = 1 - w1 - w2;
        if (w1 < 0 || w2 < 0 || w3 < 0) continue;
        const xx = ((x % W) + W) % W;
        acc[yy * W + xx] += shade;
      }
    }
  };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p00 = V(i, j), p10 = V(i + 1, j), p01 = V(i, j + 1), p11 = V(i + 1, j + 1);
      if (r() < 0.5) { tri(p00, p10, p11); tri(p00, p11, p01); }
      else { tri(p00, p10, p01); tri(p10, p11, p01); }
    }
  }
}

function sheet(seed, { coarse = 240, fine = 70, relief = 0.32, depth = 1, flatCentre = 0.5, tile = true }) {
  const r = rng(seed);
  const acc = new Float32Array(W * H);
  mesh(acc, r, coarse, relief, flatCentre, tile);
  mesh(acc, r, fine, relief * 0.7, flatCentre, tile);
  const out = Buffer.alloc(W * H * 3);
  const g = rng(seed * 31 + 5);
  for (let k = 0; k < W * H; k++) {
    const shade = Math.tanh(acc[k] * 2.2) * 0.07 * depth;
    const v = 0.975 + shade + (g() - 0.5) * 0.014;
    out[k * 3] = Math.max(0, Math.min(255, 252 * v));
    out[k * 3 + 1] = Math.max(0, Math.min(255, 249 * v));
    out[k * 3 + 2] = Math.max(0, Math.min(255, 242 * v));
  }
  return out;
}

const SHEETS = [
  ["sheet-1", 11, {}],
  ["sheet-2", 23, { coarse: 280, fine: 80 }],
  ["sheet-3", 37, { coarse: 220, fine: 60 }],
  ["sheet-4", 51, { coarse: 300, fine: 75 }],
  ["cover", 77, { coarse: 200, fine: 55, relief: 0.42, depth: 1.4, flatCentre: 0.8, tile: false }],
];

const only = process.argv[2];
for (const [name, seed, opts] of SHEETS) {
  if (only && only !== name) continue;
  const raw = sheet(seed, opts);
  await sharp(raw, { raw: { width: W, height: H, channels: 3 } })
    .webp({ quality: 80 })
    .toFile(`public/paper/${name}.webp`);
  console.log("wrote", name);
}
