"use client";

// The About section's two halves: the workshop scene (lazy-loaded three.js,
// same progressive-enhancement contract as the hero machine) and the control
// panel mounted on its wall. The panel is real HTML - crisp, keyboard
// operable, theme-aware - positioned over the plate drawn in the scene.
// Without JS or with reduced motion the scene never loads and the panel
// simply stands on its own, which is the whole point of keeping it in HTML.

import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  {
    key: "origin",
    label: "origin",
    body: "I started not knowing what an ICP was. I was doing outbound at an agency where the account lists were noisy, the enrichment was inconsistent, and the targeting logic lived in someone's head. So I started duct-taping: a scraper here, a classifier there, a dedup script written at 1am that I was too scared to touch after it worked. At some point I realised I had built a bootleg Clay without knowing what Clay was.",
  },
  {
    key: "method",
    label: "method",
    body: "Systems, not scripts. Every system on this sheet runs unattended and leaves an artifact behind - a log, a verdict, an export - because a number you cannot trace is a number I do not trust. If a workflow needs me to babysit it, it is not finished yet.",
  },
  {
    key: "current",
    label: "current",
    body: "Founding GTM Engineer at Relling (YC S25). I build Raven, the signal engine that converges ten live signals into scored, outreach-ready leads, and Diode, the orchestration layer that runs every system underneath it from a single Slack thread.",
  },
  {
    key: "edge",
    label: "edge",
    body: "GTM engineering assumes the data layer already exists. Apollo has every SaaS company, LinkedIn has every VP Sales, Clay stitches them together - you are orchestrating. In physical AI none of that holds. The buyer runs a machine shop, is barely on LinkedIn, and the record you can buy for them is thin or wrong. What machines they run, whether they are high-mix low-volume, whether they already have robots, whether they are hiring welders - none of it is in a GTM stack. You build the data layer before you can sell anything. That is the part I spent a year learning to do.",
  },
] as const;

export default function AboutBench() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import("./workshopScene").then(({ mountWorkshopScene }) => {
          if (disposed) return;
          try {
            cleanup = mountWorkshopScene(host);
          } catch {
            // no WebGL: the panel stands alone, which reads fine
          }
        });
      },
      { rootMargin: "150% 0px" }
    );
    io.observe(host);
    return () => {
      disposed = true;
      io.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <div className="about__stage">
      <div ref={hostRef} className="about3d" aria-hidden="true"></div>

      <div className="cpanel">
        <span className="cpanel__screw cpanel__screw--tl" aria-hidden="true"></span>
        <span className="cpanel__screw cpanel__screw--tr" aria-hidden="true"></span>
        <span className="cpanel__screw cpanel__screw--bl" aria-hidden="true"></span>
        <span className="cpanel__screw cpanel__screw--br" aria-hidden="true"></span>

        <div className="cpanel__head">
          <span>A. Venkatesan</span>
          <b>bench 01</b>
        </div>

        <div className="cpanel__rail" role="tablist" aria-label="About sections">
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              role="tab"
              id={`cp-tab-${s.key}`}
              aria-selected={active === i}
              aria-controls={`cp-panel-${s.key}`}
              className={`cswitch cursor-target${active === i ? " is-on" : ""}`}
              onClick={() => setActive(i)}
            >
              <span className="cswitch__lamp" aria-hidden="true"></span>
              <span className="cswitch__body" aria-hidden="true">
                <span className="cswitch__lever"></span>
              </span>
              <span className="cswitch__label">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="cpanel__screen">
          {SECTIONS.map((s, i) => (
            <p
              key={s.key}
              role="tabpanel"
              id={`cp-panel-${s.key}`}
              aria-labelledby={`cp-tab-${s.key}`}
              hidden={active !== i}
            >
              {s.body}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
