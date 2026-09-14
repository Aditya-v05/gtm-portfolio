import { getAllWeeks, getWeekBySlug, weekSlug } from "@/lib/signals";
import { csvResponse, siteUrlFor, weekCsv } from "@/lib/signals-csv";

// One section of an issue as a CSV.
export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllWeeks().flatMap((w) => w.niches.map((n) => ({ week: weekSlug(w.week), section: n.id })));
}

export async function GET(request: Request, { params }: { params: Promise<{ week: string; section: string }> }) {
  const { week, section } = await params;
  const w = getWeekBySlug(week);
  const niche = w?.niches.find((n) => n.id === section);
  if (!w || !niche) return new Response("Not found", { status: 404 });
  return csvResponse(weekCsv(w, [niche], siteUrlFor(request)), `the-paper-trail-${w.week}-${niche.id}.csv`);
}
