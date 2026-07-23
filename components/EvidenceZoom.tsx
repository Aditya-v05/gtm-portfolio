"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

// Click any [data-zoom] evidence artifact and it lifts off the page into a
// lightbox: the original is cloned in place, flown to center with a scale
// transform (GPU-smooth), and reversed on close. Vanilla DOM on purpose -
// the artifacts are static server-rendered exhibits, so cloning is safe.
export default function EvidenceZoom() {
  useEffect(() => {
    let active: {
      backdrop: HTMLDivElement;
      clone: HTMLElement;
      source: HTMLElement;
      closing: boolean;
    } | null = null;

    const reduce = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const close = () => {
      if (!active || active.closing) return;
      active.closing = true;
      const { backdrop, clone, source } = active;
      const done = () => {
        source.style.visibility = "";
        backdrop.remove();
        clone.remove();
        document.body.style.overflow = "";
        active = null;
      };
      if (reduce()) return done();
      gsap.to(clone, { x: 0, y: 0, scale: 1, duration: 0.4, ease: "power3.inOut", onComplete: done });
      gsap.to(backdrop, { opacity: 0, duration: 0.35 });
    };

    const open = (el: HTMLElement) => {
      if (active) return;
      const r = el.getBoundingClientRect();

      const backdrop = document.createElement("div");
      backdrop.className = "zoomlayer__backdrop";
      document.body.appendChild(backdrop);

      const clone = el.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-zoom");
      clone.classList.add("zoomlayer__clone");
      clone.style.cssText += `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;z-index:210;transform-origin:center center;`;
      document.body.appendChild(clone);

      el.style.visibility = "hidden"; // the artifact "lifts off" the page
      document.body.style.overflow = "hidden";
      active = { backdrop, clone, source: el, closing: false };

      const scale = Math.min((0.94 * innerWidth) / r.width, (0.92 * innerHeight) / r.height);
      const x = innerWidth / 2 - (r.left + r.width / 2);
      const y = innerHeight / 2 - (r.top + r.height / 2);

      if (reduce()) {
        gsap.set(clone, { x, y, scale });
        gsap.set(backdrop, { opacity: 1 });
      } else {
        gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4 });
        gsap.to(clone, { x, y, scale, duration: 0.55, ease: "power3.inOut" });
      }

      backdrop.addEventListener("click", close);
      clone.addEventListener("click", close);
    };

    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest?.("[data-zoom]");
      if (t instanceof HTMLElement) open(t);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      close();
    };
  }, []);

  return null;
}
