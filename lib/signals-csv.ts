import type { Niche, SignalsWeek } from "./signals";
import { independentSources } from "./signals-format";

// The Paper Trail as a spreadsheet: one row per listed company, everything on its card.

const HEADERS = [
  "issue",
  "section",
  "rank",
  "company",
  "domain",
  "score",
  "band",
  "independent_sources",
  "why_now",
  "talk_to",
  "opener",
  "signals",
  "source_urls",
  "company_file",
];

/** One CSV cell: quoted when needed, and never read by a spreadsheet as a formula. */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rows(week: SignalsWeek, niches: Niche[], siteUrl: string): string[][] {
  return niches.flatMap((n) =>
    n.companies.map((c) => [
      week.week,
      n.name,
      String(c.rank),
      c.name,
      c.domain,
      String(c.score),
      c.band,
      independentSources(c.signals).join("; "),
      c.whyNow,
      n.talkTo,
      c.opener,
      c.signals.map((s) => `${s.label} (${s.firedAt})`).join(" | "),
      [...new Set(c.signals.flatMap((s) => s.evidence.map((e) => e.url)))].join(" | "),
      `${siteUrl}/signals/companies/${c.domain}`,
    ]),
  );
}

export function weekCsv(week: SignalsWeek, niches: Niche[], siteUrl: string): string {
  const lines = [HEADERS, ...rows(week, niches, siteUrl)].map((r) => r.map(cell).join(","));
  // The byte order mark makes Excel read the file as UTF-8.
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}

export const siteUrlFor = (request: Request) => new URL(request.url).origin;
