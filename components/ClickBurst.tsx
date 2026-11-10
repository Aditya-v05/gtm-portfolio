"use client";

import { useEffect } from "react";

// A small splash of pixel droplets wherever the reader presses: eight
// squares fly out and fall away. Interactive things splash gold, the rest
// of the page splashes water-blue.
export default function ClickBurst() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onDown = (e: PointerEvent) => {
      const hot = (e.target as HTMLElement).closest?.("a, button, .card, .stone");
      const colours = hot ? ["#e3b21c", "#fff3b0", "#c8673a"] : ["#6f8ed4", "#a9c4f2", "#f2f6ff"];
      for (let i = 0; i < 8; i++) {
        const d = document.createElement("span");
        const size = i % 3 === 0 ? 8 : 4;
        d.style.cssText = `position:fixed;left:${e.clientX - size / 2}px;top:${e.clientY - size / 2}px;width:${size}px;height:${size}px;background:${colours[i % colours.length]};pointer-events:none;z-index:999;`;
        document.body.appendChild(d);
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
        const r = 22 + Math.random() * 26;
        // snap every position to the 4px grid so the motion stays pixel-true
        const s = (v: number) => Math.round(v / 4) * 4;
        d.animate(
          [
            { transform: "translate(0,0)", opacity: 1 },
            { transform: `translate(${s(Math.cos(a) * r * 0.7)}px, ${s(Math.sin(a) * r * 0.7 - 10)}px)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${s(Math.cos(a) * r)}px, ${s(Math.sin(a) * r + 18)}px)`, opacity: 0 },
          ],
          { duration: 420, easing: "steps(6)" }
        ).onfinish = () => d.remove();
      }
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
