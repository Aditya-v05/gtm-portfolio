import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import { SectionPage } from "@/components/signals/Paper";
import Turn from "@/components/signals/Turn";
import { formatWeek, getAllWeeks, getWeekBySlug, weekSlug } from "@/lib/signals";

// One inside page of an issue: a niche's section. Only sections that exist are built.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllWeeks().flatMap((w) => w.niches.map((n) => ({ week: weekSlug(w.week), section: n.id })));
}

function find(weekParam: string, sectionParam: string) {
  const week = getWeekBySlug(weekParam);
  const niche = week?.niches.find((n) => n.id === sectionParam);
  return week && niche ? { week, niche } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ week: string; section: string }> }): Promise<Metadata> {
  const { week, section } = await params;
  const hit = find(week, section);
  if (!hit) return {};
  return {
    title: `${hit.niche.name} - The Paper Trail, ${hit.week.week} - Aditya`,
    description: `Potential customers for ${hit.niche.name}, ${formatWeek(hit.week.week)}, with the public evidence behind each one.`,
  };
}

export default async function SignalsSectionPage({ params }: { params: Promise<{ week: string; section: string }> }) {
  const { week, section } = await params;
  const hit = find(week, section);
  if (!hit) notFound();
  const page = hit.week.niches.findIndex((n) => n.id === hit.niche.id) + 2;

  return (
    <>
      <SiteNav variant="page" />
      <Turn key={page} page={page}>
        <SectionPage week={hit.week} niche={hit.niche} />
      </Turn>
    </>
  );
}
