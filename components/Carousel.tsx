"use client";

// A horizontal card rail used across SHEET 01, where several sets of peer
// items would otherwise stack into a very long column.
//
// Deliberately built on native scroll with scroll-snap rather than a
// transform track: it keeps touch, trackpad and keyboard scrolling for free,
// stays accessible when JS is slow, and never fights the page's global
// scroll-behavior. The arrows just call scrollBy.

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  /** cards visible at desktop width; drives the flex-basis via a data attr */
  per?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
};

export default function Carousel({ label, per = 3, className = "", children }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [count, setCount] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const step = () => {
    const t = trackRef.current;
    if (!t) return 0;
    const first = t.firstElementChild as HTMLElement | null;
    if (!first) return t.clientWidth;
    const gap = parseFloat(getComputedStyle(t).columnGap || "14") || 14;
    return first.offsetWidth + gap;
  };

  const sync = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const s = step() || 1;
    const max = t.scrollWidth - t.clientWidth;
    setCount(t.children.length);
    setAt(Math.min(t.children.length - 1, Math.round(t.scrollLeft / s)));
    setCanPrev(t.scrollLeft > 4);
    setCanNext(t.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    sync();
    t.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(t);
    return () => {
      t.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sync]);

  const go = (dir: 1 | -1) => {
    const t = trackRef.current;
    if (!t) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollBy({ left: dir * (step() || t.clientWidth), behavior: reduce ? "instant" : "smooth" });
  };

  return (
    <div className={`car ${className}`}>
      <div className="car__hd">
        <div className="car__k">{label}</div>
        <div className="car__ctl">
          <span className="car__at" aria-hidden="true">
            {String(Math.min(at + 1, count || 1)).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="car__btn cursor-target"
            onClick={() => go(-1)}
            disabled={!canPrev}
            aria-label={`Previous ${label}`}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="car__btn cursor-target"
            onClick={() => go(1)}
            disabled={!canNext}
            aria-label={`Next ${label}`}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="car__track"
        data-per={per}
        role="group"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
