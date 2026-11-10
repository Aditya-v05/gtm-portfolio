import { hash, rng } from "./seed";

// Hand-drawn ballpoint marks: underlines, circles, crossings-out, arrows.
// Paths are generated with a seeded wobble, so each mark is a little
// different but stable across renders. Each mark's svg has the class "draw",
// so DrawObserver can draw it in once on scroll (a left-to-right wipe, like
// the pen moving across).

type Tone = "ink" | "red";
const f = (n: number) => n.toFixed(2);

function underlinePath(r: () => number, y: number, x0: number, x1: number) {
  const j = () => (r() - 0.5) * 2.2;
  const m1 = x0 + (x1 - x0) * (0.3 + r() * 0.1);
  const m2 = x0 + (x1 - x0) * (0.65 + r() * 0.1);
  return `M${f(x0)} ${f(y + j())} C${f(m1)} ${f(y + j())} ${f(m2)} ${f(y + j())} ${f(x1)} ${f(y - 1 + j())}`;
}

/** Underline a word or phrase. `double` adds a second, shorter pass. */
export function Underline({
  children,
  double = false,
  tone = "ink",
  seed,
}: {
  children: React.ReactNode;
  double?: boolean;
  tone?: Tone;
  seed?: string;
}) {
  const r = rng(hash(seed ?? String(children)));
  const a = underlinePath(r, 4 + r() * 2, -2 + r() * 3, 101 + r() * 3);
  const b = double ? underlinePath(r, 9 + r() * 1.5, 4 + r() * 6, 96 + r() * 5) : null;
  return (
    <span className={`mk mk-u mk--${tone}`}>
      {children}
      <svg className="mk__svg mk-u__svg draw" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
        <path d={a} vectorEffect="non-scaling-stroke" />
        {b && <path d={b} vectorEffect="non-scaling-stroke" />}
      </svg>
    </span>
  );
}

/** A loose ballpoint loop around a word, overshooting where it closes. */
export function Circle({
  children,
  tone = "ink",
  seed,
}: {
  children: React.ReactNode;
  tone?: Tone;
  seed?: string;
}) {
  const r = rng(hash(seed ?? "c" + String(children)));
  const j = (n: number) => (r() - 0.5) * n;
  // start top-right, go anticlockwise round, overshoot past the start
  const d =
    `M${f(78 + j(6))} ${f(6 + j(4))}` +
    ` C${f(52 + j(6))} ${f(-2 + j(3))} ${f(6 + j(4))} ${f(6 + j(4))} ${f(3 + j(3))} ${f(30 + j(4))}` +
    ` C${f(1 + j(3))} ${f(52 + j(4))} ${f(40 + j(6))} ${f(60 + j(3))} ${f(70 + j(6))} ${f(56 + j(3))}` +
    ` C${f(100 + j(4))} ${f(50 + j(4))} ${f(103 + j(3))} ${f(18 + j(4))} ${f(80 + j(6))} ${f(8 + j(4))}` +
    ` C${f(66 + j(6))} ${f(2 + j(3))} ${f(46 + j(6))} ${f(4 + j(3))} ${f(34 + j(8))} ${f(9 + j(4))}`;
  return (
    <span className={`mk mk-c mk--${tone}`}>
      {children}
      <svg className="mk__svg mk-c__svg draw" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
        <path d={d} vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

/** Strike a word through, like replacing a first idea with a better one. */
export function CrossOut({
  children,
  tone = "ink",
  seed,
}: {
  children: React.ReactNode;
  tone?: Tone;
  seed?: string;
}) {
  const r = rng(hash(seed ?? "x" + String(children)));
  const y = 50 + (r() - 0.5) * 10;
  const d = `M-2 ${f(y + 6)} C30 ${f(y + 2)} 65 ${f(y - 1)} 102 ${f(y - 7)}`;
  const d2 = `M2 ${f(y - 2)} C35 ${f(y + 3)} 70 ${f(y)} 99 ${f(y + 1)}`;
  return (
    <span className={`mk mk-x mk--${tone}`}>
      <span className="mk-x__t">{children}</span>
      <svg className="mk__svg mk-x__svg draw" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={d} vectorEffect="non-scaling-stroke" />
        <path d={d2} vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

/**
 * A curved ballpoint arrow. Points from the left edge of its box to the
 * right edge (flip with `dir`). `bend` lifts the middle of the curve.
 */
export function Arrow({
  width = 120,
  height = 50,
  dir = "right",
  bend = 0.5,
  tone = "ink",
  seed = "arrow",
  className = "",
  style,
}: {
  width?: number;
  height?: number;
  dir?: "right" | "left" | "down" | "up";
  bend?: number;
  tone?: Tone;
  seed?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const r = rng(hash(seed));
  const W = 100, H = 50;
  const x0 = 4, y0 = H * 0.7, x1 = W - 6, y1 = H * 0.55;
  const cx = W * (0.45 + (r() - 0.5) * 0.1);
  const cy = y0 - H * bend * 1.1;
  const shaft = `M${x0} ${f(y0)} Q${f(cx)} ${f(cy)} ${x1} ${f(y1)}`;
  // head: two short strokes back from the tip, along the tangent
  const tx = x1 - cx, ty = y1 - cy;
  const tl = Math.hypot(tx, ty);
  const ux = tx / tl, uy = ty / tl;
  const head = (s: number) => {
    const a = (s * (24 + r() * 8) * Math.PI) / 180;
    const hx = -(ux * Math.cos(a) - uy * Math.sin(a)) * 12;
    const hy = -(ux * Math.sin(a) + uy * Math.cos(a)) * 12;
    return `M${x1} ${f(y1)} l${f(hx)} ${f(hy)}`;
  };
  const rot = { right: 0, left: 180, down: 90, up: -90 }[dir];
  return (
    <svg
      className={`mk-a draw mk--${tone} ${className}`.trim()}
      width={width}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ ...style, transform: `${style?.transform ?? ""} rotate(${rot}deg)`.trim() }}
    >
      <path d={shaft} vectorEffect="non-scaling-stroke" />
      <path d={head(1) + " " + head(-1)} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
