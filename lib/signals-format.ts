import type { Signal } from "./signals";

// Pure display helpers for The Paper Trail, safe to import from client components
// (lib/signals.ts reads files from disk and must stay on the server).

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

export function formatDay(iso: string): string {
  return fmt(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso), { month: "short", day: "numeric" });
}

export type SourceGroup = "hiring" | "jobs" | "sec" | "web" | "posts";

export const SOURCE_LABEL: Record<SourceGroup, string> = {
  hiring: "Hiring",
  jobs: "Job posts",
  sec: "SEC filing",
  web: "Website",
  posts: "Company posts",
};

/** Where a signal type comes from, for tags and the front-page figure. */
export function sourceOf(type: string): SourceGroup {
  if (type === "funding_filing" || type === "form_d_filed") return "sec";
  if (type === "company_announcement") return "posts";
  if (/^(trust_page|tool_|pricing_|reading_site_tools)/.test(type)) return "web";
  if (/^(technology_adoption|competitor_churn|need_keywords|reading_need_terms|reading_has_term|reading_job_tools|project_)/.test(type)) return "jobs";
  return "hiring";
}


/** Independent sources behind a set of signals. Hiring and job-post text share one source. */
export function independentSources(signals: Signal[]): string[] {
  const names: Record<SourceGroup, string> = { hiring: "Job boards", jobs: "Job boards", posts: "LinkedIn", sec: "SEC", web: "Website" };
  return [...new Set(signals.map((s) => names[sourceOf(s.type)]))];
}
