"use client";

// The 3D machine cell: a vectorized (edge-line) conveyor, scanner gantry, and
// a 6-axis sorting arm at the end of the line. Plates ride the belt, Raven's
// scanner stamps a verdict, and the arm picks each plate up - verified plates
// go into the Attio bin, rejects get flung off the line. Rendered with
// three.js in hidden-line style: meshes filled with the page background color
// occlude ink-colored edges, orthographic camera like a technical drawing.
//
// Progressive enhancement: this component lazy-loads three only when the band
// nears the viewport, never on reduced-motion, and marks the section with
// .belt--3d once the first frame renders (which hides the CSS fallback).
// The render loop pauses whenever the band is off screen.

import { useEffect, useRef } from "react";

export default function ConveyorCell() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    // load three only when the band is within 1.5 viewports
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import("./conveyorScene").then(({ mountConveyorScene }) => {
          if (disposed) return;
          try {
            cleanup = mountConveyorScene(host);
          } catch {
            // WebGL unavailable: the CSS fallback simply stays
          }
        });
      },
      { rootMargin: "150% 0px" }
    );
    io.observe(host);

    return () => {
      disposed = true;
      io.disconnect();
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="belt3d" aria-hidden="true"></div>;
}
