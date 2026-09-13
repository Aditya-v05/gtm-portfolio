import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "How Signals works - Aditya",
  description: "Where the Signals lists come from, how companies are scored, and how accurate each signal is.",
};

// Precision is measured by hand-labelling fired events before a signal type can
// appear publicly. Until labels exist, the table says so rather than showing a number.
const SIGNAL_TYPES = [
  ["First role in a function", "Public job boards"],
  ["Hiring surge", "Public job boards"],
  ["GTM or leadership role posted", "Public job boards"],
  ["First role in a new country or state", "Public job boards"],
  ["Role closed", "Public job boards"],
  ["Technology adoption", "Job post text"],
  ["Competitor churn", "Job post text"],
  ["Need keywords", "Job post text"],
  ["Project detected", "Job post text"],
  ["Form D filed", "SEC EDGAR"],
  ["Tool detected in page source", "Company websites"],
  ["Trust or security page appears", "Company websites"],
  ["Pricing page changed", "Company websites"],
  ["Yes/no page check", "Company websites"],
] as const;

export default function HowItWorks() {
  return (
    <>
      <SiteNav variant="page" />
      <main className="sig sig--doc">
        <header className="sig__head">
          <p className="sig__eyebrow">
            <Link className="cursor-target" href="/signals">
              Signals
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

          <h2>Signals are changes, not states</h2>
          <p>
            A signal fires when something changes between weekly snapshots. &quot;Started hiring security
            engineers&quot; fires once. &quot;Has security roles open&quot; fires nothing. Growth is measured
            against each company&apos;s own recent baseline, so a large company is not rewarded just for
            always having more openings.
          </p>

          <h2>Scoring</h2>
          <ul>
            <li>Each event is weighted by how much it matters for that niche, how confident it is, and how recent it is.</li>
            <li>Signals from different groups in the same month score higher than any single signal.</li>
            <li>A company already using a direct competitor is removed, not scored down.</li>
            <li>The score is a percentile within that niche for the week. Every weight is a starting assumption, versioned, and tuned against results.</li>
          </ul>

          <h2>Precision</h2>
          <p>
            Before a signal type can appear publicly, up to 50 of its events are checked by hand against
            the evidence. A type needs at least 30 labels, and it stays hidden if fewer than 70% are right.
          </p>
          <div className="sigprec">
            <div className="sigprec__head" aria-hidden="true">
              <span>Signal</span>
              <span>Source</span>
              <span>Precision</span>
            </div>
            {SIGNAL_TYPES.map(([name, source]) => (
              <div className="sigprec__row" key={name}>
                <span>{name}</span>
                <span className="sigprec__src">{source}</span>
                <span className="sigprec__val">not measured yet</span>
              </div>
            ))}
          </div>

          <h2>Known limits</h2>
          <ul>
            <li>Public job boards over-represent tech startups. Traditional companies are underrepresented.</li>
            <li>&quot;First ever&quot; signals need our own history, so they stay low confidence for the first 8 weeks.</li>
            <li>SEC Form D is US-only, and not every funding round files one.</li>
            <li>Page source only shows tools that load in the browser. &quot;No competitor found&quot; means none visible.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
