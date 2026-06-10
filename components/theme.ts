"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {}
  window.dispatchEvent(new Event("themechange"));
}

/**
 * Switch theme. When `origin` (a click point) is given and the browser
 * supports the View Transitions API, the new theme bleeds outward from that
 * point as an expanding circle instead of swapping instantly.
 */
export function setTheme(t: Theme, origin?: { x: number; y: number }) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!origin || reduced || !doc.startViewTransition) {
    apply(t);
    return;
  }

  const { x, y } = origin;
  const r = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const vt = doc.startViewTransition(() => apply(t));
  vt.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${r}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "cubic-bezier(.76,0,.24,1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });
}

export function useTheme(): Theme {
  const [theme, set] = useState<Theme>("light");
  useEffect(() => {
    set(currentTheme());
    const onChange = () => set(currentTheme());
    window.addEventListener("themechange", onChange);
    return () => window.removeEventListener("themechange", onChange);
  }, []);
  return theme;
}
