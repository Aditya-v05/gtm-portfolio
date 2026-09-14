"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A short walkthrough for first-time readers of The Paper Trail: what it is, how it
// knows, how to read it. Shown once, remembered with a cookie; "What is this?" in the
// masthead or running head brings it back.

const COOKIE = "paper_trail_intro";
export const OPEN_INTRO_EVENT = "paper-trail-intro";

const STEPS = [
  {
    kicker: "Welcome",
    title: "A weekly paper about who is about to buy",
    body: (
      <>
        <p>
          Every week The Paper Trail picks a few software categories, like SOC 2 compliance or
          observability, and lists the companies whose public record says they may buy from that
          category soon.
        </p>
        <p>It is written for the people selling in those categories: founders, sellers and GTM teams looking for their next customer.</p>
      </>
    ),
  },
  {
    kicker: "How it knows",
    title: "Evidence, not guesses",
    body: (
      <>
        <p>
          The engine reads public sources only: company job boards, their own websites, their LinkedIn
          posts and SEC funding filings. No named people, nothing behind a login.
        </p>
        <p>
          One signal is a hint. When independent sources agree, like security hiring, a new trust page and
          a fresh raise, a company ranks higher. Every signal type is checked for accuracy, and the ones
          that fall short are left out.
        </p>
      </>
    ),
  },
  {
    kicker: "How to read it",
    title: "Turn the pages",
    body: (
      <ul>
        <li>Page 1 is the front page: the lead story, the numbers and fresh funding.</li>
        <li>Each category is its own page. Use the page numbers or your arrow keys.</li>
        <li>Open any company to see why now, who to talk to, a first line to send and every source.</li>
        <li>Every line links to where it came from.</li>
      </ul>
    ),
  },
];

const seen = () => document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`));

export default function PaperIntro() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState(0);
  const primary = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    document.cookie = `${COOKIE}=seen; Max-Age=31536000; Path=/; SameSite=Lax`;
    setLeaving(true);
    window.setTimeout(() => {
      setOpen(false);
      setLeaving(false);
      setStep(0);
    }, 220);
  }, []);

  useEffect(() => {
    if (!seen()) setOpen(true);
    const reopen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_INTRO_EVENT, reopen);
    return () => window.removeEventListener(OPEN_INTRO_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    primary.current?.focus();
    // Captured first, so the page's own arrow keys do not turn pages behind the dialog.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setStep((s) => Math.min(STEPS.length - 1, s + 1));
      else if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) primary.current?.focus();
  }, [step, open]);

  if (!open) return null;
  const s = STEPS[step]!;
  const last = step === STEPS.length - 1;

  return (
    <div className={`intro${leaving ? " is-leaving" : ""}`} onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="intro__card" role="dialog" aria-modal="true" aria-labelledby="intro-title">
        <div className="intro__head">
          <span className="intro__name">The Paper Trail</span>
          <button type="button" className="intro__skip cursor-target" onClick={close}>
            Skip
          </button>
        </div>
        <div className="intro__body">
          <div key={step} className="intro__step">
            <p className="intro__kicker">
              {step + 1} of {STEPS.length} · {s.kicker}
            </p>
            <h2 id="intro-title" className="intro__title">
              {s.title}
            </h2>
            {s.body}
          </div>
        </div>
        <div className="intro__foot">
          <div className="intro__dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className={i === step ? "is-on" : ""} />
            ))}
          </div>
          <div className="intro__btns">
            {step > 0 && (
              <button type="button" className="intro__btn cursor-target" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            <button
              ref={primary}
              type="button"
              className="intro__btn intro__btn--primary cursor-target"
              onClick={() => (last ? close() : setStep(step + 1))}
            >
              {last ? "Start reading" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reopens the walkthrough from anywhere in the paper. */
export function IntroButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_INTRO_EVENT))}>
      {children}
    </button>
  );
}
