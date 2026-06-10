"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import ink from "@/components/headlinePaths";

const TEXT1 = "I build GTM systems";

// stroke-draw pacing for the italic line: longer outlines take longer to
// "write", clamped so dots and serifs don't blink past
const DRAW_SPEED = 36000; // font units per second
const DRAW_MIN = 0.12;
const DRAW_MAX = 0.34;

export default function HeroHeadline() {
  // SSR renders the finished headline (full text, filled ink) so no-JS,
  // reduced-motion, and print all get the real thing
  const [typed, setTyped] = useState(TEXT1.length);
  const [caretOn, setCaretOn] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tl: gsap.core.Timeline | null = null;
    const begin = () => {
      if (ran.current) return;
      ran.current = true;
      const svg = svgRef.current;
      if (!svg) return;
      const paths = Array.from(svg.querySelectorAll("path"));

      // arm the start state just-in-time to keep the pre-JS paint complete
      setTyped(0);
      setCaretOn(true);
      const lens = paths.map((p) => p.getTotalLength());
      paths.forEach((p, i) => {
        p.style.strokeDasharray = `${lens[i]}`;
        p.style.strokeDashoffset = `${lens[i]}`;
        p.style.fillOpacity = "0";
      });

      tl = gsap.timeline({ delay: 0.15 });
      // 1 — the blocky line types out
      const ticker = { n: 0 };
      tl.to(ticker, {
        n: TEXT1.length,
        duration: TEXT1.length * 0.07,
        ease: "none",
        onUpdate: () => setTyped(Math.round(ticker.n)),
      });
      tl.addLabel("write", "+=0.2");
      tl.add(() => setCaretOn(false), "write");
      // 2 — the italic line writes itself, glyph by glyph; explicit offsets
      // from the label so the fill tweens don't stretch the cadence
      let t = 0;
      paths.forEach((p, i) => {
        const d = Math.min(DRAW_MAX, Math.max(DRAW_MIN, lens[i] / DRAW_SPEED));
        tl!.to(
          p,
          { strokeDashoffset: 0, duration: d, ease: "power1.inOut" },
          `write+=${t}`
        );
        // ink soaks in as the pen finishes each letter
        tl!.to(
          p,
          { fillOpacity: 1, duration: 0.3, ease: "power1.out" },
          `write+=${t + d * 0.35}`
        );
        t += d - 0.04; // slight overlap: the pen barely lifts between letters
      });
    };

    // first visit: wait for the boot overlay to lift; afterwards: go now
    if (sessionStorage.getItem("booted") === "1") {
      begin();
    } else {
      window.addEventListener("boot:done", begin, { once: true });
    }
    return () => {
      window.removeEventListener("boot:done", begin);
      tl?.kill();
    };
  }, []);

  const { upm, bbox, glyphs } = ink;
  const padX = 30; // breathing room so non-scaling strokes don't clip
  const padY = 30;
  const vb = `${bbox.minX - padX} ${-bbox.maxY - padY} ${
    bbox.maxX - bbox.minX + padX * 2
  } ${bbox.maxY - bbox.minY + padY * 2}`;
  const hEm = (bbox.maxY - bbox.minY + padY * 2) / upm;

  return (
    <>
      <span className="line htype">
        <span className="sr-only">{TEXT1}</span>
        {/* invisible sizer locks the line box while the live layer types */}
        <span className="htype__sizer" aria-hidden="true">
          {TEXT1}
        </span>
        <span className="htype__live" aria-hidden="true">
          {TEXT1.slice(0, typed)}
          <span className={`htype__caret${caretOn ? " is-on" : ""}`} />
        </span>
      </span>
      <span className="line ital hink">
        <span className="sr-only">{ink.text}</span>
        <svg
          ref={svgRef}
          className="hink__svg"
          viewBox={vb}
          style={{ height: `${hEm}em` }}
          aria-hidden="true"
        >
          {glyphs.map((g, i) => (
            <path
              key={i}
              d={g.d}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="18"
            />
          ))}
        </svg>
      </span>
    </>
  );
}
