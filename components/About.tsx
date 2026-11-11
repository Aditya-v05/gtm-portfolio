"use client";

import { useEffect, useRef } from "react";

// About: the biography on a stone plaque, and a small Aditya waving from an
// arched niche in a wall of cut stone. He stands in front of the niche, not
// inside its frame: his hair and hand overlap the stonework, and as the
// pointer moves he leans toward it while the wall shifts the other way, so
// he seems to stand out from the page.
export default function About() {
  const niche = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = niche.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      el.style.setProperty("--nx", nx.toFixed(3));
      el.style.setProperty("--ny", ny.toFixed(3));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <section id="about" className="band band--about">
      <div className="band__in about">
        <div className="biostone">
          <p className="biostone__k">About</p>
          <h2 className="biostone__hey">Hey, I&apos;m Aditya.</h2>
          <p className="biostone__lead">
            I&apos;m a GTM engineer. I like building systems that find customers, uncover weird buying
            signals, and save people from spending their lives copying spreadsheets.
          </p>
          <p>Before this, I built GTM infrastructure at Relling and Huntd.</p>
          <p>
            Outside work, I&apos;m usually playing a roguelike, reading something by Jules Verne,
            listening to hip-hop, or convincing myself that another three-hour research rabbit hole is
            completely necessary.
          </p>
        </div>

        <div ref={niche} className="niche">
          <div className="niche__wall" aria-hidden="true">
            <span className="niche__arch" />
            <span className="niche__step" />
          </div>
          <span className="niche__shadow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="niche__me" src="/horse/wave.png" alt="A small pixel-art Aditya, waving" width={223} height={532} draggable={false} />
        </div>
      </div>
    </section>
  );
}
