// One sheet of crumpled art paper. Each section is its own sheet with a
// different crumple, so long pages never show one tiled background. The
// textures come from scripts/make-paper.mjs (or the user's own photos, saved
// under the same names in public/paper/).
export default function Sheet({
  id,
  paper = 1,
  children,
  className = "",
  label,
}: {
  id?: string;
  paper?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section id={id} aria-label={label} className={`sheet sheet--p${paper} ${className}`.trim()}>
      <div className="sheet__in">{children}</div>
    </section>
  );
}
