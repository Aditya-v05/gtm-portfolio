"use client";

import { setTheme, useTheme } from "./theme";

// Night mode is a desk lamp: the same paper, lit by a warm pool of light in
// a dark room. The switch is a small lamp drawn in two strokes.
const Lamp = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 10 L12 3 L17 10 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 10 V19 M8 20.5 H16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export default function ThemeToggle() {
  const theme = useTheme();
  const night = theme === "dark";
  return (
    <button
      className="lampbtn"
      onClick={(e) => setTheme(night ? "light" : "dark", { x: e.clientX, y: e.clientY })}
      aria-label={night ? "Switch to daylight" : "Switch the desk lamp on"}
      aria-pressed={night}
    >
      {Lamp}
      <span className="lampbtn__t">{night ? "daylight" : "lamp"}</span>
    </button>
  );
}
