"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Hand-drawn marks (underlines, circles, arrows, the dice) carry the class
// "draw" and are server-rendered fully drawn, so they read fine without JS.
// With JS the CSS clips them away until they scroll into view, then they
// wipe in once, like the pen moving across.
//
// The observer watches each mark's parent, not the mark: a fully clipped
// element never counts as intersecting, so it would never be revealed.
export default function DrawObserver() {
  const path = usePathname();
  useEffect(() => {
    const marks = Array.from(document.querySelectorAll<Element>(".draw:not(.is-drawn)"));
    if (!marks.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      marks.forEach((m) => m.classList.add("is-drawn"));
      return;
    }
    const byHost = new Map<Element, Element[]>();
    for (const m of marks) {
      const host = m.parentElement ?? m;
      byHost.set(host, [...(byHost.get(host) ?? []), m]);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          byHost.get(e.target)?.forEach((m) => m.classList.add("is-drawn"));
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.25 }
    );
    byHost.forEach((_, host) => io.observe(host));
    return () => io.disconnect();
  }, [path]);
  return null;
}
