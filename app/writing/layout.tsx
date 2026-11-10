import EvidenceZoom from "@/components/EvidenceZoom";
import NavHeightVar from "@/components/NavHeightVar";
import World from "@/components/world/World";

// Writing lives in the library district of the same city.
export default function WritingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <World />
      <NavHeightVar />
      <EvidenceZoom />
      {children}
    </>
  );
}
