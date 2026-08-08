// SHEET 01 - the knowledge section that opens the sheet set. It argues one
// thesis (nobody publishes "we are ready to buy a robot", so you infer it from
// exhaust) and then proves it the same way every other section on this site
// proves things: with a real artifact.
//
// Every figure below is read off a live facility-level scan. Company names are
// deliberately replaced with category descriptors - the rows are Relling's
// working pipeline, and the point is the method, not the target list.

import CountUp from "@/components/CountUp";
import AnimatedContent from "@/components/AnimatedContent";
import SpotlightCard from "@/components/SpotlightCard";
import Carousel from "@/components/Carousel";

const reveal = { distance: 26, duration: 0.7, ease: "power3.out" as const };

// Each family carries a "breaks" line on purpose. Naming the failure mode is
// what separates having run this from having read about it.
const GRAMMAR = [
  {
    k: "automation-ready plant, manual task",
    m: "The site is hiring controls or automation staff and still posting manual roles at that same address. Budget exists, automation literacy exists, and this particular task is still unsolved.",
    b: "A corporate requisition filed against a plant address is not a plant requisition. Resolve to the facility, never to the company.",
  },
  {
    k: "confirmed offer degradation",
    m: "Wage band, sign-on bonus or stated requirements move across weekly snapshots of the same requisition. The labor market has priced the role and the plant is losing.",
    b: "Requires longitudinal capture. A single scrape cannot see it, and applicant systems mint new IDs on repost, so the requisition has to be fingerprinted rather than counted.",
  },
  {
    k: "persistence tiers",
    m: "Days live and repost count, graded persistent, strongly persistent, then chronic. Past a certain point an opening is not an opening, it is a task nobody will take.",
    b: "Evergreen postings. Some plants leave a shell requisition up permanently, so the repost and variant count is what separates a real vacancy from a placeholder.",
  },
  {
    k: "containment language",
    m: "Inspection and QC roles carrying containment, sortation or rework wording, clustered on one site. A quality escape is being absorbed by people instead of by a vision system.",
    b: "Inspector is a job family, not a signal. It only means something when several land at the same facility at once.",
  },
  {
    k: "why-now demand",
    m: "A federal award landing at a company that already runs automatable manual roles. Production load is about to rise faster than headcount can follow.",
    b: "Place of performance is often a base or a delivery point rather than the plant, the recipient may be a distributor who manufactures nothing, and defense awards are withheld for roughly ninety days.",
  },
  {
    k: "desperation markers",
    m: "Sign-on bonuses, dropped experience requirements, widened shift premiums, no experience required. Normal hiring has been exhausted.",
    b: "Bonuses are regional and seasonal. They carry weight only against a role that is already persistent at that same facility.",
  },
];

// Everything the scan ships today is tagged labor / pain. These are the other
// families - mapped and argued, but deliberately not dressed up as running
// data, because they are not in the export yet.
const FAMILIES = [
  {
    k: "the partner graph",
    tag: "relationship · readiness",
    q: "Who does this plant already trust, and can anyone nearby actually deploy?",
    m: [
      "A manufacturer almost never publishes the fact that it automated a line. The integrator does, because it sells an intangible and a named customer is its only credible proof. The OEM amplifies that story to prove the channel is real, since a robot with no local integrator is unsellable.",
      <>
        So the edge is public, and sometimes it sits in the URL. Universal Robots publishes roughly
        230 case stories and a class of them encodes the pair directly: <code>lactalis-via-sermaz</code>,{" "}
        <code>steelcase-via-robotindus</code>. Acieta names the customer in about 93% of its
        stories. FANUC carries a <code>Solution By</code> field across 244 integrators.
      </>,
      "A plant already working with an integrator who resells a given brand and has built similar cells nearby is proof it buys automation, proof of which application fits, and a warm path in.",
    ],
    b: "Survivorship. You only see the projects that succeeded and were granted permission to publish, so the absence of a case study means nothing at all.",
  },
  {
    k: "sponsor access",
    tag: "ownership · reach",
    q: "Who else does this owner control?",
    m: [
      "A single private equity sponsor holds fifteen to forty portfolio manufacturers, and the operating partner carries a margin mandate across all of them. One relationship converts into many plants, and the introduction arrives from the owner rather than from a cold sequence.",
    ],
    b: "Portfolio ownership is a reach multiplier, not a timing signal. It tells you how many doors open behind one conversation; it never tells you which plant needs a cell this quarter.",
  },
  {
    k: "the floor",
    tag: "intent · timing",
    q: "Who is showing up, and who is being shown to?",
    m: [
      "Exhibitor and attendee lists publish months ahead of a show, and attendance is self-selection: nobody walks an automation floor by accident. Reading GTM job postings across robotics companies, trade show lead capture appears constantly and dedicated event tooling appears nowhere. The leads get imported by hand.",
    ],
    b: "Exhibiting is a marketing budget decision, not a buying signal. It qualifies a conversation; it does not time one.",
  },
];

// The sources themselves, given room. The federal pair in particular gets
// misread constantly, so the distinction between them leads.
const SOURCES = [
  {
    k: "USAspending.gov",
    tag: "the ledger · what was already bought",
    m: "Award amounts, recipients, obligations over time, incumbent vendors and spending trends by agency and NAICS. This is the source already wired into the scan: a federal award landing at a company that is simultaneously posting automatable manual roles is the why-now, and the award page is the citation.",
    b: "Place of performance is often a base or a delivery point rather than the plant. The recipient may be a distributor or an integrator who manufactures nothing. Defense awards are withheld for roughly ninety days.",
  },
  {
    k: "SAM.gov",
    tag: "the forward book · what is intended",
    m: "Solicitations, sources sought and presolicitation notices land before any award exists, and their attachments carry part numbers, quantities, delivery schedules and required certifications. Entity records resolve a UEI and CAGE code to a physical address, which is how an award becomes a plant instead of a headquarters.",
    b: "Most private manufacturers never sell to the federal government. Coverage runs deep through aerospace, defense, shipbuilding and machining, and thin to nothing everywhere else.",
  },
  {
    k: "Applicant tracking systems",
    tag: "the labor layer · what is unstaffed",
    m: "Workday, Greenhouse, iCIMS, Paylocity, ADP and a dozen more. Every plant publishes its own pain here, continuously, at facility granularity, with wage bands and shift terms attached. Snapshotting the same requisition week after week is the only reason offer degradation is visible at all.",
    b: "It is the company writing marketing copy about itself. Titles drift, and one firm will word the same role differently at two plants.",
  },
  {
    k: "Integrator and OEM case libraries",
    tag: "the partner graph · what already works",
    m: "Universal Robots, FANUC, ABB, KUKA and the integrator networks underneath them publish who deployed what, where, and with which partner, because in this market the channel is the product. The manufacturer is the subject of those stories and never the author.",
    b: "Survivorship, and a long lag. Only successful projects that cleared a permissions review get published, sometimes years after the cell went in.",
  },
];

const ROWS = [
  {
    p: "Fortune 100 aerospace & defense prime",
    l: "Iowa",
    t: "automation-ready plant, manual task",
    o: "—",
    d: "Posting a Principal Automation Engineer for industrial robotics while manual roles stay open across 23 flagged facilities",
  },
  {
    p: "Publicly traded specialty vehicle maker",
    l: "Minnesota",
    t: "confirmed offer degradation",
    o: "74d · 6 reposts",
    d: "Welder, 2nd shift. The plant builds automated refuse bodies; the wage band widened week over week",
  },
  {
    p: "Publicly traded specialty vehicle maker",
    l: "Iowa",
    t: "technographics gap",
    o: "161d · 4 reposts",
    d: "The same welder requisition at a second plant, still unautomated",
  },
  {
    p: "Global tier-one automotive supplier",
    l: "Minnesota",
    t: "chronic persistence",
    o: "138d · 4 reposts",
    d: "Assembler, weekend days. Sign-on bonus, and 36 hours paid as 40",
  },
  {
    p: "Private aerospace machining shop",
    l: "Utah",
    t: "technographics gap",
    o: "141d",
    d: "A $5,000 sign-on bonus and tooling reimbursement, for one CNC machinist",
  },
  {
    p: "Engine overhaul and repair provider",
    l: "Ohio",
    t: "chronic persistence",
    o: "214d",
    d: "Composite technician, weekend shift, 11% differential. Seven months open",
  },
  {
    p: "Major aerostructures manufacturer",
    l: "Kansas",
    t: "containment cluster",
    o: "—",
    d: "Nine inspection roles at a single facility, every one carrying containment language",
  },
  {
    p: "Private space launch manufacturer",
    l: "6 sites",
    t: "why-now demand",
    o: "—",
    d: "A $5.6M NASA award correlated against open machinist and inspector roles at the sites that execute it",
  },
];

export default function SignalLayer() {
  return (
    <section className="sl">
      <AnimatedContent {...reveal}>
        <div className="sl__thesis">
          <p>
            No factory publishes <i>we are ready to buy a robot</i>. Every real signal in this
            market is inferred from exhaust that was never meant as a buying signal: a requisition
            reposted thirteen times, a wage band that widens week over week, a federal award landing
            on a supplier who now has to double output.
          </p>
          <p className="sl__thesis-pt">
            That is not intent data. It is <b>production load</b>, read off the public record.
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent {...reveal} delay={0.08}>
        <div className="sl__count">
          <div className="sl__big">
            <CountUp to={300} />
            <span>+</span>
          </div>
          <div className="sl__cbody">
            <b>US manufacturers currently flagged</b>, aerospace, defense and automotive, resolved
            down to individual plants rather than corporate headquarters. Not one of them has raised
            a hand. Every signal below came from a page their own recruiting team published.
          </div>
        </div>
      </AnimatedContent>

      {/* One facility, in full. The aggregate is the argument; this is the proof. */}
      <AnimatedContent {...reveal} delay={0.12}>
        <div className="ev">
          <div className="frep cursor-target">
            <div className="frep__bar">
              <span className="fn">facility report</span>
              <span className="rc">tier A · labor · pain</span>
            </div>
            <div className="frep__head">
              <h3>Publicly traded precision components manufacturer</h3>
              <div className="frep__sub">Illinois plant · aerospace &amp; defense</div>
            </div>
            <dl className="frep__rows">
              <div>
                <dt>trigger</dt>
                <dd>confirmed offer degradation on a chronic manual task</dd>
              </div>
              <div>
                <dt>role</dt>
                <dd>Swiss Lathe Machinist IV, 2nd shift</dd>
              </div>
              <div>
                <dt>open</dt>
                <dd>
                  <b>126 days</b> · 13 reposts and variants · still active
                </dd>
              </div>
              <div>
                <dt>offer</dt>
                <dd>
                  $22 to $41 posted · 10% shift differential · sign-on bonus added · terms confirmed
                  degrading across weekly snapshots
                </dd>
              </div>
              <div>
                <dt>context</dt>
                <dd>
                  the plant already runs automation: Swiss lathes, Star machines, CAD/CAM in the
                  requirements
                </dd>
              </div>
              <div>
                <dt>also open</dt>
                <dd>six QC and inspection roles at the same site, all carrying containment language</dd>
              </div>
              <div className="frep__read">
                <dt>read</dt>
                <dd>
                  Machine tending and automated inspection. The task is chronic, the plant is
                  automation literate, and the labor market has been saying no for four months.
                </dd>
              </div>
            </dl>
          </div>
          <div className="ev__cap">
            <b>▸ evidence</b> - one row of the scan, expanded. Company identity withheld; every field
            is drawn from its own public postings
          </div>
        </div>
      </AnimatedContent>

      <AnimatedContent {...reveal} delay={0.08}>
        <div className="ev sl__plants">
          <Carousel label="flagged plants · 8 of ~300" per={3}>
            {ROWS.map((r, i) => (
              <article className="pcard cursor-target" key={i}>
                <div className="pcard__top">
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="loc">{r.l}</span>
                </div>
                <h4>{r.p}</h4>
                <span className="pill pill--a">{r.t}</span>
                {r.o !== "—" && <div className="pcard__open">{r.o}</div>}
                <p>{r.d}</p>
              </article>
            ))}
          </Carousel>
          <div className="ev__cap">
            <b>▸ evidence</b> - a sample of the scan. Each card resolves to one plant and links back
            to the live posting it was read from. Identities withheld
          </div>
        </div>
      </AnimatedContent>

      <AnimatedContent {...reveal}>
        <div className="sl__gsec">
          <Carousel label="how each signal is read" per={3}>
            {GRAMMAR.map((g, i) => (
              <div className="sig cursor-target" key={g.k}>
                <div className="sig__n">{String(i + 1).padStart(2, "0")}</div>
                <h4>{g.k}</h4>
                <p>{g.m}</p>
                <div className="sig__b">
                  <span>what breaks it</span>
                  {g.b}
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </AnimatedContent>

      {/* The scan tags every signal family/dimension. Everything above is one
          pair. Saying so plainly is better than pretending the map stops here. */}
      <div className="sl__fam">
        <AnimatedContent {...reveal}>
          <div className="sl__famhd">
            <div className="sl__gk">Labor pain is one family</div>
            <p>
              Every signal above carries the same two tags: <code>labor</code> and{" "}
              <code>pain</code>. The plant is struggling, and it shows in what it posts. That is one
              axis, and it is the one running today. Three more are mapped, and each answers a
              different question.
            </p>
          </div>
        </AnimatedContent>

        <AnimatedContent {...reveal} delay={0.06}>
          <Carousel label="the families not yet running" per={2} className="car--ragged">
            {FAMILIES.map((f) => (
              <div className="fam cursor-target" key={f.k}>
                <h4>{f.k}</h4>
                <div className="fam__tag">{f.tag}</div>
                <div className="fam__q">{f.q}</div>
                <div className="fam__body">
                  {f.m.map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
                </div>
                <div className="sig__b">
                  <span>what breaks it</span>
                  {f.b}
                </div>
              </div>
            ))}
          </Carousel>
        </AnimatedContent>
      </div>

      {/* Sources, given room rather than crammed into a table. The federal
          pair carries the reframe: these are demand-shock detectors, not
          bidding tools. */}
      <div className="sl__src">
        <AnimatedContent {...reveal}>
          <div className="sl__famhd">
            <div className="sl__gk">Where it comes from</div>
            <p>
              All of it is public. None of it was published as a buying signal, which is exactly why
              it still works.
            </p>
          </div>
        </AnimatedContent>

        <AnimatedContent {...reveal} delay={0.06}>
          <div className="srcpull">
            <p>
              <b>SAM.gov is what the government intends to buy. USAspending is what it already
              bought.</b>{" "}
              Neither is being used here to bid on anything, which is the part most people get
              backwards.
            </p>
            <div className="srcchain" aria-label="prime wins award, tier-two supplier absorbs the volume, capacity gap, that plant is the lead">
              <span>prime wins the award</span>
              <i aria-hidden="true">→</i>
              <span>tier-two supplier absorbs the volume</span>
              <i aria-hidden="true">→</i>
              <span>capacity gap on fixed headcount</span>
              <i aria-hidden="true">→</i>
              <b>that plant is the lead</b>
            </div>
            <p className="srcpull__k">
              A prime winning a billion-dollar contract is not a lead. The supplier who now has to
              double output without doubling headcount is. Anyone can pull these files. Resolving one
              into <i>this exact plant may need this exact class of equipment, now</i> is the work.
            </p>
          </div>
        </AnimatedContent>

        <div className="srcgrid">
          {SOURCES.map((s, i) => (
            <AnimatedContent key={s.k} {...reveal} delay={0.05 * i}>
              <SpotlightCard
                className="src cursor-target"
                spotlightColor="rgba(99, 174, 242, 0.12)"
              >
                <h4>
                  <span className="d" aria-hidden="true"></span>
                  {s.k}
                </h4>
                <div className="src__tag">{s.tag}</div>
                <p>{s.m}</p>
                <div className="sig__b">
                  <span>what breaks it</span>
                  {s.b}
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>

      <AnimatedContent {...reveal}>
        <div className="sl__close">
          <p>
            Across the robotics and automation companies selling into these plants, the go-to-market
            stack is already solved and nearly identical: HubSpot or Salesforce, ZoomInfo or Apollo,
            Outreach or Salesloft, and increasingly a model layer on top of all three. Reviewing
            their own job postings, the tools repeat almost company for company.
          </p>
          <p className="sl__punch">
            Everyone has the pipes. Nothing tells them <b>which plant</b>, or <b>why now</b>.
          </p>
          <p>
            That layer sits in front of the CRM, not inside it, and building it is the job.
          </p>
        </div>
      </AnimatedContent>
    </section>
  );
}
