// SVG filters for the notebook's ballpoint ink, mounted once per page.
//
// A ballpoint does not lay down a flat, even line: the ball skips, so strokes
// get fine gaps and lighter streaks, and the line wobbles a hair. #ballpoint
// recreates that on any text or stroke: a fine, slightly stretched noise
// field is turned into an alpha mask (the skips), then a slow noise nudges
// the edges (the wobble). Apply it with `filter: url(#ballpoint)`.
export default function InkDefs() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter id="ballpoint" x="-4%" y="-12%" width="108%" height="124%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="1.3 0.45" numOctaves="2" seed="4" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.75"
            result="skips"
          />
          <feComposite in="SourceGraphic" in2="skips" operator="in" result="inked" />
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="1" seed="9" result="slow" />
          <feDisplacementMap in="inked" in2="slow" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* lighter version for long strokes (underlines, circles, arrows) */}
        <filter id="ballpoint-line" x="-4%" y="-30%" width="108%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.6 0.6" numOctaves="2" seed="7" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9"
            result="skips"
          />
          <feComposite in="SourceGraphic" in2="skips" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
