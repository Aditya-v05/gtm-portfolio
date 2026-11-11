"use client";

import { useState } from "react";
import Sea from "@/components/sea/Sea";
import { SOCIALS } from "@/lib/socials";

// The closing scene, a whole page of it: the ask and the ways to reach Aditya up in the sky, his name standing
// huge on the horizon, and the sea rolling in front of it.
const EMAIL = "adityaspark05@gmail.com";
export default function Footer() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  return (
    <section id="contact" className="foot" aria-labelledby="contact-title">
      {/* each letter is its own piece, so they can rise out of the water one after another */}
      <p className="foot__name" aria-hidden="true">
        {"Aditya".split("").map((ch, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties}>
            {ch}
          </span>
        ))}
      </p>
      <Sea />
      <div className="foot__in" data-above-sea>
        <div className="foot__ask">
          <p className="foot__k">Contact</p>
          <h2 id="contact-title" className="foot__title">
            Got an interesting GTM <span>problem?</span>
          </h2>
          <p className="foot__sub">A role, a project, a pipeline that leaks, or just hello. I&apos;d love to hear about it.</p>
          <div className="foot__reach">
            <a className="foot__cta" href={`mailto:${EMAIL}`}>
              Tell me about it
              <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
                <path d="M1 5h7V3h1v1h1v1h1v2h-1v1H9v1H8V7H1z" />
              </svg>
            </a>
            <button className="foot__mail" onClick={copy} aria-label={`Copy the address ${EMAIL}`}>
              <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
                <path d="M1 1h7v2H7V2H2v5h1v1H1zM4 4h7v7H4zM5 5v5h5V5z" />
              </svg>
              <span>{copied ? "Copied" : EMAIL}</span>
            </button>
          </div>
        </div>
        <div className="foot__else">
          <p className="foot__k">Elsewhere</p>
          <ul className="foot__socials">
            {SOCIALS.map(([name, href, d]) => (
              <li key={name}>
                <a href={href} target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
                    <path d={d} />
                  </svg>
                  {name}
                </a>
              </li>
            ))}
          </ul>
          <a className="foot__writing" href="/writing">
            Or read what I write here
            <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
              <path d="M1 5h7V3h1v1h1v1h1v2h-1v1H9v1H8V7H1z" />
            </svg>
          </a>
        </div>
        <div className="foot__base">
          <span>© 2026 Aditya Venkatesan</span>
          <a href="#top">
            Back to top
            <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
              <path d="M5 11V4H3V3h1V2h1V1h2v1h1v1h1v1H7v7z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
