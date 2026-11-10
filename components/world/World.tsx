"use client";

import { useEffect, useRef, useState } from "react";
import type { DistrictName } from "./layout";
import type { WorldHandle, WorldWindow } from "./engine";

// Aditya's world: one connected city, shown through windows in the page.
// Any element with data-district="<name>" becomes a window looking at that
// district, drawn by a single fixed canvas behind the content. Optional
// data-fade="left,right,bottom,top" (CSS px) dissolves those edges into the
// page in dithered steps.
//
// three.js loads after first paint. Without WebGL the windows simply show
// their CSS fallback, and the page reads exactly the same.
export default function World() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let world: WorldHandle | null = null;
    let disposed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let els: HTMLElement[] = [];
    const collect = () => {
      els = Array.from(document.querySelectorAll<HTMLElement>("[data-district]"));
    };
    const windows = (): WorldWindow[] =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        const [left = 0, right = 0, bottom = 0, top = 0] = (el.dataset.fade ?? "").split(",").map((v) => Number(v) || 0);
        return {
          district: el.dataset.district as DistrictName,
          rect: { left: r.left, top: r.top, width: r.width, height: r.height },
          fade: { left, right, bottom, top },
        };
      });

    const onResize = () => world?.resize();
    const onTheme = () => world?.setNight(document.documentElement.dataset.theme === "dark");
    const mo = new MutationObserver(collect);

    const start = async () => {
      try {
        const { createWorld } = await import("./engine");
        if (disposed) return;
        collect();
        world = createWorld(canvas, { reduced, night: document.documentElement.dataset.theme === "dark", windows });
        document.documentElement.dataset.world = "ready";
      } catch {
        setFailed(true);
      }
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(start);
    else setTimeout(start, 60);

    window.addEventListener("resize", onResize);
    window.addEventListener("themechange", onTheme);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("themechange", onTheme);
      mo.disconnect();
      world?.dispose();
      delete document.documentElement.dataset.world;
    };
  }, []);

  return (
    <div className={`world${failed ? " world--fallback" : ""}`} aria-hidden="true">
      <canvas ref={canvasRef} className="world__canvas" />
    </div>
  );
}
