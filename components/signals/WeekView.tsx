import Link from "next/link";
import type { SignalsWeek } from "@/lib/signals";
import { formatWeek, weekSlug } from "@/lib/signals";
import CompanyCard from "./CompanyCard";
import NicheTabs from "./NicheTabs";

export function SampleBanner() {
  return (
    <div className="sigsample" role="note">
      <b>Sample data.</b> These companies are fictional and every link goes to example.com. The real
      weekly list replaces this once the signal engine is running.
    </div>
  );
}

export default function WeekView({ week, weeks }: { week: SignalsWeek; weeks: SignalsWeek[] }) {
  const sotw = week.signalOfTheWeek;
  const sotwNiche = sotw ? week.niches.find((n) => n.id === sotw.nicheId) : null;
  const sotwCompany = sotw && sotwNiche ? sotwNiche.companies.find((c) => c.domain === sotw.domain) : null;
  const total = week.niches.reduce((a, n) => a + n.companies.length, 0);

  return (
    <main className="sig">
      {week.sample && <SampleBanner />}

      <header className="sig__head">
        <p className="sig__eyebrow">Signals · week {week.week.split("-W")[1]}</p>
        <h1 className="sig__title">Who is about to buy, this week</h1>
        <p className="sig__lede">
          For a few hot software categories, the companies whose public signals say they are likely to
          buy right now, with the evidence behind every one. Signals worth a look, not guarantees.
        </p>
        <div className="sig__meta">
          <span>{formatWeek(week.week)}</span>
          <span>{week.niches.length} niches</span>
          <span>{total} companies</span>
          <Link className="cursor-target" href="/signals/how-it-works">
            how this works →
          </Link>
        </div>
      </header>

      {sotw && sotwCompany && sotwNiche && (
        <section className="sotw" aria-labelledby="sotw-title">
          <p className="sotw__k">Signal of the week · {sotwNiche.name}</p>
          <h2 id="sotw-title" className="sotw__title">
            {sotw.headline}
          </h2>
          <p className="sotw__body">{sotw.body}</p>
          <Link className="sotw__link cursor-target" href={`/signals/companies/${sotwCompany.domain}`}>
            {sotwCompany.name}, every week it appeared →
          </Link>
        </section>
      )}

      <NicheTabs
        tabs={week.niches.map((n) => ({
          id: n.id,
          name: n.name,
          count: n.companies.length,
          panel: (
            <>
              <div className="signiche">
                <p className="signiche__desc">{n.description}</p>
                <p className="signiche__talk">
                  <span>Buyer</span> {n.talkTo}
                </p>
              </div>
              {n.companies.length === 0 ? (
                <p className="sig__empty">No company cleared the bar in this niche this week.</p>
              ) : (
                <div className="sigcards">
                  {n.companies.map((c) => (
                    <CompanyCard key={c.domain} company={c} talkTo={n.talkTo} />
                  ))}
                </div>
              )}
            </>
          ),
        }))}
      />

      {weeks.length > 1 && (
        <nav className="sigweeks" aria-label="Past weeks">
          <p className="sigweeks__k">Archive</p>
          <ul>
            {weeks.map((w) => (
              <li key={w.week}>
                {w.week === week.week ? (
                  <span className="is-on">
                    {w.week} <em>{formatWeek(w.week)}</em>
                  </span>
                ) : (
                  <Link className="cursor-target" href={`/signals/${weekSlug(w.week)}`}>
                    {w.week} <em>{formatWeek(w.week)}</em>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
