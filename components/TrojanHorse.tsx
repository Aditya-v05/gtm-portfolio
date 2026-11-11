"use client";

import { useEffect, useRef, useState } from "react";
import SZ from "./horse-sizes.json";

// About, by way of a Trojan horse. It stands outside the city with a cloth
// over its side and a sign saying something suspicious is inside. Press it:
// it shakes, the cloth comes off, and everything he owns tumbles out of the
// hatch one thing after another, an unreasonable number of them
// spreadsheets. Last of all a small Aditya falls out, looks round, and says
// "oh. hey." Then the actual biography appears.
//
// The words are always in the page for screen readers and search; "just the
// bio" skips the show; reduced motion goes straight to the end.

const STAGE = { w: 1120, h: 540, ground: 500 };
const HORSE = { left: 10, w: 410 };
const HORSE_H = (HORSE.w * SZ.horse[1]) / SZ.horse[0];
const HATCH = { x: HORSE.left + HORSE.w * 0.56, y: STAGE.ground - HORSE_H * 0.41 };
type Name = keyof typeof SZ;
// what falls out, in order: [sprite, left, width, how far toward the viewer, resting tilt]
const SPILL: [Name, number, number, number, number][] = [
  ["laptop", 578, 98, 0, 0], ["d20", 612, 46, 30, -12], ["book", 866, 84, 4, 0], ["headphones", 1034, 76, 6, 0],
  ["stack", 672, 96, 6, 0], ["scroll", 944, 90, -2, 0], ["sheets", 764, 104, -4, 0], ["envelope", 706, 68, 32, 8],
  ["sheets", 898, 88, 34, -14], ["checklist", 800, 74, 30, 6], ["sheets", 1040, 80, 36, 18], ["tent", 984, 70, 30, 0],
  ["papers", 520, 110, 38, 0],
];
type Phase = "idle" | "shake" | "spill" | "fall" | "look" | "hey" | "done";

export default function TrojanHorse() {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const w = wrap.current;
    if (!w) return;
    const fit = () => w.style.setProperty("--s", String(Math.min(1, w.clientWidth / STAGE.w)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(w);
    return () => {
      ro.disconnect();
      clear();
    };
  }, []);

  const open = () => {
    if (phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPhase("done");
    setPhase("shake");
    later(1000, () => setPhase("spill"));
  };

  // once the spill starts, throw each thing out of the hatch along an arc
  useEffect(() => {
    if (phase !== "spill" || !stage.current) return;
    const els = stage.current.querySelectorAll<HTMLElement>(".spill");
    const GAP = 210;
    els.forEach((el, i) => {
      const x = parseFloat(el.style.left) + el.offsetWidth / 2, y = STAGE.h - parseFloat(el.style.bottom) - el.offsetHeight / 2;
      const dx = HATCH.x - x, dy = HATCH.y - y, tilt = el.dataset.tilt ?? "0";
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(0.2) rotate(-200deg)`, opacity: 0, offset: 0 },
          { transform: `translate(${dx * 0.92}px, ${dy * 0.96}px) scale(0.4) rotate(-170deg)`, opacity: 1, offset: 0.06 },
          { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 150}px) scale(0.85) rotate(-60deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(0px, 0px) scale(1) rotate(${tilt}deg)`, opacity: 1, offset: 0.82 },
          { transform: `translate(0px, -16px) scale(1) rotate(${tilt}deg)`, opacity: 1, offset: 0.91 },
          { transform: `translate(0px, 0px) scale(1) rotate(${tilt}deg)`, opacity: 1, offset: 1 },
        ],
        { duration: 760, delay: i * GAP, easing: "linear", fill: "both" }
      );
    });
    const total = els.length * GAP + 500;
    later(total, () => setPhase("fall"));
    later(total + 900, () => setPhase("look"));
    later(total + 2100, () => setPhase("hey"));
    later(total + 4300, () => setPhase("done"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const reset = () => {
    clear();
    stage.current?.querySelectorAll(".spill").forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    setPhase("idle");
  };
  const out = phase !== "idle" && phase !== "shake";
  const pose: Name | null = phase === "fall" ? "fall" : phase === "look" ? "look" : phase === "hey" ? "wave" : phase === "done" ? "read" : null;
  const poseW = { fall: 190, look: 104, wave: 106, read: 112 }[pose as "fall"] ?? 0;

  /* eslint-disable @next/next/no-img-element */
  return (
    <section id="about" className={`band band--horse is-${phase}`}>
      <div className="band__in horse">
        <div ref={wrap} className="horse__wrap">
          <div ref={stage} className="horse__stage">
            <span className="horse__ground" aria-hidden="true" />

            <button className="horse__body" style={{ left: HORSE.left, bottom: STAGE.h - STAGE.ground, width: HORSE.w }} onClick={open} disabled={phase !== "idle"} aria-label="A wooden Trojan horse. Something suspicious is inside. Press to open it.">
              <img src="/horse/horse.png" alt="" draggable={false} />
              <span className="horse__cloth" aria-hidden="true" />
              <img className="horse__marks horse__marks--a" src="/horse/shake.png" alt="" />
              <img className="horse__marks horse__marks--b" src="/horse/burst.png" alt="" />
            </button>
            {phase === "idle" && (
              <p className="horse__sign" aria-hidden="true">
                Something suspicious inside.
                <span>click the horse</span>
              </p>
            )}

            {SPILL.map(([name, left, w, depth, tilt], i) => (
              <img
                key={i}
                className={`spill${out ? " is-out" : ""}`}
                src={`/horse/${name}.png`}
                alt=""
                draggable={false}
                data-tilt={tilt}
                style={{ left, width: w, bottom: STAGE.h - STAGE.ground - depth, zIndex: 3 + depth }}
              />
            ))}

            {pose && (
              <span className={`horse__me horse__me--${phase}`} style={{ left: 452 - (poseW - 106) / 2, bottom: STAGE.h - STAGE.ground - 4, width: poseW }}>
                <img key={pose} src={`/horse/${pose}.png`} alt="" draggable={false} />
                {phase === "fall" && <img className="horse__dust" src="/horse/cloud.png" alt="" />}
                {phase === "hey" && <img className="horse__bubble" src="/horse/bubble.png" alt="" />}
              </span>
            )}
          </div>
        </div>

        <div className="horse__bio">
          <h2 className="horse__hey">Hey, I&apos;m Aditya.</h2>
          <p className="horse__lead">
            I&apos;m a GTM engineer. I like building systems that find customers, uncover weird buying
            signals, and save people from spending their lives copying spreadsheets.
          </p>
          <p>Before this, I built GTM infrastructure at Relling and Huntd.</p>
          <p>
            Outside work, I&apos;m usually playing a roguelike, reading something by Jules Verne,
            listening to hip-hop, or convincing myself that another three-hour research rabbit hole is
            completely necessary.
          </p>
        </div>

        <p className="horse__controls">
          {phase === "idle" && (
            <button onClick={() => setPhase("done")}>or just read the bio</button>
          )}
          {phase === "done" && <button onClick={reset}>stuff it all back in</button>}
        </p>
      </div>
    </section>
  );
}
