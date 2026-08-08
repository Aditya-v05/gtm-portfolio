"use client";

// SHEET 01 - the line. One factory record enters at the top and comes out the
// other end as a verdict. The reader meets a single Illinois plant, watches it
// get read, correlated and judged, and only then learns it happened 300+ times.
//
// Three primitives only, and everything is built from them:
//   .raw      raw evidence, document-like, monospace
//   .ann      system annotation: small labels, rules, measurements
//   .say      verdict: oversized, clean, almost nothing else
//
// Structure is a sticky stage rail plus one sticky canvas. Invisible spacers
// scroll past and swap what the canvas is showing, so the object never
// changes - only what the system has done to it.
//
// Every value below is read off one real record (observed 2026-07-06). The
// company is withheld; the numbers are not.

import { useEffect, useRef, useState } from "react";

const STAGES = [
  { id: "intake", n: "01", k: "Intake" },
  { id: "read", n: "02", k: "Read" },
  { id: "correlate", n: "03", k: "Correlate" },
  { id: "verdict", n: "04", k: "Verdict" },
];

const STEPS = [
  { id: "i1", s: "intake" },
  { id: "i2", s: "intake" },
  { id: "r1", s: "read" },
  { id: "r2", s: "read" },
  { id: "r3", s: "read" },
  { id: "c1", s: "correlate" },
  { id: "c2", s: "correlate" },
  { id: "c3", s: "correlate" },
  { id: "v1", s: "verdict" },
  { id: "v2", s: "verdict" },
];

const SOURCES = [
  { k: "applicant systems", v: "what is unstaffed" },
  { k: "sam.gov", v: "what is intended" },
  { k: "usaspending", v: "what was bought" },
  { k: "partner graph", v: "what already works" },
];

export default function SignalLine() {
  const [step, setStep] = useState("i1");
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const spacers = Array.from(track.querySelectorAll<HTMLElement>("[data-step]"));
    // fire when a spacer crosses the middle of the viewport
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setStep((e.target as HTMLElement).dataset.step!);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    spacers.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const stage = STEPS.find((s) => s.id === step)?.s ?? "intake";
  const railRef = useRef<HTMLDivElement>(null);

  // on narrow screens the rail is a horizontal strip, so the active stage has
  // to be scrolled into it - scrollLeft rather than scrollIntoView, which
  // would drag the page with it
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;
    const on = rail.querySelector<HTMLElement>(".rl.is-on");
    if (!on) return;
    const target = on.offsetLeft - rail.clientWidth / 2 + on.offsetWidth / 2;
    rail.scrollTo({
      left: Math.max(0, target),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [stage]);

  return (
    <section className="ln">
      {/* ---------- the opening claim: almost nothing on screen ---------- */}
      <div className="ln__open">
        <h3 className="say say--xl">
          Factories don&apos;t announce when they&apos;re ready to automate.
        </h3>
        <p className="say__sub">We built a system that figures it out anyway.</p>
        <div className="ann ln__proof">
          <span>300+ US plants flagged</span>
          <i aria-hidden="true">·</i>
          <span>126-day histories</span>
          <i aria-hidden="true">·</i>
          <span>public data only</span>
        </div>
      </div>

      <div className="ln__grid">
        {/* ---------- sticky stage rail ---------- */}
        <div className="ln__rail" ref={railRef} aria-hidden="true">
          {STAGES.map((s) => (
            <div key={s.id} className={`rl${stage === s.id ? " is-on" : ""}`}>
              <span className="rl__n">{s.n}</span>
              <span className="rl__k">{s.k}</span>
            </div>
          ))}
        </div>

        <div className="ln__main">
          {/* ---------- the canvas: one object, transformed ---------- */}
          <div className="ln__canvas">
            <div className="cv" data-step={step}>
              {/* 01 · i1 - four sources converge */}
              {step === "i1" && (
                <div className="cv__in">
                  <h4 className="say">Start with the exhaust.</h4>
                  <div className="pipes">
                    {SOURCES.map((s) => (
                      <div className="pipe" key={s.k}>
                        <span className="pipe__k">{s.k}</span>
                        <span className="pipe__v">{s.v}</span>
                      </div>
                    ))}
                    <div className="pipes__hub ann">one facility</div>
                  </div>
                </div>
              )}

              {/* 01 · i2 - a record lands */}
              {step === "i2" && (
                <div className="cv__in">
                  <h4 className="say">One of them lands like this.</h4>
                  <div className="raw">
                    <div className="raw__bar">
                      <span>workday · applicant system</span>
                      <span>read 2026-07-06</span>
                    </div>
                    <div className="raw__b">
                      <div className="raw__t">Swiss Lathe Machinist IV &mdash; 2nd Shift</div>
                      <div className="raw__l">Illinois plant · aerospace &amp; defense</div>
                      <dl className="raw__f">
                        <div><dt>posted wage</dt><dd>$22 &ndash; 41 / hr</dd></div>
                        <div><dt>shift</dt><dd>2nd, 10% differential</dd></div>
                        <div><dt>sign-on</dt><dd>offered</dd></div>
                        <div><dt>requires</dt><dd>5+ yrs diversified machinist · Swiss lathes, Star machines · CAD/CAM</dd></div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {/* 02 · r1 - the same record, plain */}
              {step === "r1" && (
                <div className="cv__in">
                  <h4 className="say">On its own it says nothing.</h4>
                  <div className="raw">
                    <div className="raw__bar">
                      <span>workday · applicant system</span>
                      <span>read 2026-07-06</span>
                    </div>
                    <div className="raw__b">
                      <div className="raw__t">Swiss Lathe Machinist IV &mdash; 2nd Shift</div>
                      <div className="raw__l">Illinois plant · aerospace &amp; defense</div>
                      <dl className="raw__f">
                        <div><dt>posted wage</dt><dd>$22 &ndash; 41 / hr</dd></div>
                        <div><dt>shift</dt><dd>2nd, 10% differential</dd></div>
                        <div><dt>sign-on</dt><dd>offered</dd></div>
                        <div><dt>requires</dt><dd>5+ yrs diversified machinist · Swiss lathes, Star machines · CAD/CAM</dd></div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {/* 02 · r2 - the same record, annotated */}
              {step === "r2" && (
                <div className="cv__in">
                  <h4 className="say">Every field is a claim about the floor.</h4>
                  <div className="raw raw--lit">
                    <div className="raw__bar">
                      <span>workday · applicant system</span>
                      <span>parsed</span>
                    </div>
                    <div className="raw__b">
                      <div className="raw__t">
                        <mark>Swiss Lathe Machinist IV</mark> &mdash; <mark>2nd Shift</mark>
                        <span className="tick">manual task · undesirable shift</span>
                      </div>
                      <div className="raw__l">
                        <mark>Illinois plant</mark>
                        <span className="tick">resolved to a site, not a headquarters</span>
                      </div>
                      <dl className="raw__f">
                        <div>
                          <dt>posted wage</dt>
                          <dd><mark>$22 &ndash; 41 / hr</mark><span className="tick">a 19-point band is not a salary, it is a plea</span></dd>
                        </div>
                        <div>
                          <dt>sign-on</dt>
                          <dd><mark>offered</mark><span className="tick">normal hiring already exhausted</span></dd>
                        </div>
                        <div>
                          <dt>requires</dt>
                          <dd>
                            5+ yrs diversified machinist · <mark>Swiss lathes, Star machines</mark> ·{" "}
                            <mark>CAD/CAM</mark>
                            <span className="tick">the plant already runs the automation this task would need</span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {/* 02 · r3 - the readout */}
              {step === "r3" && (
                <div className="cv__in">
                  <h4 className="say">Read together, it is a diagnosis.</h4>
                  <div className="rout">
                    <div className="rout__hd ann">
                      <span>signal</span>
                      <span>reading</span>
                    </div>
                    <Row k="persistence" lvl={3} v="chronic · 126 days" />
                    <Row k="repost frequency" lvl={3} v="13 reposts and variants" />
                    <Row k="offer degradation" lvl={3} v="confirmed across weekly snapshots" />
                    <Row k="automation on site" lvl={2} v="confirmed in the requirements" />
                    <Row k="containment cluster" lvl={2} v="6 QC roles, same facility" />
                    <div className="rout__ft ann">
                      persistence is graded persistent, strongly persistent, chronic
                    </div>
                  </div>
                </div>
              )}

              {/* 03 · c1 - the timeline */}
              {step === "c1" && (
                <div className="cv__in">
                  <h4 className="say">One read tells you nothing. The history tells you everything.</h4>
                  <div className="tl">
                    <div className="tl__ends ann">
                      <span>first seen 2 Mar 2026</span>
                      <span>still open 6 Jul 2026</span>
                    </div>
                    <div className="tl__bar">
                      {Array.from({ length: 13 }, (_, i) => (
                        <span key={i} className="tl__t" style={{ left: `${(i / 12) * 100}%` }} />
                      ))}
                    </div>
                    <div className="tl__k ann">13 reposts · schematic spacing, endpoints are real</div>
                  </div>
                </div>
              )}

              {/* 03 · c2 - the punch */}
              {step === "c2" && (
                <div className="cv__in cv__in--mid">
                  <div className="say say--num">126 days. 13 reposts.</div>
                  <p className="say__sub">
                    What looked like thirteen job postings was one unresolved labor problem.
                  </p>
                </div>
              )}

              {/* 03 · c3 - correlate at the facility */}
              {step === "c3" && (
                <div className="cv__in">
                  <h4 className="say">Then the rest of the address speaks up.</h4>
                  <div className="corr">
                    <div className="corr__site ann">same facility · Illinois</div>
                    <ul className="corr__l">
                      <li><b>Swiss Lathe Machinist IV</b><span>2nd shift · 126 days · chronic</span></li>
                      <li>Receiving Inspector A<span>2nd shift</span></li>
                      <li>Mechanical Receiving Inspector<span>1st shift</span></li>
                      <li>Mechanical Receiving Inspector<span>2nd shift</span></li>
                      <li className="corr__more">+ 3 more inspection roles<span>all carrying containment language</span></li>
                    </ul>
                    <div className="corr__note ann">
                      A machinist nobody will take, and six people checking the parts by hand, at
                      one address.
                    </div>
                  </div>
                </div>
              )}

              {/* 04 · v1 - the verdict */}
              {step === "v1" && (
                <div className="cv__in">
                  <div className="vd">
                    <div className="vd__hd">
                      <span className="ann">illinois plant · aerospace &amp; defense</span>
                      <span className="vd__tier">tier A</span>
                    </div>
                    <div className="vd__rows">
                      <div><span>persistent labor failure</span><b>chronic · 126 days</b></div>
                      <div><span>reposting</span><b>13&times;</b></div>
                      <div><span>offer degradation</span><b>confirmed</b></div>
                      <div><span>automation already on site</span><b>confirmed</b></div>
                      <div><span>inspection load, same site</span><b>6 roles</b></div>
                    </div>
                    <div className="vd__why">
                      <span className="ann">why now</span>
                      <p>
                        This plant has failed to fill one production role for four consecutive
                        months while widening its offer, at a site that already runs the automation
                        the task would need.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 04 · v2 - and it was not one plant */}
              {step === "v2" && (
                <div className="cv__in cv__in--mid">
                  <div className="say say--num">And it wasn&apos;t one plant.</div>
                  <div className="field" aria-hidden="true">
                    {Array.from({ length: 300 }, (_, i) => (
                      <span key={i} className="field__d" style={{ animationDelay: `${(i % 40) * 12}ms` }} />
                    ))}
                  </div>
                  <p className="say__sub">
                    <b>300+</b> US facilities currently carrying the same shape of signal, across
                    aerospace, defense and automotive. Every one of them found the same way, from
                    pages their own recruiting teams published.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* invisible scroll spacers drive the canvas */}
          <div className="ln__track" ref={trackRef}>
            {STEPS.map((s) => (
              <div key={s.id} className="ln__sp" data-step={s.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="ln__close">
        <p className="say say--end">
          The data already existed. The missing layer was deciding which factory mattered today.
        </p>
      </div>
    </section>
  );
}

function Row({ k, lvl, v }: { k: string; lvl: number; v: string }) {
  return (
    <div className="rout__r">
      <span className="rout__k">{k}</span>
      <span className="rout__m" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= lvl ? "on" : ""} />
        ))}
      </span>
      <span className="rout__v">{v}</span>
    </div>
  );
}
