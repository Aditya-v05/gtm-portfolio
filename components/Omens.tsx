"use client";

import { useEffect, useRef, useState } from "react";

// Rare events, rolled once per visit.
//  - Hydra: one visit in five, at night, a three-headed hydra rises out of
//    the harbour in the closing scene. Switch to day and it sinks again.
//  - Lightning: one visit in three, a bolt strikes over the hero with a
//    flash and a rumble through the page.
// Add ?hydra or ?zeus to the address to force one while testing.

export function Hydra() {
  const ref = useRef<HTMLDivElement>(null);
  const [chosen, setChosen] = useState(false);
  const [up, setUp] = useState(false);

  useEffect(() => {
    setChosen(location.search.includes("hydra") || Math.random() < 0.2);
  }, []);
  useEffect(() => {
    if (!chosen || !ref.current) return;
    let seen = false;
    const sync = () => setUp(seen && document.documentElement.dataset.theme === "dark");
    const io = new IntersectionObserver((e) => {
      seen = e[0].isIntersecting;
      sync();
    }, { threshold: 0.5 });
    io.observe(ref.current);
    window.addEventListener("themechange", sync);
    return () => {
      io.disconnect();
      window.removeEventListener("themechange", sync);
    };
  }, [chosen]);

  if (!chosen) return null;
  return (
    <div ref={ref} className={`hydra${up ? " is-up" : ""}`} aria-hidden="true">
      <div className="hydra__body" />
      <div className="hydra__foam" />
    </div>
  );
}

// a jagged bolt on a 4px grid, from the top of the sky down to the horizon
function bolt(seed: number) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let x = 60 + r() * 30, y = 0;
  let d = `M${x} 0`;
  const forks: string[] = [];
  while (y < 100) {
    y += 5 + r() * 9;
    x += (r() - 0.45) * 16;
    d += ` L${x.toFixed(1)} ${Math.min(y, 100).toFixed(1)}`;
    if (r() < 0.3 && y < 80) forks.push(`M${x.toFixed(1)} ${y.toFixed(1)} l${(8 + r() * 10).toFixed(1)} ${(6 + r() * 8).toFixed(1)} l${(r() * 6 - 1).toFixed(1)} ${(6 + r() * 8).toFixed(1)}`);
  }
  return { d, forks };
}

export function Lightning() {
  const [strike, setStrike] = useState<{ d: string; forks: string[] } | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!(location.search.includes("zeus") || Math.random() < 1 / 3)) return;
    const t = setTimeout(() => {
      if (window.scrollY > window.innerHeight * 0.5) return;
      setStrike(bolt(Date.now() % 100000));
      document.body.classList.add("thunder");
      setTimeout(() => document.body.classList.remove("thunder"), 900);
      setTimeout(() => setStrike(null), 1300);
    }, 1800 + Math.random() * 2500);
    return () => clearTimeout(t);
  }, []);
  if (!strike) return null;
  return (
    <div className="lightning" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="lightning__glow" d={strike.d} />
        <path className="lightning__bolt" d={strike.d} />
        {strike.forks.map((f, i) => (
          <path key={i} className="lightning__fork" d={f} />
        ))}
      </svg>
    </div>
  );
}
