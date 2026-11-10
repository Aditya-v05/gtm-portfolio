import { Fragment } from "react";
import { hash, rng } from "./seed";

// Short handwritten lines (headings, labels). A font repeats every letter
// exactly, which is what gives handwriting fonts away. Hand nudges each
// letter a hair (rotation, baseline, spacing) with a seed taken from the
// text, so repeated letters differ but the result is the same on every
// render. Words stay unbroken. Use for headings only, never body text.
export default function Hand({
  children,
  as: Tag = "span",
  rush = false,
  className = "",
  jitter = 1,
}: {
  children: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
  rush?: boolean;
  className?: string;
  jitter?: number;
}) {
  const r = rng(hash(children));
  const words = children.split(" ");
  return (
    <Tag className={`hand ${rush ? "hand--rush" : "hand--neat"} ${className}`.trim()} aria-label={children}>
      {words.map((w, wi) => (
        <Fragment key={wi}>
        <span className="hand__w" aria-hidden="true">
          {Array.from(w).map((ch, ci) => {
            const rot = (r() - 0.5) * 5 * jitter;
            const dy = (r() - 0.5) * 0.07 * jitter;
            const dx = (r() - 0.5) * 0.03 * jitter;
            return (
              <span
                key={ci}
                className="hand__c"
                style={{ transform: `translate(${dx.toFixed(3)}em, ${dy.toFixed(3)}em) rotate(${rot.toFixed(2)}deg)` }}
              >
                {ch}
              </span>
            );
          })}
        </span>
        {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
