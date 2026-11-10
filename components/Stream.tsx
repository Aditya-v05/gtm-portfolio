"use client";

import { useEffect, useRef } from "react";
import { FOUNTAIN_GRID as FG } from "./Fountain";

// The water system. It is one body of water that changes form as it travels:
// it pours from the statue's amphora, drops into a stone catch basin, runs
// along a carved channel, steps down a stair of small pools (one of them
// turning a wheel), crosses the page in a second channel, and leaves by a
// spout into the sea.
//
// The water always sits inside stonework: every channel is a trough with a
// lip, an inner wall and a shadow under it, and every bend is a basin where
// the water pools before going on. Each form moves in its own way: channels
// drift a slow highlight, falls streak downward, pools barely shimmer. Foam
// appears only where water lands.
//
// It flows as the reader scrolls: the head of the water reaches only as far
// as the page has been read, and never runs back. One fixed canvas of 4px
// pixels, behind the content.

const CELL = 4;
type Piece =
  | { kind: "run"; x0: number; x1: number; y: number; dir: 1 | -1; start: number; len: number }
  | { kind: "fall"; x: number; y0: number; y1: number; start: number; len: number; foam: boolean; sea?: boolean }
  | { kind: "basin"; x: number; y: number; w: number; h: number; start: number; len: number; wheel?: boolean };

// uneven, hand-placed highlight clusters, so the surface never looks tiled
const GLINT = "..##......#....###........#..##...........#.....##....#.........###......#....";
const STREAK = ["#..#.#...#..#....#.#..", ".#....#.#...#..#....#.", "#.#..#....#..#.#..#..."];

export default function Stream() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pieces: Piece[] = [];
    let total = 0, front = 0, W = 0, H = 0;

    const build = () => {
      const f = document.querySelector<HTMLElement>(".fountain");
      const work = document.querySelector<HTMLElement>("#work");
      const end = document.querySelector<HTMLElement>("#contact");
      pieces = [];
      if (!f || !work || !end) return;
      const sy = window.scrollY, vw = window.innerWidth;
      const fr = f.getBoundingClientRect(), wr = work.getBoundingClientRect(), er = end.getBoundingClientRect();
      const k = fr.width / FG.w;
      const g = (v: number) => Math.round(v / CELL);
      let cost = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const add = (p: any) => {
        pieces.push({ ...p, start: cost } as Piece);
        cost += p.len;
      };
      const fall = (x: number, y0: number, y1: number, foam = true, sea = false) =>
        add({ kind: "fall", x, y0, y1, foam, sea, len: (y1 - y0) * CELL });
      const run = (x0: number, x1: number, y: number) =>
        add({ kind: "run", x0: Math.min(x0, x1), x1: Math.max(x0, x1), y, dir: x1 > x0 ? 1 : -1, len: Math.abs(x1 - x0) * CELL * 0.35 });
      const basin = (cx: number, y: number, w = 13, h = 7, wheel = false) => add({ kind: "basin", x: cx - (w >> 1), y, w, h, wheel, len: 60 });

      // 1. the pour, from the amphora's mouth into the statue's own bowl
      const mx = g(fr.left + FG.mouth[0] * k) - 1;
      fall(mx, g(fr.top + sy + FG.mouth[1] * k), g(fr.top + sy + FG.basinY * k), false);
      // 2. out under the bowl, down into the first catch basin
      const ex = g(fr.left + FG.exit[0] * k) - 1;
      const y1 = g(wr.top + sy + 30);
      fall(ex, g(fr.bottom + sy), y1);
      basin(ex + 1, y1);
      // 3. the carved channel, left to the head of the stair
      const xL = g(Math.max(40, (vw - 1120) / 2 - 70));
      run(ex - 6, xL + 7, y1 + 2);
      basin(xL, y1);
      // 4. the stair of pools beside the work
      const y2 = g(wr.bottom + sy - 70);
      const step = 46; // cells between pools
      let x = xL, y = y1, side: 1 | -1 = 1, n = 0;
      while (y + step * 1.6 < y2) {
        // spill over the lip on one side, fall to the next pool
        const fx = x + side * 5;
        fall(fx, y + 3, y + step);
        y += step;
        x = fx + side * 3;
        basin(x, y, 13, 7, n === 1);
        side = side === 1 ? -1 : 1;
        n++;
      }
      fall(x + side * 5, y + 3, y2);
      x = x + side * 5;
      basin(x + 1, y2);
      // 5. the lower channel across the page, to the outlet
      const xE = g(vw > 900 ? vw * 0.9 : vw - 34);
      run(x + 8, xE - 6, y2 + 2);
      basin(xE, y2, 11, 7);
      // 6. the spout, and the last fall into the sea
      fall(xE, y2 + 6, g(er.top + sy + er.height * 0.95), true, true);
      total = cost;
    };

    const size = () => {
      W = Math.ceil(window.innerWidth / CELL);
      H = Math.ceil(window.innerHeight / CELL) + 1;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W * CELL}px`;
      canvas.style.height = `${H * CELL}px`;
      build();
    };

    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !pieces.length) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const sy = window.scrollY;
      const reach = (sy + window.innerHeight * 0.78) / CELL;
      let target = 0;
      for (const p of pieces) {
        const top = p.kind === "fall" ? p.y0 : p.y;
        if (top <= reach) target = p.kind === "fall" ? p.start + Math.min(1, (reach - p.y0) / Math.max(1, p.y1 - p.y0)) * p.len : p.start + p.len;
      }
      front = reduced ? Math.max(front, target) : Math.max(front, Math.min(target, front + dt * 1300));
      // slow loops: channels step every 260ms, falls every 90ms, pools every 700ms
      const tRun = reduced ? 0 : Math.floor(now / 260);
      const tFall = reduced ? 0 : Math.floor(now / 90);
      const tPool = reduced ? 0 : Math.floor(now / 700);

      const night = document.documentElement.dataset.theme === "dark";
      // four water tones, three stone tones
      const HI = night ? "#b9c8f2" : "#f2f6ff", MID = night ? "#6f86c8" : "#a9c4f2", BASE = night ? "#4660a8" : "#6f8ed4", SHADE = night ? "#2f4384" : "#4a63b0";
      const S1 = night ? "#6c7298" : "#f6ead9", S2 = night ? "#4c5378" : "#dcc7a8", S3 = night ? "#343a5c" : "#b89f7c", DRY = night ? "#2a3052" : "#cbb592";
      const off = sy % CELL, top = (sy - off) / CELL;
      canvas.style.transform = `translateY(${-off}px)`;
      ctx.clearRect(0, 0, W, H);
      const p = (x: number, y: number, w: number, h: number, col: string) => {
        ctx.fillStyle = col;
        ctx.fillRect(x, y - top, w, h);
      };
      const vis = (y0: number, y1: number) => y1 - top > -4 && y0 - top < H + 4;

      for (const pc of pieces) {
        const wet = Math.min(1, Math.max(0, (front - pc.start) / pc.len));
        if (pc.kind === "run") {
          if (!vis(pc.y - 1, pc.y + 5)) continue;
          const n = pc.x1 - pc.x0;
          // the trough: lip, inner wall, floor, and its shadow on the page
          p(pc.x0, pc.y - 1, n, 1, S1);
          p(pc.x0, pc.y, n, 3, DRY);
          p(pc.x0, pc.y + 3, n, 1, S2);
          p(pc.x0, pc.y + 4, n, 1, S3);
          const wn = Math.round(n * wet);
          const wx = pc.dir > 0 ? pc.x0 : pc.x1 - wn;
          if (wn > 0) {
            p(wx, pc.y, wn, 1, MID);
            p(wx, pc.y + 1, wn, 1, BASE);
            p(wx, pc.y + 2, wn, 1, SHADE);
            // a slow drift of highlight along the surface
            for (let i = 0; i < wn; i++) {
              const gx = wx + i;
              const s = (((gx * pc.dir - tRun) % GLINT.length) + GLINT.length) % GLINT.length;
              if (GLINT[s] === "#") p(gx, pc.y, 1, 1, HI);
              else if (GLINT[(s + 31) % GLINT.length] === "#") p(gx, pc.y + 1, 1, 1, MID);
            }
            // the leading edge, while the water is still arriving
            if (wet < 1) p(pc.dir > 0 ? wx + wn - 1 : wx, pc.y, 1, 3, HI);
          }
        } else if (pc.kind === "fall") {
          if (!vis(pc.y0, pc.y1 + 3)) continue;
          const n = pc.y1 - pc.y0;
          const wn = Math.round(n * wet);
          if (wn <= 0) continue;
          for (let i = 0; i < wn; i++) {
            const y = pc.y0 + i;
            if (y - top < -2 || y - top > H) continue;
            for (let c = 0; c < 3; c++) {
              const st = STREAK[c];
              const on = st[(((i - tFall) % st.length) + st.length) % st.length] === "#";
              p(pc.x + c, y, 1, 1, on ? HI : c === 1 ? MID : BASE);
            }
          }
          if (wet >= 1 && pc.foam) {
            // foam only where the water lands
            const y = pc.y1;
            const a = tFall % 3;
            p(pc.x - 1 + (a === 0 ? 0 : 1), y - 1, 2, 1, HI);
            p(pc.x + 2 - (a === 2 ? 1 : 0), y - 2, 2, 1, HI);
            if (pc.sea) for (let i = 0; i < 7; i++) p(pc.x - 6 + ((i * 5 + a * 3) % 15), y - ((i + a) % 3), 2, 1, HI);
          }
        } else {
          if (!vis(pc.y - 1, pc.y + pc.h + 2)) continue;
          // a stone basin: rim, wall, and its shadow
          p(pc.x, pc.y, pc.w, pc.h, S2);
          p(pc.x, pc.y, pc.w, 1, S1);
          p(pc.x, pc.y, 1, pc.h, S1);
          p(pc.x, pc.y + pc.h - 1, pc.w, 1, S3);
          p(pc.x + 1, pc.y + pc.h, pc.w, 1, S3);
          p(pc.x + 2, pc.y + 2, pc.w - 4, pc.h - 4, DRY);
          if (wet > 0) {
            // the pool fills from the bottom; pooled water is darker and almost still
            const ih = pc.h - 4, fill = Math.max(1, Math.round(ih * wet));
            const iy = pc.y + 2 + ih - fill;
            p(pc.x + 2, iy, pc.w - 4, fill, BASE);
            p(pc.x + 2, iy, pc.w - 4, 1, MID);
            if (fill > 2) {
              p(pc.x + 4, iy + 1, 3, 1, SHADE);
              p(pc.x + pc.w - 7, iy + 2, 2, 1, SHADE);
            }
            p(pc.x + 3 + (tPool % 2) * 4, iy, 2, 1, HI);
          }
          if (pc.wheel) {
            // a small wheel turned by the fall above it
            const cx = pc.x - 7, cy = pc.y - 5;
            const a = wet > 0 ? tRun % 2 : 0;
            p(cx - 4, cy - 4, 9, 9, S3);
            p(cx - 3, cy - 3, 7, 7, night ? "#0f1630" : "#fbf1c4");
            if (a === 0) {
              p(cx - 4, cy, 9, 1, S3);
              p(cx, cy - 4, 1, 9, S3);
            } else {
              for (let i = -3; i <= 3; i++) {
                p(cx + i, cy + i, 1, 1, S3);
                p(cx + i, cy - i, 1, 1, S3);
              }
            }
            p(cx - 1, cy - 1, 3, 3, S2);
          }
        }
      }
    };

    size();
    const ro = new ResizeObserver(build);
    ro.observe(document.body);
    window.addEventListener("resize", size);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", size);
    };
  }, []);

  return <canvas ref={ref} className="stream" aria-hidden="true" />;
}
