// The GTM assembly line: lead plates ride a blueprint conveyor, pass Raven's
// scanner, get stamped with a fit verdict, and continue toward the Attio bin.
// Structure follows a real machine drawing: a static frame (double rails top
// and bottom, roller trucks below) with a separately-scrolling chain-link belt
// running inside it. Pure CSS transforms on the compositor - no JS, no jank;
// a shared --dur/--d pair keeps each plate's verdict stamp in sync with its
// position. prefers-reduced-motion freezes the whole scene into a tableau.

const DUR = 30; // seconds for one full crossing

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
        {/* static frame: rail pairs above and below the belt channel */}
        <div className="belt__rail belt__rail--t"></div>
        <div className="belt__rail belt__rail--b"></div>

        {/* the belt channel: chain-link tread scrolling inside the frame */}
        <div className="belt__channel">
          <div className="belt__tread"></div>
        </div>

        {/* roller trucks under the frame */}
        <div className="belt__rollers">
          {Array.from({ length: ROLLERS }, (_, i) => (
            <span key={i} className="belt__roller"></span>
          ))}
        </div>

        {/* carrier plates riding the belt surface */}
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

        {/* scanner gantry straddling the line */}
        <div className="belt__scanner">
          <span className="belt__scanbeam"></span>
          <span className="belt__scanlabel">raven · scan</span>
        </div>

        <div className="belt__bin">→ attio</div>
      </div>

      <div className="belt__caption">
        systems shipped for Brex · Rho · Peec AI · Warp · Hyperbound · Qashio
        <b> · now founding @ Relling · YC S25</b>
      </div>
    </section>
  );
}
