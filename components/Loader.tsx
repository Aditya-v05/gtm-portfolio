"use client";

import { useEffect, useRef, useState } from "react";

// While the 3D city loads, the hero is not shown half-built: a plain sheet of
// sky covers it, with the name on it exactly where the hero has it. When the
// city is ready the sheet dissolves in a few hard steps and the name is left
// standing over the finished scene. The name never moves.
//
// It is in the server markup, so it is there from the first paint. It belongs
// to the top of the page, not the screen, so a reload further down the page
// never sees it.

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
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    let finished = false;

    // sit exactly on the real name
    const real = document.querySelector<HTMLElement>(".page .pixelname__text");
    const copy = el.querySelector<HTMLElement>(".pixelname__text");
    if (real && copy) {
      const a = real.getBoundingClientRect(), b = copy.getBoundingClientRect();
      if (a.left !== b.left || a.top !== b.top) copy.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }

    const finish = () => {
      if (finished) return;
      finished = true;
      mo.disconnect();
      el.classList.add("is-out");
      later(() => {
        setGone(true);
        window.dispatchEvent(new Event("loader:done"));
      }, 420);
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
    </div>
  );
}
