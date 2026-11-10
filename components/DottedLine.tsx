// A line of serif text drawn in dots: the letter outlines traced with a
// dotted stroke. Used for the closing question. The real text stays in the
// page for screen readers and search.
export default function DottedLine({ children }: { children: string }) {
  const w = children.length * 31;
  return (
    <>
      <span className="sr-only">{children}</span>
      <svg className="dotted" viewBox={`0 0 ${w} 80`} aria-hidden="true">
        <text x={w / 2} y="58" textAnchor="middle" fontSize="60" textLength={w - 20} lengthAdjust="spacingAndGlyphs">
          {children}
        </text>
      </svg>
    </>
  );
}
