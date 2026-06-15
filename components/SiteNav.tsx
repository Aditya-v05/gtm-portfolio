import ThemeToggle from "@/components/ThemeToggle";

// variant "home": in-page section anchors (#work). variant "page": route back
// to the homepage first (/#work) so the links work from /blog pages.
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
            <a className="cursor-target" href="/">
              Aditya <em>Venkatesan</em>
              <span className="tail">gtm engineer</span>
            </a>
          )}
        </div>
        <div className="links">
          <a className="cursor-target" href={`${base}#work`}>
            Work
          </a>
          <a className="cursor-target" href={`${base}#stack`}>
            Stack
          </a>
          <a className="cursor-target" href="/blog">
            Blog
          </a>
          <a className="cursor-target" href="https://github.com/Aditya-v05">
            GitHub
          </a>
          <a className="cursor-target" href={`${base}#contact`}>
            Contact
          </a>
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
