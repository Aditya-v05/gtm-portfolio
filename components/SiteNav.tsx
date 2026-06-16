import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

// variant "home": in-page section anchors (#work). variant "page": route back
// to the homepage first (/#work) so the links work from /blog pages.
// Internal routes use next/link for client-side navigation (no full reload,
// which otherwise replays the boot intro and flashes a black screen).
export default function SiteNav({
  variant = "home",
}: {
  variant?: "home" | "page";
}) {
  const base = variant === "home" ? "" : "/";
  return (
    <nav>
      <div className="in">
        <div className="brand">
          {variant === "home" ? (
            <>
              Aditya <em>Venkatesan</em>
              <span className="tail">gtm engineer</span>
            </>
          ) : (
            <Link className="cursor-target" href="/">
              Aditya <em>Venkatesan</em>
              <span className="tail">gtm engineer</span>
            </Link>
          )}
        </div>
        <div className="links">
          <Link className="cursor-target" href={`${base}#work`}>
            Work
          </Link>
          <Link className="cursor-target" href={`${base}#stack`}>
            Stack
          </Link>
          <Link className="cursor-target" href="/blog">
            Blog
          </Link>
          <a className="cursor-target" href="https://github.com/Aditya-v05">
            GitHub
          </a>
          <Link className="cursor-target" href={`${base}#contact`}>
            Contact
          </Link>
          <ThemeToggle />
          <a
            className="modebtn navpdf cursor-target"
            href="/Aditya-GTM-Engineering-Portfolio.pdf"
            download
          >
            <span className="navpdf__t">portfolio.</span>pdf ↓
          </a>
        </div>
      </div>
    </nav>
  );
}
