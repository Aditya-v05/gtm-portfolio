"use client";

import { useEffect } from "react";

// Publishes the sticky nav's real height as --nav-h, and marks the nav
// solid once the reader scrolls past the hero. The height lets the hero size
// itself to exactly the remaining viewport. The nav's height changes as its
// links wrap (70px wide, up to ~121px at narrow widths), and wrapping nav +
// hero in a fixed-height flex container would break position:sticky - so it
// gets measured instead of guessed.
export default function NavHeightVar() {
  useEffect(() => {
    const nav = document.querySelector("nav");
    if (!nav) return;
    const apply = () => {
      document.documentElement.style.setProperty(
        "--nav-h",
        `${Math.round(nav.getBoundingClientRect().height)}px`
      );
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(nav);
    // transparent over the hero sky, backed once the reader scrolls on
    const solid = () => {
      nav.dataset.solid = window.scrollY > window.innerHeight * 0.45 ? "1" : "0";
    };
    solid();
    window.addEventListener("scroll", solid, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", solid);
    };
  }, []);

  return null;
}
