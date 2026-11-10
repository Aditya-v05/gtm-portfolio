import { hash, rng } from "./seed";

// A ballpoint D20, drawn as line work. Placeholder until the user draws their
// own dice; swap it for a <Doodle name="d20" /> then. The pink/purple fill is
// the one place the notebook uses colour, like a highlighter swipe behind
// the pen.
export default function D20({ size = 90, roll, className = "" }: { size?: number; roll?: number; className?: string }) {
  const r = rng(hash("d20" + (roll ?? "")));
  const j = () => (r() - 0.5) * 2.4;
  const P = {
    t: [50 + j(), 4 + j()],
    tr: [91 + j(), 28 + j()],
    br: [90 + j(), 73 + j()],
    b: [50 + j(), 96 + j()],
    bl: [10 + j(), 72 + j()],
    tl: [9 + j(), 27 + j()],
    // inner face
    i1: [50 + j(), 26 + j()],
    i2: [76 + j(), 66 + j()],
    i3: [24 + j(), 66 + j()],
  };
  const L = (a: number[], b: number[]) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  const outline = [L(P.t, P.tr), L(P.tr, P.br), L(P.br, P.b), L(P.b, P.bl), L(P.bl, P.tl), L(P.tl, P.t)].join("");
  const inner = [L(P.i1, P.i2), L(P.i2, P.i3), L(P.i3, P.i1)].join("");
  const spokes = [
    L(P.t, P.i1), L(P.tl, P.i1), L(P.tr, P.i1),
    L(P.tr, P.i2), L(P.br, P.i2), L(P.b, P.i2),
    L(P.b, P.i3), L(P.bl, P.i3), L(P.tl, P.i3),
  ].join("");
  return (
    <svg className={`d20 draw ${className}`.trim()} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path className="d20__fill" d={`M${P.i1.join(" ")}L${P.i2.join(" ")}L${P.i3.join(" ")}Z`} />
      <g className="d20__ink">
        <path d={outline} />
        <path d={inner + spokes} />
      </g>
      {roll != null && (
        <text className="d20__n" x="50" y="56" textAnchor="middle">
          {roll}
        </text>
      )}
    </svg>
  );
}
