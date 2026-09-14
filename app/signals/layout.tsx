import PaperIntro from "@/components/signals/PaperIntro";

// Every page of The Paper Trail shares the first-visit walkthrough.
export default function PaperTrailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PaperIntro />
    </>
  );
}
