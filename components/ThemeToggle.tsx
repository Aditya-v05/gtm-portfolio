"use client";

import { setTheme, useTheme } from "./theme";

// Day and night. At night the city's windows light up and the moon comes out.
// Both icons are drawn on a 12 by 12 grid of whole pixels, like the rest of the site's icons.
const Sun = (
  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" fill="currentColor">
    {/* the disc, with its corners stepped off */}
    <path d="M5 3h2v1h1v1h1v2H8v1H7v1H5V8H4V7H3V5h1V4h1z" />
    {/* four straight rays and four at the corners */}
    <path d="M5 0h2v2H5zM5 10h2v2H5zM0 5h2v2H0zM10 5h2v2h-2zM2 2h1v1H2zM9 2h1v1H9zM2 9h1v1H2zM9 9h1v1H9z" />
  </svg>
);
const Moon = (
  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" fill="currentColor">
    {/* a crescent, built from rows */}
    <path d="M5 1h3v1H5zM4 2h2v1H4zM3 3h2v1H3zM2 4h3v2H2zM2 6h4v1H2zM2 7h5v1H2zM10 7h1v1h-1zM3 8h8v1H3zM4 9h6v1H4zM5 10h4v1H5z" />
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
