import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { getLatestWeek, type PrecisionEntry } from "@/lib/signals";

export const metadata: Metadata = {
  title: "How The Paper Trail is made - Aditya",
  description: "Where The Paper Trail's lists come from, how companies are scored, and how accurate each signal is.",
};

// Precision is measured by hand-labelling fired events before a signal type can
// appear publicly. Until labels exist, the table says so rather than showing a number.
const SIGNAL_TYPES = [
  ["First role in a function", "Public job boards"],
  ["Hiring surge", "Public job boards"],
  ["GTM or leadership role posted", "Public job boards"],
  ["First role in a new country or state", "Public job boards"],
  ["Technology adoption", "Job post text"],
  ["Competitor churn", "Job post text"],
  ["Need keywords", "Job post text"],
  ["Form D filed", "SEC EDGAR"],
  ["Tool appears on a homepage", "Company websites"],
  ["Trust or security page appears", "Company websites"],
  ["Pricing page adds an enterprise path", "Company websites"],
  ["Open roles this week (reading)", "Public job boards"],
  ["Need described in job posts (reading)", "Job post text, checked by a model"],
  ["Tools in use (reading)", "Job post text and homepages"],
  ["Company announcement", "The company's own LinkedIn posts, read by a model"],
] as const;

const pct = (x: number) => `${Math.round(x * 100)}%`;

function precisionText(p: PrecisionEntry): string {
  if (p.status === "not measured") return p.labelled ? `not measured yet (${p.labelled} labelled)` : "not measured yet";
  const range = p.low !== null && p.high !== null ? `, 95% range ${pct(p.low)} to ${pct(p.high)}` : "";
  const who = p.reviewedBy ? `, reviewed by ${p.reviewedBy}` : "";
  const base = `${pct(p.precision ?? 0)} of ${p.labelled}${range}${who}`;
  return p.status === "hidden" ? `${base}; hidden` : base;
}

export default function HowItWorks() {
  const measured = getLatestWeek()?.precision ?? [];
  const rows: Array<{ name: string; source: string; value: string; status: string }> = measured.length
    ? measured.map((p) => ({ name: p.name, source: p.source, value: precisionText(p), status: p.status }))
    : SIGNAL_TYPES.map(([name, source]) => ({ name, source, value: "not measured yet", status: "not measured" }));
  return (
    <>
      <SiteNav variant="page" />
      <main className="sig sig--doc">
        <header className="sig__head">
          <p className="sig__eyebrow">
            <Link className="cursor-target" href="/signals">
              The Paper Trail
            </Link>{" "}
            · how it works
          </p>
          <h1 className="sig__title">How this works</h1>
          <p className="sig__lede">
            A signal engine reads public data every week, turns changes into events, and ranks the
            companies most likely to buy from each category. Everything here is company-level and
            public. No named people, no logins, no private data.
          </p>
        </header>

        <section className="sigdoc">
          <h2>What a niche is</h2>
          <p>
            A niche is a category of software, like SOC 2 compliance automation. Its page lists that
            category&apos;s potential customers: companies whose public signals say the need is live now.
            The readers are the vendors in that category. Niches are picked monthly from the ones where
            vendors are well funded and building their GTM teams.
          </p>

          <h2>Changes, and this week&apos;s readings</h2>
          <p>
            Most signals are changes between weekly snapshots. &quot;Started hiring security engineers&quot;
            fires once, in the week it happens. Growth is measured against each company&apos;s own recent
            baseline, so a large company is not rewarded just for always having more openings.
          </p>
          <p>
            Changes need history, and the engine is new. So each card can also carry readings: what is
            true this week, labelled as a count, like &quot;2 open security roles&quot;. Readings weigh less than
            changes in every niche, and tools a company already uses never list it on their own. As
            weeks of history build, changes take over the top of each list.
          </p>

          <h2>How job posts are read</h2>
          <ul>
            <li>Titles are classified into a function and seniority by rules written against real job board titles.</li>
            <li>A tool counts only in a role that would use it. Kubernetes in an electrician&apos;s posting says nothing about the platform team.</li>
            <li>Counts are distinct roles, so a role reposted in five cities, or a paragraph pasted into every posting, counts once.</li>
            <li>
              A keyword cannot tell &quot;you will lead our first SOC 2 audit&quot; from &quot;exposure to SOC 2 is a
              plus&quot;. A language model reads the text around each mention and decides whether the company
              needs the work, already has it, or is only describing a candidate. Only the first two count.
            </li>
          </ul>

          <h2>Scoring: agreement compounds</h2>
          <p>
            A company that is hiring is not news. A company that is hiring security engineers, announced an
            enterprise plan on its own LinkedIn page, and added a trust page to its site the same month is. The
            score is built to reward that agreement, not volume from any one place.
          </p>
          <ul>
            <li>There are four independent sources: job boards, the company&apos;s own LinkedIn posts, its website, and SEC filings. Hiring and job-post text count as one source, because they come from the same postings.</li>
            <li>Within a source, each further signal counts for less: the first in full, the second half, the rest a quarter. Five hiring signals are one story, not five.</li>
            <li>Across sources, agreement multiplies. Every extra source with timing evidence in the same month raises the score sharply; a source that only shows fit, like the tools a site runs, raises it a little.</li>
            <li>Bands mean breadth. Very strong needs three sources in agreement, strong needs two. A company seen through one source can be listed, but never above medium.</li>
            <li>Each signal is weighted by how much it matters for that niche, how confident it is, and how recent it is. Nothing older than 90 days counts.</li>
            <li>For SOC 2 and CTV, a company already using a direct competitor is removed, not scored down. Vendors in a category are never listed as its buyers.</li>
            <li>&quot;Why now&quot; and the opener are written by a model from that card&apos;s signals only, then checked: no named people, no certainty, and they must point at a signal. Anything that fails is replaced with plain text built from the signals.</li>
          </ul>

          <h2>Precision</h2>
          <p>
            Signals are sampled at random from everything the engine scored, not only what reached the page, and
            each one is judged against a written rule with its evidence in front of the reviewer. So far the
            reviewer is an AI: one model drafts a verdict and Claude, a second model that never sees the draft,
            reviews the signal independently. Only the reviewer&apos;s verdict counts. These numbers measure how
            often the engine agrees with a careful AI reading of the same evidence, not a human audit; each row
            says who reviewed it, and hand checks will be marked as such. A type is measured once it has 30
            labels (unsure calls do not count), and from then on it is left out of scoring and off the page if
            fewer than 70% are right.
          </p>
          <div className="sigprec">
            <div className="sigprec__head" aria-hidden="true">
              <span>Signal</span>
              <span>Source</span>
              <span>Precision</span>
            </div>
            {rows.map((r) => (
              <div className="sigprec__row" key={r.name}>
                <span>{r.name}</span>
                <span className="sigprec__src">{r.source}</span>
                <span className={`sigprec__val sigprec__val--${r.status.replace(" ", "-")}`}>{r.value}</span>
              </div>
            ))}
          </div>

          <h2>Known limits</h2>
          <ul>
            <li>The company pool is Y Combinator companies with a public website, and only those whose job board is linked from their own site. That over-represents tech startups.</li>
            <li>&quot;First ever&quot; signals need our own history, so they stay low confidence for the first 8 weeks.</li>
            <li>SEC Form D is US-only, not every round files one, and a filing is matched only when exactly one company in the pool carries its legal name.</li>
            <li>Homepages are read as served, so a pixel that a tag manager loads later is missed. &quot;No competitor found&quot; means none visible.</li>
            <li>Workable job boards publish no description text, so job text signals skip those companies.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
