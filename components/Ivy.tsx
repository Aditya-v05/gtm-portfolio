"use client";

import { useEffect, useRef } from "react";

// Pixel ivy growing down a wall from its top edge: seeded strands that
// wander as they fall, with leaf clusters either side. Drawn once on a
// low-resolution canvas and scaled up with crisp pixels.
export default function Ivy({ seed = 1, className = "" }: { seed?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const W = 90, H = 70;
    const c = cv.getContext("2d")!;
    let s = seed * 9301 + 49297;
    const r = () => ((s = (s * 233280 + 49297) % 2147483647) / 2147483647);
    const LEAF = ["#4f7a3a", "#6b9a4a", "#3d6030", "#8fb35a"];
    c.clearRect(0, 0, W, H);
    for (let k = 0; k < 9; k++) {
      let x = 4 + r() * (W - 8);
      const len = 14 + r() * (H - 22);
      for (let y = 0; y < len; y++) {
        if (r() < 0.35) x += r() < 0.5 ? -1 : 1;
        c.fillStyle = "#3d6030";
        c.fillRect(Math.round(x), y, 1, 1);
        if (r() < 0.55) {
          const side = r() < 0.5 ? -1 : 1;
          c.fillStyle = LEAF[Math.floor(r() * LEAF.length)];
          c.fillRect(Math.round(x) + side, y, 2, 2);
          if (r() < 0.4) c.fillRect(Math.round(x) + side * 2, y + 1, 2, 1);
        }
      }
    }
  }, [seed]);
  return <canvas ref={ref} className={`ivy ${className}`.trim()} width={90} height={70} aria-hidden="true" />;
}
