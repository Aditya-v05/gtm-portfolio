import Sea from "@/components/sea/Sea";
import { SOCIALS } from "@/lib/socials";

// The closing scene, a whole page of it: the ask, the address and the links up in the sky, and open sea
// filling everything below them.
const EMAIL = "adityaspark05@gmail.com";
const LINKS: [string, string, string][] = [...SOCIALS, ["Writing", "/writing", "M2 1h7v1h1v9H3v-1H2zM4 3v1h4V3zM4 5v1h4V5zM4 7v1h3V7z"]];

export default function Footer() {
  return (
    <section id="contact" className="foot" aria-labelledby="contact-title">
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
      </div>
      <p className="foot__c">© 2026 Aditya Venkatesan</p>
    </section>
  );
}
