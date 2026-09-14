"use client";

import Link from "next/link";
import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Company, Signal } from "@/lib/signals";
import { formatDay, independentSources, SOURCE_LABEL, sourceOf } from "@/lib/signals-format";

// useLayoutEffect warns on the server; the collapse-on-mount must happen before paint so
// the server-rendered open panels (kept for crawlers and no-JS readers) never flash.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

/**
 * One company as a newspaper brief: the name and the strongest evidence up front, the
 * reasoning and every source in a drawer. The drawer opens like the projects section's
 * folds: the panel's height eases open, then its contents rise in one after another.
 */
function Brief({
  company,
  talkTo,
  open,
  onToggle,
  openId,
  showFileLink,
}: {
  company: Company;
  talkTo?: string;
  open: boolean;
  onToggle: () => void;
  openId: string | null;
  showFileLink: boolean;
}) {
  const c = company;
  const [top, ...rest] = c.signals;
  const sources = [...new Set(c.signals.map((s) => sourceOf(s.type)))];
  const agree = independentSources(c.signals).length;
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useIsoLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      gsap.set(el, { height: open ? "auto" : 0 });
      return;
    }
    // A brief closing above the one just opened, in the same column, would pull the
    // reader's view up by its height. Counter-scroll by exactly what it gives back.
    const opened = openId ? document.getElementById(`brief-${openId}`) : null;
    const pinView =
      !open && opened !== null && opened.closest(".brief-col") === el.closest(".brief-col") && el.getBoundingClientRect().top < opened.getBoundingClientRect().top;

    gsap.killTweensOf(el);
    if (reduceMotion()) {
      const h = el.getBoundingClientRect().height;
      gsap.set(el, { height: open ? "auto" : 0 });
      if (pinView && h) window.scrollBy({ top: -h, behavior: "instant" });
      return;
    }
    if (open) {
      const items = el.querySelectorAll(".brief__body > *");
      gsap
        .timeline()
        .fromTo(el, { height: 0 }, { height: () => el.scrollHeight, duration: 0.6, ease: "power3.inOut" })
        .fromTo(items, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", stagger: 0.05, clearProps: "all" }, "-=0.3")
        .set(el, { height: "auto" });
    } else {
      let prev = el.getBoundingClientRect().height;
      gsap.to(el, {
        height: 0,
        duration: 0.38,
        ease: "power3.inOut",
        onUpdate: pinView
          ? () => {
              const h = el.getBoundingClientRect().height;
              const shrunk = prev - h;
              prev = h;
              if (shrunk) window.scrollBy({ top: -shrunk, behavior: "instant" });
            }
          : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <li
      className={`brief${open ? " is-open" : ""}`}
      id={`brief-${c.domain}`}
      style={{ "--rank": c.rank } as CSSProperties}
    >
      <button type="button" className="brief__sum cursor-target" aria-expanded={open} aria-controls={`brief-panel-${c.domain}`} onClick={onToggle}>
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
      </button>

      <div className="brief__panel" id={`brief-panel-${c.domain}`} ref={panel} role="region" aria-label={`${c.name}, details`}>
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
      </div>
    </li>
  );
}

/**
 * A section's briefs. One open at a time. Two columns that stack on their own, so opening
 * a brief only moves what is below it in its own column; on phones, one list in rank order.
 */
export default function BriefList({
  companies,
  talkTo,
  defaultOpen = null,
  columns = 2,
  showFileLink = true,
}: {
  companies: Company[];
  talkTo?: string;
  defaultOpen?: string | null;
  columns?: 1 | 2;
  showFileLink?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen);
  const toggle = (domain: string) => setOpenId((cur) => (cur === domain ? null : domain));
  const cols = columns === 2 ? [companies.filter((_, i) => i % 2 === 0), companies.filter((_, i) => i % 2 === 1)] : [companies];

  return (
    <div className={`desk__briefs${columns === 1 ? " desk__briefs--single" : ""}`}>
      {cols.map((list, i) => (
        <ol key={i} className="brief-col">
          {list.map((c) => (
            <Brief
              key={c.domain}
              company={c}
              {...(talkTo ? { talkTo } : {})}
              open={openId === c.domain}
              openId={openId}
              onToggle={() => toggle(c.domain)}
              showFileLink={showFileLink}
            />
          ))}
        </ol>
      ))}
    </div>
  );
}
