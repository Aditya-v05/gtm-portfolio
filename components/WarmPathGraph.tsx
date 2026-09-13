// Warmest Path output drawn as the graph it is: our roster on the left, target
// accounts on the right, the unreached as dust, and the few real paths lit.
//
// The accounts and the four lit scores are from the real run. The people are
// not: every person node is an anonymous dot from a seeded generator, so the
// graph renders identically on every build and names nobody. What it shows
// truthfully is the SHAPE of a run: most targets are unreachable, a handful of
// paths survive, and one of them needs a bridge inside the target's company.

type Pt = { x: number; y: number };

// small deterministic generator, so the scatter is stable across renders
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(11);

// our company: one dense cluster
const OURS: Pt[] = Array.from({ length: 26 }, () => {
  const r = 92 * Math.sqrt(rng());
  const a = rng() * Math.PI * 2;
  return { x: 175 + Math.cos(a) * r * 1.05, y: 222 + Math.sin(a) * r };
});

// target accounts from the run, each a hub with a few people around it
const ACCOUNT_AT: { x: number; y: number; name: string }[] = [
  { x: 610, y: 88, name: "EY" },
  { x: 790, y: 120, name: "Goldman Sachs" },
  { x: 895, y: 250, name: "Visa" },
  { x: 700, y: 222, name: "State Street" },
  { x: 560, y: 300, name: "Citi" },
  { x: 790, y: 360, name: "Motorola Solutions" },
  { x: 630, y: 405, name: "Cityblock Health" },
  { x: 885, y: 64, name: "Verizon Business" },
  { x: 905, y: 400, name: "Lightspeed" },
];
const ACCOUNTS = ACCOUNT_AT.map((hub) => {
  const n = 3 + Math.floor(rng() * 4);
  const people = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rng() * 0.6;
    const r = 19 + rng() * 10;
    return { x: hub.x + Math.cos(a) * r, y: hub.y + Math.sin(a) * r };
  });
  return { hub, people };
});

// everyone no path reached, as dust
const DUST: Pt[] = Array.from({ length: 280 }, () => ({
  x: 390 + rng() * 555,
  y: 18 + rng() * 410,
}));

// the search: candidate pairs that were checked and scored below the floor
const TRIED: [Pt, Pt][] = Array.from({ length: 22 }, () => {
  const a = OURS[Math.floor(rng() * OURS.length)];
  const acct = ACCOUNTS[Math.floor(rng() * ACCOUNTS.length)];
  return [a, acct.people[Math.floor(rng() * acct.people.length)]];
});

type Lit = { from: Pt; via?: Pt; to: Pt; score: string; band: "vs" | "s" | "m" };
const LIT: Lit[] = [
  { from: OURS[2], to: ACCOUNTS[0].people[0], score: "0.72", band: "vs" },
  { from: OURS[7], to: ACCOUNTS[3].people[1], score: "0.69", band: "vs" },
  { from: OURS[11], to: ACCOUNTS[4].people[2], score: "0.57", band: "s" },
  // stage 2: into the target through a colleague who sits beside them today
  { from: OURS[16], via: ACCOUNTS[5].people[0], to: ACCOUNTS[5].people[2], score: "0.34", band: "m" },
];

const curve = (a: Pt, b: Pt, lift = 46) =>
  `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${((a.x + b.x) / 2).toFixed(1)} ${(Math.min(a.y, b.y) - lift).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;

const CHAMPIONS = new Set(LIT.map((l) => l.from));
const REACHED = new Set(LIT.flatMap((l) => (l.via ? [l.via, l.to] : [l.to])));

export default function WarmPathGraph() {
  return (
    <div className="wpg cursor-target" data-zoom>
      <div className="term__bar">
        <span className="d r" /><span className="d y" /><span className="d g" />
        <span className="f">warmest-path · run graph · 4,426 targets</span>
      </div>
      <svg className="wpg__svg" viewBox="0 0 960 440" role="img"
        aria-label="A run drawn as a graph: our roster on the left, target accounts on the right, unreached targets as dust, and four lit warm paths, one of them through a bridge inside the target company.">
        {DUST.map((d, i) => (
          <circle key={`d${i}`} className="wpg__dust" cx={d.x} cy={d.y} r={0.9 + (i % 3) * 0.35} />
        ))}

        {TRIED.map(([a, b], i) => (
          <path key={`t${i}`} className="wpg__tried" d={curve(a, b, 30)} />
        ))}

        {ACCOUNTS.map((acct, i) => (
          <g key={`a${i}`}>
            {acct.people.map((p, j) => (
              <line key={j} className="wpg__spoke" x1={acct.hub.x} y1={acct.hub.y} x2={p.x} y2={p.y} />
            ))}
            <circle className="wpg__hub" cx={acct.hub.x} cy={acct.hub.y} r={4.2} />
            <text
              className="wpg__acct"
              x={acct.hub.x > 850 ? acct.hub.x - 9 : acct.hub.x + 9}
              y={acct.hub.y - 30}
              textAnchor={acct.hub.x > 850 ? "end" : "start"}
            >
              {acct.hub.name}
            </text>
            {acct.people.map((p, j) => (
              <circle key={j} className={`wpg__p${REACHED.has(p) ? " is-hit" : ""}`} cx={p.x} cy={p.y} r={REACHED.has(p) ? 3.6 : 2.2} />
            ))}
          </g>
        ))}

        {OURS.map((p, i) => (
          <circle key={`o${i}`} className={`wpg__our${CHAMPIONS.has(p) ? " is-champ" : ""}`} cx={p.x} cy={p.y} r={CHAMPIONS.has(p) ? 4.4 : 2.8} />
        ))}

        {LIT.map((l, i) => {
          const legs = l.via ? [curve(l.from, l.via), curve(l.via, l.to, 14)] : [curve(l.from, l.to)];
          return (
            <g key={`l${i}`} className={`wpg__lit wpg__lit--${l.band}`}>
              {legs.map((d, j) => (
                <g key={j}>
                  <path className="wpg__edge" d={d} />
                  <path className="wpg__pulse" d={d} pathLength={1} style={{ animationDelay: `${-i * 0.9 - j * 0.6}s` }} />
                </g>
              ))}
              {l.via && <circle className="wpg__bridge" cx={l.via.x} cy={l.via.y} r={6.5} />}
              <text className="wpg__score" x={l.to.x + 11} y={l.to.y + 4}>{l.score}</text>
            </g>
          );
        })}

        <text className="wpg__k" x="92" y="104">our roster</text>
        <text className="wpg__k" x="560" y="30">target accounts</text>

        <g className="wpg__legend" transform="translate(28 408)">
          <circle className="wpg__our is-champ" cx="4" cy="-3" r="4" />
          <text x="14" y="0">champion</text>
          <circle className="wpg__bridge" cx="96" cy="-3" r="5.5" />
          <text x="108" y="0">bridge at target co.</text>
          <circle className="wpg__dust" cx="252" cy="-3" r="1.6" />
          <text x="262" y="0">unreached</text>
        </g>
      </svg>
    </div>
  );
}
