"use client";

import { useEffect, useRef, useState } from "react";

// CNC-style digital readout trailing the cursor: `x 0412 · y 0388`.
// Fine pointers only; driven by rAF-throttled direct DOM writes (no
// re-renders). Fades out when the pointer rests.
export default function CursorDRO() {
  const [fine, setFine] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFine(
      window.matchMedia("(pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  useEffect(() => {
    if (!fine) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let idle: ReturnType<typeof setTimeout>;
    const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${e.clientX + 26}px, ${e.clientY + 30}px)`;
        el.textContent = `x ${pad(e.clientX)} · y ${pad(e.clientY)}`;
        el.style.opacity = "1";
      });
      clearTimeout(idle);
      idle = setTimeout(() => {
        el.style.opacity = "0";
      }, 1600);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      clearTimeout(idle);
    };
  }, [fine]);

  if (!fine) return null;
  return <div ref={ref} className="dro" aria-hidden="true"></div>;
}
