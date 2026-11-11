"use client";

import { useEffect, useRef, useState } from "react";
import A from "./study-anchors.json";
import SZ from "./sprite-sizes.json";

// The study: a corner of an old Greek workshop that somebody clearly lives
// in, with the user's own sprites left lying about on it. No frame: the
// room's own ragged outline is its edge.
//
// Three things are worth playing with: the d20 rolls across the floor, the
// sticky note peels off (and was hiding the last line of the inscription),
// and the little bust answers back. The rest react when touched.

// The room itself is modelled and lit in Blender, then rendered as pixel art
// by scripts/build-study.py. That script also writes where each surface is.
const S = 3; // the render is shown at 3x
const [W, H] = A.size;
/** a point on the floor (world x, y) in CSS pixels */
const floor = (x: number, y: number) => ({ x: (A.origin[0] + x * A.ux[0] + y * A.uy[0]) * S, y: (A.origin[1] + x * A.ux[1] + y * A.uy[1]) * S });

const BUST = ["Just following up.", "Bumping this to the top of your inbox.", "Per my last statue.", "Circling back.", "Any thoughts?", "He came. He saw. He followed up."];
const ROLL = (n: number) =>
  n === 20 ? "Nat 20. They signed before the demo." : n >= 16 ? "Meeting booked." : n >= 11 ? "“Send me more info.”" : n >= 6 ? "Opened. No reply. Follow up." : n >= 2 ? "Bounced. Clean the list." : "Nat 1. The CRM is down.";

export default function Courtyard() {
  const wrap = useRef<HTMLDivElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const pupil = useRef<HTMLSpanElement>(null);
  const die = useRef<HTMLButtonElement>(null);
  const [say, setSay] = useState<{ who: string; text: string } | null>(null);
  const [bustN, setBustN] = useState(0);
  const [dieAt, setDieAt] = useState({ x: 36, y: 70 });
  const [busy, setBusy] = useState(false);
  const [face, setFace] = useState<number | null>(null);
  const [puff, setPuff] = useState(0);
  const [note, setNote] = useState<{ x: number; y: number; peeled: boolean }>({ x: 0, y: 0, peeled: false });
  const [held, setHeld] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const scale = useRef(1);

  useEffect(() => {
    const w = wrap.current, r = room.current;
    if (!w || !r) return;
    const fit = () => {
      scale.current = Math.min(1, w.clientWidth / (W * S));
      w.style.setProperty("--s", String(scale.current));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(w);
    const io = new IntersectionObserver((e) => e[0].isIntersecting && (r.classList.add("is-in"), io.disconnect()), { threshold: 0.2 });
    io.observe(w);
    return () => (ro.disconnect(), io.disconnect());
  }, []);

  // the watcher's eye follows the pointer
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = room.current;
      if (r) {
        const b = r.getBoundingClientRect();
        if (b.bottom > 0 && b.top < innerHeight) {
          r.style.setProperty("--px", `${Math.round(((e.clientX - (b.left + b.width / 2)) / innerWidth) * -8)}px`);
          r.style.setProperty("--py", `${Math.round(((e.clientY - (b.top + b.height / 2)) / innerHeight) * -5)}px`);
        }
      }
      const p = pupil.current;
      if (!p) return;
      const q = p.parentElement!.getBoundingClientRect();
      const dx = e.clientX - q.left, dy = e.clientY - q.top, d = Math.hypot(dx, dy) || 1;
      p.style.transform = `translate(${Math.round((dx / d) * Math.min(4, d / 40))}px, ${Math.round((dy / d) * Math.min(2, d / 80))}px)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  // a message says its piece and goes
  useEffect(() => {
    if (!say) return;
    const id = setTimeout(() => setSay(null), 3200);
    return () => clearTimeout(id);
  }, [say]);

  useEffect(() => {
    if (!say && !flipped) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && (setSay(null), setFlipped(false));
    const out = (e: PointerEvent) => !(e.target as HTMLElement).closest?.(".thing") && setSay(null);
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", out);
    return () => (window.removeEventListener("keydown", key), window.removeEventListener("pointerdown", out));
  }, [say, flipped]);

  const speak = (who: string, text: string) => setSay((s) => (s?.who === who && s.text === text ? null : { who, text }));

  // the d20 tumbles across the floor to somewhere new, bouncing as it goes
  const rollDie = () => {
    const el = die.current;
    if (busy || !el) return;
    // kept to the part of the rug clear of the column and the books
    const to = { x: 30 + Math.random() * 14, y: 60 + Math.random() * 18 };
    const a = floor(dieAt.x, dieAt.y), b = floor(to.x, to.y);
    const n = 1 + Math.floor(Math.random() * 20);
    setSay(null);
    const land = () => {
      setDieAt(to);
      setBusy(false);
      setFace(n);
      setSay({ who: "d20", text: ROLL(n) });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return land();
    setBusy(true);
    const dx = b.x - a.x, dy = b.y - a.y;
    const hop = (t: number, lift: number) => `translate(${Math.round(dx * t)}px, ${Math.round(dy * t - lift)}px)`;
    el.animate(
      [0, 0.18, 0.36, 0.52, 0.68, 0.8, 0.9, 1].map((t, i) => ({ transform: hop(t, [0, 46, 0, 26, 0, 12, 0, 0][i]), offset: t })),
      { duration: 900, easing: "linear" }
    ).onfinish = land;
    el.querySelector("img")?.animate([{ rotate: "0deg" }, { rotate: `${dx >= 0 ? 720 : -720}deg` }], { duration: 900, easing: "steps(16)" });
  };

  // the note: peel it off and put it anywhere; a plain click turns it over
  const grab = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(null);
  const noteDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    grab.current = { px: e.clientX, py: e.clientY, x: note.x, y: note.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const noteMove = (e: React.PointerEvent) => {
    const g = grab.current;
    if (!g) return;
    const dx = (e.clientX - g.px) / scale.current, dy = (e.clientY - g.py) / scale.current;
    if (!g.moved && Math.hypot(dx, dy) < 6) return;
    g.moved = true;
    setHeld(true);
    setNote({ x: Math.max(-190, Math.min(430, g.x + dx)), y: Math.max(-220, Math.min(420, g.y + dy)), peeled: true });
  };
  const noteUp = () => {
    const g = grab.current;
    grab.current = null;
    setHeld(false);
    if (g && !g.moved) setFlipped((v) => !v);
  };
  const noteKey = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[e.key];
    if (step) (e.preventDefault(), setNote((n) => ({ x: Math.max(-190, Math.min(430, n.x + step[0])), y: Math.max(-220, Math.min(420, n.y + step[1])), peeled: true })));
    else if (e.key === "Enter" || e.key === " ") (e.preventDefault(), setFlipped((v) => !v));
  };

  /** stand a pixel sprite with its foot on a point given in CSS pixels */
  const stand = (p: { x: number; y: number }, name: keyof typeof SZ, foot = 0.96, i = 0) => {
    const [w, h] = SZ[name];
    return { left: Math.round(p.x - (w * S) / 2), top: Math.round(p.y - h * S * foot), width: w * S, height: h * S, "--i": i } as React.CSSProperties;
  };
  const on = (k: "bust" | "watcher" | "dragon" | "phones" | "tablet" | "note") => ({ x: A[k][0] * S, y: A[k][1] * S });
  const tab = on("tablet");

  /* eslint-disable @next/next/no-img-element */
  return (
    <div ref={wrap} className="study-wrap">
      <div ref={room} className="study">
        <img className="study__canvas" src="/art/study.png" alt="" width={W} height={H} draggable={false} />
        <span className="study__water" aria-hidden="true" style={{ left: A.water[0][0] * S, top: A.water[0][1] * S, "--wx": `${(A.water[1][0] - A.water[0][0]) * S}px`, "--wy": `${(A.water[1][1] - A.water[0][1]) * S}px` } as React.CSSProperties}>
          <i /><i /><i /><i />
        </span>
        <span className="study__dust" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </span>
        {/* the inscription: the note has been stuck over its last line */}
        <p className="study__tablet" style={{ left: tab.x, top: tab.y }}>
          <span>He came.</span>
          <span>He saw.</span>
          <span>He followed up.</span>
        </p>

        <button data-label="Inspect" className="thing thing--watcher" style={stand(on("watcher"), "watcher", 0.97, 1)} onClick={() => speak("watcher", "It has been watching you scroll.")} aria-label="A one-eyed figurine on the shelf">
          <img src="/art/px/watcher.png" alt="" draggable={false} />
          <span className="thing__eye" aria-hidden="true">
            <span ref={pupil} className="thing__pupil" />
          </span>
          {say?.who === "watcher" && <span className="thing__say">{say.text}</span>}
        </button>

        <button data-label="Poke" className="thing thing--bust" style={stand(on("bust"), "bust", 0.98, 2)} onClick={() => (setBustN((n) => n + 1), setSay({ who: "bust", text: BUST[bustN % BUST.length] }))} aria-label="A small marble bust of Aditya on the desk. Press it.">
          <img key={bustN} className={bustN ? "is-nudged" : ""} src="/art/px/bust.png" alt="" draggable={false} />
          <span className="bust__lid bust__lid--l" aria-hidden="true" />
          <span className="bust__lid bust__lid--r" aria-hidden="true" />
          {say?.who === "bust" && <span className="thing__say">{say.text}</span>}
        </button>

        <button data-label="Inspect" className="thing thing--dragon" style={stand(on("dragon"), "dragon", 0.94, 3)} onClick={() => (setPuff((n) => n + 1), setSay(null), setTimeout(() => setSay({ who: "dragon", text: "D&D. Fantasy anything." }), 520))} aria-label="A dragon figurine balanced on a stack of books">
          <img key={puff} className={puff ? "is-roaring" : ""} src="/art/px/dragon.png" alt="" draggable={false} />
          {puff > 0 && (
            <span key={`p${puff}`} className="thing__puff" aria-hidden="true">
              <i /><i /><i />
            </span>
          )}
          {say?.who === "dragon" && <span className="thing__say">{say.text}</span>}
        </button>

        <button data-label="Listen" className="thing thing--phones" style={stand(on("phones"), "headphones", 0.9, 4)} onClick={() => speak("phones", "Hip-hop, on while I build.")} aria-label="Stone headphones hung on a broken column">
          <img src="/art/px/headphones.png" alt="" draggable={false} />
          {say?.who === "phones" && <span className="thing__say">{say.text}</span>}
        </button>

        <button ref={die} data-label="Roll" className={`thing thing--d20${busy ? " is-busy" : ""}`} style={stand(floor(dieAt.x, dieAt.y), "d20", 0.9, 5)} onClick={rollDie} aria-label="A twenty-sided die on the floor. Press to roll it.">
          <img src="/art/px/d20.png" alt="" draggable={false} />
          {face !== null && !busy && <span className={`thing__face${face === 20 ? " is-crit" : face === 1 ? " is-fail" : ""}`}>{face}</span>}
          {say?.who === "d20" && <span className="thing__say">{say.text}</span>}
        </button>

        <button
          data-label={note.peeled ? "Move" : "Peel"} className={`thing thing--note${held ? " is-held" : ""}${note.peeled ? " is-peeled" : ""}${flipped ? " is-flipped" : ""}`}
          style={{ left: on("note").x - 39 + note.x, top: on("note").y - 30 + note.y, width: 78, "--i": 6 } as React.CSSProperties}
          onPointerDown={noteDown}
          onPointerMove={noteMove}
          onPointerUp={noteUp}
          onPointerCancel={noteUp}
          onKeyDown={noteKey}
          aria-label={flipped ? "Sticky note, turned over: Just circling back on my last 3 follow-ups." : "Sticky note: Follow up! Drag it or use the arrow keys to move it. Press Enter to turn it over."}
        >
          <span className="thing__paper">{flipped ? "Just circling back on my last 3 follow-ups." : "Follow up!"}</span>
        </button>
      </div>
    </div>
  );
}
