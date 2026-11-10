// A notebook entry, laid out like the user's own notes: the term in the
// left margin, the explanation running on the right. On phones the term sits
// above the entry.
export default function Entry({
  id,
  margin,
  children,
  className = "",
}: {
  id?: string;
  margin: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article id={id} className={`entry ${className}`.trim()}>
      <div className="entry__margin">{margin}</div>
      <div className="entry__body">{children}</div>
    </article>
  );
}
