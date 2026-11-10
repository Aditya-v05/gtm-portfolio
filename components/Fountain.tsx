"use client";

import { useEffect, useRef } from "react";

// The source of the water: a marble statue on a plinth, pouring from an
// amphora into a basin. Drawn as real pixel art on a 60x110 grid: the
// silhouette is built from shapes, then shaded per pixel (light from the
// upper left, shade along every right and under edge) and outlined.
// The falling water itself is drawn by <Stream />, which reads this
// element's position. Grid coordinates used there: the amphora's mouth is at
// (6, 55), the basin's surface at y 86, and the water leaves under (8, 110).
export const FOUNTAIN_GRID = { w: 60, h: 110, mouth: [6, 55], basinY: 86, exit: [8, 110] } as const;

function draw(canvas: HTMLCanvasElement, night: boolean) {
  const W = FOUNTAIN_GRID.w, H = FOUNTAIN_GRID.h;
  const L = night ? "#a7abc9" : "#fffbe6";
  const M = night ? "#6c7298" : "#d9d2e0";
  const D = night ? "#4c5378" : "#a9b0d6";
  const O = night ? "#5a74b8" : "#3f5cab";
  const WATER = night ? "#34457a" : "#8aa5e0";

  // 1. silhouette, drawn with shapes on a scratch canvas
  const s = document.createElement("canvas");
  s.width = W;
  s.height = H;
  const c = s.getContext("2d", { willReadFrequently: true })!;
  c.fillStyle = "#000";
  c.strokeStyle = "#000";
  c.lineCap = "round";
  c.lineJoin = "round";
  const poly = (p: number[][]) => {
    c.beginPath();
    p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
  };
  const path = (p: number[][], w: number) => {
    c.lineWidth = w;
    c.beginPath();
    p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  };
  // plinth: cornice, die, base
  c.fillRect(22, 92, 34, 3);
  c.fillRect(24, 95, 30, 9);
  c.fillRect(20, 104, 38, 6);
  // drapery, torso, neck, head, hair bun
  poly([[34, 52], [46, 52], [49, 70], [52, 92], [28, 92], [31, 70]]);
  poly([[32, 34], [47, 34], [47, 44], [45, 53], [34, 53], [33, 44]]);
  c.fillRect(38, 29, 4, 6);
  c.beginPath();
  c.ellipse(39.5, 23.5, 5, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(45.5, 21, 3, 0, Math.PI * 2);
  c.fill();
  // arms, both reaching to the amphora
  path([[33, 37], [26, 46], [21, 44]], 4);
  path([[46, 37], [40, 48], [25, 50]], 4);
  // the amphora, tipped so its mouth points down and to the left
  c.save();
  c.translate(17, 45);
  c.rotate(-2.2);
  c.beginPath();
  c.ellipse(0, 0, 6, 8.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-2.5, -13, 5, 6);
  c.fillRect(-4, -15, 8, 2.4);
  c.fillRect(-1.5, 8, 3, 3);
  c.restore();
  // the basin on its stem
  poly([[0, 85], [16, 85], [13, 92], [3, 92]]);
  c.fillRect(6, 92, 4, 12);
  c.fillRect(3, 104, 10, 6);

  // 2. per-pixel shading and outline
  const a = c.getImageData(0, 0, W, H).data;
  const m = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && a[(y * W + x) * 4 + 3] > 110;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  const px = (x: number, y: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (m(x, y)) {
        let col = L;
        if (!m(x + 2, y) || !m(x, y + 1)) col = M;
        if (!m(x + 1, y)) col = D;
        px(x, y, col);
      } else if (m(x + 1, y) || m(x - 1, y) || m(x, y + 1) || m(x, y - 1)) px(x, y, O);
    }
  const line = (x0: number, y0: number, x1: number, y1: number, col: string) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      if (m(x, y)) px(x, y, col);
    }
  };
  // 3. details: folds of the drapery, belt, arm contours, hair, face, plinth
  line(37, 55, 34, 91, M);
  line(40, 55, 40, 91, M);
  line(43, 55, 47, 91, M);
  line(36, 62, 35, 80, D);
  line(44, 60, 46, 84, D);
  line(34, 53, 45, 53, D);
  line(34, 39, 28, 47, M);
  line(45, 40, 40, 50, D);
  line(40, 50, 26, 52, D);
  for (let y = 17; y < 23; y++) for (let x = 34; x < 46; x++) if (m(x, y) && (y < 20 || x > 41)) px(x, y, M);
  for (let y = 18; y < 25; y++) for (let x = 43; x < 49; x++) if (m(x, y)) px(x, y, M);
  px(36, 24, O);
  px(35, 27, D);
  line(22, 95, 55, 95, D);
  line(20, 104, 57, 104, D);
  line(26, 98, 51, 98, M);
  line(26, 101, 51, 101, M);
  // amphora bands
  line(13, 41, 21, 49, M);
  line(11, 44, 19, 52, D);
  // water standing in the basin
  ctx.fillStyle = WATER;
  ctx.fillRect(1, 86, 14, 2);
}

export default function Fountain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const paint = () => draw(cv, document.documentElement.dataset.theme === "dark");
    paint();
    window.addEventListener("themechange", paint);
    return () => window.removeEventListener("themechange", paint);
  }, []);
  return <canvas ref={ref} className="fountain" width={FOUNTAIN_GRID.w} height={FOUNTAIN_GRID.h} aria-hidden="true" />;
}
