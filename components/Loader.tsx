"use client";

import { useEffect, useRef, useState } from "react";

// The loading screen: a sheet of pixel water falls down the whole screen
// while the 3D city loads, and nothing else shows. When the city is ready the
// water falls away in columns, each letting go at its own moment, but it
// stays inside the letters of the name: the name is left standing, made of
// the same running water, exactly where the hero has it. Then the water in
// the letters settles to the name's own blue and the page dissolves in
// behind it. The name never moves.
//
// It is in the server markup and animated in CSS, so it runs before any
// script does. The falling streaks move by transform only, so they stay
// smooth while the city is being built. It plays once per visit; add ?loader
// to the address to watch it again, held a little longer.

// each column lets go at its own time and falls at its own pace; seeded, so
// the server and the browser agree
const COLS = 48;
const DROPS = (() => {
  let s = 20261111;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: COLS }, () => ({ d: Math.round(rnd() * rnd() * 520), t: Math.round(380 + rnd() * 260) }));
})();

const Name = ({ wet = false }: { wet?: boolean }) => (
  // the same boxes as the hero, so the name lands in the same place
  <div className={`hero loader__hero${wet ? " loader__wet" : ""}`} aria-hidden="true">
    <div className="hero__in">
      <div className="hero__name">
        <span className="pixelname__text">Aditya Venkatesan</span>
      </div>
    </div>
  </div>
);

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
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    let finished = false;

    // sit exactly on the real name
    const real = document.querySelector<HTMLElement>(".page .pixelname__text");
    const copies = el.querySelectorAll<HTMLElement>(".pixelname__text");
    if (real && copies[0]) {
      const a = real.getBoundingClientRect(), b = copies[0].getBoundingClientRect();
      if (a.left !== b.left || a.top !== b.top) copies.forEach((c) => (c.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`));
      // line the water in the letters up with the water on the screen
      el.style.setProperty("--bx", `${-Math.round(a.left)}px`);
      el.style.setProperty("--by", `${-Math.round(a.top)}px`);
    }

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
      later(() => {
        if (reduced) {
          el.classList.add("is-out");
          return later(leave, 400);
        }
        el.classList.add("is-drain"); // the columns let go, all gone by about 1.1s
        later(() => el.classList.add("is-out"), 1250); // the name stands in water for a beat, then the page
        later(leave, 1700);
      }, Math.max(0, (demo ? 2400 : 650) - performance.now()));
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
      <div className="loader__bg" />
      <Name />
      <Name wet />
      <div className="loader__water">
        {DROPS.map((c, i) => (
          <i key={i} style={{ "--i": i, "--d": `${c.d}ms`, "--t": `${c.t}ms` } as React.CSSProperties}>
            <b />
            <b />
          </i>
        ))}
      </div>
    </div>
  );
}
