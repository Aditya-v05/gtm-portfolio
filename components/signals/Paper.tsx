import Link from "next/link";
import type { SignalsWeek } from "@/lib/signals";
import { formatDay, formatWeek, issueNumber, SOURCE_LABEL, sourceOf, weekSlug, type SourceGroup } from "@/lib/signals";
import Brief from "./Brief";
import Halftone from "./Halftone";

// /signals as a weekly newspaper: a masthead, the signal of the week as the lead story,
// a figure and the numbers behind the issue, then one section per niche, and back issues.
// The structure is borrowed from print; the type and colour are the site's own.

export function SampleBanner() {
  return (
    <div className="paper__sample" role="note">
      <b>Sample data.</b> These companies are fictional and every link goes to example.com.
    </div>
  );
}

export function Masthead({ week, compact = false }: { week: SignalsWeek; compact?: boolean }) {
  return (
    <header className={`mast${compact ? " mast--compact" : ""}`}>
      <div className="mast__strip">
        <span>Vol. 1 · No. {issueNumber(week.week)}</span>
        <span>Week {week.week.split("-W")[1]} · {formatWeek(week.week)}</span>
        <span>Public data · company level</span>
      </div>
      <p className="mast__name">
        {compact ? (
          <Link className="cursor-target" href="/signals">
            Signals
          </Link>
        ) : (
          "Signals"
        )}
      </p>
      {!compact && <p className="mast__motto">Who is about to buy, and the public record that says so.</p>}
    </header>
  );
}

const GROUP_ORDER: SourceGroup[] = ["hiring", "jobs", "sec", "web"];
const fmt = (n: number) => n.toLocaleString("en-US");

export default function Paper({ week, weeks }: { week: SignalsWeek; weeks: SignalsWeek[] }) {
  const sotw = week.signalOfTheWeek;
  const leadNiche = sotw ? week.niches.find((n) => n.id === sotw.nicheId) : undefined;
  const lead = sotw && leadNiche ? leadNiche.companies.find((c) => c.domain === sotw.domain) : undefined;
  const total = week.niches.reduce((a, n) => a + n.companies.length, 0);

  const counts = new Map<SourceGroup, number>();
  for (const n of week.niches) for (const c of n.companies) for (const s of c.signals) {
    const g = sourceOf(s.type);
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const bars = GROUP_ORDER.map((g) => ({ label: SOURCE_LABEL[g], value: counts.get(g) ?? 0 }));
  const signalCount = bars.reduce((a, b) => a + b.value, 0);

  return (
    <main className="paper">
      {week.sample && <SampleBanner />}
      <Masthead week={week} />

      <nav className="paper__index" aria-label="Sections">
        {week.niches.map((n, i) => (
          <a key={n.id} className="cursor-target" href={`#${n.id}`}>
            <span>{String.fromCharCode(65 + i)}</span> {n.name}
          </a>
        ))}
        <Link className="cursor-target" href="/signals/how-it-works">
          <span>?</span> How this paper is made
        </Link>
      </nav>

      <section className="front">
        {sotw && lead && leadNiche ? (
          <article className="lead">
            <p className="lead__kicker">Signal of the week · {leadNiche.name}</p>
            <h1 className="lead__hed">{sotw.headline}</h1>
            <p className="lead__deck">{sotw.body}</p>
            <p className="lead__byline">
              <span>By the signal engine</span>
              <span>Filed {formatDay(week.generatedAt)}</span>
              <span>
                Rank {lead.rank} of {leadNiche.companies.length} in {leadNiche.name}
              </span>
            </p>
            <div className="lead__body">
              <p>
                {lead.name} ({lead.domain}) leads this issue on public evidence alone. The record below is
                everything behind the call, and every line links to its source.
              </p>
              <ol className="record record--lead">
                {lead.signals.map((s, i) => (
                  <li key={`${s.type}-${i}`} className="record__item">
                    <span className={`src src--${sourceOf(s.type)}`}>{SOURCE_LABEL[sourceOf(s.type)]}</span>
                    <span className="record__label">{s.label}</span>
                    <time className="record__date" dateTime={s.firedAt}>
                      {formatDay(s.firedAt)}
                    </time>
                    <a className="record__cite cursor-target" href={s.evidence[0].url} target="_blank" rel="noreferrer">
                      source ↗
                    </a>
                  </li>
                ))}
              </ol>
              <p>
                <b>Talk to:</b> {leadNiche.talkTo}.
              </p>
              <p className="lead__opener">
                <b>A first line that fits:</b> <q>{lead.opener}</q>
              </p>
              <Link className="brief__file cursor-target" href={`/signals/companies/${lead.domain}`}>
                {lead.name}, company file →
              </Link>
            </div>
          </article>
        ) : (
          <article className="lead">
            <p className="lead__kicker">This week</p>
            <h1 className="lead__hed">No single signal stood out this week.</h1>
          </article>
        )}

        <aside className="front__side">
          <figure className="fig">
            <Halftone bars={bars} label={`Signals behind this issue by source: ${bars.map((b) => `${b.label} ${b.value}`).join(", ")}`} />
            <figcaption>
              Fig. 1. Where the {signalCount} signals behind this issue&apos;s {total} companies came from.
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
                  <dd>{total}</dd>
                </div>
              </dl>
            </section>
          )}
        </aside>
      </section>

      {week.niches.map((n, i) => (
        <section key={n.id} id={n.id} className="desk" aria-labelledby={`${n.id}-name`}>
          <header className="desk__head">
            <span className="desk__k">Section {String.fromCharCode(65 + i)}</span>
            <h2 id={`${n.id}-name`} className="desk__name">
              {n.name}
            </h2>
            <span className="desk__count">{n.companies.length} companies</span>
            <p className="desk__desc">{n.description}</p>
            <p className="desk__buyer">
              <span>Talk to</span> {n.talkTo}
            </p>
          </header>
          {n.companies.length === 0 ? (
            <p className="desk__empty">No company cleared the bar in this section this week.</p>
          ) : (
            <ol className="desk__briefs">
              {n.companies.map((c) => (
                <Brief key={c.domain} company={c} />
              ))}
            </ol>
          )}
        </section>
      ))}

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
                  <Link className="cursor-target" href={`/signals/${weekSlug(w.week)}`}>
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
