import Link from "next/link";
import type { Company } from "@/lib/signals";
import { formatDay } from "@/lib/signals";

// One potential customer: the evidence first, then what to do with it.
export default function CompanyCard({
  company,
  talkTo,
  compact = false,
}: {
  company: Company;
  talkTo: string;
  compact?: boolean;
}) {
  const c = company;
  return (
    <article className={`sigcard${compact ? " sigcard--compact" : ""}`} id={c.domain}>
      <header className="sigcard__head">
        <span className="sigcard__rank" aria-label={`Rank ${c.rank}`}>
          {String(c.rank).padStart(2, "0")}
        </span>
        <div className="sigcard__who">
          <Link className="sigcard__name cursor-target" href={`/signals/companies/${c.domain}`}>
            {c.name}
          </Link>
          <span className="sigcard__domain">{c.domain}</span>
        </div>
        <div className="sigcard__score">
          <span className="sigcard__num">{c.score}</span>
          <span className={`sigband sigband--${c.band.replace(" ", "-")}`}>{c.band}</span>
          {c.reviewed && <span className="sigcard__reviewed">reviewed</span>}
        </div>
      </header>

      <ol className="sigcard__signals">
        {c.signals.map((s, i) => (
          <li key={`${s.type}-${s.firedAt}-${i}`} className="sigrow">
            <span className={`sigrow__dot sigrow__dot--${s.confidence}`} aria-hidden="true" />
            <span className="sigrow__label">{s.label}</span>
            <time className="sigrow__date" dateTime={s.firedAt}>
              {formatDay(s.firedAt)}
            </time>
            <span className="sigrow__conf">{s.confidence}</span>
            <a className="sigrow__src cursor-target" href={s.evidence[0].url} target="_blank" rel="noreferrer">
              source ↗
            </a>
          </li>
        ))}
      </ol>

      {!compact && (
        <dl className="sigcard__use">
          <div>
            <dt>Why now</dt>
            <dd>{c.whyNow}</dd>
          </div>
          <div>
            <dt>Talk to</dt>
            <dd>{talkTo}</dd>
          </div>
          <div>
            <dt>Opener</dt>
            <dd className="sigcard__opener">{c.opener}</dd>
          </div>
        </dl>
      )}
    </article>
  );
}
