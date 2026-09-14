import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import Paper from "@/components/signals/Paper";
import { formatWeek, getAllWeeks, getWeekBySlug, weekSlug } from "@/lib/signals";

// Only weeks that exist are built; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllWeeks().map((w) => ({ week: weekSlug(w.week) }));
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params;
  const w = getWeekBySlug(week);
  if (!w) return {};
  return {
    title: `Signals ${w.week} - Aditya`,
    description: `Potential customers for ${w.niches.map((n) => n.name).join(", ")}, ${formatWeek(w.week)}.`,
  };
}

export default async function SignalsWeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const w = getWeekBySlug(week);
  if (!w) notFound();

  return (
    <>
      <SiteNav variant="page" />
      <Paper week={w} weeks={getAllWeeks()} />
    </>
  );
}
