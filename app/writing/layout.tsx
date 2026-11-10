import EvidenceZoom from "@/components/EvidenceZoom";

// Writing pages share the notebook's paper and nav, and can zoom taped photos.
export default function WritingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EvidenceZoom />
      {children}
    </>
  );
}
