"use client";

import { useRef } from "react";
import Sea from "@/components/sea/Sea";
import { SOCIALS } from "@/lib/socials";

// The closing scene, a whole page of it: the ask, the address and the links up in the sky, Aditya's name
// standing huge in the sea, and the waves rolling in front of it.
const EMAIL = "adityaspark05@gmail.com";
const LINKS: [string, string, string][] = [...SOCIALS, ["Writing", "/writing", "M2 1h7v1h1v9H3v-1H2zM4 3v1h4V3zM4 5v1h4V5zM4 7v1h3V7z"]];

export default function Footer() {
  const name = useRef<HTMLParagraphElement>(null);

  // The letter under the pointer rises out of the water, and its neighbours rise a little with it. It goes by
  // how far each letter is from the pointer sideways, so a letter does not drop the moment it lifts away.
  const lift = (x: number | null) => {
    name.current?.querySelectorAll<HTMLElement>("span").forEach((s) => {
      const r = s.getBoundingClientRect(), d = x === null ? 9 : Math.abs(x - (r.left + r.width / 2)) / r.width;
      s.style.setProperty("--lift", (d < 0.5 ? 1 : d < 1.5 ? 0.38 : d < 2.5 ? 0.12 : 0).toString());
    });
  };

  return (
    <section id="contact" className="foot" aria-labelledby="contact-title">
      <p ref={name} className="foot__name" aria-hidden="true" onPointerMove={(e) => lift(e.clientX)} onPointerLeave={() => lift(null)}>
        {"Aditya".split("").map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </p>
      <Sea />
      <div className="scene__in foot__in" data-above-sea>
        <h2 id="contact-title" className="ask">
          Got an interesting GTM problem?
        </h2>
        <p className="ask__sub">I&apos;d love to hear about it.</p>
        <p className="contact">
          <a className="contact__mail" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </p>
        <ul className="foot__links">
          {LINKS.map(([label, href, d]) => (
            <li key={label}>
              <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
                  <path d={d} />
                </svg>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="foot__c">© 2026 Aditya Venkatesan</p>
      </div>
    </section>
  );
}
