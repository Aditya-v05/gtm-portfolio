"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROJECTS, type Project } from "./projects";

// The work as a deck of red-figure cards, one Olympian per system. Click a
// card and it spins out of the deck to the middle of the screen, turning
// over as it grows, to show the project on its back. Escape, the close
// button or a click outside folds it back into its place.
//
// Card art lives at /cards/<god>.webp; the page passes in which exist. Until
// a god's art exists, the card shows its frame, name plate and an emblem.

function Emblem({ god }: { god: string }) {
  // a simple attribute per god, drawn in terracotta, for cards without art yet
  const p: Record<string, string> = {
    Zeus: "M52 8 L34 52 H50 L40 92 L68 40 H52 L62 8 Z",
    Athena: "M50 10 C30 10 22 30 22 44 C22 62 36 74 50 90 C64 74 78 62 78 44 C78 30 70 10 50 10 Z M38 40 a6 6 0 1 0 0.1 0 M62 40 a6 6 0 1 0 0.1 0",
    Apollo: "M30 20 C30 60 70 60 70 20 M30 20 V80 M70 20 V80 M42 30 V74 M50 32 V76 M58 30 V74",
    Hermes: "M50 10 V90 M36 22 C20 22 20 40 36 40 M64 22 C80 22 80 40 64 40 M40 56 C30 66 70 66 60 76",
    Hephaestus: "M26 30 H74 V44 H26 Z M44 44 V88 H56 V44",
    Aphrodite: "M50 30 C40 10 14 20 22 44 C30 66 50 80 50 86 C50 80 70 66 78 44 C86 20 60 10 50 30 Z",
    Demeter: "M50 90 V20 M50 30 C40 24 36 30 38 38 M50 30 C60 24 64 30 62 38 M50 46 C40 40 36 46 38 54 M50 46 C60 40 64 46 62 54 M50 62 C40 56 36 62 38 70 M50 62 C60 56 64 62 62 70",
    Dionysus: "M30 20 H70 C70 46 60 56 50 56 C40 56 30 46 30 20 Z M50 56 V80 M36 84 H64",
    Poseidon: "M50 90 V24 M34 20 V40 C34 48 66 48 66 40 V20 M50 14 V24 M34 20 l-4 8 M66 20 l4 8",
    Ares: "M24 50 H76 M34 30 L66 70 M66 30 L34 70 M50 14 C34 14 26 28 26 40 H74 C74 28 66 14 50 14",
    Hera: "M28 70 L36 30 L50 52 L64 30 L72 70 Z M26 78 H74",
    Artemis: "M30 14 C70 30 70 70 30 86 M30 14 V86 M20 50 H86 M78 44 L86 50 L78 56",
  };
  return (
    <svg className="card__emblem" viewBox="0 0 100 100" aria-hidden="true">
      <path d={p[god] ?? "M30 50 H70"} />
    </svg>
  );
}

function CardFace({ p, art }: { p: Project; art: Set<string> }) {
  const slug = p.god.toLowerCase();
  return (
    <span className="card__face">
      <span className="card__band" aria-hidden="true" />
      <span className="card__art">
        {art.has(slug) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/cards/${slug}.webp`} alt="" />
        ) : (
          <Emblem god={p.god} />
        )}
      </span>
      <span className="card__band" aria-hidden="true" />
      <span className="card__plate">
        <span className="card__god">{p.god}</span>
      </span>
    </span>
  );
}

export default function Deck({ art = [] }: { art?: string[] }) {
  const artSet = new Set(art);
  const [open, setOpen] = useState<Project | null>(null);
  const [phase, setPhase] = useState<"idle" | "opening" | "open" | "closing">("idle");
  const stage = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The transform that puts the stage's front face exactly over the small
  // card. The front face is card-shaped and as tall as the stage, so one
  // uniform scale does it. Every keyframe uses the same three functions
  // (translate, scale, rotateY) so the browser interpolates them cleanly.
  const fromCard = () => {
    const el = stage.current, src = origin.current;
    if (!el || !src) return "translate(0px, 0px) scale(1)";
    const a = src.getBoundingClientRect();
    const h = el.offsetHeight;
    const s = a.height / h;
    const dx = a.left + a.width / 2 - window.innerWidth / 2;
    const dy = a.top + a.height / 2 - window.innerHeight / 2;
    return `translate(${dx}px, ${dy}px) scale(${s})`;
  };

  const show = (p: Project, btn: HTMLButtonElement) => {
    origin.current = btn;
    setOpen(p);
    setPhase("opening");
  };

  useEffect(() => {
    if (phase !== "opening" || !stage.current) return;
    document.body.style.overflow = "hidden";
    const el = stage.current;
    if (origin.current) origin.current.style.visibility = "hidden";
    const anim = reduced()
      ? el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "forwards" })
      : el.animate(
          [
            { transform: `${fromCard()} rotateY(0deg)` },
            { transform: "translate(0px, -16px) scale(1.03) rotateY(110deg)", offset: 0.62 },
            { transform: "translate(0px, 0px) scale(1) rotateY(180deg)" },
          ],
          { duration: 820, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" }
        );
    // finish on the animation's own event, with a timer as a safety net so a
    // dropped frame can never leave the card stuck half open
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      anim.finish();
      setPhase("open");
      closeBtn.current?.focus();
    };
    anim.onfinish = finish;
    const timer = setTimeout(finish, 1000);
    return () => clearTimeout(timer);
  }, [phase]);

  const close = useCallback(() => {
    if (phase !== "open" || !stage.current) return;
    setPhase("closing");
    const el = stage.current;
    const anim = reduced()
      ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" })
      : el.animate(
          [{ transform: "translate(0px, 0px) scale(1) rotateY(180deg)" }, { transform: `${fromCard()} rotateY(0deg)` }],
          { duration: 620, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" }
        );
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (origin.current) {
        origin.current.style.visibility = "";
        origin.current.focus();
      }
      document.body.style.overflow = "";
      setOpen(null);
      setPhase("idle");
    };
    anim.onfinish = finish;
    setTimeout(finish, 800);
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // a fanned hand: the four flagships in the middle, the rest either side
  const flagships = PROJECTS.filter((p) => p.flagship);
  const rest = PROJECTS.filter((p) => !p.flagship);
  const hand = [...rest.slice(0, 4), ...flagships, ...rest.slice(4)];
  const [hover, setHover] = useState<Project | null>(null);
  const shown = hover ?? open ?? flagships[0];

  return (
    <>
      <ul className="fan" onMouseLeave={() => setHover(null)}>
        {hand.map((p, i) => (
          <li
            key={p.slug}
            className={`fan__item${p.flagship ? " fan__item--major" : ""}`}
            style={{ "--t": ((i - (hand.length - 1) / 2) / ((hand.length - 1) / 2)).toFixed(3) } as React.CSSProperties}
          >
            <button
              className="card"
              onClick={(e) => show(p, e.currentTarget)}
              onMouseEnter={() => setHover(p)}
              onFocus={() => setHover(p)}
              aria-haspopup="dialog"
              aria-label={`${p.god}: ${p.title}. ${p.lede} Open the project.`}
            >
              <CardFace p={p} art={artSet} />
            </button>
          </li>
        ))}
      </ul>
      <p className="fan__caption" aria-live="polite">
        <span className="fan__god">{shown.god}</span>
        <span className="fan__title">{shown.title}</span>
        <span className="fan__lede">{shown.lede}</span>
      </p>

      {open && createPortal(
        <div className={`spin spin--${phase}`} onClick={(e) => e.target === e.currentTarget && close()}>
          <div ref={stage} className="spin__stage" role="dialog" aria-modal="true" aria-labelledby="spin-title">
            <div className="spin__front" aria-hidden="true">
              <CardFace p={open} art={artSet} />
            </div>
            <div className="spin__back">
              <button ref={closeBtn} className="spin__close" onClick={close} aria-label="Close and return the card">
                ×
              </button>
              <div className="spin__scroll">
                <header className="spin__head">
                  <p className="spin__god">
                    {open.god} <span>· {open.epithet}</span>
                  </p>
                  <h3 id="spin-title" className="spin__title">
                    {open.title}
                  </h3>
                  <p className="spin__lede">{open.lede}</p>
                </header>
                <div className="spin__grid">
                  <aside className="spin__rail rail">{open.rail}</aside>
                  <div className="spin__body body">{open.body}</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
