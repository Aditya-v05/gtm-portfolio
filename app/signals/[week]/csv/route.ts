import { getAllWeeks, getWeekBySlug, weekSlug } from "@/lib/signals";
import { csvResponse, siteUrlFor, weekCsv } from "@/lib/signals-csv";

// The whole issue as a CSV: every section, every listed company.
export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllWeeks().map((w) => ({ week: weekSlug(w.week) }));
}

export async function GET(request: Request, { params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const w = getWeekBySlug(week);
  if (!w) return new Response("Not found", { status: 404 });
  return csvResponse(weekCsv(w, w.niches, siteUrlFor(request)), `the-paper-trail-${w.week}.csv`);
}
