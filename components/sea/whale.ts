// The whale: a 2D pixel sprite, painted fresh for every step of a breach. Nothing is stored as an image.
//
// A real breach is not a dolphin's arc. The whale drives up out of the water at a steep angle until most of its
// body is clear, its tail still in the sea; it twists about its own length, throwing its flippers out; then it
// topples and comes down flat on its back or side. (After Whitehead's breach studies and NOAA's notes.)

export type WhaleSheet = { w: number; h: number; water: number; len: number };
/** the sheet a whale of this length needs: its size, and the row the sea sits at */
export const whaleSheet = (len: number): WhaleSheet => {
  const k = len / 64;
  return { w: Math.round(200 * k), h: Math.round(112 * k), water: Math.round(84 * k), len };
};
export const WHALE_LEAP = 3.1; // seconds from breaking the surface to going under
export const WHALE_TOTAL = WHALE_LEAP + 1.6; // the spray outlasts the whale

const INK = [27, 43, 90], BACK = [47, 74, 148], BACK_L = [85, 116, 194], BELLY = [220, 228, 245], GROOVE = [169, 189, 234], FOAM = [255, 249, 220], MIST = [197, 211, 240];
const rnd = (i: number) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
const ss = (e0: number, e1: number, v: number) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/** paint one moment. age is seconds since it broke the surface; the whale itself is gone after WHALE_LEAP */
export function paintWhale(ctx: CanvasRenderingContext2D, sheet: WhaleSheet, age: number) {
  const { w: W, h: H, water: WL, len: L } = sheet, K = L / 64, u = age / WHALE_LEAP;
  const img = ctx.createImageData(W, H), d = img.data;
  const put = (x: number, y: number, c: number[]) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  };
  const dot = (x: number, y: number, c: number[], r: number) => { for (let a = 0; a < r; a++) for (let b = 0; b < r; b++) put(x + a, y - b, c); };
  const x0 = 62 * K, drift = 46 * K;
  const waterX = (v: number) => x0 + drift * v; // where its body meets the surface
  if (u < 1) {
    const out = 0.82 * ss(0, 0.3, u); // how much of its length is clear of the water
    const th = (1.12 + 0.1 * ss(0.25, 0.45, u)) * (1 - ss(0.5, 0.84, u)) + 0.1 * (1 - ss(0.84, 1, u)); // steep, then toppling to flat
    const co = Math.cos(th), si = Math.sin(th);
    const sw = 0.5 - out; // the point along the body that sits at the waterline
    const sink = 20 * K * ss(0.84, 1, u) ** 2;
    const cx = waterX(u) - sw * L * co, cy = -sw * L * si - sink; // cy is height above the water
    const bow = -0.15 * ss(0, 0.2, u) + 0.75 * ss(0.3, 0.6, u) - 0.4 * ss(0.78, 0.9, u); // it arches backward as it hangs and falls
    const rs = ss(0.2, 0.58, u); // rolled onto its back
    const edge = 0.5 + 0.3 * K; // outline weight
    const half = (s: number) => {
      // half its thickness along the body, tail (-0.5) to nose (0.5)
      const k = [[-0.5, 1.2], [-0.4, 2.2], [-0.2, 5.2], [0.05, 8.6], [0.28, 9.4], [0.42, 7.6], [0.5, 3.4]];
      for (let i = 1; i < k.length; i++) if (s <= k[i][0]) { const f = (s - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return (k[i - 1][1] + (k[i][1] - k[i - 1][1]) * f) * K; }
      return 3 * K;
    };
    // a point on the whale: s along the body, n pixels toward its back; returned in sheet pixels
    const at = (s: number, n: number): [number, number] => {
      const lx = s * L, ly = n + bow * 13 * K * (4 * s * s - 0.35);
      return [cx + lx * co - ly * si, WL - (cy + lx * si + ly * co)];
    };
    const tailBeat = Math.sin(age * 11) * 2.2 * K * (1 - ss(0.2, 0.4, u));
    // The flippers are long, soft paddles, not planks. They trail back as the whale drives upward, are flung out
    // past square and swing back, and drag behind as it falls; along their length they bend, most at the tip.
    const fling = u > 0.5 ? 0.3 * Math.sin((u - 0.5) * 15) * Math.exp(-(u - 0.5) * 7) : 0;
    const open = ss(0.18, 0.5, u) + fling; // 0 laid back, 1 flung out
    const flipper = (side: number, far: boolean) => {
      // side -1 is the belly edge of a side-on whale, +1 the back edge; the far one only clears the body as it rolls
      const fa = side * (2.8 - open * 1.23), n = 26 * K;
      const curl = side * (0.95 * (1 - ss(0.12, 0.42, u)) - 0.85 * ss(0.58, 0.86, u)) + 0.22 * Math.sin(age * 6.5 + side * 1.3);
      let lx = 0.14 * L, ly = side < 0 ? -half(0.14) * (0.6 + 0.35 * rs) : half(0.14) * (-0.1 + 1.05 * rs);
      for (let k = 0; k < n; k += 0.5) {
        const f = k / n, ang = fa + curl * f ** 1.3;
        lx += 0.5 * Math.cos(ang); ly += 0.5 * Math.sin(ang);
        const wdt = K * (0.9 + 1.5 * Math.sin(Math.PI * Math.min(1, f ** 0.7))); // narrow at the root, broad in the middle, rounded at the tip
        for (let t = -wdt; t <= wdt; t += 0.5) {
          const [px, py] = at((lx - Math.sin(ang) * t) / L, ly + Math.cos(ang) * t);
          put(px, py, Math.abs(t) > wdt - edge || k > n - 1.5 ? INK : rs > 0.5 ? BELLY : far ? BACK_L : BACK);
        }
      }
    };
    flipper(1, true);
    // the small fin on its back, which shows while it is side on and turns away as it rolls
    if (rs < 0.6) for (let k = 0; k < 6 * K; k += 0.5) for (let t = 0; t <= (5 * K - k) * (1 - rs); t += 0.5) {
      const s = -0.2 - (k * 0.77) / L, [dx, dy] = at(s, half(s) + t);
      put(dx, dy, t >= (5 * K - k) * (1 - rs) - edge ? INK : BACK);
    }
    // tail flukes: two blades opening out behind the tail stock
    for (let k = 0; k < 13 * K; k += 0.5) for (const side of [-1, 1]) for (let t = 0; t < 4 * K; t += 0.5) {
      const droop = (k / (13 * K)) ** 2 * K * (3 * (1 - ss(0.1, 0.4, u)) - 3.5 * ss(0.6, 0.86, u));   // the blade tips trail, too
      const [fx, fy] = at(-0.5 - (k * 0.7) / L, side * (k * 0.95 + t * 0.6) + tailBeat * (k / (13 * K)) + droop);
      put(fx, fy, k > 11 * K || t < edge ? INK : BACK);
    }
    // the body, drawn as slices across the spine
    for (let s = -0.5; s <= 0.5; s += 0.5 / L) {
      const hh = half(s), beat = s < -0.2 ? tailBeat * ((-0.2 - s) / 0.3) ** 2 : 0;
      const belly = hh * (2 * (0.42 + 0.58 * rs)) - hh; // everything below this is belly; it grows as the whale rolls over
      for (let n = -hh; n <= hh; n += 0.5) {
        let c = n < belly ? BELLY : n > hh - 2.2 * K ? BACK_L : BACK;
        if (n < belly && s > -0.08 && s < 0.44 && Math.round(n / K) % 3 === 0 && n < belly - K) c = GROOVE; // the long throat grooves
        if (Math.abs(n) > hh - edge || s < -0.5 + edge / L || s > 0.5 - edge / L) c = INK;
        const [bx, by] = at(s, n + beat);
        put(bx, by, c);
      }
    }
    // The mouth: a long shallow curve along the jaw from the snout back to under the eye, with a small downturn
    // at its corner. Like the eye, it belongs to the whale's side, so both turn away as it rolls.
    if (rs < 0.55) {
      for (let s2 = 0.5 - (1.5 * K) / L; s2 > 0.23; s2 -= 0.5 / L) {
        const corner = Math.max(0, (0.27 - s2) / 0.04);
        for (let t = 0; t < Math.max(1, K * 0.7); t += 0.5) { const [mx, my] = at(s2, -half(s2) * 0.36 - corner * 1.6 * K - t); put(mx, my, INK); }
      }
      const [ex, ey] = at(0.25, half(0.25) * 0.02 + 0.5 * K);
      dot(ex, ey, FOAM, Math.max(1, Math.round(1.4 * K))); dot(ex - co * K, ey + si * K, INK, Math.max(1, Math.round(K)));
    }
    // The near flipper. Side on, it lies back along the chest; as the whale rolls belly-up it swings out to stand
    // square to the body on one side, and the far flipper (painted earlier, behind the body) does the same on the
    // other, so a rolled whale shows both.
    flipper(-1, false);
  }
  // nothing of the whale shows below the waterline
  for (let i = (WL + 1) * W * 4; i < d.length; i += 4) d[i + 3] = 0;
  // spray: a burst where it comes out, a bigger one where it lands, each a fan of drops that rise and fall
  const fan = (t: number, x: number, n: number, power: number, seed: number) => {
    if (t < 0 || t > 1.5) return;
    const big = Math.max(2, Math.round(1.6 * K));
    for (let i = 0; i < n * K; i++) {
      const a = (rnd(seed + i) - 0.5) * 2.4, sp = (0.35 + rnd(seed + i * 3 + 1)) * power, life = 0.6 + rnd(seed + i * 7 + 2) * 0.9;
      if (t > life) continue;
      const px = x + Math.sin(a) * sp * 34 * K * t, py = WL - (Math.cos(a) * sp * 62 * K * t - 70 * K * t * t);
      if (py > WL) continue;
      dot(px, py, rnd(seed + i * 5) > 0.35 ? FOAM : MIST, rnd(seed + i * 11) > 0.4 ? big : Math.max(1, big - 1));
    }
    // white water boiling at the surface, spreading out and thinning
    const wide = (10 + 34 * Math.min(1, t * 1.4) * power) * K;
    for (let i = 0; i < 170 * power * K * K; i++) {
      const fx = x + (rnd(seed + 900 + i) - 0.5) * 2 * wide, fy = WL - rnd(seed + 1300 + i + Math.floor(t * 12)) * 9 * K * (1 - t / 1.5);
      if (rnd(seed + 1700 + i) > t / 1.5) dot(fx, fy, i % 4 ? FOAM : MIST, 2);
    }
  };
  fan(age - 0.03 * WHALE_LEAP, waterX(0.03), 80, 0.95, 3); // bursting out
  fan(age - 0.84 * WHALE_LEAP, waterX(0.84) + L * 0.18, 150, 1.5, 77); // the whole body coming down flat
  fan(age - 0.86 * WHALE_LEAP, waterX(0.84) + L * 0.5, 110, 1.25, 191);
  ctx.putImageData(img, 0, 0);
}
