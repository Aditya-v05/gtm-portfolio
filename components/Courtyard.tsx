"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Ivy from "./Ivy";

// The courtyard: a small 2.5D pixel diorama. The architecture is drawn in
// code on two canvases (a back layer: floor in perspective, wall, alcove,
// window, shelf; a front layer: columns, beam, pedestal, ledge), with the
// user's own sprites standing on those surfaces between them. The layers
// shift by a few whole pixels with the pointer, and every artifact does
// something when used.

const W = 186, H = 206, S = 3; // logical pixels, drawn at 3x
const P = { lite: "#fffbe6", ivory: "#f6eed8", mid: "#e6dcc4", shade: "#c9cbe0", peri: "#a9b0d6", navy: "#3f5cab", deep: "#1b2b5a", sea: "#6f8ed4", seaL: "#c5d3f0", sky: "#fbf1c4", recess: "#dcdcea" };
type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const box = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  R(c, x - 1, y - 1, w + 2, h + 2, P.navy);
  R(c, x, y, w, h, col);
};
/** a round-headed arch, filled, with a 1px outline */
const arch = (c: Ctx, cx: number, top: number, hw: number, bottom: number, col: string) => {
  const cy = top + hw;
  const half = (y: number, r: number) => (y < cy ? Math.round(Math.sqrt(Math.max(0, r * r - (cy - y) * (cy - y)))) : r);
  for (let y = top - 1; y < bottom; y++) R(c, cx - half(y, hw + 1), y, 2 * half(y, hw + 1), 1, P.navy);
  for (let y = top; y < bottom; y++) R(c, cx - half(y, hw), y, 2 * half(y, hw), 1, col);
};

function drawBack(c: Ctx, t: number) {
  c.clearRect(0, 0, W, H);
  // the floor: stone tiles in perspective, on a slab with a front edge
  const cx = 93, y0 = 128, y1 = 198;
  const a = Math.pow(0.15, 0.6), b = Math.pow(1.15, 0.6) - a;
  const tile = (x: number, y: number) => {
    if (y >= y1) return -1;
    const tt = (y - y0) / (y1 - y0);
    const u = ((x - cx) / (82 + tt * 34)) * 4;
    if (Math.abs(u) > 4) return -1;
    return Math.floor(u + 4) + 16 * Math.floor((5 * (Math.pow(tt + 0.15, 0.6) - a)) / b);
  };
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < W; x++) {
      const k = tile(x, y);
      if (k < 0) continue;
      const l = tile(x - 1, y), r = tile(x + 1, y), d = tile(x, y + 1);
      const col = (l < 0 && x > 0) || (r < 0 && x < W - 1) ? P.navy : r !== k || (d >= 0 && d !== k) ? P.shade : ((k & 15) + (k >> 4)) % 2 ? P.ivory : P.lite;
      R(c, x, y, 1, 1, col);
    }
  R(c, 0, y1, W, 7, P.shade);
  R(c, 0, y1, W, 1, P.navy);
  R(c, 0, y1 + 2, W, 1, P.peri);
  R(c, 0, y1 + 7, W, 1, P.navy);
  // the wall: coursed marble blocks, with a cap that shows its thickness
  box(c, 12, 16, 162, 112, P.ivory);
  for (let i = 0, y = 30; y < 128; y += 14, i++) {
    R(c, 12, y, 162, 1, P.mid);
    for (let x = 12 + (i % 2 ? 12 : 24); x < 174; x += 24) R(c, x, y + 1, 1, 13, P.mid);
  }
  R(c, 12, 16, 162, 2, P.shade);
  box(c, 8, 9, 170, 7, P.lite);
  R(c, 8, 14, 170, 2, P.mid);
  R(c, 12, 128, 162, 2, P.shade); // the wall's shadow on the floor
  // cracks
  for (const [x, y] of [[150, 40], [151, 41], [151, 42], [152, 43], [153, 44], [153, 45], [152, 46], [56, 100], [55, 101], [55, 102], [54, 103], [53, 104], [158, 112], [159, 113], [159, 114]]) R(c, x, y, 1, 1, P.peri);
  // the alcove: a moulded arch, recessed, its left reveal in shadow
  arch(c, 93, 20, 33, 128, P.lite);
  arch(c, 93, 24, 29, 128, P.recess);
  for (let y = 26; y < 128; y++) {
    const w = y < 53 ? Math.round(Math.sqrt(29 * 29 - (53 - y) * (53 - y))) : 29;
    R(c, 93 - w, y, Math.min(5, w), 1, P.peri);
    if (y < 30) R(c, 93 - w, y, 2 * w, 1, P.peri);
  }
  R(c, 60, 124, 66, 4, P.lite);
  R(c, 60, 124, 66, 1, P.navy);
  // a small arched window onto the sea, where the water moves
  arch(c, 35, 62, 11, 104, P.sky);
  R(c, 38, 85, 5, 1, P.peri);
  R(c, 39, 84, 3, 1, P.peri);
  for (let y = 86; y < 104; y++)
    for (let x = 24; x < 46; x++) R(c, x, y, 1, 1, (x * 3 + y * 7 + t * (y % 2 ? 1 : -1) + 220) % 11 < 2 ? P.seaL : P.sea);
  R(c, 24, 73, 2, 31, P.peri);
  box(c, 21, 104, 28, 3, P.lite);
  // a stone shelf on brackets
  R(c, 130, 89, 38, 3, P.shade);
  box(c, 127, 84, 42, 4, P.lite);
  box(c, 132, 89, 3, 5, P.mid);
  box(c, 161, 89, 3, 5, P.mid);
}

function drawFore(c: Ctx) {
  c.clearRect(0, 0, W, H);
  const column = (x: number) => {
    R(c, x + 3, 158, 16, 2, P.shade);
    box(c, x, 16, 12, 134, P.ivory);
    R(c, x, 16, 1, 134, P.lite);
    for (const dx of [3, 6]) R(c, x + dx, 16, 1, 134, P.shade);
    R(c, x + 9, 16, 3, 134, P.shade);
    box(c, x - 1, 148, 14, 4, P.ivory);
    box(c, x - 2, 152, 16, 6, P.lite);
    box(c, x - 2, 10, 16, 6, P.lite);
    R(c, x - 2, 12, 3, 3, P.peri);
    R(c, x + 11, 12, 3, 3, P.peri);
  };
  column(3);
  column(171);
  // the beam the columns carry, running out past both sides
  box(c, -2, 2, 190, 7, P.lite);
  R(c, 0, 7, W, 2, P.mid);
  for (let x = 2; x < W; x += 6) R(c, x, 4, 3, 1, P.peri);
  // a low ledge at the front
  R(c, 28, 190, 44, 2, P.shade);
  box(c, 26, 178, 44, 5, P.lite);
  box(c, 26, 184, 44, 5, P.mid);
  // a small pedestal
  R(c, 137, 185, 34, 2, P.shade);
  box(c, 139, 162, 26, 18, P.ivory);
  R(c, 160, 162, 5, 18, P.shade);
  box(c, 136, 158, 32, 4, P.lite);
  box(c, 136, 180, 32, 4, P.lite);
}

const ROLL = (n: number) =>
  n === 20 ? "Natural 20. They signed before the demo." : n >= 16 ? "Meeting booked." : n >= 11 ? "Replied: “send me more info.”" : n >= 6 ? "Opened, no reply. Follow up." : n >= 2 ? "Bounced. Clean the list." : "Critical fail. The CRM is down.";

type Panel = { key: string; title: string; body: string } | null;

export default function Courtyard() {
  const wrap = useRef<HTMLDivElement>(null);
  const court = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLCanvasElement>(null);
  const fore = useRef<HTMLCanvasElement>(null);
  const pupil = useRef<HTMLSpanElement>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [roll, setRoll] = useState<{ n: number; id: number } | null>(null);
  const [rolling, setRolling] = useState(0);
  const [puff, setPuff] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [hi, setHi] = useState(false);

  // draw the architecture; only the sea in the window is redrawn after that
  useEffect(() => {
    const b = back.current?.getContext("2d"), f = fore.current?.getContext("2d");
    if (!b || !f) return;
    drawBack(b, 0);
    drawFore(f);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t = 0;
    const id = setInterval(() => drawBack(b, ++t), 420);
    return () => clearInterval(id);
  }, []);

  // fit the scene to its column, and bring it in when it is first seen
  useEffect(() => {
    const w = wrap.current, c = court.current;
    if (!w || !c) return;
    const fit = () => w.style.setProperty("--s", String(Math.min(1, w.clientWidth / (W * S))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(w);
    const io = new IntersectionObserver((e) => e[0].isIntersecting && (c.classList.add("is-in"), io.disconnect()), { threshold: 0.25 });
    io.observe(w);
    return () => (ro.disconnect(), io.disconnect());
  }, []);

  // pointer: the layers shift a few whole pixels, and the eye follows
  useEffect(() => {
    const c = court.current;
    if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      for (const [k, m] of [["b", 2], ["m", 4], ["f", 7]] as const) {
        c.style.setProperty(`--${k}x`, `${Math.round(-nx * m)}px`);
        c.style.setProperty(`--${k}y`, `${Math.round(-ny * m * 0.5)}px`);
      }
      const p = pupil.current;
      if (p) {
        const q = p.parentElement!.getBoundingClientRect();
        const dx = e.clientX - (q.left + q.width / 2), dy = e.clientY - (q.top + q.height * 0.3);
        const d = Math.hypot(dx, dy) || 1;
        p.style.transform = `translate(${Math.round((dx / d) * Math.min(5, d / 30))}px, ${Math.round((dy / d) * Math.min(2, d / 60))}px)`;
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const close = useCallback(() => setPanel(null), []);
  useEffect(() => {
    if (!panel && !flipped) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && (close(), setFlipped(false));
    const out = (e: PointerEvent) => !(e.target as HTMLElement).closest?.(".court__panel, .art") && close();
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", out);
    return () => (window.removeEventListener("keydown", key), window.removeEventListener("pointerdown", out));
  }, [panel, flipped, close]);

  const toggle = (p: NonNullable<Panel>) => setPanel((cur) => (cur?.key === p.key ? null : p));
  const throwDie = () => {
    setRolling((n) => n + 1);
    setRoll(null);
    setPanel(null);
    setTimeout(() => {
      const n = 1 + Math.floor(Math.random() * 20);
      setRoll({ n, id: Date.now() });
      setPanel({ key: "d20", title: `You rolled ${n}`, body: ROLL(n) });
    }, 620);
  };
  const flip = () => {
    setFlipping(true);
    setTimeout(() => setFlipped((v) => !v), 140);
    setTimeout(() => setFlipping(false), 300);
  };
  // the note is pinned: it can be pulled a short way, and swings back
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const noteDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    start.current = { x: e.clientX, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const noteMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.moved && Math.hypot(dx, dy) < 5) return;
    s.moved = true;
    const k = Math.min(1, 46 / (Math.hypot(dx, dy) || 1));
    setDrag({ x: Math.round(dx * k), y: Math.round(dy * k) });
  };
  const noteUp = () => {
    const s = start.current;
    start.current = null;
    setDrag(null);
    if (s && !s.moved) flip();
  };

  /* eslint-disable @next/next/no-img-element */
  return (
    <div ref={wrap} className="court-wrap">
      <div ref={court} className="court">
        <div className="court__layer court__layer--back">
          <canvas ref={back} className="court__canvas" width={W} height={H} aria-hidden="true" />
          <span className="court__light" aria-hidden="true" />
          <Ivy seed={9} className="court__ivy court__ivy--a" />
          <Ivy seed={4} className="court__ivy court__ivy--b" />

          <button
            className={`art art--note${drag ? " is-dragging" : ""}${flipping ? " is-flipping" : ""}${flipped ? " is-flipped" : ""}`}
            style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${Math.round(drag.x / 6)}deg)` } : undefined}
            onPointerDown={noteDown}
            onPointerMove={noteMove}
            onPointerUp={noteUp}
            onPointerCancel={noteUp}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), flip())}
            aria-label={flipped ? "Sticky note, turned over: Just circling back on my last 3 follow-ups. Press to turn it back." : "Sticky note: Follow up! Press to turn it over, or drag it."}
          >
            {flipped ? <span className="art__back">Just circling back on my last 3 follow-ups.</span> : <img src="/art/note.png" alt="" draggable={false} />}
          </button>

          <button
            className="art art--dragon"
            onClick={() => (setPuff((n) => n + 1), toggle({ key: "dragon", title: "The dragon", body: "D&D and fantasy games. Give me a party, a map and a bad plan." }))}
            aria-label="Dragon figurine. Press to inspect."
          >
            <span className="art__shadow" aria-hidden="true" />
            <img key={puff} className={puff ? "is-roaring" : ""} src="/art/dragon.png" alt="" draggable={false} />
            {puff > 0 && (
              <span key={`p${puff}`} className="art__puff" aria-hidden="true">
                <i /><i /><i />
              </span>
            )}
          </button>
        </div>

        <div className="court__layer court__layer--mid">
          <div className="court__pedestal">
            <span className="court__name">Aditya Venkatesan</span>
            <span className="court__motto">&ldquo;He came. He saw. He followed up.&rdquo;</span>
          </div>
          <button className="art art--bust" onMouseEnter={() => setHi(true)} onMouseLeave={() => setHi(false)} onFocus={() => setHi(true)} onBlur={() => setHi(false)} onClick={() => setHi((v) => !v)} aria-label="Marble bust of Aditya. It says: just following up.">
            <span className="art__contact" aria-hidden="true" />
            <img src="/art/bust.png" alt="" draggable={false} />
            <span className="bust__lid bust__lid--l" aria-hidden="true" />
            <span className="bust__lid bust__lid--r" aria-hidden="true" />
            {hi && <span className="court__bubble">Just following up.</span>}
          </button>
        </div>

        <div className="court__layer court__layer--fore">
          <canvas ref={fore} className="court__canvas" width={W} height={H} aria-hidden="true" />
          <button className="art art--phones" onClick={() => toggle({ key: "phones", title: "Currently listening", body: "Rap and hip-hop, on while I build. Nothing plays here, you're safe." })} aria-label="Stone headphones. Press to see what is playing.">
            <img src="/art/headphones.png" alt="" draggable={false} />
          </button>
          <button className="art art--watcher" onClick={() => toggle({ key: "watcher", title: "The watcher", body: "Terraria, roguelikes, anything with a boss that takes forty tries. It has been watching you scroll." })} aria-label="One-eyed figurine. Press to inspect.">
            <img src="/art/watcher.png" alt="" draggable={false} />
            <span className="art__eye" aria-hidden="true">
              <span ref={pupil} className="art__pupil" />
            </span>
          </button>
          <button className="art art--d20" onClick={throwDie} aria-label="A twenty-sided die. Press to roll it.">
            <img key={rolling} className={rolling ? "is-rolling" : ""} src="/art/d20.png" alt="" draggable={false} />
            {roll && <span key={roll.id} className={`art__roll${roll.n === 20 ? " is-crit" : ""}`}>{roll.n}</span>}
          </button>
        </div>
      </div>

      {panel && (
        <div className="court__panel" role="status" key={panel.key + panel.title}>
          <button className="court__x" onClick={close} aria-label="Close">
            ×
          </button>
          <span className="court__ptitle">{panel.title}</span>
          <span className="court__pbody">{panel.body}</span>
        </div>
      )}
    </div>
  );
}
