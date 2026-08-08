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
        <div className="ev">
          <div className="data">
            <div className="data__bar">
              <span className="fn">flagged-plants.csv</span>
              <span className="rc">8 of ~300 · identities withheld</span>
            </div>
            <div className="sl__scroll">
              <table className="dt dt--wrap">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Trigger</th>
                    <th>Open</th>
                    <th>What the posting says</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r, i) => (
                    <tr key={i}>
                      <td>
                        {r.p}
                        <span className="mut"> · {r.l}</span>
                      </td>
                      <td>
                        <span className="pill pill--a">{r.t}</span>
                      </td>
                      <td className="mut">{r.o}</td>
                      <td className="wrapcell">{r.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="ev__cap">
            <b>▸ evidence</b> - a sample of the scan. Each row resolves to one plant and links back
            to the live posting it was read from
          </div>
        </div>
      </AnimatedContent>

      <div className="sl__gsec">
        <div className="sl__gk">How each signal is read</div>
        <div className="sl__grid">
          {GRAMMAR.map((g, i) => (
            <AnimatedContent key={g.k} {...reveal} delay={0.04 * i}>
              <div className="sig cursor-target">
                <div className="sig__n">{String(i + 1).padStart(2, "0")}</div>
                <h4>{g.k}</h4>
                <p>{g.m}</p>
                <div className="sig__b">
                  <span>what breaks it</span>
                  {g.b}
                </div>
              </div>
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
