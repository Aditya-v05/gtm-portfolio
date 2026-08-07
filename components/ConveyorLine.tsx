// The hero machine cell. Two layers:
//  - .belt__flat: pure-CSS fallback (no-JS, reduced-motion, loading state)
//  - ConveyorCell: the 3D transfer line (belt > scanner > arm > belt >
//    scanner > arm > box) that replaces the flat layer once running by
//    adding .belt--3d to the wrapper.
// Lives at the bottom of the hero section, full width, no clipping.

import ConveyorCell from "@/components/ConveyorCell";

const DUR = 30;
const PLATES = 6;
const ROLLERS = 14;

export default function ConveyorLine() {
  return (
    <div
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
          {Array.from({ length: PLATES }, (_, i) => (
            <div
              key={i}
              className="belt__plate"
              style={
                {
                  "--dur": `${DUR}s`,
                  "--d": `${-(DUR / PLATES) * i}s`,
                } as React.CSSProperties
              }
            >
              <div className="belt__puck">
                <span className="belt__bar"></span>
                <span className="belt__bar belt__bar--sm"></span>
              </div>
            </div>
          ))}
          <div className="belt__scanner">
            <span className="belt__scanbeam"></span>
          </div>
          <div className="belt__bin"></div>
        </div>

        <div className="belt__dim" aria-hidden="true">
          <b></b><i>signal</i><i>→</i><i>revenue</i><b></b>
        </div>

        <ConveyorCell />

        {/* blueprint callouts: the hero stats, tethered to machine parts by
            leader lines the scene draws each frame */}
        <svg className="belt3d__leads" aria-hidden="true"></svg>
        <div className="belt3d__co" data-co="scan">
          <b>10</b> live signals converged
        </div>
        <div className="belt3d__co" data-co="arm">
          <b>100+</b> campaigns automated
        </div>
        <div className="belt3d__co" data-co="box">
          <b>40+</b> systems shipped
        </div>
      </div>

      <div className="belt__caption">
        systems shipped for Brex · Rho · Peec AI · Warp · Hyperbound · Qashio
        <b> · now founding @ Relling · YC S25</b>
      </div>
    </div>
  );
}
