import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

// Small, plain and always readable, links on the right like the reference.
// On the homepage it starts transparent over the hero sky and gains a quiet
// backing once the reader scrolls on (see NavHeightVar). variant "home" uses in-page anchors; "page" routes
// back to the homepage first so the links work from /writing.
export default function SiteNav({
  variant = "home",
}: {
  variant?: "home" | "page";
}) {
  const base = variant === "home" ? "" : "/";
  return (
    <nav className={`nav${variant === "page" ? " nav--page" : ""}`}>
      <div className="nav__in">
        <Link className="nav__brand" href="/">
          Aditya Venkatesan
        </Link>
        <div className="nav__links">
          <Link href={`${base}#work`}>Work</Link>
          <Link href={`${base}#about`}>About</Link>
          <Link href="/writing">Writing</Link>
          <Link href={`${base}#contact`}>Contact</Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
