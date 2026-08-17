// Pure-CSS fallback band for the hero machine: shown for no-JS, reduced
// motion, and while three.js loads. The 3D cell is a hero-level layer
// (ConveyorCell); once it renders it adds .hero--3d, which hides this.


const DUR = 30;
const PLATES = 6;
const ROLLERS = 14;

export default function ConveyorLine() {
  return (
    <div
      className="belt"
      aria-label="Systems shipped for Brex, Rho, Peec AI, Warp, Hyperbound, Qashio. Previously founding GTM engineer at Relling (YC S25)."
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


      </div>

    </div>
  );
}
