"use client";

import { useEffect, useRef } from "react";

// The name, in the hand-lettered display face. On load it assembles from
// small square pixels that fly in and settle into the letters, then hands
// over to the crisp live text and stays perfectly still. Without JS or with
// reduced motion, the text simply shows.
export default function PixelName({ children }: { children: string }) {
  const wrap = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current, txt = textRef.current, canvas = canvasRef.current;
    if (!box || !txt || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let cancelled = false;

    (async () => {
      await document.fonts.ready;
      if (cancelled) return;
      const cs = getComputedStyle(txt);
      const rect = txt.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pad = 40;
      const W = Math.round((rect.width + pad * 2) * dpr), H = Math.round((rect.height + pad * 2) * dpr);
      if (!rect.width) return;

      // draw the real text offscreen, exactly as the page lays it out
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      o.scale(dpr, dpr);
      o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      o.textBaseline = "alphabetic";
      o.textAlign = "left";
      const m = o.measureText(children);
      const ls = parseFloat(cs.letterSpacing) || 0;
      if ("letterSpacing" in o) (o as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${ls}px`;
      const baseline = pad + (rect.height + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      o.fillStyle = "#000";
      o.fillText(children, pad, baseline);
      const data = o.getImageData(0, 0, W, H).data;

      // sample the filled letters on a pixel grid
      const step = Math.max(3, Math.round(parseFloat(cs.fontSize) / 26)) * dpr;
      const pts: { x: number; y: number; sx: number; sy: number; d: number }[] = [];
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          if (data[(Math.floor(y + step / 2) * W + Math.floor(x + step / 2)) * 4 + 3] < 128) continue;
          pts.push({ x, y, sx: Math.random() * W, sy: Math.random() * H * 1.6 - H * 0.3, d: x / W });
        }
      }
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W / dpr}px`;
      canvas.style.height = `${H / dpr}px`;
      canvas.style.left = `${-pad}px`;
      canvas.style.top = `${-pad}px`;
      const c = canvas.getContext("2d");
      if (!c) return;
      box.dataset.assembling = "1";
      const colour = cs.color;
      const start = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      const frame = (now: number) => {
        const t = (now - start) / 1000;
        c.clearRect(0, 0, W, H);
        c.fillStyle = colour;
        let done = true;
        for (const p of pts) {
          const k = Math.min(1, Math.max(0, (t - p.d * 0.6 - 0.05) / 0.9));
          if (k < 1) done = false;
          const e = ease(k);
          c.globalAlpha = Math.min(1, k * 4);
          c.fillRect(p.sx + (p.x - p.sx) * e, p.sy + (p.y - p.sy) * e, step - dpr * 0.5, step - dpr * 0.5);
        }
        if (!done) raf = requestAnimationFrame(frame);
        else box.dataset.assembling = "done";
      };
      raf = requestAnimationFrame(frame);
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [children]);

  return (
    <span ref={wrap} className="pixelname">
      <span ref={textRef} className="pixelname__text">
        {children}
      </span>
      <canvas ref={canvasRef} className="pixelname__canvas" aria-hidden="true" />
    </span>
  );
}
