"use client";

// The drawer: the flagged list plus the four places it is read from, as
// folders you open rather than four screens of prose sitting on the page.
//
// The folder art is the react-bits Folder idea redrawn in the site's
// language - flat line work, bg-filled papers, an accent flap that skews
// open - instead of the rounded gradient original. Clicking one opens a
// dialog holding that folder's cards.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Card = { k: string; v: React.ReactNode };
type Folder = {
  id: string;
  label: string;
  kind: string;
  title: string;
  sub: string;
  cards: Card[];
  plants?: boolean;
};

// The eight sample rows, now living behind the list folder.
const PLANTS = [
  { p: "Fortune 100 aerospace & defense prime", l: "Iowa", t: "automation-ready plant, manual task", o: "", d: "Posting a Principal Automation Engineer for industrial robotics while manual roles stay open across 23 flagged facilities" },
  { p: "Publicly traded specialty vehicle maker", l: "Minnesota", t: "confirmed offer degradation", o: "74d · 6 reposts", d: "Welder, 2nd shift. The plant builds automated refuse bodies; the wage band widened week over week" },
  { p: "Publicly traded specialty vehicle maker", l: "Iowa", t: "technographics gap", o: "161d · 4 reposts", d: "The same welder requisition at a second plant, still unautomated" },
  { p: "Global tier-one automotive supplier", l: "Minnesota", t: "chronic persistence", o: "138d · 4 reposts", d: "Assembler, weekend days. Sign-on bonus, and 36 hours paid as 40" },
  { p: "Private aerospace machining shop", l: "Utah", t: "technographics gap", o: "141d", d: "A $5,000 sign-on bonus and tooling reimbursement, for one CNC machinist" },
  { p: "Engine overhaul and repair provider", l: "Ohio", t: "chronic persistence", o: "214d", d: "Composite technician, weekend shift, 11% differential. Seven months open" },
  { p: "Major aerostructures manufacturer", l: "Kansas", t: "containment cluster", o: "", d: "Nine inspection roles at a single facility, every one carrying containment language" },
  { p: "Private space launch manufacturer", l: "6 sites", t: "why-now demand", o: "", d: "A $5.6M NASA award correlated against open machinist and inspector roles at the sites that execute it" },
];

const FOLDERS: Folder[] = [
  {
    id: "plants",
    label: "flagged-plants",
    kind: "the list · 8 shown",
    title: "Flagged plants",
    sub: "A sample of the scan. Each card resolves to one plant and links back to the live posting it was read from. Identities withheld.",
    cards: [],
    plants: true,
  },
  {
    id: "usaspending",
    label: "usaspending",
    kind: "the ledger",
    title: "USAspending.gov",
    sub: "What the federal government already bought and paid for.",
    cards: [
      {
        k: "what it holds",
        v: "Award amounts, recipients, obligations over time, incumbent vendors, and spending trends broken out by agency and NAICS code.",
      },
      {
        k: "what it answers",
        v: "Which manufacturers just took on more work than their current headcount can absorb, and roughly when the delivery pressure lands.",
      },
      {
        k: "seen in the scan",
        v: "Awards that correlated against open manual roles at the same company: $5.6M NASA at a private launch manufacturer across six sites, $7.9M NASA at a smallsat builder, $6.5M NASA at a space systems firm, $40.5M from Justice at an aircraft manufacturer. Each one cites its own award page.",
      },
      {
        k: "what breaks it",
        v: "Place of performance is often a base or a delivery point rather than the plant. The recipient may be a distributor or an integrator that manufactures nothing. Defense awards are withheld for roughly ninety days.",
      },
    ],
  },
  {
    id: "sam",
    label: "sam-gov",
    kind: "the forward book",
    title: "SAM.gov",
    sub: "What the federal government intends to buy, before any award exists.",
    cards: [
      {
        k: "what it holds",
        v: "Solicitations, sources sought and presolicitation notices, award notices, and entity records carrying UEI and CAGE identifiers.",
      },
      {
        k: "what it answers",
        v: "What is about to be bought, in what quantity, against what schedule, and which physical address is going to build it.",
      },
      {
        k: "why the attachments matter",
        v: "The documents behind a notice carry part numbers, quantities, delivery schedules, required certifications and approved sources. That is what turns a dollar figure into a manufacturing process you can name.",
      },
      {
        k: "what breaks it",
        v: "Most private manufacturers never sell to the federal government at all. Coverage runs deep through aerospace, defense, shipbuilding and precision machining, and thin to nothing everywhere else.",
      },
    ],
  },
  {
    id: "ats",
    label: "ats-feeds",
    kind: "the labor layer",
    title: "Applicant tracking systems",
    sub: "Where every plant publishes its own pain, continuously, at facility granularity.",
    cards: [
      {
        k: "what it holds",
        v: "Workday, Greenhouse, iCIMS, Paylocity, ADP, Dayforce, SmartRecruiters, UltiPro, BambooHR, Lever, Taleo and a long tail of smaller boards. Job title, site address, shift, wage band, bonus terms and stated requirements.",
      },
      {
        k: "why snapshots",
        v: "A single read tells you a role is open. Reading the same requisition week after week tells you it is not being filled, that the wage band moved, that the experience requirement was dropped. Offer degradation only exists as a difference between two snapshots.",
      },
      {
        k: "what breaks it",
        v: "It is the company writing marketing copy about itself. Titles drift, one firm words the same role differently at two plants, and applicant systems mint fresh IDs on repost, so requisitions have to be fingerprinted rather than counted.",
      },
    ],
  },
  {
    id: "oem",
    label: "oem-libraries",
    kind: "the partner graph",
    title: "Integrator and OEM case libraries",
    sub: "Who already deployed what, where, and with which partner.",
    cards: [
      {
        k: "what it holds",
        v: (
          <>
            Universal Robots publishes roughly 230 case stories. FANUC carries a{" "}
            <code>Solution By</code> field across 244 integrators, ABB runs Value Provider and KUKA
            runs System Partner. Acieta names the customer in about 93% of its stories and titles
            them by customer slug.
          </>
        ),
      },
      {
        k: "the slug tells you the pair",
        v: (
          <>
            A whole class of these URLs encodes the relationship directly:{" "}
            <code>lactalis-via-sermaz</code>, <code>steelcase-via-robotindus</code>. The manufacturer
            is the subject of the story and never its author, because the integrator is the one who
            needs the credential.
          </>
        ),
      },
      {
        k: "what breaks it",
        v: "Survivorship, and a long lag. Only projects that succeeded and cleared a permissions review get published, sometimes years after the cell went in. Absence of a case study means nothing at all.",
      },
    ],
  },
];

export default function SourceDrawer() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The drawer sits inside a gsap-animated wrapper, and a transformed
  // ancestor becomes the containing block for position:fixed - which left
  // the scrim covering the wrapper instead of the viewport. Portalling to
  // body is the fix; it also keeps the dialog out of the section's stacking
  // context entirely.
  useEffect(() => setMounted(true), []);

  const active = FOLDERS.find((f) => f.id === openId) || null;

  const close = useCallback(() => {
    setOpenId(null);
    lastFocus.current?.focus();
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // lock the page behind the dialog without shifting layout
    const prev = document.body.style.overflow;
    const pad = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (pad > 0) document.body.style.paddingRight = `${pad}px`;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      document.body.style.paddingRight = "";
    };
  }, [openId, close]);

  return (
    <div className="drw">
      <div className="drw__shelf">
        {FOLDERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`fdr cursor-target${hoverId === f.id ? " is-lift" : ""}`}
            onClick={(e) => {
              lastFocus.current = e.currentTarget;
              setOpenId(f.id);
            }}
            onMouseEnter={() => setHoverId(f.id)}
            onMouseLeave={() => setHoverId(null)}
            aria-haspopup="dialog"
          >
            <span className="fdr__art" aria-hidden="true">
              <span className="fdr__tab"></span>
              <span className="fdr__back"></span>
              <span className="pg pg1"></span>
              <span className="pg pg2"></span>
              <span className="pg pg3"></span>
              <span className="fdr__front"></span>
            </span>
            <span className="fdr__label">{f.label}</span>
            <span className="fdr__meta">{f.kind}</span>
          </button>
        ))}
      </div>

      {active && mounted && createPortal(
        <div className="ovl" role="presentation">
          <div className="ovl__scrim" onClick={close} />
          <div
            ref={panelRef}
            className="ovl__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ovl-title"
            tabIndex={-1}
          >
            <div className="ovl__hd">
              <div>
                <div className="ovl__k">{active.label}</div>
                <h3 id="ovl-title">{active.title}</h3>
                <p>{active.sub}</p>
              </div>
              <button
                type="button"
                className="ovl__x cursor-target"
                onClick={close}
                aria-label="Close"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M4 4 L12 12 M12 4 L4 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="ovl__body">
              {active.plants ? (
                <div className="ovl__plants">
                  {PLANTS.map((r, i) => (
                    <article className="pcard" key={i}>
                      <div className="pcard__top">
                        <span className="n">{String(i + 1).padStart(2, "0")}</span>
                        <span className="loc">{r.l}</span>
                      </div>
                      <h4>{r.p}</h4>
                      <span className="pill pill--a">{r.t}</span>
                      {r.o && <div className="pcard__open">{r.o}</div>}
                      <p>{r.d}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="ovl__cards">
                  {active.cards.map((c) => (
                    <article className="ocard" key={c.k}>
                      <div className="ocard__k">{c.k}</div>
                      <p>{c.v}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
