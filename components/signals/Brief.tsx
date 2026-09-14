import Link from "next/link";
import type { Company, Signal } from "@/lib/signals";
import { formatDay, independentSources, SOURCE_LABEL, sourceOf } from "@/lib/signals";

/** Every signal behind a company, with its source, date and a citation. */
export function Record({ signals, lead = false }: { signals: Signal[]; lead?: boolean }) {
  return (
    <ol className={`record${lead ? " record--lead" : ""}`}>
      {signals.map((s, i) => (
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
  );
}

// One company as a newspaper brief: the name and the strongest piece of evidence up
// front, the reasoning and every cited source behind a click. Built on <details>, so it
// opens without JavaScript.
export default function Brief({
  company,
  talkTo,
  open = false,
  showFileLink = true,
}: {
  company: Company;
  talkTo?: string;
  open?: boolean;
  showFileLink?: boolean;
}) {
  const c = company;
  const [top, ...rest] = c.signals;
  const sources = [...new Set(c.signals.map((s) => sourceOf(s.type)))];
  const agree = independentSources(c.signals).length;

  return (
    <li className="brief" id={c.domain}>
      <details open={open}>
        <summary className="brief__sum cursor-target">
          <span className="brief__rank" aria-label={`Rank ${c.rank}`}>
            {c.rank}
          </span>
          <span className="brief__main">
            <span className="brief__top">
              <span className="brief__name">{c.name}</span>
              <span className="brief__domain">{c.domain}</span>
              <span className="brief__agree" title={independentSources(c.signals).join(", ")}>
                {agree} {agree === 1 ? "source" : "sources"}
              </span>
              <span className={`brief__band brief__band--${c.band.replace(" ", "-")}`}>{c.band}</span>
            </span>
            <span className="brief__hed">{top?.label}</span>
            <span className="brief__tags">
              {sources.map((s) => (
                <span key={s} className={`src src--${s}`}>
                  {SOURCE_LABEL[s]}
                </span>
              ))}
              {rest.length > 0 && <span className="brief__more">+{rest.length} more</span>}
              <span className="brief__open" aria-hidden="true" />
            </span>
          </span>
        </summary>

        <div className="brief__body">
          <p>
            <b>Why now.</b> {c.whyNow}
          </p>
          {talkTo && (
            <p>
              <b>Talk to.</b> {talkTo}
            </p>
          )}
          <p className="brief__opener">
            <b>Opener.</b> <q>{c.opener}</q>
          </p>
          <Record signals={c.signals} />
          {showFileLink && (
            <Link className="brief__file cursor-target" href={`/signals/companies/${c.domain}`}>
              Company file →
            </Link>
          )}
        </div>
      </details>
    </li>
  );
}
