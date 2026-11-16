"use client";

import { useEffect, useRef } from "react";
import { SOCIALS } from "@/lib/socials";

// About: the biography on a stone plaque, and a small Aditya waving from a
// Greek terrace. The scene has depth, like the portrait in the user's
// reference recording: as the pointer moves he turns and slides toward it,
// the terrace behind him slides the other way, and his shadow shifts. The
// motion is eased every frame, so it glides and settles.
export default function About() {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scene.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.45)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight * 0.6)));
      if (!raf && r.bottom > 0 && r.top < innerHeight) raf = requestAnimationFrame(tick);
    };
    // the loop sleeps once the figure has settled, and a pointer move wakes it
    const tick = () => {
      if (Math.abs(tx - x) < 0.0005 && Math.abs(ty - y) < 0.0005) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      el.style.setProperty("--nx", x.toFixed(4));
      el.style.setProperty("--ny", y.toFixed(4));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
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
          <ul className="biostone__links" aria-label="Find me elsewhere">
            {SOCIALS.map(([name, href, d]) => (
              <li key={name}>
                <a href={href} target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
                    <path d={d} />
                  </svg>
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div ref={scene} className="scene3">
          <div className="scene3__frame" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="scene3__back" src="/art/terrace.png" alt="" draggable={false} />
          </div>
          <span className="scene3__shadow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="scene3__me" src="/horse/wave.png" alt="A small pixel-art Aditya, waving" width={223} height={532} draggable={false} />
        </div>
      </div>
    </section>
  );
}
