"use client";

import { useEffect, useRef, useState } from "react";
import Ivy from "./Ivy";

// The study: a corner of an old Greek workshop that somebody clearly lives
// in. An isometric room drawn in code (two ruined walls, a tiled floor with
// tiles missing, a stone desk, a rug, a broken column, a stack of books),
// with the user's own sprites left lying about on it. No frame: the room's
// own ragged outline is its edge.
//
// Three things are worth playing with: the d20 rolls across the floor, the
// sticky note peels off (and was hiding the last line of the inscription),
// and the little bust answers back. The rest react when touched.

const W = 212, H = 192, S = 3; // logical pixels, shown at 3x
const OX = 106, OY = 84;
const P = { lite: "#fffbe6", ivory: "#f6eed8", mid: "#e6dcc4", shade: "#c9cbe0", peri: "#a9b0d6", blue: "#6f8ed4", navy: "#3f5cab", deep: "#1b2b5a", clay: "#c8673a" };
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];
/** world (x, y on the floor, z up) to logical screen pixels */
const pt = (x: number, y: number, z = 0): Pt => [OX + x - y, OY + (x + y) / 2 - z];
/** the same point in CSS pixels, for placing sprites */
const at = (x: number, y: number, z = 0) => {
  const [sx, sy] = pt(x, y, z);
  return { x: sx * S, y: sy * S };
};

// crisp drawing: no anti-aliasing anywhere
const px = (c: Ctx, x: number, y: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), 1, 1);
};
function line(c: Ctx, a: Pt, b: Pt, col: string) {
  let x0 = Math.round(a[0]), y0 = Math.round(a[1]);
  const x1 = Math.round(b[0]), y1 = Math.round(b[1]);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (;;) {
    px(c, x0, y0, col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) (e += dy), (x0 += sx);
    if (e2 <= dx) (e += dx), (y0 += sy);
  }
}
function poly(c: Ctx, p: Pt[], col: string, edge: string | null = P.navy) {
  const ys = p.map((q) => q[1]);
  c.fillStyle = col;
  for (let y = Math.ceil(Math.min(...ys)); y <= Math.floor(Math.max(...ys)); y++) {
    const xs: number[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      if (a[1] <= y !== b[1] <= y) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((m, n) => m - n);
    for (let i = 0; i + 1 < xs.length; i += 2) c.fillRect(Math.round(xs[i]), y, Math.round(xs[i + 1]) - Math.round(xs[i]) + 1, 1);
  }
  if (edge) p.forEach((a, i) => line(c, a, p[(i + 1) % p.length], edge));
}
/** a block: top, the face toward the lower left, the face toward the lower right */
function block(c: Ctx, x: number, y: number, z: number, w: number, d: number, h: number, top: string = P.lite, left: string = P.ivory, right: string = P.shade, edge: string | null = P.navy) {
  poly(c, [pt(x, y + d, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], left, edge);
  poly(c, [pt(x + w, y, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x + w, y, z + h)], right, edge);
  poly(c, [pt(x, y, z + h), pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x, y + d, z + h)], top, edge);
}

function drawRoom(c: Ctx) {
  c.clearRect(0, 0, W, H);
  // the floor: stone tiles, a few of them long gone
  const gone = new Set(["5,5", "4,5", "5,4", "0,5"]);
  for (let s = 0; s <= 10; s++)
    for (let i = 0; i <= 5; i++) {
      const j = s - i;
      if (j < 0 || j > 5 || gone.has(`${i},${j}`)) continue;
      block(c, i * 16, j * 16, -4, 16, 16, 4, (i + j) % 2 ? P.ivory : P.lite, P.mid, P.shade, P.peri);
    }
  // the walls: one lit, one in shade, both crumbling toward their ends
  const lw: [number, number, number][] = [[0, 40, 76], [40, 68, 62], [68, 96, 34]];
  const rw: [number, number, number][] = [[0, 80, 76], [80, 96, 64]];
  block(c, -6, -6, 0, 6, 6, 76, P.lite, P.mid, P.ivory);
  for (const [a, b, h] of rw) {
    block(c, a, -6, 0, b - a, 6, h, P.lite, P.ivory, P.shade);
    for (let z = 12; z < h; z += 12) line(c, pt(a, 0, z), pt(b, 0, z), P.mid);
    for (let z = 0, k = 0; z < h - 6; z += 12, k++) for (let x = a + (k % 2 ? 10 : 22); x < b; x += 24) line(c, pt(x, 0, z), pt(x, 0, Math.min(h, z + 12)), P.mid);
  }
  for (const [a, b, h] of lw) {
    block(c, -6, a, 0, 6, b - a, h, P.lite, P.mid, P.mid);
    for (let z = 12; z < h; z += 12) line(c, pt(0, a, z), pt(0, b, z), P.shade);
    for (let z = 0, k = 0; z < h - 6; z += 12, k++) for (let y = a + (k % 2 ? 8 : 20); y < b; y += 24) line(c, pt(0, y, z), pt(0, y, Math.min(h, z + 12)), P.shade);
  }
  // an inscription tablet set into the lit wall (its words are HTML, on top)
  poly(c, [pt(54, 0, 34), pt(92, 0, 34), pt(92, 0, 64), pt(54, 0, 64)], P.lite);
  poly(c, [pt(54, 0, 34), pt(92, 0, 34), pt(92, 0, 36), pt(54, 0, 36)], P.shade, null);
  // a shelf on the shaded wall
  block(c, 0, 14, 44, 7, 26, 3, P.lite, P.ivory, P.shade);
  // a rug that has seen better days
  poly(c, [pt(24, 40), pt(66, 40), pt(66, 84), pt(24, 84)], P.peri, P.navy);
  poly(c, [pt(28, 44), pt(62, 44), pt(62, 80), pt(28, 80)], P.peri, P.lite);
  for (let k = 0; k < 5; k++) px(c, pt(24, 84)[0] + 2 + k * 9, pt(24, 84)[1] - k * 4.5 + 2, P.navy);
  // the desk: a slab on two blocks, against the wall, with things left on it
  block(c, 30, 6, 0, 8, 18, 18, P.lite, P.ivory, P.shade);
  block(c, 62, 6, 0, 8, 18, 18, P.lite, P.ivory, P.shade);
  block(c, 24, 3, 18, 52, 24, 4, P.lite, P.ivory, P.shade);
  block(c, 56, 9, 22, 13, 4, 2, P.lite, P.ivory, P.mid); // a scroll
  block(c, 53, 16, 22, 11, 7, 1, P.lite, P.mid, P.mid, P.peri); // a loose sheet
  block(c, 70, 18, 22, 4, 4, 5, P.navy, P.deep, P.deep, P.deep); // an ink pot
  // a broken column, and a piece of it on the floor
  block(c, 8, 74, 0, 14, 14, 30, P.lite, P.ivory, P.shade);
  for (const dx of [3, 7, 11]) line(c, pt(8 + dx, 88, 1), pt(8 + dx, 88, 29), P.mid);
  for (const dy of [3, 7, 11]) line(c, pt(22, 74 + dy, 1), pt(22, 74 + dy, 29), P.peri);
  block(c, 36, 86, 0, 12, 8, 7, P.lite, P.ivory, P.shade);
  // a stack of books, none of them square to the next
  block(c, 74, 56, 0, 16, 11, 4, P.navy, P.deep, P.deep, P.deep);
  block(c, 76, 57, 4, 14, 10, 3, P.clay, "#9a4a2c", "#9a4a2c", P.deep);
  block(c, 73, 55, 7, 16, 11, 4, P.peri, P.blue, P.navy, P.deep);
  block(c, 76, 58, 11, 12, 8, 3, P.lite, P.ivory, P.shade, P.deep);
  block(c, 50, 70, 0, 12, 9, 3, P.blue, P.navy, P.navy, P.deep); // one more, left open on the rug
}

const BUST = ["Just following up.", "Bumping this to the top of your inbox.", "Per my last statue.", "Circling back.", "Any thoughts?", "He came. He saw. He followed up."];
const ROLL = (n: number) =>
  n === 20 ? "Nat 20. They signed before the demo." : n >= 16 ? "Meeting booked." : n >= 11 ? "“Send me more info.”" : n >= 6 ? "Opened. No reply. Follow up." : n >= 2 ? "Bounced. Clean the list." : "Nat 1. The CRM is down.";

export default function Courtyard() {
  const wrap = useRef<HTMLDivElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pupil = useRef<HTMLSpanElement>(null);
  const die = useRef<HTMLButtonElement>(null);
  const [say, setSay] = useState<{ who: string; text: string } | null>(null);
  const [bustN, setBustN] = useState(0);
  const [dieAt, setDieAt] = useState({ x: 46, y: 62 });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ x: number; y: number; peeled: boolean }>({ x: 0, y: 0, peeled: false });
  const [held, setHeld] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const scale = useRef(1);

  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (c) drawRoom(c);
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
      const p = pupil.current;
      if (!p) return;
      const q = p.parentElement!.getBoundingClientRect();
      const dx = e.clientX - q.left, dy = e.clientY - q.top, d = Math.hypot(dx, dy) || 1;
      p.style.transform = `translate(${Math.round((dx / d) * Math.min(4, d / 40))}px, ${Math.round((dy / d) * Math.min(2, d / 80))}px)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

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
    const to = { x: 28 + Math.random() * 34, y: 44 + Math.random() * 34 };
    const a = at(dieAt.x, dieAt.y), b = at(to.x, to.y);
    const n = 1 + Math.floor(Math.random() * 20);
    setSay(null);
    const land = () => {
      setDieAt(to);
      setBusy(false);
      setSay({ who: "d20", text: `${n}. ${ROLL(n)}` });
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
    setNote({ x: Math.max(-470, Math.min(70, g.x + dx)), y: Math.max(-190, Math.min(300, g.y + dy)), peeled: true });
  };
  const noteUp = () => {
    const g = grab.current;
    grab.current = null;
    setHeld(false);
    if (g && !g.moved) setFlipped((v) => !v);
  };
  const noteKey = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[e.key];
    if (step) (e.preventDefault(), setNote((n) => ({ x: Math.max(-470, Math.min(70, n.x + step[0])), y: Math.max(-190, Math.min(300, n.y + step[1])), peeled: true })));
    else if (e.key === "Enter" || e.key === " ") (e.preventDefault(), setFlipped((v) => !v));
  };

  /** stand a sprite on a point of the room: (x, y, z) is where its foot goes */
  const stand = (x: number, y: number, z: number, w: number, ratio: number, foot = 0.92, i = 0) => {
    const p = at(x, y, z);
    return { left: p.x - w / 2, top: p.y - w * ratio * foot, width: w, "--i": i } as React.CSSProperties;
  };
  const tab = at(54, 0, 64);

  /* eslint-disable @next/next/no-img-element */
  return (
    <div ref={wrap} className="study-wrap">
      <div ref={room} className="study">
        <canvas ref={canvas} className="study__canvas" width={W} height={H} aria-hidden="true" />
        <Ivy seed={9} className="study__ivy" />
        {/* the inscription: the note has been stuck over its last line */}
        <p className="study__tablet" style={{ left: tab.x, top: tab.y }}>
          <span>He came.</span>
          <span>He saw.</span>
          <span>He followed up.</span>
        </p>

        <button className="thing thing--watcher" style={stand(4, 27, 47, 66, 350 / 380, 0.93, 1)} onClick={() => speak("watcher", "It has been watching you scroll.")} aria-label="A one-eyed figurine on the shelf">
          <img src="/art/watcher.png" alt="" draggable={false} />
          <span className="thing__eye" aria-hidden="true">
            <span ref={pupil} className="thing__pupil" />
          </span>
          {say?.who === "watcher" && <span className="thing__say">{say.text}</span>}
        </button>

        <button className="thing thing--bust" style={stand(36, 14, 22, 92, 1.4, 0.985, 2)} onClick={() => (setBustN((n) => n + 1), setSay({ who: "bust", text: BUST[bustN % BUST.length] }))} aria-label="A small marble bust of Aditya on the desk. Press it.">
          <img key={bustN} className={bustN ? "is-nudged" : ""} src="/art/bust.png" alt="" draggable={false} />
          <span className="bust__lid bust__lid--l" aria-hidden="true" />
          <span className="bust__lid bust__lid--r" aria-hidden="true" />
          {say?.who === "bust" && <span className="thing__say">{say.text}</span>}
        </button>

        <button className="thing thing--dragon" style={stand(82, 62, 14, 74, 1, 0.9, 3)} onClick={() => speak("dragon", "D&D. Fantasy anything.")} aria-label="A dragon figurine balanced on a stack of books">
          <img src="/art/dragon.png" alt="" draggable={false} />
          {say?.who === "dragon" && <span className="thing__say">{say.text}</span>}
        </button>

        <button className="thing thing--phones" style={stand(15, 81, 30, 74, 350 / 470, 0.86, 4)} onClick={() => speak("phones", "Hip-hop, on while I build.")} aria-label="Stone headphones hung on a broken column">
          <img src="/art/headphones.png" alt="" draggable={false} />
          {say?.who === "phones" && <span className="thing__say">{say.text}</span>}
        </button>

        <button ref={die} className={`thing thing--d20${busy ? " is-busy" : ""}`} style={stand(dieAt.x, dieAt.y, 0, 52, 1, 0.84, 5)} onClick={rollDie} aria-label="A twenty-sided die on the floor. Press to roll it.">
          <img src="/art/d20.png" alt="" draggable={false} />
          {say?.who === "d20" && <span className="thing__say">{say.text}</span>}
        </button>

        <button
          className={`thing thing--note${held ? " is-held" : ""}${note.peeled ? " is-peeled" : ""}`}
          style={{ left: 498 + note.x, top: 196 + note.y, width: 72, "--i": 6 } as React.CSSProperties}
          onPointerDown={noteDown}
          onPointerMove={noteMove}
          onPointerUp={noteUp}
          onPointerCancel={noteUp}
          onKeyDown={noteKey}
          aria-label={flipped ? "Sticky note, turned over: Just circling back on my last 3 follow-ups." : "Sticky note: Follow up! Drag it or use the arrow keys to move it. Press Enter to turn it over."}
        >
          {flipped ? <span className="thing__back">Just circling back on my last 3 follow-ups.</span> : <img src="/art/note.png" alt="" draggable={false} />}
        </button>
      </div>
    </div>
  );
}
