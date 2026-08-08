"use client";

// SHEET 01 - reason and route.
//
// The argument: industrial buyers leave no clean intent signal, so you read
// the places it leaks out, resolve everything to a building rather than a
// company, and then split what you find into two jobs that are not the same
// job - the evidence that an account matters now, and the way into it.
//
// Three primitives only:
//   .raw   evidence, document-like, monospace
//   .ann   system annotation: labels, rules, measurements
//   .say   verdict: oversized, clean, almost nothing around it
//
// HONESTY: every item carries a live/mapped mark. "live" means it is in the
// export today and the numbers below are read off it (observed 2026-07-06).
// "mapped" means specced and argued but not shipped. Nothing here invents a
// relationship, a solicitation or a sponsor the system has not actually seen.

import { useEffect, useRef, useState } from "react";

const STAGES = [
  { id: "scatter", n: "01", k: "Scatter" },
  { id: "sources", n: "02", k: "Sources" },
  { id: "resolve", n: "03", k: "Resolve" },
  { id: "split", n: "04", k: "Split" },
  { id: "correlate", n: "05", k: "Correlate" },
  { id: "decide", n: "06", k: "Decide" },
];

const STEPS = [
  { id: "a1", s: "scatter" },
  { id: "b1", s: "sources" },
  { id: "c1", s: "resolve" },
  { id: "c2", s: "resolve" },
  { id: "d1", s: "split" },
  { id: "d2", s: "split" },
  { id: "e1", s: "correlate" },
  { id: "e2", s: "correlate" },
  { id: "e3", s: "correlate" },
  { id: "f1", s: "decide" },
  { id: "f2", s: "decide" },
];

const SOURCES = [
  { k: "applicant systems", v: "what is unstaffed", live: true },
  { k: "usaspending", v: "what was already bought", live: true },
  { k: "sam.gov", v: "what is intended", live: false },
  { k: "integrator + OEM libraries", v: "what already works", live: false },
  { k: "ownership records", v: "who else this owner holds", live: false },
  { k: "exhibitor lists", v: "who is showing up", live: false },
];

const REASON = [
  { k: "hiring pain", v: "13 reposts across 126 days, offer degrading", live: true },
  { k: "federal spend", v: "awards landing on operators already short-staffed", live: true },
  { k: "procurement", v: "solicitations, before any award exists", live: false },
  { k: "expansion + capex", v: "new lines, new buildings, equipment finance", live: false },
];

// what the scope footer reports at each step - keeps the frame alive and
// doubles as a running statement of what is actually loaded
const TEL: Record<string, string> = {
  a1: "sources 6 · resolved 0",
  b1: "sources 6 · live 2 · mapped 4",
  c1: "resolution target: facility",
  c2: "1 recipient → 23 facilities · 6A 17B",
  d1: "reason 4 · route 4",
  d2: "live 2 of 8 · route 0 of 4",
  e1: "window 126d · events 13",
  e2: "persistence CHRONIC",
  e3: "families 2 · agreement 2 of 2",
  f1: "tier A · why-now complete",
  f2: "n = 300+ facilities",
};

const ROUTE = [
  { k: "the partner graph", v: "integrator case studies publish the relationship", live: false },
  { k: "sponsor access", v: "one owner, fifteen to forty plants", live: false },
  { k: "existing customers", v: "who already sells into this building", live: false },
  { k: "the show floor", v: "exhibitor lists, months ahead", live: false },
];

export default function SignalLine() {
  const [step, setStep] = useState("a1");
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStep((e.target as HTMLElement).dataset.step!);
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    track.querySelectorAll<HTMLElement>("[data-step]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const stage = STEPS.find((s) => s.id === step)?.s ?? "scatter";
  const idx = Math.max(0, STEPS.findIndex((s) => s.id === step));
  const pct = ((idx + 1) / STEPS.length) * 100;

  // the rail thickens and grows a running head while the page moves, then
  // settles back when it stops - so the instrument reads as live
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    let t = 0;
    const onScroll = () => {
      setMoving(true);
      clearTimeout(t);
      t = window.setTimeout(() => setMoving(false), 560);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  // what the reader is scrolling toward; absent on the final step
  const nextStep = STEPS[idx + 1];
  const nextLabel = nextStep
    ? nextStep.s === stage
      ? "keep scrolling"
      : `next · ${STAGES.find((x) => x.id === nextStep.s)?.k.toLowerCase()}`
    : null;

  // narrow screens turn the rail into a strip; keep the active stage in it
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;
    const on = rail.querySelector<HTMLElement>(".rl.is-on");
    if (!on) return;
    rail.scrollTo({
      left: Math.max(0, on.offsetLeft - rail.clientWidth / 2 + on.offsetWidth / 2),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [stage]);

  return (
    <section className="ln">
      <div className="ln__open">
        <h3 className="say say--xl">Industrial buyers don&apos;t leave clean intent signals.</h3>
        <p className="say__sub">
          No demo request, no pricing page visit, no whitepaper download. So I read the places the
          intent leaks out instead, and work backwards to the building.
        </p>
        <div className="ann ln__proof">
          <span>300+ US plants flagged</span>
          <i aria-hidden="true">·</i>
          <span>126-day histories</span>
          <i aria-hidden="true">·</i>
          <span>public data only</span>
        </div>
        <div className="ln__cue" aria-hidden="true">
          <span>scroll</span>
          <i />
        </div>
      </div>

      <div className="ln__grid">
        <div className="ln__railwrap" aria-hidden="true">
          <span className={`ln__prog${moving ? " is-moving" : ""}`}>
            <i style={{ height: `${pct}%`, width: `${pct}%` }}>
              <b />
            </i>
          </span>
          <div className="ln__rail" ref={railRef}>
            {STAGES.map((s) => (
              <div key={s.id} className={`rl${stage === s.id ? " is-on" : ""}`}>
                <span className="rl__n">{s.n}</span>
                <span className="rl__k">{s.k}</span>
              </div>
            ))}
          </div>
          <div className="ln__count">
            {String(idx + 1).padStart(2, "0")} / {STEPS.length}
          </div>
        </div>

        <div className="ln__main">
          <div className="ln__canvas">
            <div className="scope" aria-hidden="true">
              <i className="scope__c scope__c--tl" /><i className="scope__c scope__c--tr" />
              <i className="scope__c scope__c--bl" /><i className="scope__c scope__c--br" />
              <span className="scope__grat" />
            </div>
            {nextLabel && (
              <div className="scope__next" aria-hidden="true">
                <span>{nextLabel}</span>
                <svg viewBox="0 0 12 20">
                  <path d="M6 0 V16 M1.5 11.5 L6 16.5 L10.5 11.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <div className="scope__tel" aria-hidden="true">
              <span>rec {String(idx + 1).padStart(2, "0")}</span>
              <i />
              <span>{stage}</span>
              <i />
              <span>{TEL[step]}</span>
              <b>obs 2026-07-06</b>
            </div>
            <div className="cv" data-step={step}>
              {/* 01 - the scatter */}
              {step === "a1" && (
                <div className="cv__in">
                  <h4 className="say">It leaks out in six directions at once.</h4>
                  <div className="sct">
                    <svg className="sct__w" viewBox="0 0 600 300" preserveAspectRatio="none">
                      {[[86, 34], [514, 34], [58, 150], [542, 150], [86, 266], [514, 266]].map(
                        ([x, y], i) => (
                          <line
                            key={i}
                            x1={x}
                            y1={y}
                            x2={300}
                            y2={150}
                            style={{ animationDelay: `${i * 90}ms` }}
                          />
                        )
                      )}
                    </svg>
                    <span className="sct__i sct__i--tl">hiring</span>
                    <span className="sct__i sct__i--tr">procurement</span>
                    <span className="sct__i sct__i--ml">ownership</span>
                    <span className="sct__i sct__i--mr">partners</span>
                    <span className="sct__i sct__i--bl">federal spend</span>
                    <span className="sct__i sct__i--br">the show floor</span>
                    <span className="sct__hub">one building</span>
                  </div>
                  <div className="ann sct__k">none of it published as a buying signal</div>
                </div>
              )}

              {/* 02 - the sources, with what is actually running */}
              {step === "b1" && (
                <div className="cv__in">
                  <h4 className="say">Each one answers a different question.</h4>
                  <div className="srcs">
                    {SOURCES.map((s) => (
                      <div className={`src2${s.live ? " is-live" : ""}`} key={s.k}>
                        <span className="src2__d" aria-hidden="true" />
                        <span className="src2__k">{s.k}</span>
                        <span className="src2__v">{s.v}</span>
                        <span className="src2__s">{s.live ? "live" : "mapped"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ann srcs__k">
                    live = in the export today · mapped = specced, not shipped
                  </div>
                </div>
              )}

              {/* 03 - resolve to a building */}
              {step === "c1" && (
                <div className="cv__in cv__in--mid">
                  <div className="say say--num">The account is a building.</div>
                  <p className="say__sub">
                    Not a company. A territory rep cannot sell to a Fortune 100 prime, and every
                    record that stops at the parent is useless to them.
                  </p>
                </div>
              )}

              {step === "c2" && (
                <div className="cv__in">
                  <h4 className="say">One prime resolved to twenty-three plants.</h4>
                  <div className="res">
                    <div className="res__top ann">one recipient name</div>
                    <div className="res__fan" aria-hidden="true">
                      {Array.from({ length: 23 }, (_, i) => (
                        <span key={i} style={{ animationDelay: `${i * 26}ms` }} />
                      ))}
                    </div>
                    <div className="res__b">
                      <b>23</b> flagged facilities · <b>6</b> tier A · <b>17</b> tier B
                    </div>
                    <div className="corr__note ann">
                      Signals only count when they land on the same address. That is the difference
                      between a company that is hiring and a plant that is stuck.
                    </div>
                  </div>
                </div>
              )}

              {/* 04 - the split. the idea the page is built around */}
              {step === "d1" && (
                <div className="cv__in cv__in--mid">
                  <div className="say say--num">Not every source does the same job.</div>
                  <p className="say__sub">
                    Half of them tell you an account matters right now. The other half tell you how
                    to get inside it. Treating those as one pile is why most industrial prospecting
                    stalls.
                  </p>
                </div>
              )}

              {step === "d2" && (
                <div className="cv__in">
                  <div className="split">
                    <div className="split__col">
                      <div className="split__h">
                        <span className="ann">find the reason</span>
                        <b>why this plant, now</b>
                      </div>
                      {REASON.map((r) => (
                        <div className={`sl2${r.live ? " is-live" : ""}`} key={r.k}>
                          <span className="sl2__d" aria-hidden="true" />
                          <span className="sl2__k">{r.k}</span>
                          <span className="sl2__v">{r.v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="split__col">
                      <div className="split__h">
                        <span className="ann">find the route</span>
                        <b>how to get in</b>
                      </div>
                      {ROUTE.map((r) => (
                        <div className={`sl2${r.live ? " is-live" : ""}`} key={r.k}>
                          <span className="sl2__d" aria-hidden="true" />
                          <span className="sl2__k">{r.k}</span>
                          <span className="sl2__v">{r.v}</span>
                        </div>
                      ))}
                    </div>
                    <svg className="split__v" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M8 0 L200 40" fill="none" stroke="currentColor" strokeWidth="1" />
                      <path d="M392 0 L200 40" fill="none" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    <div className="split__out">target · now · via</div>
                  </div>
                </div>
              )}

              {/* 05 - correlate over time */}
              {step === "e1" && (
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
                    <div className="tl__k ann">13 reposts · endpoints real, spacing schematic</div>
                  </div>
                </div>
              )}

              {step === "e2" && (
                <div className="cv__in cv__in--mid">
                  <div className="say say--num">126 days. 13 reposts.</div>
                  <p className="say__sub">
                    What looked like thirteen job postings was one unresolved labor problem. A single
                    scrape cannot see that. Only weekly snapshots of the same requisition can.
                  </p>
                </div>
              )}

              {step === "e3" && (
                <div className="cv__in">
                  <h4 className="say">Then a second family lands on the same operator.</h4>
                  <div className="raw">
                    <div className="raw__bar">
                      <span>two families · one recipient</span>
                      <span>tier A</span>
                    </div>
                    <div className="raw__b">
                      <dl className="raw__f">
                        <div>
                          <dt>labor</dt>
                          <dd>
                            CNC machinists, weld inspectors and instrumentation techs open across
                            the flagged sites
                            <span className="tick">the operator cannot staff the work it has</span>
                          </dd>
                        </div>
                        <div>
                          <dt>spend</dt>
                          <dd>
                            <mark>$5,595,792</mark> NASA award to the same recipient
                            <span className="tick">and more work is arriving anyway</span>
                          </dd>
                        </div>
                      </dl>
                      <div className="corr__note ann">
                        Neither is decisive alone. Together they are the whole argument.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 06 - the decision */}
              {step === "f1" && (
                <div className="cv__in">
                  <div className="vd">
                    <div className="vd__hd">
                      <span className="ann">private space launch manufacturer · 6 flagged sites</span>
                      <span className="vd__tier">tier A</span>
                    </div>

                    <div className="vd__sec">
                      <span className="ann">why now</span>
                      <div className="vd__rows">
                        <div><span>labor pain</span><b>machinists, inspectors, I&amp;C techs open</b></div>
                        <div><span>federal spend</span><b>$5,595,792 NASA award</b></div>
                        <div><span>families agreeing</span><b>2 of 2</b></div>
                      </div>
                    </div>

                    <div className="vd__sec vd__sec--off">
                      <span className="ann">how in</span>
                      <p className="vd__pend">
                        The partner graph, sponsor access and the show floor are specced and argued.
                        None of them are in the export yet, so this half of the card is empty on
                        purpose.
                      </p>
                    </div>

                    <div className="vd__why">
                      <span className="ann">what the system says today</span>
                      <p>
                        The reason is established: two independent families landed on one operator
                        that already runs the automation the work would need. The route is the half
                        being built next.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === "f2" && (
                <div className="cv__in cv__in--mid">
                  <div className="say say--num">And it wasn&apos;t one plant.</div>
                  <div className="field" aria-hidden="true">
                    {Array.from({ length: 300 }, (_, i) => (
                      <span key={i} className="field__d" style={{ animationDelay: `${(i % 40) * 12}ms` }} />
                    ))}
                  </div>
                  <p className="say__sub">
                    <b>300+</b> US facilities currently carrying the same shape of signal, across
                    aerospace, defense and automotive. Every one found the same way, from pages
                    their own teams published.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="ln__track" ref={trackRef}>
            {STEPS.map((s) => (
              <div key={s.id} className="ln__sp" data-step={s.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="ln__close">
        <p className="say say--end">
          I didn&apos;t build another database. I connected evidence of demand with routes into the
          account.
        </p>
      </div>
    </section>
  );
}
