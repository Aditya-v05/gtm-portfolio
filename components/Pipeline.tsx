"use client";

import { useState } from "react";

// The engineering philosophy in four stages: find demand, qualify it,
// discover access, automate execution. Each stage is a real system. Hover or
// focus a stage to see a sample of what it actually produces; click to open
// that system's case study. A fine cobalt line runs through the stages, the
// same water that flows through the aqueduct in the hero.

type Stage = {
  key: string;
  name: string;
  verb: string;
  system: string;
  target: string;
  sample: { k: string; v: string }[];
  note: string;
};

const STAGES: Stage[] = [
  {
    key: "signals",
    name: "Signals",
    verb: "Find demand",
    system: "Raven",
    target: "raven",
    sample: [
      { k: "signals watched", v: "10 live sources" },
      { k: "movements, last 30 days", v: "1,094" },
      { k: "top lead", v: "score 100, fit reason written" },
      { k: "lands in", v: "Attio, traceable to its signals" },
    ],
    note: "LinkedIn activity, job postings, hiring velocity, funding and tech-stack shifts, converged into scored leads.",
  },
  {
    key: "fit",
    name: "ICP fit",
    verb: "Qualify",
    system: "Sift",
    target: "sift",
    sample: [
      { k: "company", v: "Gorgias, 520 employees" },
      { k: "fit", v: "69%, partial" },
      { k: "requirements", v: "2 met · 1 near miss · 1 unsure" },
      { k: "why now", v: "hiring 6 relevant roles" },
    ],
    note: "Every requirement marked met, near miss, unsure or not met, each line with its source.",
  },
  {
    key: "paths",
    name: "Warm paths",
    verb: "Discover access",
    system: "Warmest Path",
    target: "warmest-path",
    sample: [
      { k: "targets scored", v: "4,426 in 41s" },
      { k: "best path", v: "0.72, very strong" },
      { k: "shared history", v: "EY Business Consulting" },
      { k: "group size", v: "~120 people, 26 months together" },
    ],
    note: "Shared history priced by how small the group was. No network calls, no LLM, 993 tests.",
  },
  {
    key: "outreach",
    name: "Outreach",
    verb: "Automate execution",
    system: "LinkedIn Campaign Autopilot",
    target: "outreach",
    sample: [
      { k: "input", v: "a doc and a lead list" },
      { k: "gate", v: "human approval before launch" },
      { k: "run", v: "3 campaigns · 39 leads live" },
      { k: "time", v: "4m 12s end to end" },
    ],
    note: "Drop a doc, say go, and the campaigns go live, with a person signing off in between.",
  },
];

export default function Pipeline() {
  const [active, setActive] = useState(0);
  const open = (target: string) => {
    const el = document.getElementById(target) ?? document.getElementById("work");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const s = STAGES[active];
  return (
    <div className="pipe">
      <div className="pipe__track">
        <svg className="pipe__line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
          <path className="pipe__path" d="M0 20 C 120 4, 180 36, 250 20 S 380 4, 500 20 S 630 36, 750 20 S 880 4, 1000 20" />
          <path className="pipe__flow" d="M0 20 C 120 4, 180 36, 250 20 S 380 4, 500 20 S 630 36, 750 20 S 880 4, 1000 20" />
        </svg>
        {STAGES.map((st, i) => (
          <button
            key={st.key}
            className={`pipe__stage${i === active ? " is-active" : ""}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => open(st.target)}
            aria-label={`${st.name}: ${st.system}. Open the case study.`}
          >
            <span className="pipe__no">0{i + 1}</span>
            <span className="pipe__name">{st.name}</span>
            <span className="pipe__verb">{st.verb}</span>
          </button>
        ))}
      </div>

      <div className="pipe__card" aria-live="polite">
        <div className="pipe__card-head">
          <span className="label">{s.verb}</span>
          <span className="pipe__system">{s.system}</span>
        </div>
        <dl className="pipe__sample">
          {s.sample.map((row) => (
            <div key={row.k}>
              <dt>{row.k}</dt>
              <dd>{row.v}</dd>
            </div>
          ))}
        </dl>
        <p className="pipe__note">{s.note}</p>
        <button className="pipe__open" onClick={() => open(s.target)}>
          Open the case study <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
