// A thin channel of water running down the page between the windows into
// the world, so the water visibly travels from the hero to the harbour.
export default function Runnel({ height = 140, bend = 0 }: { height?: number; bend?: number }) {
  const d = `M20 0 C ${20 + bend} ${height * 0.35}, ${20 - bend} ${height * 0.65}, 20 ${height}`;
  return (
    <div className="runnel" aria-hidden="true" style={{ height }}>
      <svg viewBox={`0 0 40 ${height}`} width="40" height={height}>
        <path className="runnel__bed" d={d} />
        <path className="runnel__flow" d={d} />
      </svg>
    </div>
  );
}
