"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {}
  window.dispatchEvent(new Event("themechange"));
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
