"use client";

import { useEffect, useRef, useState } from "react";

const LINES: Array<[string, string]> = [
  ["collection", "ok"],
  ["enrichment", "ok"],
  ["overlap detection", "ok"],
  ["classification", "ok"],
  ["outbound", "live"],
];

const STEP = 160;

export default function BootIntro() {
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<"boot" | "lift" | "done">("boot");
  const lifted = useRef(false);

  function lift() {
    if (lifted.current) return;
    lifted.current = true;
    sessionStorage.setItem("booted", "1");
    setShown(LINES.length);
    setPhase("lift");
    setTimeout(() => setPhase("done"), 780);
  }

  useEffect(() => {
    if (
      sessionStorage.getItem("booted") === "1" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setPhase("done");
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) =>
      timers.push(setTimeout(() => setShown(i + 1), STEP * i + STEP))
    );
    timers.push(setTimeout(lift, STEP * LINES.length + 650));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done") return null;
  return (
    <div
      className={`boot${phase === "lift" ? " boot--lift" : ""}`}
      onClick={lift}
      role="presentation"
    >
      <div className="boot__panel">
        {LINES.map(([name, status], i) => (
          <div key={name} className={`boot__line${i < shown ? " is-on" : ""}`}>
            <span className="boot__caret">▸</span>
            <span>{name}</span>
            <span className="boot__dots"></span>
            <span className={status === "live" ? "boot__live" : "boot__ok"}>
              {status}
            </span>
          </div>
        ))}
        <div className={`boot__brand${shown >= LINES.length ? " is-on" : ""}`}>
          systems online.
        </div>
      </div>
    </div>
  );
}
