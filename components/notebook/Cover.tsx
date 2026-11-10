"use client";

import { useEffect, useRef } from "react";

// The notebook cover. It sits on a sticky stage over the first inside page;
// as the reader scrolls the first screen, the cover swings open from its
// spine (left edge) and reveals the page underneath. After that the site
// scrolls normally. Without JS, or with reduced motion, the CSS lays the
// cover and the first page out one after the other, with no turn.
export default function Cover({
  cover,
  children,
}: {
  cover: React.ReactNode;
  children: React.ReactNode;
}) {
  const stage = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // the turn runs over the first ~85% of one screen of scrolling
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)));
      el.style.setProperty("--turn", p.toFixed(4));
      el.dataset.open = p >= 1 ? "1" : "0";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <section ref={stage} className="cover-stage" data-open="0">
      <div className="cover-stage__sticky">
        <div className="cover-stage__page">{children}</div>
        <div className="cover" role="img" aria-label="Notebook cover">
          {cover}
        </div>
      </div>
    </section>
  );
}
