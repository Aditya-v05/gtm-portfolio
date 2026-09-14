import Link from "next/link";
import type { Company, Niche, SignalsWeek } from "@/lib/signals";
import { formatDay, formatWeek, issueNumber, SOURCE_LABEL, sourceOf, weekSlug, type SourceGroup } from "@/lib/signals";
import Brief, { Record } from "./Brief";
import Halftone from "./Halftone";
import PageKeys from "./PageKeys";

// /signals as a weekly newspaper, one page per section. Page 1 is the front page (the
// masthead, the lead story, the numbers, and what is inside); every niche is its own
// inside page with a running head, a section front and its own lead. Print structure,
// the site's own type and colour.

export const frontHref = (week: SignalsWeek) => `/signals/${weekSlug(week.week)}`;
export const sectionHref = (week: SignalsWeek, niche: Niche) => `/signals/${weekSlug(week.week)}/${niche.id}`;
const letter = (i: number) => String.fromCharCode(65 + i);

export function pagesOf(week: SignalsWeek) {
  return [
    { number: 1, label: "Front page", href: frontHref(week) },
    ...week.niches.map((n, i) => ({ number: i + 2, label: n.name, href: sectionHref(week, n) })),
  ];
}

const GROUP_ORDER: SourceGroup[] = ["hiring", "jobs", "posts", "sec", "web"];
const fmt = (n: number) => n.toLocaleString("en-US");

function sourceBars(companies: Company[]) {
  const counts = new Map<SourceGroup, number>();
  for (const c of companies) for (const s of c.signals) counts.set(sourceOf(s.type), (counts.get(sourceOf(s.type)) ?? 0) + 1);
  return GROUP_ORDER.map((g) => ({ label: SOURCE_LABEL[g], value: counts.get(g) ?? 0 }));
}

const barsLabel = (bars: { label: string; value: number }[]) => bars.map((b) => `${b.label} ${b.value}`).join(", ");

export function SampleBanner() {
  return (
    <div className="paper__sample" role="note">
      <b>Sample data.</b> These companies are fictional and every link goes to example.com.
    </div>
  );
}

export function Masthead({ week }: { week: SignalsWeek }) {
  return (
    <header className="mast">
      <div className="mast__strip">
        <span>Vol. 1 · No. {issueNumber(week.week)}</span>
        <span>
          Week {week.week.split("-W")[1]} · {formatWeek(week.week)}
        </span>
        <span>Public data · company level</span>
      </div>
      <p className="mast__name">Signals</p>
      <p className="mast__motto">Who is about to buy, and the public record that says so.</p>
    </header>
  );
}

/** The running head of an inside page. */
export function Folio({ week, page, label }: { week: SignalsWeek; page?: number; label: string }) {
  return (
    <header className="folio">
      <Link className="folio__name cursor-target" href={frontHref(week)}>
        Signals
      </Link>
      <span className="folio__mid">{label}</span>
      <span className="folio__meta">
        No. {issueNumber(week.week)} · {formatWeek(week.week)}
        {page ? ` · Page ${page}` : ""}
      </span>
    </header>
  );
}

export function Pager({ week, current }: { week: SignalsWeek; current: number }) {
  const pages = pagesOf(week);
  const prev = pages[current - 2];
  const next = pages[current];
  return (
    <nav className="pager" aria-label="Pages of this issue">
      <div>
        {prev && (
          <Link className="pager__turn cursor-target" href={prev.href}>
            <span>← Page {prev.number}</span>
            {prev.label}
          </Link>
        )}
      </div>
      <ol className="pager__dots">
        {pages.map((p) => (
          <li key={p.number}>
            <Link
              className="cursor-target"
              href={p.href}
              aria-current={p.number === current ? "page" : undefined}
              title={p.label}
            >
              {p.number}
            </Link>
          </li>
        ))}
      </ol>
      <div>
        {next && (
          <Link className="pager__turn cursor-target" href={next.href}>
            <span>Page {next.number} →</span>
            {next.label}
          </Link>
        )}
      </div>
      <PageKeys prev={prev?.href} next={next?.href} />
    </nav>
  );
}

function LeadStory({
  kicker,
  headline,
  deck,
  byline,
  company,
  talkTo,
}: {
  kicker: string;
  headline: string;
  deck: string;
  byline: string[];
  company: Company;
  talkTo: string;
}) {
  return (
    <article className="lead">
      <p className="lead__kicker">{kicker}</p>
      <h1 className="lead__hed">{headline}</h1>
      <p className="lead__deck">{deck}</p>
      <p className="lead__byline">
        {byline.map((b) => (
          <span key={b}>{b}</span>
        ))}
      </p>
      <div className="lead__body">
        <p>
          {company.name} ({company.domain}) is here on public evidence alone. The record below is
          everything behind the call, and every line links to its source.
        </p>
        <Record signals={company.signals} lead />
        <p>
          <b>Talk to:</b> {talkTo}.
        </p>
        <p className="lead__opener">
          <b>A first line that fits:</b> <q>{company.opener}</q>
        </p>
        <Link className="brief__file cursor-target" href={`/signals/companies/${company.domain}`}>
          {company.name}, company file →
        </Link>
      </div>
    </article>
  );
}

export function FrontPage({ week, weeks }: { week: SignalsWeek; weeks: SignalsWeek[] }) {
  const sotw = week.signalOfTheWeek;
  const leadNiche = sotw ? week.niches.find((n) => n.id === sotw.nicheId) : undefined;
  const lead = sotw && leadNiche ? leadNiche.companies.find((c) => c.domain === sotw.domain) : undefined;
  const all = week.niches.flatMap((n) => n.companies);
  const bars = sourceBars(all);
  const signalCount = bars.reduce((a, b) => a + b.value, 0);

  return (
    <main className="paper">
      {week.sample && <SampleBanner />}
      <Masthead week={week} />

      <nav className="paper__index" aria-label="Sections">
        {week.niches.map((n, i) => (
          <Link key={n.id} className="cursor-target" href={sectionHref(week, n)}>
            <span>{letter(i)}</span> {n.name} <em>p.{i + 2}</em>
          </Link>
        ))}
        <Link className="cursor-target" href="/signals/how-it-works">
          <span>?</span> How this paper is made
        </Link>
      </nav>

      <section className="front">
        {sotw && lead && leadNiche ? (
          <LeadStory
            kicker={`Signal of the week · ${leadNiche.name}`}
            headline={sotw.headline}
            deck={sotw.body}
            byline={["By the signal engine", `Filed ${formatDay(week.generatedAt)}`, `Rank ${lead.rank} of ${leadNiche.companies.length} in ${leadNiche.name}`]}
            company={lead}
            talkTo={leadNiche.talkTo}
          />
        ) : (
          <article className="lead">
            <p className="lead__kicker">This week</p>
            <h1 className="lead__hed">No single signal stood out this week.</h1>
          </article>
        )}

        <aside className="front__side">
          <figure className="fig">
            <Halftone bars={bars} label={`Signals behind this issue by source: ${barsLabel(bars)}`} />
            <figcaption>
              Fig. 1. Where the {signalCount} signals behind this issue&apos;s {all.length} companies came from.
            </figcaption>
          </figure>

          {week.coverage && (
            <section className="ear" aria-label="By the numbers">
              <p className="ear__k">By the numbers</p>
              <dl>
                <div>
                  <dt>Job posts read</dt>
                  <dd>{fmt(week.coverage.postings)}</dd>
                </div>
                <div>
                  <dt>Job boards</dt>
                  <dd>{fmt(week.coverage.boards)}</dd>
                </div>
                <div>
                  <dt>Homepages read</dt>
                  <dd>{fmt(week.coverage.homepages)}</dd>
                </div>
                <div>
                  <dt>SEC filings checked, 30 days</dt>
                  <dd>{fmt(week.coverage.filings)}</dd>
                </div>
                <div>
                  <dt>Companies watched</dt>
                  <dd>{fmt(week.coverage.companies)}</dd>
                </div>
                <div>
                  <dt>Made the paper</dt>
                  <dd>{all.length}</dd>
                </div>
              </dl>
            </section>
          )}
        </aside>
      </section>

      <section className="inside" aria-labelledby="inside-k">
        <p id="inside-k" className="inside__k">
          Inside this issue
        </p>
        <div className="inside__grid">
          {week.niches.map((n, i) => (
            <Link key={n.id} className="teaser cursor-target" href={sectionHref(week, n)}>
              <span className="teaser__page">
                <span>Section {letter(i)}</span>
                <span>Page {i + 2}</span>
              </span>
              <span className="teaser__name">{n.name}</span>
              <ol className="teaser__list">
                {n.companies.slice(0, 3).map((c) => (
                  <li key={c.domain}>
                    <b>{c.rank}</b>
                    <span>{c.name}</span>
                    <em>{c.signals[0]?.label}</em>
                  </li>
                ))}
              </ol>
              <span className="teaser__turn">
                {n.companies.length} companies · turn to page {i + 2} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Pager week={week} current={1} />

      <footer className="paper__back">
        <div>
          <p className="paper__backk">Back issues</p>
          <ul className="issues">
            {weeks.map((w) => (
              <li key={w.week}>
                {w.week === week.week ? (
                  <span className="is-on">
                    No. {issueNumber(w.week)} · {formatWeek(w.week)}
                  </span>
                ) : (
                  <Link className="cursor-target" href={frontHref(w)}>
                    No. {issueNumber(w.week)} · {formatWeek(w.week)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="paper__backk">Colophon</p>
          <p className="paper__colophon">
            Written by a signal engine from public job boards, company websites and SEC filings. Company
            level only: no named people, nothing behind a login. Scoring version {week.scoringVersion}.{" "}
            <Link className="cursor-target" href="/signals/how-it-works">
              How this paper is made →
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

export function SectionPage({ week, niche }: { week: SignalsWeek; niche: Niche }) {
  const index = week.niches.findIndex((n) => n.id === niche.id);
  const page = index + 2;
  const [first, ...rest] = niche.companies;
  const bars = sourceBars(niche.companies);
  const signalCount = bars.reduce((a, b) => a + b.value, 0);
  const veryStrong = niche.companies.filter((c) => c.band === "very strong").length;

  return (
    <main className="paper paper--inside">
      {week.sample && <SampleBanner />}
      <Folio week={week} page={page} label={`Section ${letter(index)} · ${niche.name}`} />

      <header className="secfront">
        <p className="secfront__k">
          Section {letter(index)} · Page {page}
        </p>
        <h1 className="secfront__name">{niche.name}</h1>
        <p className="secfront__desc">{niche.description}</p>
        <p className="secfront__buyer">
          <span>Talk to</span> {niche.talkTo}
        </p>
      </header>

      {first ? (
        <>
          <section className="front front--section">
            <LeadStory
              kicker={`No. 1 in ${niche.name}`}
              headline={`${first.name}: ${first.signals[0]?.label ?? ""}`}
              deck={first.whyNow}
              byline={[first.domain, first.band, `${first.signals.length} ${first.signals.length === 1 ? "signal" : "signals"}`]}
              company={first}
              talkTo={niche.talkTo}
            />
            <aside className="front__side">
              <figure className="fig">
                <Halftone bars={bars} label={`Signals behind this section by source: ${barsLabel(bars)}`} />
                <figcaption>
                  Fig. {page}. Where the {signalCount} signals behind this section came from.
                </figcaption>
              </figure>
              <section className="ear" aria-label="This section">
                <p className="ear__k">This section</p>
                <dl>
                  <div>
                    <dt>Companies</dt>
                    <dd>{niche.companies.length}</dd>
                  </div>
                  <div>
                    <dt>Signals cited</dt>
                    <dd>{signalCount}</dd>
                  </div>
                  <div>
                    <dt>Very strong</dt>
                    <dd>{veryStrong}</dd>
                  </div>
                  <div>
                    <dt>Sources used</dt>
                    <dd>{bars.filter((b) => b.value > 0).length} of {bars.length}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </section>

          {rest.length > 0 && (
            <section className="desk desk--inside" aria-label="The rest of the list">
              <p className="desk__rule">
                <span>The rest of the list</span>
                <span>Ranks 2 to {niche.companies.length}</span>
              </p>
              <ol className="desk__briefs">
                {rest.map((c) => (
                  <Brief key={c.domain} company={c} />
                ))}
              </ol>
            </section>
          )}
        </>
      ) : (
        <p className="desk__empty">No company cleared the bar in this section this week.</p>
      )}

      <Pager week={week} current={page} />
    </main>
  );
}
