"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "signals", n: "01", label: "Signals" },
  { id: "work", n: "02", label: "Systems" },
  { id: "stack", n: "03", label: "Stack" },
  { id: "contact", n: "04", label: "Contact" },
];

export default function SideRail() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
          else visible.delete(e.target.id);
        }
        let best = "";
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        if (best) setActive(best);
        else if (visible.size === 0 && window.scrollY < 300) setActive("");
      },
      { rootMargin: "-20% 0px -30% 0px", threshold: [0, 0.05, 0.25, 0.5] }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <div className="siderail" aria-hidden="true">
      {SECTIONS.map((s) => (
        <a key={s.id} href={`#${s.id}`} className={active === s.id ? "on" : ""}>
          <span className="tick"></span>
          <span className="num">{s.n}</span>
          <span className="lab">{s.label}</span>
        </a>
      ))}
    </div>
  );
}
