"use client";

import { setTheme, useTheme } from "./theme";

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
      {theme === "dark" ? "☼" : "☾"}
      <span className="modebtn__t">{theme === "dark" ? " day" : " night"}</span>
    </button>
  );
}
