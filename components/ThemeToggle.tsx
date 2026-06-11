"use client";

import { setTheme, useTheme } from "./theme";

// inline icons: the unicode glyphs (☼ ☾) render inconsistently across
// platforms — Android draws ☼ as a dotted gear
const SunIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.6" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="12" y1="1.6" x2="12" y2="4.4" />
      <line x1="12" y1="19.6" x2="12" y2="22.4" />
      <line x1="1.6" y1="12" x2="4.4" y2="12" />
      <line x1="19.6" y1="12" x2="22.4" y2="12" />
      <line x1="4.65" y1="4.65" x2="6.63" y2="6.63" />
      <line x1="17.37" y1="17.37" x2="19.35" y2="19.35" />
      <line x1="4.65" y1="19.35" x2="6.63" y2="17.37" />
      <line x1="17.37" y1="6.63" x2="19.35" y2="4.65" />
    </g>
  </svg>
);

const MoonIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M20.4 13.6A8.6 8.6 0 1 1 10.4 3.6a7 7 0 0 0 10 10z"
      fill="currentColor"
    />
  </svg>
);

export default function ThemeToggle() {
  const theme = useTheme();
  return (
    <button
      className="modebtn cursor-target"
      onClick={(e) =>
        setTheme(theme === "dark" ? "light" : "dark", {
          x: e.clientX,
          y: e.clientY,
        })
      }
      aria-label="Toggle color theme"
    >
      {theme === "dark" ? SunIcon : MoonIcon}
      <span className="modebtn__t">{theme === "dark" ? "day" : "night"}</span>
    </button>
  );
}
