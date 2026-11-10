"use client";

import { setTheme, useTheme } from "./theme";

// Day and night. At night the city's windows light up and the moon comes out.
const Sun = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.4" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="4.6" />
      <line x1="12" y1="19.4" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.6" y2="12" />
      <line x1="19.4" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.1" y2="4.9" />
    </g>
  </svg>
);
const Moon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.4 13.6A8.6 8.6 0 1 1 10.4 3.6a7 7 0 0 0 10 10z" fill="currentColor" />
  </svg>
);

export default function ThemeToggle() {
  const theme = useTheme();
  const night = theme === "dark";
  return (
    <button
      className="daybtn"
      onClick={(e) => setTheme(night ? "light" : "dark", { x: e.clientX, y: e.clientY })}
      aria-label={night ? "Switch to day" : "Switch to night"}
      aria-pressed={night}
    >
      {night ? Sun : Moon}
      <span className="daybtn__t">{night ? "day" : "night"}</span>
    </button>
  );
}
