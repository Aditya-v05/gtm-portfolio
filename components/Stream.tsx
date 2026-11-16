"use client";

import { useEffect, useRef } from "react";
import { FOUNTAIN_GRID as FG } from "./Fountain";
import { seaHorizon } from "@/lib/horizon";

// The water system. It is one body of water that changes form as it travels:
// it leaves the statue's basin, drops into a stone catch basin, runs along a
// carved channel, steps down a stair of small pools (one of them turning a
// wheel), and finally spills onto the aqueduct of the closing scene, which
// carries it out to the harbour.
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
  | { kind: "fall"; x: number; y0: number; y1: number; start: number; len: number; foam: boolean; sea?: boolean; open?: number }
  | { kind: "basin"; x: number; y: number; w: number; h: number; start: number; len: number; wheel?: boolean };

// uneven, hand-placed highlight clusters, so the surface never looks tiled
const GLINT = "..##......#....###........#..##...........#.....##....#.........###......#....";

export default function Stream() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pieces: Piece[] = [];
    let total = 0, front = 0, W = 0, H = 0, wallStart = 0;
    let agora: HTMLElement | null = null;

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
      // open: the row where the stone chute ends and the water falls free
      const fall = (x: number, y0: number, y1: number, foam = true, sea = false, open?: number) =>
        add({ kind: "fall", x, y0, y1, foam, sea, open, len: (y1 - y0) * CELL });
      const run = (x0: number, x1: number, y: number) =>
        add({ kind: "run", x0: Math.min(x0, x1), x1: Math.max(x0, x1), y, dir: x1 > x0 ? 1 : -1, len: Math.abs(x1 - x0) * CELL * 0.35 });
      const basin = (cx: number, y: number, w = 17, h = 8, wheel = false) => add({ kind: "basin", x: cx - (w >> 1), y, w, h, wheel, len: 60 });

      // 2. out under the bowl and down onto the agora wall. The wall itself
      //    carries the water along a channel in its top course (drawn by the
      //    wall, in CSS) and lets it out at its left end.
      const ex = g(fr.left + FG.exit[0] * k) - 1;
      agora = document.querySelector<HTMLElement>(".agora");
      const ar = (agora ?? work).getBoundingClientRect();
      const y1 = g(ar.top + sy + 6);
      // where the water lands on the wall: under the statue, or the wall's right end
      const xin = Math.min(ex, g(ar.right) - 14);
      const clay = document.querySelector<HTMLElement>(".clay");
      if (clay) {
        // the water goes round the clay plaque: a basin above it, a channel
        // out past its right end, a fall down beside it, and a channel back
        const cr = clay.getBoundingClientRect();
        const yA = g(cr.top + sy) - 14, yB = g(cr.bottom + sy) + 8;
        const xP = g(cr.right) + 9;
        fall(ex, g(fr.bottom + sy) - 1, yA);
        basin(ex + 1, yA);
        run(ex + 8, xP - 6, yA + 2);
        basin(xP, yA);
        fall(xP, yA + 6, yB);
        basin(xP, yB);
        run(xP - 7, xin + 8, yB + 2);
        basin(xin + 1, yB);
        fall(xin, yB + 6, y1, false);
      } else fall(ex, g(fr.bottom + sy) - 1, y1, false);
      wallStart = cost;
      cost += Math.max(0, xin - g(ar.left)) * CELL * 0.35;
      agora?.style.setProperty("--inlet", `${xin * CELL - ar.left + 12}px`);
      // 3. out of the wall's left end, into the basin at the head of the stair
      const xL = g(Math.max(40, (vw - 1120) / 2 - 70));
      run(g(ar.left) + 2, xL + 7, y1 + 2);
      basin(xL, y1);
      // 4. a stair of pools down the left, beside the client wall
      const step = 46; // cells between pools
      let x = xL, y = y1, side: 1 | -1 = 1, n = 0;
      const stair = (yEnd: number) => {
        while (y + step * 1.6 < yEnd) {
          // spill over the lip on one side, fall to the next pool
          const fx = x + side * 5;
          fall(fx, y + 3, y + step);
          y += step;
          x = fx + side * 3;
          basin(x, y, 17, 8, n === 1);
          side = side === 1 ? -1 : 1;
          n++;
        }
      };
      const yW = g(wr.top + sy + 24);
      stair(yW);
      // 5. at the head of the work the water changes sides: a last drop into a
      //    basin, then a channel right across the page
      fall(x + side * 5, y + 3, yW);
      x += side * 5;
      basin(x + 1, yW);
      const xR = W - xL - 2;
      run(x + 8, xR - 6, yW + 2);
      basin(xR, yW);
      x = xR;
      y = yW;
      side = W - xR > 20 ? 1 : -1; // step outward, away from the cards, when there is room
      // 6. a second stair down the right, beside the cards
      stair(g(wr.bottom + sy - 70));
      // 7. the last pool spills over and falls into the sea of the closing scene
      // it lands just below the horizon, where the sea in front hides the foot of the fall
      // the chute ends in a spout at the top of the closing scene; from there the water falls free through the sky
      fall(x + side * 5, y + 3, g(er.top + sy + seaHorizon(end) + 26), true, true, g(er.top + sy) + 10);
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

    let raf = 0, last = performance.now(), drawn = "", wet = false, shift = -1;
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
      const nowWet = front >= wallStart && wallStart > 0;
      if (nowWet !== wet) agora?.classList.toggle("is-wet", (wet = nowWet));
      // slow loops: channels step every 260ms, falls every 90ms, pools every 700ms
      const tRun = reduced ? 0 : Math.floor(now / 260);
      const tFall = reduced ? 0 : Math.floor(now / 90);
      const tPool = reduced ? 0 : Math.floor(now / 700);

      const night = document.documentElement.dataset.theme === "dark";
      // The picture only changes when the page moves, the water advances, one of the slow loops steps or the
      // theme flips. Otherwise there is nothing to repaint, and most frames end here.
      const key = `${sy}|${front}|${tRun}|${tFall}|${tPool}|${night}|${W}|${H}|${pieces.length}`;
      if (key === drawn) return;
      drawn = key;
      // four water tones, three stone tones
      const HI = night ? "#b9c8f2" : "#f2f6ff", MID = night ? "#6f86c8" : "#a9c4f2", BASE = night ? "#4660a8" : "#6f8ed4", SHADE = night ? "#2f4384" : "#4a63b0";
      const S1 = night ? "#6c7298" : "#f6ead9", S2 = night ? "#4c5378" : "#dcc7a8", S3 = night ? "#343a5c" : "#b89f7c", DRY = night ? "#2a3052" : "#cbb592";
      const off = sy % CELL, top = (sy - off) / CELL;
      if (off !== shift) canvas.style.transform = `translateY(${-(shift = off)}px)`;
      ctx.clearRect(0, 0, W, H);
      const p = (x: number, y: number, w: number, h: number, col: string) => {
        ctx.fillStyle = col;
        ctx.fillRect(x, y - top, w, h);
      };
      const vis = (y0: number, y1: number) => y1 - top > -4 && y0 - top < H + 4;

      const hsh = (i: number, j: number) => {
        let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263)) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
      };
      const BACK = night ? "#1a2040" : "#a48a66"; // the shadowed back of a recess
      const wetOf = (pc: Piece) => Math.min(1, Math.max(0, (front - pc.start) / pc.len));

      // Four passes, so stone always sits behind water: the chutes that falls run down, then the troughs,
      // then the basins, and last the falling water itself, which spills over a basin's lip and lands in the next.

      // 1. chutes: a slot recessed into a stone pier, with a lit wall, a shadowed wall and course joints
      for (const pc of pieces) {
        if (pc.kind !== "fall" || !vis(pc.y0, pc.y1 + 3)) continue;
        const end = Math.min(pc.y1, pc.open ?? pc.y1);
        for (let y = Math.max(pc.y0, top - 2); y < Math.min(end, top + H + 2); y++) {
          const joint = y % 7 === 0;
          p(pc.x - 3, y, 1, 1, joint ? S2 : S1);
          p(pc.x - 2, y, 1, 1, joint ? S3 : S2);
          p(pc.x - 1, y, 5, 1, BACK);
          p(pc.x + 4, y, 1, 1, joint ? S3 : S2);
          p(pc.x + 5, y, 1, 1, S3);
          if (joint && hsh(y, pc.x) > 0.5) p(pc.x - 1, y, 5, 1, S3); // a darker course across the back, here and there
        }
        if (pc.open !== undefined && vis(pc.open - 2, pc.open + 3)) {
          // the spout: a stone lip the chute ends in
          p(pc.x - 4, pc.open - 1, 11, 1, S1);
          p(pc.x - 4, pc.open, 11, 2, S2);
          p(pc.x - 3, pc.open + 2, 9, 1, S3);
          p(pc.x - 1, pc.open, 5, 3, BACK);
        }
      }

      // 2. troughs: lip, water, floor, a joint between stones and a bracket under every so often
      for (const pc of pieces) {
        if (pc.kind !== "run" || !vis(pc.y - 1, pc.y + 7)) continue;
        const wet = wetOf(pc), n = pc.x1 - pc.x0;
        p(pc.x0, pc.y - 1, n, 1, S1);
        p(pc.x0, pc.y, n, 3, DRY);
        p(pc.x0, pc.y + 3, n, 1, S2);
        p(pc.x0, pc.y + 4, n, 1, S3);
        for (let gx = pc.x0 + 5; gx < pc.x1 - 2; gx += 11) {
          p(gx, pc.y - 1, 1, 1, S2);
          p(gx, pc.y + 3, 1, 1, S3);
          if (((gx - pc.x0 - 5) / 11) % 2 === 0) {
            p(gx - 1, pc.y + 5, 3, 1, S3);
            p(gx, pc.y + 6, 1, 1, S3);
          }
        }
        const wn = Math.round(n * wet);
        const wx = pc.dir > 0 ? pc.x0 : pc.x1 - wn;
        if (wn > 0) {
          p(wx, pc.y, wn, 1, MID);
          p(wx, pc.y + 1, wn, 1, BASE);
          p(wx, pc.y + 2, wn, 1, SHADE);
          for (let i = 0; i < wn; i++) {
            const gx = wx + i;
            // highlights drift with the flow, and a slower swell passes through under them
            const s = (((gx * pc.dir - tRun) % GLINT.length) + GLINT.length) % GLINT.length;
            if (GLINT[s] === "#") p(gx, pc.y, 1, 1, HI);
            else if (GLINT[(s + 31) % GLINT.length] === "#") p(gx, pc.y + 1, 1, 1, MID);
            const sw = (((gx * pc.dir - tPool * 3) % 23) + 23) % 23;
            if (sw < 4) p(gx, pc.y + 2, 1, 1, BASE);
          }
          if (wet < 1) p(pc.dir > 0 ? wx + wn - 1 : wx, pc.y, 1, 3, HI);
        }
      }

      // 3. basins: a stone bowl on a corbel
      for (const pc of pieces) {
        if (pc.kind !== "basin" || !vis(pc.y - 10, pc.y + pc.h + 4)) continue;
        const wet = wetOf(pc);
        p(pc.x, pc.y, pc.w, pc.h, S2);
        p(pc.x, pc.y, pc.w, 1, S1);
        p(pc.x, pc.y, 1, pc.h, S1);
        p(pc.x + pc.w - 1, pc.y + 1, 1, pc.h - 1, S3);
        p(pc.x, pc.y + pc.h - 1, pc.w, 1, S3);
        p(pc.x + 3, pc.y + pc.h, pc.w - 6, 1, S3);
        p(pc.x + 5, pc.y + pc.h + 1, pc.w - 10, 1, S3);
        p(pc.x + 2, pc.y + 2, pc.w - 4, pc.h - 4, BACK);
        if (wet > 0) {
          // the pool fills from the bottom; pooled water is darker and almost still
          const ih = pc.h - 4, fill = Math.max(1, Math.round(ih * wet));
          const iy = pc.y + 2 + ih - fill;
          p(pc.x + 2, iy, pc.w - 4, fill, BASE);
          p(pc.x + 2, iy, pc.w - 4, 1, MID);
          if (fill > 2) {
            p(pc.x + 4, iy + 2, 4, 1, SHADE);
            p(pc.x + pc.w - 8, iy + 3, 3, 1, SHADE);
            p(pc.x + 3, iy + fill - 1, pc.w - 6, 1, SHADE);
          }
          p(pc.x + 3 + (tPool % 3) * 4, iy, 2, 1, HI);
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

      // 4. falling water: a sheet five cells wide whose edges break up, streaks of different lengths dropping
      //    faster down the middle than at the sides, and a burst where it lands
      const SPD = [1, 2, 3, 2, 1], LEN = [7, 5, 9, 6, 8];
      for (const pc of pieces) {
        if (pc.kind !== "fall" || !vis(pc.y0, pc.y1 + 3)) continue;
        const wet = wetOf(pc), n = pc.y1 - pc.y0, wn = Math.round(n * wet);
        if (wn <= 0) continue;
        for (let i = Math.max(0, top - 2 - pc.y0); i < Math.min(wn, top + H + 2 - pc.y0); i++) {
          const y = pc.y0 + i, free = pc.open !== undefined && y > pc.open + 2;
          for (let c = 0; c < 5; c++) {
            const pos = i - tFall * SPD[c], seg = Math.floor(pos / LEN[c]), into = pos - seg * LEN[c];
            const r = hsh(seg, c * 17 + pc.x);
            if ((c === 0 || c === 4) && hsh(seg, c * 31 + pc.x + 7) < (free ? 0.6 : 0.38)) continue; // the sheet's ragged edge
            p(pc.x - 1 + c, y, 1, 1, r > 0.5 && into < 2 + r * 4 ? HI : r < 0.18 && into < 3 ? SHADE : c === 0 || c === 4 ? BASE : MID);
          }
          // in free fall the sheet throws off drops to either side
          if (free && hsh(i - tFall * 2, pc.x + 3) > 0.9) p(pc.x - 3 + Math.floor(hsh(i, 5) * 2) * 8, y, 1, 1, MID);
        }
        if (wet < 1) p(pc.x, pc.y0 + wn - 2, 3, 2, HI); // the head of the water, on its way down
        if (wet >= 1 && pc.foam) {
          const y = pc.y1, cx = pc.x + 1, a = tFall % 3;
          // churned white where it lands, drops thrown up in arcs, and rings running out across the pool
          p(pc.x - 1 + (a === 0 ? 0 : 1), y + 1, 4, 1, HI);
          p(pc.x + (a === 2 ? 1 : 0), y, 3, 1, HI);
          for (let k = 0; k < 6; k++) {
            const ph = (tFall + k * 4) % 11, dir = k % 2 ? 1 : -1;
            const dx = Math.round(dir * (1 + (k >> 1)) * ph * 0.32), dy = Math.round(-(ph * 1.0 - 0.1 * ph * ph));
            if (dy <= 0 && ph < 10) p(cx + dx, y + dy, 1, 1, ph < 6 ? HI : MID);
          }
          if (pc.sea) for (let i = 0; i < 12; i++) p(pc.x - 11 + ((i * 5 + a * 3) % 24), y + 1 - ((i + a) % 3), 2, 1, HI);
          else {
            const r = 1 + ((tFall >> 1) % 3);
            p(cx - r, y + 2, 1, 1, HI);
            p(cx + r, y + 2, 1, 1, HI);
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
