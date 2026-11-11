"use client";

import { useEffect, useRef, useState } from "react";

// About: the biography on a stone plaque, and a small Aditya beside it in
// one of three poses, chosen at random on each visit. Press him for another.
// He stands a little off the page: a hard pixel shadow behind him, a shadow
// on the ground, and a slight turn toward the pointer.
const POSES = [
  { src: "/horse/wave.png", w: 223, h: 532, alt: "waving" },
  { src: "/horse/read.png", w: 240, h: 534, alt: "reading a scroll" },
  { src: "/horse/shrug.png", w: 342, h: 528, alt: "shrugging" },
];

export default function About() {
  const fig = useRef<HTMLButtonElement>(null);
  // the first pose is fixed for the server; a random one replaces it on load
  const [i, setI] = useState(0);
  const [swap, setSwap] = useState(0);
  useEffect(() => setI(Math.floor(Math.random() * POSES.length)), []);
  const next = () => {
    setI((cur) => (cur + 1 + Math.floor(Math.random() * (POSES.length - 1))) % POSES.length);
    setSwap((n) => n + 1);
  };

  // he turns a few degrees toward the pointer
  useEffect(() => {
    const el = fig.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      el.style.setProperty("--ry", `${(nx * 14).toFixed(1)}deg`);
      el.style.setProperty("--rx", `${(-ny * 6).toFixed(1)}deg`);
      el.style.setProperty("--sx", `${Math.round(-nx * 10)}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const p = POSES[i];
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

        <button ref={fig} className="figure" onClick={next} aria-label={`A small pixel-art Aditya, ${p.alt}. Press for another pose.`}>
          <span className="figure__ground" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={swap} className={swap ? "is-swapped" : ""} src={p.src} alt="" width={p.w} height={p.h} draggable={false} />
        </button>
      </div>
    </section>
  );
}
