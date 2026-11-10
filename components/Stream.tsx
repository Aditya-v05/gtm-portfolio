"use client";

import { useEffect, useRef } from "react";
import { FOUNTAIN_GRID as FG } from "./Fountain";

// The water. It pours from the statue's amphora, drops out under the basin,
// runs along a stone channel, tumbles down a zig-zag cascade beside the
// work, and finally falls into the sea at the foot of the page.
//
// It flows as the reader scrolls: the head of the water only reaches as far
// as the page has been read, and it never runs back uphill. Everything is
// drawn on one fixed canvas of 4px pixels, behind the content.

const CELL = 4;
type Cell = { x: number; y: number; kind: "run" | "fall"; dir: number; cost: number; land?: boolean };

const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export default function Stream() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cells: Cell[] = [];
    let total = 0;
    let front = 0;
    let W = 0, H = 0;

    const build = () => {
      const f = document.querySelector<HTMLElement>(".fountain");
      const work = document.querySelector<HTMLElement>("#work");
      const end = document.querySelector<HTMLElement>("#contact");
      cells = [];
      if (!f || !work || !end) return;
      const sy = window.scrollY, vw = window.innerWidth;
      const fr = f.getBoundingClientRect(), wr = work.getBoundingClientRect(), er = end.getBoundingClientRect();
      const k = fr.width / FG.w;
      const g = (v: number) => Math.round(v / CELL);
      let cost = 0;
      const fall = (x: number, y0: number, y1: number) => {
        for (let y = g(y0); y < g(y1); y++) cells.push({ x: g(x), y, kind: "fall", dir: 1, cost: (cost += CELL) });
      };
      const run = (x0: number, x1: number, y: number) => {
        const d = x1 > x0 ? 1 : -1;
        let first = true;
        // run two cells past each end, so it meets the 3-wide falls squarely
        const a = d > 0 ? g(x0) : g(x0) + 2, b = d > 0 ? g(x1) + 2 : g(x1);
        for (let x = a; d > 0 ? x <= b : x >= b; x += d) {
          cells.push({ x, y: g(y), kind: "run", dir: d, cost: (cost += CELL * 0.3), land: first });
          first = false;
        }
      };
      // the pour, from the amphora's mouth into the basin
      const mx = fr.left + FG.mouth[0] * k - CELL, my = fr.top + sy + FG.mouth[1] * k;
      fall(mx, my, fr.top + sy + FG.basinY * k);
      // out under the basin, down to the channel
      const ex = fr.left + FG.exit[0] * k - CELL;
      const y1 = wr.top + sy + 44;
      fall(ex, fr.bottom + sy, y1);
      // along the channel to the left margin
      const xL = Math.max(26, (vw - 1120) / 2 - 86);
      run(ex, xL, y1);
      // the cascade: short falls and ledges, zig-zagging down beside the work
      const y2 = wr.bottom + sy - 60;
      let x = xL, y = y1, side = 1;
      while (y + 150 < y2) {
        fall(x, y, y + 96);
        y += 96;
        const nx = x + side * Math.min(52, xL - 6);
        run(x, nx, y);
        x = nx;
        side = -side;
      }
      fall(x, y, y2);
            // across the page, clear of the closing words, then the last fall into the sea
      const xE = vw > 900 ? vw * 0.9 : vw - 30;
      run(x, xE, y2);
      fall(xE, y2, er.top + sy + er.height * 0.95);
      cells[cells.length - 1].land = true;
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

    let raf = 0, last = performance.now(), tick = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !cells.length) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const sy = window.scrollY;
      // how far the water should have reached: the last cell above the read line
      const reach = (sy + window.innerHeight * 0.78) / CELL;
      let target = 0;
      for (const c of cells) if (c.y <= reach) target = c.cost;
      front = reduced ? Math.max(front, target) : Math.max(front, Math.min(target, front + dt * 1100));
      if (!reduced) tick = Math.floor(now / 70);

      const night = document.documentElement.dataset.theme === "dark";
      const A = night ? "#34457a" : "#7f9be0", B = night ? "#4b62a2" : "#a9bdea", Lt = night ? "#8f9fd0" : "#eef1fa";
      const FOAM = night ? "#c9d2f0" : "#fffbe6", ST = night ? "#4c5378" : "#ead6bd", SD = night ? "#353a52" : "#c9ae8a";
      const off = sy % CELL, top = (sy - off) / CELL;
      canvas.style.transform = `translateY(${-off}px)`;
      ctx.clearRect(0, 0, W, H);
      const p = (x: number, y: number, w: number, h: number, col: string) => {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, w, h);
      };
      for (const c of cells) {
        const y = c.y - top;
        if (y < -8 || y > H + 8) continue;
        const wet = c.cost <= front;
        const head = wet && front - c.cost < 26 && front < total - 1;
        if (c.kind === "run") {
          // the stone trough is always there; the water arrives later
          p(c.x, y - 1, 1, 1, ST);
          p(c.x, y, 1, 3, wet ? A : ST);
          p(c.x, y + 3, 1, 1, SD);
          if (!wet && hash(c.x, c.y) > 0.8) p(c.x, y + 1, 1, 1, SD);
          if (wet) {
            for (let r = 0; r < 3; r++) {
              const h = hash(c.x - c.dir * tick, c.y + r * 7);
              if (h > 0.7) p(c.x, y + r, 1, 1, h > 0.9 ? Lt : B);
            }
            if (c.land || head) p(c.x - 1, y - 1, 3, 2, FOAM);
          }
        } else if (wet) {
          for (let col = 0; col < 3; col++) {
            const h = hash(c.x + col * 3, c.y - tick);
            p(c.x + col, y, 1, 1, h > 0.86 ? FOAM : h > 0.5 ? B : A);
          }
          if (head) p(c.x - 1, y, 5, 1, FOAM);
          if (c.land) {
            // spray where the last fall meets the sea
            for (let i = 0; i < 9; i++) {
              const h = hash(i, tick >> 1);
              p(c.x - 5 + Math.floor(h * 12), y - Math.floor(hash(i + 9, tick >> 1) * 4), 2, 1, FOAM);
            }
          }
        }
      }
      // little paper boats riding the water, looping from the source
      if (!reduced && front > 200) {
        for (let b = 0; b < 4; b++) {
          const at = ((now / 1000) * 150 + b * (total / 4)) % total;
          if (at > front - 20) continue;
          let lo = 0, hi = cells.length - 1;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (cells[mid].cost < at) lo = mid + 1;
            else hi = mid;
          }
          const c = cells[lo];
          if (c.kind !== "run") continue;
          const y = c.y - top;
          p(c.x - 1, y, 3, 1, FOAM);
          p(c.x, y - 1, 1, 1, FOAM);
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
