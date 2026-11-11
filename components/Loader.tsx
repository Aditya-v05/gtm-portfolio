"use client";

import { useEffect, useRef, useState } from "react";

// The loading screen: a sheet of pixel water falls down the whole screen
// while the 3D city loads, with the name showing pale through it. When the
// city is ready the water drops away, top edge first, and leaves only the
// name, now in its own blue, exactly where the hero has it. Then the page
// behind dissolves in and the name never moves.
//
// It is in the server markup and animated in CSS, so it runs before any
// script does. It plays once per visit; add ?loader to the address to watch
// it again, held a little longer.

const Name = () => (
  // the same boxes as the hero, so the name lands in the same place
  <div className="hero loader__hero" aria-hidden="true">
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
        el.classList.add("is-drain"); // the water drops away, 0.6s
        later(() => el.classList.add("is-out"), 720); // the name alone for a beat, then the page
        later(leave, 1080);
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
      <div className="loader__water">
        <div className="loader__still">
          <div className="loader__sheet loader__sheet--far" />
          <div className="loader__sheet loader__sheet--near" />
          <Name />
        </div>
      </div>
    </div>
  );
}
