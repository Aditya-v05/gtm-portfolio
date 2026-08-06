// The GTM assembly line band. Two layers:
//  - .belt__flat: the pure-CSS machine drawing (compositor animations). This
//    is the base experience - no-JS, reduced-motion (paused tableau), and the
//    loading state while three.js fetches.
//  - ConveyorCell: the 3D cell (belt + scanner + sorting arm) that lazy-loads
//    when the band nears the viewport and replaces the flat layer by adding
//    .belt--3d to the section.
// The scanner/bin labels live outside both layers so they caption either one.

import ConveyorCell from "@/components/ConveyorCell";

const DUR = 30; // seconds for one full flat-mode crossing

type Plate = { score?: number; ok: boolean };

const PLATES: Plate[] = [
  { score: 94, ok: true },
  { ok: false },
  { score: 88, ok: true },
  { score: 96, ok: true },
  { ok: false },
  { score: 71, ok: true },
];

const ROLLERS = 14;

export default function ConveyorLine() {
  return (
    <section
      className="belt"
      aria-label="Systems shipped for Brex, Rho, Peec AI, Warp, Hyperbound, Qashio. Now founding at Relling (YC S25)."
    >
      <div className="belt__stage" aria-hidden="true">
        <div className="belt__flat">
          <div className="belt__rail belt__rail--t"></div>
          <div className="belt__rail belt__rail--b"></div>
          <div className="belt__channel">
            <div className="belt__tread"></div>
          </div>
          <div className="belt__rollers">
            {Array.from({ length: ROLLERS }, (_, i) => (
              <span key={i} className="belt__roller"></span>
            ))}
          </div>
          {PLATES.map((pl, i) => (
            <div
              key={i}
              className={`belt__plate${pl.ok ? "" : " is-reject"}`}
              style={
                {
                  "--dur": `${DUR}s`,
                  "--d": `${-(DUR / PLATES.length) * i}s`,
                } as React.CSSProperties
              }
            >
              <div className="belt__puck">
                <span className="belt__bar"></span>
                <span className="belt__bar belt__bar--sm"></span>
                <span className="belt__chip">{pl.ok ? `✓ ${pl.score}` : "✗ excl"}</span>
              </div>
            </div>
          ))}
          <div className="belt__scanner">
            <span className="belt__scanbeam"></span>
          </div>
          <div className="belt__bin">→ attio</div>
        </div>

        {/* labels caption both the flat and 3D machines */}
        <span className="belt__scanlabel">raven · scan</span>
        <span className="belt__binlabel">
          → attio · <b>00</b>
        </span>

        <ConveyorCell />
      </div>

      <div className="belt__caption">
        systems shipped for Brex · Rho · Peec AI · Warp · Hyperbound · Qashio
        <b> · now founding @ Relling · YC S25</b>
      </div>
    </section>
  );
}
