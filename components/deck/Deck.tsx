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

const EMBLEMS: Record<string, string> = {
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
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
// each card's sky: [top, bottom, emblem]
const SKIES: [string, string, string][] = [
  ["#fbf1c4", "#f0b429", "#2a1f3d"],
  ["#f6d4c0", "#c8673a", "#2a1f3d"],
  ["#c5d3f0", "#2f4f9e", "#fbf1c4"],
  ["#fbf1c4", "#7fd0d8", "#1b2b5a"],
];
const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** a small pixel scene: dithered sky, a sun or stars, the god's emblem, ground */
function PixelArt({ god, n }: { god: string; n: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const W = 40, H = 52;
    const c = cv.getContext("2d")!;
    const [top, bot, ink] = SKIES[n % SKIES.length];
    // sky: two flat tones with an ordered-dither seam
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const t = y / H;
        const edge = t > 0.38 && t < 0.62 ? ((x + y) % 2 === 0 ? t > 0.5 : t > 0.56) : t > 0.5;
        c.fillStyle = edge ? bot : top;
        c.fillRect(x, y, 1, 1);
      }
    // stars
    c.fillStyle = ink;
    for (let i = 0; i < 9; i++) c.fillRect(Math.floor(hash(i, n) * W), Math.floor(hash(n, i + 7) * H * 0.4), 1, 1);
    // ground
    c.fillStyle = ink;
    c.fillRect(0, H - 5, W, 5);
    c.fillStyle = bot;
    for (let x = 0; x < W; x += 2) c.fillRect(x + (n % 2), H - 4, 1, 1);
    // the emblem, rasterised small so it comes out as chunky pixels
    const s = document.createElement("canvas");
    s.width = W;
    s.height = H;
    const o = s.getContext("2d")!;
    o.translate(4, 8);
    o.scale(0.32, 0.32);
    o.lineWidth = 9;
    o.lineCap = "square";
    o.strokeStyle = "#000";
    o.stroke(new Path2D(EMBLEMS[god] ?? "M30 50 H70"));
    const d = o.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (d[(y * W + x) * 4 + 3] > 120) {
          c.fillStyle = ink;
          c.fillRect(x, y, 1, 1);
        }
  }, [god, n]);
  return <canvas ref={ref} className="card__px" width={40} height={52} aria-hidden="true" />;
}

function CardFace({ p, n, art }: { p: Project; n: number; art: Set<string> }) {
  const slug = p.god.toLowerCase();
  return (
    <span className="card__face">
      <span className="card__no" aria-hidden="true">
        {ROMAN[n]}
      </span>
      <span className="card__art">
        {art.has(slug) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/cards/${slug}.webp`} alt="" />
        ) : (
          <PixelArt god={p.god} n={n} />
        )}
      </span>
      <span className="card__plate">
        <span className="card__god">{p.god}</span>
      </span>
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
    src.style.visibility = "hidden";
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
            <span className="pile__card" aria-hidden="true" />
            <span className="pile__card" aria-hidden="true" />
            <span className="pile__card pile__card--top" aria-hidden="true">
              <span className="pile__count">{rest.length}</span>
            </span>
          </button>
          <span className="tarot__title">{spread ? "Gather the deck" : "The rest of the deck"}</span>
          <span className="tarot__type">{spread ? "fold them away" : `${rest.length} more systems`}</span>
        </li>
      </ul>
      <ul id="the-rest" className={`tarot tarot--minor${spread ? " is-spread" : ""}`} hidden={!spread}>
        {PROJECTS.map((p, n) => (p.flagship ? null : item(p, n, rest.indexOf(p))))}
      </ul>

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
