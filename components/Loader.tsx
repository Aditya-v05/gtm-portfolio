"use client";

import { useEffect, useRef, useState } from "react";

// The loading screen: a small stone aqueduct whose channel fills with water
// while the 3D city loads. When the city is ready the water reaches the end,
// spills into a basin, and the screen dissolves in pixel steps.
//
// It is in the server markup, so it shows before any script runs. If the city
// is ready almost at once it leaves before the aqueduct has even faded in, so
// a fast load never sees a loader. It shows once per visit; add ?loader to
// the address to watch it again, held open for a few seconds.

const PIERS = [0, 1, 2, 3, 4, 5].map((i) => 6 + 16 * i);
const SPANS = [0, 1, 2, 3, 4].map((i) => 12 + 16 * i);
const GLINTS = Array.from({ length: 8 }, (_, i) => -14 + 16 * i);

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    if (html.classList.contains("no-loader")) return setGone(true);
    const demo = /[?&]loader\b/.test(location.search);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    let finished = false;

    const leave = () => {
      try {
        sessionStorage.setItem("loader", "1");
      } catch {}
      setGone(true);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      mo.disconnect();
      const now = performance.now();
      // ready before the aqueduct has appeared: nobody saw a loader
      if (!demo && now < 450) return leave();
      const hold = Math.max(0, (demo ? 3200 : 1500) - now);
      later(() => {
        if (reduced) {
          el.classList.add("is-out");
          return later(leave, 320);
        }
        // run the water on from wherever it has crept to
        const cover = el.querySelector<SVGRectElement>(".loader__dry");
        if (cover) {
          const sx = new DOMMatrixReadOnly(getComputedStyle(cover).transform).a;
          cover.style.animation = "none";
          cover.style.transform = `scaleX(${sx})`;
          void cover.getBoundingClientRect();
          cover.style.transition = "transform 420ms steps(10)";
          cover.style.transform = "scaleX(0)";
        }
        later(() => el.classList.add("is-full"), 420);
        later(() => el.classList.add("is-out"), 1350);
        later(leave, 1850);
      }, hold);
    };

    const mo = new MutationObserver(() => html.dataset.world && finish());
    mo.observe(html, { attributes: true, attributeFilter: ["data-world"] });
    if (html.dataset.world) finish();
    later(finish, 6000);
    return () => {
      mo.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="loader" role="status" aria-label="Loading">
      <div className="loader__in">
        <svg className="loader__aq" viewBox="0 0 108 50" shapeRendering="crispEdges" aria-hidden="true">
          <defs>
            <clipPath id="loader-channel">
              <rect x="6" y="7" width="88" height="2" />
            </clipPath>
          </defs>
          {/* piers and their arches */}
          {PIERS.map((x) => (
            <g key={x}>
              <rect x={x} y="14" width="6" height="32" className="st" />
              <rect x={x + 5} y="14" width="1" height="32" className="st-m" />
              <rect x={x} y="24" width="5" height="1" className="st-l" />
              <rect x={x} y="35" width="5" height="1" className="st-l" />
              <rect x={x - 1} y="44" width="8" height="2" className="st-m" />
            </g>
          ))}
          {SPANS.map((x) => (
            <g key={x} className="st">
              <rect x={x} y="14" width="4" height="1" />
              <rect x={x + 6} y="14" width="4" height="1" />
              <rect x={x} y="15" width="3" height="1" />
              <rect x={x + 7} y="15" width="3" height="1" />
              <rect x={x} y="16" width="2" height="1" />
              <rect x={x + 8} y="16" width="2" height="1" />
              <rect x={x} y="17" width="1" height="2" />
              <rect x={x + 9} y="17" width="1" height="2" />
            </g>
          ))}
          {/* the deck and the trough on top of it */}
          <rect x="4" y="10" width="90" height="4" className="st" />
          <rect x="4" y="10" width="90" height="1" className="st-l" />
          <rect x="4" y="13" width="90" height="1" className="st-m" />
          <rect x="4" y="5" width="2" height="5" className="st-m" />
          <rect x="4" y="6" width="90" height="1" className="st-l" />
          <rect x="6" y="7" width="88" height="1" className="w-l" />
          <rect x="6" y="8" width="88" height="1" className="w" />
          <g clipPath="url(#loader-channel)">
            <g className="loader__glints">
              {GLINTS.map((x) => (
                <g key={x} className="w-g">
                  <rect x={x} y="7" width="3" height="1" />
                  <rect x={x + 9} y="8" width="2" height="1" />
                </g>
              ))}
            </g>
          </g>
          <rect x="6" y="7" width="88" height="2" className="loader__dry" />
          <rect x="4" y="9" width="90" height="1" className="st-m" />
          {/* the spill and its basin */}
          <g className="loader__fall">
            <rect x="94" y="7" width="3" height="36" className="w" />
            <rect x="94" y="7" width="1" height="36" className="w-l" />
            <g className="loader__streaks w-g">
              <rect x="96" y="11" width="1" height="3" />
              <rect x="95" y="20" width="1" height="2" />
              <rect x="96" y="29" width="1" height="3" />
              <rect x="95" y="37" width="1" height="2" />
            </g>
          </g>
          <rect x="93" y="42" width="11" height="4" className="st" />
          <rect x="93" y="42" width="11" height="1" className="st-l" />
          <rect x="93" y="45" width="11" height="1" className="st-m" />
          <g className="loader__pool">
            <rect x="94" y="42" width="9" height="2" className="w" />
            <rect x="94" y="42" width="9" height="1" className="w-l" />
            <g className="loader__foam w-g">
              <rect x="93" y="41" width="1" height="1" />
              <rect x="98" y="41" width="1" height="1" />
              <rect x="94" y="42" width="5" height="1" />
            </g>
          </g>
          <rect x="0" y="46" width="108" height="1" className="loader__ground" />
        </svg>
        <p className="loader__k">Drawing water</p>
      </div>
    </div>
  );
}
