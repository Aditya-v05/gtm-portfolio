import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

// A notch hanging from the top of the screen, with pixel-stepped corners.
// variant "home" uses in-page anchors; "page" routes back to the homepage
// first so the links work from /writing.
export default function SiteNav({
  variant = "home",
}: {
  variant?: "home" | "page";
}) {
  const base = variant === "home" ? "" : "/";
  return (
    <nav className="notch" aria-label="Main">
      <div className="notch__in">
        <Link className="notch__brand" href="/">
          <span className="notch__mark" aria-hidden="true" />
          Aditya
        </Link>
        <div className="notch__links">
          <Link href={`${base}#work`}>Work</Link>
          <Link href={`${base}#about`}>About</Link>
          <Link href="/writing">Writing</Link>
        </div>
        <Link className="notch__cta" href={`${base}#contact`}>
          Contact
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
