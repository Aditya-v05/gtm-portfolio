"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROJECTS, type Project } from "./projects";

// The work as twelve pixel tarot cards, one Olympian per system. The four
// flagships are dealt face up; the other eight wait in a deck that deals
// them all out at once when clicked. Click a card: it lifts to the middle of the screen and turns on its
// edge, and the project sheet turns in from that edge. Escape, the close
// button or a click outside turns it back.
//
// Card art lives at /cards/<god>.webp; the page passes in which exist. Until
// a god's art exists, the card draws its own pixel scene.

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// A card is the user's own red-figure artwork (public/cards/<god>.png, cut
// by scripts/cut-art.mjs). Gods without artwork yet show the card back with
// their name on a plate.
function CardFace({ p, art }: { p: Project; n?: number; art: Set<string> }) {
  const slug = p.god.toLowerCase();
  if (art.has(slug)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="card__img" src={`/cards/${slug}.png`} alt="" />;
  }
  return (
    <span className="card__blank">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="card__img" src="/cards/back.png" alt="" />
      <span className="card__blankname">{p.god}</span>
    </span>
  );
}

export default function Deck({ art = [] }: { art?: string[] }) {
  const artSet = new Set(art);
  const [open, setOpen] = useState<{ p: Project; n: number } | null>(null);
  const [spread, setSpread] = useState(false);
  const [phase, setPhase] = useState<"idle" | "opening" | "open" | "closing">("idle");
  const ghost = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const show = (p: Project, n: number, btn: HTMLButtonElement) => {
    origin.current = btn;
    setOpen({ p, n });
    setPhase("opening");
  };

  // where the ghost card has to go to sit in the middle of the screen, edge-on
  const toCentre = () => {
    const r = origin.current!.getBoundingClientRect();
    const dx = window.innerWidth / 2 - (r.left + r.width / 2);
    const dy = window.innerHeight / 2 - (r.top + r.height / 2);
    const s = Math.min(2.2, (window.innerHeight * 0.7) / r.height);
    return `perspective(1400px) translate(${dx}px, ${dy}px) scale(${s}) rotateY(90deg)`;
  };
  const AT_REST = "perspective(1400px) translate(0px, 0px) scale(1) rotateY(0deg)";
  const SHEET_EDGE = "perspective(1400px) rotateY(-90deg) scale(0.92)";
  const SHEET_FLAT = "perspective(1400px) rotateY(0deg) scale(1)";

  useEffect(() => {
    if (phase !== "opening" || !ghost.current || !sheet.current || !origin.current) return;
    document.body.style.overflow = "hidden";
    const g = ghost.current, sh = sheet.current, src = origin.current;
    const r = src.getBoundingClientRect();
    Object.assign(g.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, visibility: "visible" });
    const plain = src.classList.contains("rest__row");
    if (!plain) src.style.visibility = "hidden";
    sh.style.visibility = "hidden";
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      g.style.visibility = "hidden";
      sh.style.visibility = "visible";
      // drop every transform once open, so text is crisp and nothing is 3D
      sh.getAnimations().forEach((a) => a.cancel());
      setPhase("open");
      closeBtn.current?.focus();
    };
    if (reduced()) {
      settle();
      return;
    }
    if (plain) {
      g.style.visibility = "hidden";
      sh.style.visibility = "visible";
      sh.animate([{ transform: SHEET_EDGE }, { transform: SHEET_FLAT }], { duration: 300, easing: "cubic-bezier(.1,.6,.3,1)" }).onfinish = settle;
      const t = setTimeout(settle, 700);
      return () => clearTimeout(t);
    }
    const a = g.animate([{ transform: AT_REST }, { transform: toCentre() }], { duration: 300, easing: "cubic-bezier(.5,0,.9,.6)", fill: "forwards" });
    a.onfinish = () => {
      g.style.visibility = "hidden";
      sh.style.visibility = "visible";
      const b = sh.animate([{ transform: SHEET_EDGE }, { transform: SHEET_FLAT }], { duration: 340, easing: "cubic-bezier(.1,.6,.3,1)" });
      b.onfinish = settle;
    };
    const timer = setTimeout(settle, 1100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const close = useCallback(() => {
    if (phase !== "open" || !ghost.current || !sheet.current) return;
    setPhase("closing");
    const g = ghost.current, sh = sheet.current;
    let done = false;
    const settle = () => {
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
    if (reduced()) {
      settle();
      return;
    }
    const a = sh.animate([{ transform: SHEET_FLAT }, { transform: SHEET_EDGE }], { duration: 220, easing: "ease-in", fill: "forwards" });
    a.onfinish = () => {
      sh.style.visibility = "hidden";
      if (origin.current?.classList.contains("rest__row")) return settle();
      g.style.visibility = "visible";
      g.getAnimations().forEach((x) => x.cancel());
      const b = g.animate([{ transform: toCentre() }, { transform: AT_REST }], { duration: 300, easing: "cubic-bezier(.1,.6,.3,1)" });
      b.onfinish = settle;
    };
    setTimeout(settle, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const rest = PROJECTS.filter((p) => !p.flagship);
  const item = (p: Project, n: number, i = 0) => (
    <li key={p.slug} className="tarot__item" style={{ "--i": i } as React.CSSProperties}>
      <button
        className="card"
        onClick={(e) => show(p, n, e.currentTarget)}
        aria-haspopup="dialog"
        aria-label={`${p.god}: ${p.title}. ${p.lede} Open the project.`}
      >
        <CardFace p={p} n={n} art={artSet} />
      </button>
      <span className="tarot__title">{p.title}</span>
      <span className="tarot__type">{p.type}</span>
    </li>
  );

  return (
    <>
      <ul className="tarot tarot--major">
        {PROJECTS.map((p, n) => (p.flagship ? item(p, n) : null))}
        <li className="tarot__item tarot__item--deck">
          <button className="pile" onClick={() => setSpread((v) => !v)} aria-expanded={spread} aria-controls="the-rest">
            {/* eslint-disable @next/next/no-img-element */}
            <img className="pile__card" src="/cards/back.png" alt="" />
            <img className="pile__card" src="/cards/back.png" alt="" />
            <img className="pile__card pile__card--top" src="/cards/back.png" alt="" />
            {/* eslint-enable @next/next/no-img-element */}
          </button>
          <span className="tarot__title">{spread ? "Put them back" : `${rest.length} more`}</span>
          <span className="tarot__type">{spread ? "close the deck" : "open the deck"}</span>
        </li>
      </ul>
      {spread && (
        <ul id="the-rest" className="rest">
          {PROJECTS.map((p, n) =>
            p.flagship ? null : (
              <li key={p.slug}>
                <button className="rest__row" onClick={(e) => show(p, n, e.currentTarget)} aria-haspopup="dialog">
                  <span className="rest__title">{p.title}</span>
                  <span className="rest__lede">{p.lede}</span>
                  <span className="rest__type">{p.type}</span>
                </button>
              </li>
            )
          )}
        </ul>
      )}

      {open &&
        createPortal(
          <div className={`spin spin--${phase}`} onClick={(e) => e.target === e.currentTarget && close()}>
            <div ref={ghost} className="spin__ghost card" aria-hidden="true">
              <CardFace p={open.p} n={open.n} art={artSet} />
            </div>
            <div ref={sheet} className="sheet spin__back" role="dialog" aria-modal="true" aria-labelledby="spin-title">
              <button ref={closeBtn} className="spin__close" onClick={close} aria-label="Close and return the card">
                ×
              </button>
              <div className="spin__scroll">
                <header className="spin__head">
                  <p className="spin__god">
                    {ROMAN[open.n]} · {open.p.god} <span>· {open.p.epithet}</span>
                  </p>
                  <h3 id="spin-title" className="spin__title">
                    {open.p.title}
                  </h3>
                  <p className="spin__lede">{open.p.lede}</p>
                </header>
                <div className="spin__grid">
                  <aside className="spin__rail rail">{open.p.rail}</aside>
                  <div className="spin__body body">{open.p.body}</div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
