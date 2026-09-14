"use client";

import { useEffect, useRef } from "react";

// The front page's figure: a bar chart printed as halftone. Every dot sits on one grid;
// inside a bar the dots swell towards the base like newsprint shading, and outside it
// they shrink to a faint screen. Colours come from the site's theme tokens, so it
// re-inks when the day/night toggle flips.

export type HalftoneBar = { label: string; value: number };

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export default function Halftone({ bars, label }: { bars: HalftoneBar[]; label: string }) {
  const plate = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = plate.current;
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!box || !el || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const max = Math.max(1, ...bars.map((b) => b.value));
    let progress = reduce ? 1 : 0;
    let raf = 0;

    const draw = () => {
      const css = getComputedStyle(document.documentElement);
      const ink = css.getPropertyValue("--accent").trim() || "#63AEF2";
      const screen = css.getPropertyValue("--line-2").trim() || "#2B425D";
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = box.clientWidth;
      const h = box.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cell = 7;
      const slot = w / bars.length;
      const barW = slot * 0.6;
      const p = ease(progress);
      for (let y = cell / 2; y < h; y += cell) {
        for (let x = cell / 2; x < w; x += cell) {
          const i = Math.min(bars.length - 1, Math.floor(x / slot));
          const left = i * slot + (slot - barW) / 2;
          const top = h - (bars[i]!.value / max) * (h - cell) * p;
          const inBar = x >= left && x <= left + barW && y >= top && bars[i]!.value > 0;
          let r: number;
          if (inBar) {
            const depth = Math.min(1, ((y - top) / Math.max(cell, h - top)) * 1.7);
            r = (cell / 2 - 0.35) * (0.3 + 0.7 * depth);
            ctx.fillStyle = ink;
          } else {
            r = 0.75;
            ctx.fillStyle = screen;
          }
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const run = () => {
      const start = performance.now() - progress * 1100;
      const step = (t: number) => {
        progress = Math.min(1, (t - start) / 1100);
        draw();
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    draw();
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && progress < 1) {
          seen.disconnect();
          run();
        }
      },
      { threshold: 0.35 },
    );
    seen.observe(box);
    const resized = new ResizeObserver(() => draw());
    resized.observe(box);
    const themed = new MutationObserver(() => draw());
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      seen.disconnect();
      resized.disconnect();
      themed.disconnect();
    };
  }, [bars]);

  return (
    <div className="halftone">
      <div className="halftone__plate" ref={plate}>
        <canvas ref={canvas} role="img" aria-label={label} />
      </div>
      <ul className="halftone__keys">
        {bars.map((b) => (
          <li key={b.label}>
            <b>{b.value}</b>
            <span>{b.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
