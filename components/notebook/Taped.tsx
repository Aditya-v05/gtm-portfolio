import { hash, rng } from "./seed";

// A photo or printout taped into the notebook: two strips of tape, a slight
// tilt, and a scribbled caption. The inner frame carries data-zoom, so
// EvidenceZoom can lift it off the page to look closer.
export default function Taped({
  children,
  caption,
  seed = "taped",
  tilt,
  printout = false,
  className = "",
}: {
  children: React.ReactNode;
  caption?: React.ReactNode;
  seed?: string;
  tilt?: number;
  printout?: boolean;
  className?: string;
}) {
  const r = rng(hash(seed));
  const t = tilt ?? (r() - 0.5) * 2.2;
  const tape = () => ({
    transform: `rotate(${((r() - 0.5) * 14).toFixed(1)}deg)`,
  });
  return (
    <figure className={`taped${printout ? " taped--printout" : ""} ${className}`.trim()} style={{ transform: `rotate(${t.toFixed(2)}deg)` }}>
      <span className="tape tape--l" style={tape()} aria-hidden="true" />
      <span className="tape tape--r" style={tape()} aria-hidden="true" />
      <div className="taped__frame" data-zoom>
        {children}
      </div>
      {caption && <figcaption className="taped__cap">{caption}</figcaption>}
    </figure>
  );
}
