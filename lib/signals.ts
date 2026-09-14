import fs from "node:fs";
import path from "node:path";

// Reads the weekly /signals files the signal engine writes into
// content/signals/<ISO week>.json. The file contract is fixed in
// docs/superpowers/specs/2026-09-14-signals-design.md, section 9.
//
// Validation is strict on purpose: unknown keys fail the build. A weekly file
// is public, and the engine also holds private vendor-side data (the heat
// score, the GTM-hiring lens). Rejecting anything outside the contract is what
// stops a field like that from ever reaching a page.

const SIGNALS_DIR = path.join(process.cwd(), "content", "signals");

export type Confidence = "high" | "medium" | "low";
export type Band = "very strong" | "strong" | "medium";

export type Evidence = { url: string; title: string; seenAt: string };

export type Signal = {
  type: string;
  label: string;
  firedAt: string;
  confidence: Confidence;
  evidence: Evidence[];
};

export type Company = {
  rank: number;
  domain: string;
  name: string;
  score: number;
  band: Band;
  reviewed: boolean;
  whyNow: string;
  opener: string;
  signals: Signal[];
};

export type Niche = {
  id: string;
  name: string;
  description: string;
  talkTo: string;
  companies: Company[];
};

export type SignalOfTheWeek = {
  nicheId: string;
  domain: string;
  headline: string;
  body: string;
};

export type Coverage = {
  companies: number;
  boards: number;
  postings: number;
  homepages: number;
  filings: number;
};

export type SignalsWeek = {
  version: 1;
  week: string; // "2026-W38"
  generatedAt: string;
  engineVersion: string;
  scoringVersion: string;
  sample: boolean;
  coverage: Coverage | null;
  signalOfTheWeek: SignalOfTheWeek | null;
  niches: Niche[];
};

// ---- validation ----

function fail(file: string, where: string, msg: string): never {
  throw new Error(`content/signals/${file}: ${where}: ${msg}`);
}

function exactKeys(file: string, where: string, obj: unknown, keys: string[]) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) fail(file, where, "expected an object");
  const extra = Object.keys(obj).filter((k) => !keys.includes(k));
  if (extra.length) fail(file, where, `unexpected field(s) ${extra.join(", ")}`);
  const missing = keys.filter((k) => !(k in obj));
  if (missing.length) fail(file, where, `missing field(s) ${missing.join(", ")}`);
}

function str(file: string, where: string, v: unknown) {
  if (typeof v !== "string" || !v.trim()) fail(file, where, "expected a non-empty string");
}

function oneOf(file: string, where: string, v: unknown, allowed: readonly string[]) {
  if (typeof v !== "string" || !allowed.includes(v)) fail(file, where, `expected one of ${allowed.join(", ")}`);
}

// No em dashes in anything the site publishes.
function noEmDash(file: string, where: string, v: string) {
  if (v.includes("—")) fail(file, where, "contains an em dash");
}

function validateWeek(file: string, raw: unknown): SignalsWeek {
  exactKeys(file, "week", raw, [
    "version", "week", "generatedAt", "engineVersion", "scoringVersion",
    "sample", "coverage", "signalOfTheWeek", "niches",
  ]);
  const w = raw as SignalsWeek;
  if (w.version !== 1) fail(file, "version", "expected 1");
  if (!/^\d{4}-W\d{2}$/.test(w.week)) fail(file, "week", 'expected "YYYY-Www"');
  if (`${w.week}.json` !== file) fail(file, "week", `does not match its file name (${w.week})`);
  str(file, "generatedAt", w.generatedAt);
  str(file, "engineVersion", w.engineVersion);
  str(file, "scoringVersion", w.scoringVersion);
  if (typeof w.sample !== "boolean") fail(file, "sample", "expected a boolean");
  if (w.coverage !== null) {
    const keys = ["companies", "boards", "postings", "homepages", "filings"] as const;
    exactKeys(file, "coverage", w.coverage, [...keys]);
    for (const k of keys) {
      const v = w.coverage[k];
      if (!Number.isInteger(v) || v < 0) fail(file, `coverage.${k}`, "expected a count");
    }
  }
  if (!Array.isArray(w.niches) || w.niches.length === 0) fail(file, "niches", "expected at least one niche");

  w.niches.forEach((n, ni) => {
    const at = `niches[${ni}]`;
    exactKeys(file, at, n, ["id", "name", "description", "talkTo", "companies"]);
    for (const k of ["id", "name", "description", "talkTo"] as const) {
      str(file, `${at}.${k}`, n[k]);
      noEmDash(file, `${at}.${k}`, n[k]);
    }
    if (!Array.isArray(n.companies) || n.companies.length > 10) fail(file, `${at}.companies`, "expected at most 10 companies");

    n.companies.forEach((c, ci) => {
      const cat = `${at}.companies[${ci}]`;
      exactKeys(file, cat, c, ["rank", "domain", "name", "score", "band", "reviewed", "whyNow", "opener", "signals"]);
      if (c.rank !== ci + 1) fail(file, `${cat}.rank`, `expected ${ci + 1}`);
      str(file, `${cat}.domain`, c.domain);
      str(file, `${cat}.name`, c.name);
      if (typeof c.score !== "number" || c.score < 0 || c.score > 100) fail(file, `${cat}.score`, "expected 0 to 100");
      oneOf(file, `${cat}.band`, c.band, ["very strong", "strong", "medium"]);
      if (typeof c.reviewed !== "boolean") fail(file, `${cat}.reviewed`, "expected a boolean");
      for (const k of ["whyNow", "opener"] as const) {
        str(file, `${cat}.${k}`, c[k]);
        noEmDash(file, `${cat}.${k}`, c[k]);
      }
      if (!Array.isArray(c.signals) || c.signals.length === 0) fail(file, `${cat}.signals`, "expected at least one signal");

      c.signals.forEach((s, si) => {
        const sat = `${cat}.signals[${si}]`;
        exactKeys(file, sat, s, ["type", "label", "firedAt", "confidence", "evidence"]);
        str(file, `${sat}.type`, s.type);
        str(file, `${sat}.label`, s.label);
        noEmDash(file, `${sat}.label`, s.label);
        str(file, `${sat}.firedAt`, s.firedAt);
        oneOf(file, `${sat}.confidence`, s.confidence, ["high", "medium", "low"]);
        if (!Array.isArray(s.evidence) || s.evidence.length === 0) fail(file, `${sat}.evidence`, "expected at least one source");
        s.evidence.forEach((e, ei) => {
          exactKeys(file, `${sat}.evidence[${ei}]`, e, ["url", "title", "seenAt"]);
          if (!/^https:\/\//.test(e.url)) fail(file, `${sat}.evidence[${ei}].url`, "expected an https URL");
        });
      });
    });
  });

  if (w.signalOfTheWeek !== null) {
    exactKeys(file, "signalOfTheWeek", w.signalOfTheWeek, ["nicheId", "domain", "headline", "body"]);
    const s = w.signalOfTheWeek;
    const niche = w.niches.find((n) => n.id === s.nicheId);
    if (!niche) fail(file, "signalOfTheWeek.nicheId", "does not match a niche");
    if (!niche.companies.some((c) => c.domain === s.domain)) fail(file, "signalOfTheWeek.domain", "is not listed in that niche");
    noEmDash(file, "signalOfTheWeek.headline", s.headline);
    noEmDash(file, "signalOfTheWeek.body", s.body);
  }
  return w;
}

// ---- reading ----

// Keyed by modification time, so a week the engine rewrites shows up on the next
// request in dev instead of after a server restart.
const cache = new Map<string, { mtimeMs: number; week: SignalsWeek }>();

function readWeek(file: string): SignalsWeek {
  const full = path.join(SIGNALS_DIR, file);
  const { mtimeMs } = fs.statSync(full);
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === mtimeMs) return hit.week;
  const week = validateWeek(file, JSON.parse(fs.readFileSync(full, "utf8")));
  cache.set(file, { mtimeMs, week });
  return week;
}

/** Every week, newest first. */
export function getAllWeeks(): SignalsWeek[] {
  if (!fs.existsSync(SIGNALS_DIR)) return [];
  return fs
    .readdirSync(SIGNALS_DIR)
    .filter((f) => /^\d{4}-W\d{2}\.json$/.test(f))
    .sort()
    .reverse()
    .map(readWeek);
}

export function getLatestWeek(): SignalsWeek | null {
  return getAllWeeks()[0] ?? null;
}

/** "2026-W38" is the file; "2026-w38" is the URL. */
export const weekSlug = (week: string) => week.toLowerCase();

export function getWeekBySlug(slug: string): SignalsWeek | null {
  return getAllWeeks().find((w) => weekSlug(w.week) === slug.toLowerCase()) ?? null;
}

/** Monday to Sunday of an ISO week, as dates. */
export function weekRange(week: string): { start: Date; end: Date } {
  const [y, w] = week.split("-W").map(Number);
  // ISO week 1 is the week containing 4 January.
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday1 = new Date(jan4);
  monday1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const start = new Date(monday1);
  start.setUTCDate(monday1.getUTCDate() + (w - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

export function formatWeek(week: string): string {
  const { start, end } = weekRange(week);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  // Built by hand: asking Intl for just a day and a year renders "2026 (day: 20)".
  const from = fmt(start, { month: "short", day: "numeric" });
  return sameMonth
    ? `${from} to ${end.getUTCDate()}, ${end.getUTCFullYear()}`
    : `${from} to ${fmt(end, { month: "short", day: "numeric" })}, ${end.getUTCFullYear()}`;
}

export function formatDay(iso: string): string {
  return fmt(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso), { month: "short", day: "numeric" });
}

// ---- company permalinks ----

export type Appearance = {
  week: string;
  nicheId: string;
  nicheName: string;
  company: Company;
};

export type CompanyHistory = {
  domain: string;
  name: string;
  appearances: Appearance[]; // newest week first
};

export function getCompanyIndex(): Map<string, CompanyHistory> {
  const index = new Map<string, CompanyHistory>();
  for (const w of getAllWeeks()) {
    for (const n of w.niches) {
      for (const c of n.companies) {
        const entry = index.get(c.domain) ?? { domain: c.domain, name: c.name, appearances: [] };
        entry.appearances.push({ week: w.week, nicheId: n.id, nicheName: n.name, company: c });
        index.set(c.domain, entry);
      }
    }
  }
  return index;
}

export function getCompany(domain: string): CompanyHistory | null {
  return getCompanyIndex().get(domain) ?? null;
}

// ---- presentation helpers ----

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

/** Issue number: the week's position among all published weeks, oldest first. */
export function issueNumber(week: string): number {
  const all = getAllWeeks().map((w) => w.week).sort();
  return all.indexOf(week) + 1;
}
