"use client";

import { useEffect, useRef, useState } from "react";

// The loading screen: the name sits exactly where the hero has it, as empty
// carved stone letters. Water runs through the letters from the left while
// the 3D city loads, turning them the blue they are on the site. When the
// last letter is full the water spills off the end and falls down the page,
// the screen behind the name dissolves, and the hero is already there: the
// name never moves.
//
// It is in the server markup, so it shows before any script runs. It plays
// once per visit; add ?loader to the address to watch it again, slowed down.

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    if (html.classList.contains("no-loader") || window.scrollY > 40) return setGone(true);
    const demo = /[?&]loader\b/.test(location.search);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const name = el.querySelector<HTMLElement>(".pixelname__text")!;
    const fall = el.querySelector<HTMLElement>(".loader__fall")!;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    let raf = 0;

    // sit exactly on the real name, and take its colour
    const real = document.querySelector<HTMLElement>(".page .pixelname__text");
    if (real) {
      const a = real.getBoundingClientRect(), b = name.getBoundingClientRect();
      if (a.left !== b.left || a.top !== b.top) name.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
      el.style.setProperty("--fill", getComputedStyle(real).color);
    }

    const leave = () => {
      try {
        sessionStorage.setItem("loader", "1");
      } catch {}
      setGone(true);
    };

    // the water: creeps toward most of the way while the city loads, then
    // runs to the end once it is ready. Moves in small steps, like pixels.
    const CREEP = demo ? 2400 : 900, RUN = 260, MIN = demo ? 2600 : 800;
    const t0 = performance.now();
    let ready = 0, from = 0, p = 0, done = false;
    const set = (v: number) => name.style.setProperty("--p", (Math.round(v * 48) / 48).toFixed(4));
    const spill = () => {
      const r = name.getBoundingClientRect();
      const cell = Math.max(3, Math.round(r.height / 14));
      // the box ends with one letter-space of air after the last letter
      const ls = parseFloat(getComputedStyle(name).letterSpacing) || 0;
      Object.assign(fall.style, { left: `${Math.round(r.right - ls - cell * 2)}px`, top: `${Math.round(r.bottom - cell * 4)}px`, width: `${cell * 2}px` });
      el.classList.add("is-full");
      later(() => el.classList.add("is-out"), 240);
      later(leave, 760);
    };
    const tick = (now: number) => {
      if (done) return;
      if (!ready) {
        const k = Math.min(1, (now - t0) / CREEP);
        p = 0.84 * (1 - Math.pow(1 - k, 2.2));
      } else {
        const k = Math.min(1, (now - ready) / RUN);
        p = from + (1 - from) * k;
        if (k >= 1) {
          done = true;
          set(1);
          return spill();
        }
      }
      set(p);
      raf = requestAnimationFrame(tick);
    };

    const finish = () => {
      if (ready || done) return;
      mo.disconnect();
      if (reduced) {
        done = true;
        set(1);
        el.classList.add("is-out");
        return later(leave, 400);
      }
      later(() => {
        ready = performance.now();
        from = p;
      }, Math.max(0, MIN - (performance.now() - t0)));
    };

    const mo = new MutationObserver(() => html.dataset.world && finish());
    mo.observe(html, { attributes: true, attributeFilter: ["data-world"] });
    if (!reduced) raf = requestAnimationFrame(tick);
    if (html.dataset.world) finish();
    later(finish, 6000);
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="loader" role="status" aria-label="Loading">
      <div className="loader__bg" />
      <div className="loader__fall" aria-hidden="true">
        <i />
      </div>
      {/* the same boxes as the hero, so the name lands in the same place */}
      <div className="hero loader__hero" aria-hidden="true">
        <div className="hero__in">
          <div className="hero__name">
            <span className="pixelname__text">Aditya Venkatesan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
