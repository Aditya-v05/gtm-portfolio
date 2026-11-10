"use client";

import { useEffect, useRef } from "react";

// The name drawn in dots, like the reference: the serif's outline traced in
// small blue dots. On load the dots start as scattered pixels and gather
// into the letters, then everything stays perfectly still.
//
// The SVG underneath is the finished wordmark (a dotted stroke: round caps on
// a near-zero dash). It is what shows without JS or with reduced motion, and
// the canvas takes its exact size and font so the two line up. Once the
// pixels land, the canvas fades and the SVG wordmark stays.
export default function DotName({ children }: { children: string }) {
  const wrap = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const svg = svgRef.current, canvas = canvasRef.current, box = wrap.current;
    if (!svg || !canvas || !box) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let cancelled = false;

    const run = async () => {
      await document.fonts.ready;
      if (cancelled) return;
      const text = svg.querySelector("text");
      if (!text) return;
      const cs = getComputedStyle(text);
      const color = cs.stroke || "#2f4f9e";
      const rect = svg.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
      if (!W || !H) return;
      const k = rect.width / 860; // css px per viewBox unit

      // trace the letter outlines on an offscreen canvas
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      o.font = `400 ${118 * k * dpr}px ${cs.fontFamily}`;
      o.textAlign = "center";
      o.textBaseline = "alphabetic";
      const measured = o.measureText(children).width || 1;
      o.save();
      o.translate(W / 2, 104 * k * dpr);
      o.scale((820 * k * dpr) / measured, 1);
      o.lineWidth = 2 * dpr;
      o.strokeStyle = "#000";
      o.strokeText(children, 0, 0);
      o.restore();
      const data = o.getImageData(0, 0, W, H).data;

      // sample the outline into evenly spaced dots
      const gap = 4.6 * k * dpr * (rect.width < 500 ? 0.8 : 1);
      const cell = gap * 0.75;
      const taken = new Map<string, true>();
      const dots: { x: number; y: number; sx: number; sy: number; d: number }[] = [];
      const near = (x: number, y: number) => {
        const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (taken.has(`${cx + i},${cy + j}`)) return true;
        return false;
      };
      for (let y = 0; y < H; y += 1) {
        for (let x = 0; x < W; x += 1) {
          if (data[(y * W + x) * 4 + 3] < 60) continue;
          if (near(x, y)) continue;
          taken.set(`${Math.floor(x / cell)},${Math.floor(y / cell)}`, true);
          dots.push({ x, y, sx: Math.random() * W, sy: H * (0.2 + Math.random() * 1.8) - H * 0.6, d: x / W });
        }
      }
      if (!dots.length) return;

      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const c = canvas.getContext("2d");
      if (!c) return;
      box.dataset.assembling = "1";
      const r = 1.05 * dpr * Math.max(0.8, k);
      const start = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      const frame = (now: number) => {
        const t = (now - start) / 1000;
        c.clearRect(0, 0, W, H);
        c.fillStyle = color;
        let done = true;
        for (const p of dots) {
          // left to right, each dot travelling about a second
          const local = Math.min(1, Math.max(0, (t - p.d * 0.7 - 0.1) / 1.0));
          if (local < 1) done = false;
          const e = ease(local);
          const x = p.sx + (p.x - p.sx) * e, y = p.sy + (p.y - p.sy) * e;
          if (local < 0.85) {
            // in flight: a tiny square pixel
            const s = r * 1.2;
            c.globalAlpha = Math.min(1, local * 3);
            c.fillRect(x - s / 2, y - s / 2, s, s);
          } else {
            c.globalAlpha = 1;
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.fill();
          }
        }
        if (!done) raf = requestAnimationFrame(frame);
        else {
          // the pixels have landed: hand over to the crisp dotted wordmark
          box.dataset.assembling = "done";
        }
      };
      raf = requestAnimationFrame(frame);
    };
    run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [children]);

  return (
    <span ref={wrap} className="dotname-wrap">
      <span className="sr-only">{children}</span>
      <svg ref={svgRef} className="dotname" viewBox="0 0 860 130" aria-hidden="true">
        <text x="430" y="104" textAnchor="middle" fontSize="118" textLength="820" lengthAdjust="spacingAndGlyphs">
          {children}
        </text>
      </svg>
      <canvas ref={canvasRef} className="dotname__canvas" aria-hidden="true" />
    </span>
  );
}
