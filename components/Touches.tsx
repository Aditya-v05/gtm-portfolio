"use client";

import { useEffect } from "react";

// Small behaviours that need to know where the reader is: the nav marks the section in view, and the client
// threads underline their key replies when they come on screen. It also rests looping animations that are out of view.
const SECTIONS = ["about", "work", "contact"];

export default function Touches() {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".notch a[href*='#']"));
    let raf = 0;
    const mark = () => {
      raf = 0;
      let here = "";
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) here = id;
      }
      for (const a of links) a.classList.toggle("is-here", !!here && a.hash === `#${here}`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(mark);
    };
    mark();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const threads = document.querySelector(".threads");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-seen");
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (threads) io.observe(threads);

    // Looping CSS animations keep the browser recalculating styles on every frame, even when the thing they move
    // is off screen. So anything that loops is put to rest while it is out of view.
    const rest = new IntersectionObserver(
      (es) => {
        for (const e of es) (e.target as HTMLElement).toggleAttribute("data-rest", !e.isIntersecting);
      },
      { rootMargin: "80px" }
    );
    document.querySelectorAll(".fountain, .agora, .xp").forEach((el) => rest.observe(el));
    return () => {
      rest.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
    };
  }, []);
  return null;
}
