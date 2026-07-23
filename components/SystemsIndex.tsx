"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

// useLayoutEffect runs before paint; on the server it warns, so fall back.
// The collapse-on-mount must happen pre-paint so the SSR-expanded content
// (kept for crawlers, print, and no-JS readers) never flashes.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Ctx = { openId: string | null; toggle: (id: string) => void };
const AccordionCtx = createContext<Ctx | null>(null);

export function SystemsAccordion({
  defaultOpen = "01",
  children,
}: {
  defaultOpen?: string;
  children: React.ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggle = (id: string) => setOpenId((p) => (p === id ? null : id));

  // cascade: the index rows deal in one after another the first time the
  // section scrolls into view
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduceMotion()) return;
    const rows = root.querySelectorAll(".fold");
    gsap.set(rows, { y: 18, autoAlpha: 0 });
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        gsap.to(rows, {
          y: 0,
          autoAlpha: 1,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.055,
          clearProps: "all",
        });
      },
      { threshold: 0.08 }
    );
    io.observe(root);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AccordionCtx.Provider value={{ openId, toggle }}>
      <div ref={rootRef} className="folds">
        {children}
      </div>
    </AccordionCtx.Provider>
  );
}

export function SystemFold({
  id,
  title,
  lede,
  type,
  status = "shipped",
  children,
}: {
  id: string;
  title: string;
  lede: string;
  type: string;
  status?: "live" | "shipped";
  children: React.ReactNode;
}) {
  const ctx = useContext(AccordionCtx);
  const open = ctx?.openId === id;
  const bodyRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useIsoLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (first.current) {
      // initial state: no animation, just collapse the closed folds pre-paint
      first.current = false;
      gsap.set(el, { height: open ? "auto" : 0 });
      return;
    }
    // When this fold closes because one BELOW it opened, its collapse would
    // shift the clicked row (and the user's whole view) upward. Counter-scroll
    // by exactly the shrinkage so the page stays visually pinned. Never touch
    // the scroll otherwise - hijacking the user's scroll reads as a jerk.
    const closingAboveNewOpen =
      !open && ctx?.openId != null && parseInt(id, 10) < parseInt(ctx.openId, 10);

    if (reduceMotion()) {
      if (!open && closingAboveNewOpen) {
        const h = el.getBoundingClientRect().height;
        gsap.set(el, { height: 0 });
        // behavior:"instant" - the page uses CSS scroll-behavior:smooth, which
        // would turn compensation into a laggy glide
        if (h) window.scrollBy({ top: -h, behavior: "instant" });
      } else {
        gsap.set(el, { height: open ? "auto" : 0 });
      }
      return;
    }
    gsap.killTweensOf(el);
    if (open) {
      // unfold: the drawer opens, then the card is dealt onto the table -
      // rail and body blocks rise in sequence
      const items = el.querySelectorAll(".rail, .body > *");
      const tl = gsap.timeline();
      tl.fromTo(
        el,
        { height: 0 },
        { height: () => el.scrollHeight, duration: 0.65, ease: "power3.inOut" }
      );
      tl.fromTo(
        items,
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out", stagger: 0.06, clearProps: "all" },
        "-=0.3"
      );
      tl.set(el, { height: "auto" });
    } else {
      // closing reads snappier at ~2x the opening speed
      let prevH = el.getBoundingClientRect().height;
      gsap.to(el, {
        height: 0,
        duration: 0.4,
        ease: "power3.inOut",
        onUpdate: closingAboveNewOpen
          ? () => {
              const h = el.getBoundingClientRect().height;
              const shrunk = prevH - h;
              prevH = h;
              // instant: CSS scroll-behavior:smooth would smear these
              // per-frame corrections into overlapping glides
              if (shrunk) window.scrollBy({ top: -shrunk, behavior: "instant" });
            }
          : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // the cursor whisper: a tiny mono label trailing the pointer over the head.
  // Driven through a ref (no re-render per mousemove).
  const moveHint = (e: React.MouseEvent<HTMLButtonElement>) => {
    const h = hintRef.current;
    if (!h) return;
    const r = e.currentTarget.getBoundingClientRect();
    h.style.transform = `translate(${e.clientX - r.left + 22}px, ${e.clientY - r.top + 10}px)`;
    h.style.opacity = "1";
  };
  const hideHint = () => {
    if (hintRef.current) hintRef.current.style.opacity = "0";
  };

  return (
    <div className={`fold${open ? " is-open" : ""}`}>
      <button
        ref={headRef}
        className="fold__head cursor-target"
        onClick={() => ctx?.toggle(id)}
        onMouseMove={moveHint}
        onMouseLeave={hideHint}
        aria-expanded={open}
      >
        <span className="fold__no">{id}</span>
        <span className="fold__t">
          <span className="fold__title">{title}</span>
          <span className="fold__lede">{lede}</span>
        </span>
        <span className="fold__type">{type}</span>
        <span className={`fold__st${status === "live" ? " is-live" : ""}`}>
          <span className="d"></span> {status}
        </span>
        <span className="fold__x" aria-hidden="true">
          +
        </span>
        <span ref={hintRef} className="fold__hint" aria-hidden="true">
          {open ? "fold" : "unfold ▸"}
        </span>
      </button>
      <div ref={bodyRef} className="fold__body">
        <div className="fold__inner">{children}</div>
      </div>
    </div>
  );
}
