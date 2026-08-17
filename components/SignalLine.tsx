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

// Anchor points in the scatter's 600x300 viewBox. The labels are positioned
// from the same numbers, so a line always ends dead centre of its pill.
const SCATTER: [number, number][] = [
  [110, 36], [490, 36], [90, 150], [510, 150], [110, 264], [490, 264],
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
  c2: "1 company name → 23 plants · 6 corroborated",
  d1: "reason 4 · route 4",
  d2: "live 2 of 8 · route 0 of 4",
  e1: "window 126d · events 13",
  e2: "persistence CHRONIC",
  e3: "1 address · 7 correlated roles",
  f1: "corroborated · 126d · why-now complete",
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

  // which of the six stages the current step belongs to; the telemetry line
  // is the only place the reader is told, so it carries the count too
  const stageIdx = Math.max(0, STAGES.findIndex((s) => s.id === stage));


  // what the reader is scrolling toward; absent on the final step
  const nextStep = STEPS[idx + 1];
  const nextLabel = nextStep
    ? nextStep.s === stage
      ? "keep scrolling"
      : `next · ${STAGES.find((x) => x.id === nextStep.s)?.k.toLowerCase()}`
    : null;


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
              <span>{String(stageIdx + 1).padStart(2, "0")} / 06</span>
              <i />
              <span>{stage}</span>
              <i />
              <span>{TEL[step]}</span>
              <b>obs 2026-07-06</b>
            </div>
            <div className="stack" data-step={step}>
              {STEPS.map((st, j) => {
                const d = idx - j;
                return (
                  <div
                    key={st.id}
                    className="card"
                    data-d={d < 0 ? -1 : Math.min(d, 3)}
                    aria-hidden={d !== 0}
                  >
                    <StepBody step={st.id} />
                  </div>
                );
              })}
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

// All eleven step bodies, so the whole run can be mounted and stacked.
function StepBody({ step }: { step: string }) {
  return (
    <>
              {/* 01 - the scatter */}
              {step === "a1" && (
                <div className="cv__in">
                  <h4 className="say">It leaks out in six directions at once.</h4>
                  <div className="sct">
                    <svg className="sct__w" viewBox="0 0 600 300">
                      {SCATTER.map(([x, y], i) => (
                        <line
                          key={`l${i}`}
                          className="sct__l"
                          x1={x}
                          y1={y}
                          x2={300}
                          y2={150}
                          style={{ animationDelay: `${i * 90}ms` }}
                        />
                      ))}
                      {SCATTER.map(([x, y], i) => (
                        <line
                          key={`p${i}`}
                          className="sct__p"
                          x1={x}
                          y1={y}
                          x2={300}
                          y2={150}
                          style={{ animationDelay: `${900 + i * 300}ms` }}
                        />
                      ))}
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
                    Not a company. The whole point is to reach the exact plant with the problem,
                    so any record that stops at the parent name is useless.
                  </p>
                </div>
              )}

              {step === "c2" && (
                <div className="cv__in">
                  <h4 className="say">You can&apos;t sell to a company name.</h4>
                  <div className="res">
                    <p className="res__lede">
                      One name in the export. Twenty-three separate plants underneath it, in
                      twenty-three different towns. A rep covers a territory, not a logo.
                    </p>
                    <div className="res__top ann">one company name</div>
                    <div className="res__fan" aria-hidden="true">
                      {Array.from({ length: 23 }, (_, i) => (
                        <span
                          key={i}
                          className={i < 6 ? "is-corr" : ""}
                          style={{ animationDelay: `${i * 48}ms` }}
                        />
                      ))}
                    </div>
                    <div className="res__key">
                      <span>
                        <i className="is-corr" aria-hidden="true" />
                        <b>6 plants</b> where more than one signal lands on the same address
                      </span>
                      <span>
                        <i aria-hidden="true" />
                        <b>17 plants</b> where only one does
                      </span>
                    </div>
                    <div className="corr__note ann">
                      Those six are the ones with a problem you can point at. That is the
                      difference between a company that is hiring and a plant that is stuck.
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
                      {REASON.map((r, i) => (
                        <div
                          className={`sl2${r.live ? " is-live" : ""}`}
                          key={r.k}
                          style={{ animationDelay: `${180 + i * 90}ms` }}
                        >
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
                      {ROUTE.map((r, i) => (
                        <div
                          className={`sl2${r.live ? " is-live" : ""}`}
                          key={r.k}
                          style={{ animationDelay: `${560 + i * 90}ms` }}
                        >
                          <span className="sl2__d" aria-hidden="true" />
                          <span className="sl2__k">{r.k}</span>
                          <span className="sl2__v">{r.v}</span>
                        </div>
                      ))}
                    </div>
                    <svg className="split__v" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true">
                      <path className="split__arm" d="M8 0 L200 40" />
                      <path className="split__arm" d="M392 0 L200 40" />
                      <path className="split__pk" d="M8 0 L200 40" />
                      <path className="split__pk split__pk--b" d="M392 0 L200 40" />
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
                      <span className="tl__run" />
                      {Array.from({ length: 13 }, (_, i) => (
                        <span
                          key={i}
                          className="tl__t"
                          style={{
                            left: `${(i / 12) * 100}%`,
                            animationDelay: `${520 + i * 90}ms`,
                            ["--pass" as string]: `${(1.8 + (i / 12) * 3.4).toFixed(2)}s`,
                          } as React.CSSProperties}
                        />
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
                  <h4 className="say">Then the rest of the address speaks up.</h4>
                  <div className="corr">
                    <div className="corr__site ann">same facility · Illinois</div>
                    <ul className="corr__l">
                      <li>
                        <b>Swiss Lathe Machinist IV</b>
                        <span>2nd shift · 126 days · chronic</span>
                      </li>
                      <li>
                        Receiving Inspector A<span>2nd shift</span>
                      </li>
                      <li>
                        Mechanical Receiving Inspector<span>1st shift</span>
                      </li>
                      <li>
                        Mechanical Receiving Inspector<span>2nd shift</span>
                      </li>
                      <li className="corr__more">
                        + 3 more inspection roles<span>all carrying containment language</span>
                      </li>
                    </ul>
                    <div className="corr__note ann">
                      A machinist nobody will take, and six people checking the parts by hand, at
                      one address.
                    </div>
                  </div>
                </div>
              )}

              {/* 06 - the decision */}
              {step === "f1" && (
                <div className="cv__in">
                  <div className="vd">
                    <div className="vd__hd">
                      <span className="ann">illinois plant · aerospace &amp; defense</span>
                      <span className="vd__tier">corroborated</span>
                    </div>

                    <div className="vd__sec">
                      <span className="ann">why now</span>
                      <div className="vd__rows">
                        <div>
                          <span>unfilled since</span>
                          <b>2 Mar 2026 · 126 days</b>
                        </div>
                        <div>
                          <span>reposted</span>
                          <b>13&times;</b>
                        </div>
                        <div>
                          <span>offer degradation</span>
                          <b>confirmed, weekly</b>
                        </div>
                        <div>
                          <span>automation already on site</span>
                          <b>confirmed</b>
                        </div>
                        <div>
                          <span>inspection load, same address</span>
                          <b>6 roles</b>
                        </div>
                      </div>
                      <p className="vd__read">
                        Four consecutive months without filling one production role, while the offer
                        widened, at a site that already runs the automation the task would need.
                      </p>
                    </div>

                    <div className="vd__sec vd__sec--off">
                      <span className="ann">how in</span>
                      <p className="vd__pend">
                        Partner graph, sponsor access and the show floor are specced but not in the
                        export. This half is empty on purpose.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === "f2" && (
                <div className="cv__in cv__in--mid">
                  <div className="say say--num">And it wasn&apos;t one plant.</div>
                  {/* 300 plants rippling out from the one the run followed */}
                  <div className="field" aria-hidden="true">
                    {Array.from({ length: 300 }, (_, i) => {
                      const col = i % 30;
                      const row = Math.floor(i / 30);
                      const one = col === 14 && row === 4;
                      const d = Math.hypot(col - 14, row - 4);
                      return (
                        <span
                          key={i}
                          className={`field__d${one ? " is-one" : ""}`}
                          style={{ animationDelay: `${Math.round(d * 36)}ms` }}
                        />
                      );
                    })}
                  </div>
                  <div className="field__k ann">
                    <i aria-hidden="true" />
                    the plant you just followed
                  </div>
                  <p className="say__sub">
                    <b>300+</b> US facilities currently carrying the same shape of signal, across
                    aerospace, defense and automotive. Every one found the same way, from pages
                    their own teams published.
                  </p>
                </div>
              )}
    </>
  );
}
