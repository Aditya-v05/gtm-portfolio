import CursorFX from "@/components/CursorFX";
import Noise from "@/components/Noise";

// Blog pages reuse the site's ambient FX (custom cursor + film-grain noise) but
// NOT the homepage boot intro. Theme persistence is handled globally by the
// inline script in the root layout, so the ThemeToggle in SiteNav just works.
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CursorFX />
      <Noise patternSize={250} patternAlpha={10} patternRefreshInterval={3} />
      {children}
    </>
  );
}
