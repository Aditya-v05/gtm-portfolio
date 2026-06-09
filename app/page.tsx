import PrintButton from "./PrintButton";

// Pre-formatted terminal blocks: whitespace and newlines are significant
// (rendered with white-space:pre-wrap), so they are injected as raw HTML to
// preserve exact spacing and the colored <span> markup.
const term01 = `<span class="ac">user ›</span> create a LinkedIn campaign for this  <span class="dm">[+ klaviyo-outreach.docx]</span>

<span class="dm">🔒 workspace confirm:</span> account=<span class="wt">&lt;workspace&gt;</span>  campaign=<span class="wt">Klaviyo-PMM-leads</span>  leads=<span class="wt">39</span>  proceed? <span class="ac">yes</span>

<span class="tl">[phase 1]</span> extracting copy → building templates
<span class="tl">[phase 1]</span> <span class="ok">✅</span> klaviyo_normal      <span class="dm">{{FIRST_NAME}}, {{CURRENT_COMPANY}}</span>
<span class="tl">[phase 1]</span> <span class="ok">✅</span> klaviyo_ken_emma    <span class="dm">{{FIRST_NAME}}, {{CURRENT_COMPANY}}</span>
<span class="tl">[phase 1]</span> <span class="ok">✅</span> klaviyo_deja_mary   <span class="dm">{{FIRST_NAME}}, {{CURRENT_COMPANY}}</span>
<span class="tl">[phase 1]</span> querying MongoDB salesnav → <span class="wt">39 leads</span> w/ LinkedIn URLs
<span class="tl">[phase 1]</span> <span class="ok">✅</span> csv: normal=35 · ken_emma=2 · deja_mary=2   <span class="dm">⏱ 1m32s</span>

<span class="ac">user ›</span> approved

<span class="tl">[phase 2]</span> <span class="wt">Klaviyo-Normal-10-02-2026</span>
  [1/10] create campaign <span class="ok">✅</span>   [4/10] audience resolved <span class="ok">✅</span> 35 profiles
  [7/10] preview <span class="dm">"{{FIRST_NAME}} — {{TITLE}}" → "Hi {{FIRST_NAME}}, noticed {{COMPANY}}'s…"</span> <span class="ok">✅</span>
  [10/10] activate <span class="ok">✅</span> <span class="ac">ACTIVE</span>
<span class="tl">[phase 2]</span> <span class="ok">✅</span> 3 campaigns · 39 leads <span class="ac">LIVE</span>  <span class="dm">⏱ 4m12s</span>`;

const term02 = `<span class="dm">[init]</span> driving each prospect through signup → reading "already registered" signal

<span class="dm">[w1]</span> m****@acme.com        <span class="dm">→</span> <span class="ok">registered ✓</span>  1.9s  | hits 1/200
<span class="dm">[w2]</span> s****@globex.io       <span class="dm">→</span> <span class="dm">new prospect</span>  2.3s  | hits 1/200
<span class="dm">[w3]</span> d****@initech.com     <span class="dm">→</span> <span class="ok">registered ✓</span>  2.1s  | hits 2/200
<span class="dm">[w4]</span> r****@umbrella.co     <span class="dm">→</span> <span class="dm">new prospect</span>  1.8s  | hits 2/200
<span class="dm">[w1]</span> k****@hooli.com       <span class="dm">→</span> <span class="ok">registered ✓</span>  2.4s  | hits 3/200
<span class="dm">[w2]</span> j****@stark.io        <span class="dm">→</span> <span class="dm">new prospect</span>  2.0s  | hits 3/200
<span class="wt">─ summary:</span> <span class="ok">14 / 200 already customers</span> → excluded from outbound  <span class="dm">⏱ 3m02s</span>`;

const term03 = `<span class="dm">$</span> <span class="pr">npm start</span> -- --input companies.csv --output ./out

<span class="wt">=== SaaS B2B Classifier Pipeline ===</span>
<span class="tl">[CONFIG]</span> azure: gpt-5-mini · batch:50 · max-concurrent:10
<span class="tl">[CSV]</span> parsed → valid companies w/ websites: <span class="wt">13,700</span>  (skipped 1,249)
<span class="tl">[PROGRESS]</span> loaded: batch 15/274 · resuming <span class="wt">16/274</span> · Apollo <span class="ok">OK</span>
<span class="tl">[CLASSIFIER]</span> <span class="ok">SUCCESS</span> "Trinseo": b2b=true, b2b_saas=false, confidence=high
<span class="tl">[CLASSIFIER]</span> <span class="ok">SUCCESS</span> "IREKS Group": b2b=true, b2b_saas=false, confidence=high
<span class="tl">[OUTPUT]</span> wrote 800 rows → <span class="pr">./out/final.csv</span>`;

const term08 = `<span class="tl">[AUTH]</span> phase 1b: scraping login page <span class="dm">→</span> https://app-auth.<span class="dm">&lt;target&gt;</span>.com/login
<span class="tl">[SCRAPER]</span> <span class="ok">done</span>: "Customer Case Study" (8013 chars, 3232ms)
<span class="tl">[AGENT]</span> baseline fake email <span class="dm">→</span> fakeuser_…@nonexistent-testdomain.com
<span class="tl">[AGENT]</span> analyze_page <span class="dm">→</span> interact_with_page <span class="dm">→</span> parse_har_diff
<span class="tl">[AGENT]</span> real emails bypass CAPTCHA via server-side redirect <span class="dm">(differential)</span>

<span class="wt">── report.md ─────────────────────────</span>
verdict:  <span class="er">ENUMERABLE</span>      method: <span class="tl">api_response_diff</span>
pages tested: 3 · non-SSO findings: 3 · confidence: high`;

export default function Home() {
  return (
    <>
      <PrintButton />

      {/* NAV */}
      <nav>
        <div className="in">
          <div className="brand">
            <b>ADITYA</b> <span>// gtm engineer</span>
          </div>
          <div className="links">
            <a href="#work">Work</a>
            <a href="#stack">Stack</a>
            <a href="https://github.com/Aditya-v05">GitHub</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </nav>

      <div className="wrap">
        <div className="cover">
          {/* HERO */}
          <section className="hero">
            <div className="eyebrow fade d1">GTM Engineer · Data &amp; Automation</div>
            <h1 className="fade d2">
              I build GTM systems that <em>run themselves.</em>
            </h1>
            <p className="sub fade d3">
              Collection, enrichment, customer-overlap detection, LLM classification, and live outbound —
              built as <b>autonomous systems</b>, not one-off scripts. <b>40+ shipped</b>, each one backed by a
              real artifact: a log, a verdict, an export.
            </p>
            <div className="meta fade d4">
              <span><span className="d"></span> rev. 2026.06</span>
              <span><b>40+</b> systems shipped</span>
              <span><b>100+</b> campaigns automated</span>
              <span>available for GTM engineering</span>
            </div>
          </section>

          {/* CLIENTS */}
          <section className="clients">
            <div className="k">Systems shipped for</div>
            <div className="names">
              <span className="client">Brex</span>
              <span className="client">Rho</span>
              <span className="client">Peec&nbsp;AI</span>
              <span className="client">Warp</span>
              <span className="client">Hyperbound</span>
              <span className="client">Qashio</span>
            </div>
          </section>
        </div>

        {/* CLIENT SIGNALS — recreated, sanitized Slack (own page) */}
        <div className="shead signals-head">
          <span className="n">§ 01</span>
          <h2>Client Signals</h2>
          <span className="c">delivered work · real reactions</span>
        </div>
        <hr className="rule" />
        <section className="signals">
          <div className="slack">
            <div className="slack__bar">
              <span className="chan"><span className="lk">#</span> huntd-warp</span>
              <span className="ext">2 people from Warp</span>
            </div>
            <div className="slmsg">
              <div className="slav" style={{ background: "#2EB67D" }}>H</div>
              <div>
                <div className="slhead"><span className="slname">Huntd</span><span className="sltime">5:24 PM</span></div>
                <div className="sltext">The agent recognises companies using <b>Rippling</b> really well — a big chunk in the 1–100 range. So we can do <b>Rippling, Gusto, Deel</b> &amp; all other PEOs in one place now. Gonna be great!</div>
              </div>
            </div>
            <div className="slmsg">
              <div className="slav" style={{ background: "#E01E5A" }}>H</div>
              <div>
                <div className="slhead"><span className="slname">Hayk G.</span><span className="sltime">1:36 AM</span></div>
                <div className="sltext">Amazing</div>
                <span className="slreact">🙌 1</span>
              </div>
            </div>
          </div>

          <div className="slack">
            <div className="slack__bar">
              <span className="chan"><span className="lk">#</span> huntd-hyperbound</span>
              <span className="ext">3 people from Hyperbound</span>
            </div>
            <div className="slmsg">
              <div className="slav" style={{ background: "#2EB67D" }}>H</div>
              <div>
                <div className="slhead"><span className="slname">Huntd</span><span className="sltime">1:57 PM</span></div>
                <div className="sltext">This contains everything you asked for, <span className="slred" style={{ width: "58px" }}>&nbsp;</span> — the <b>B2B-SaaS</b> and <b>med-device</b> target lists. We can pull a lot more if we loosen the employee-count filter.</div>
                <div className="slfiles">
                  <div className="slfile"><span className="ic">CSV</span><div><div className="fn">b2b-saas-list.csv</div><div className="ft">CSV</div></div></div>
                  <div className="slfile"><span className="ic">CSV</span><div><div className="fn">med-device-list.csv</div><div className="ft">CSV</div></div></div>
                </div>
              </div>
            </div>
            <div className="slmsg">
              <div className="slav" style={{ background: "#ECB22E" }}>I</div>
              <div>
                <div className="slhead"><span className="slname">Isaac H.</span><span className="sltime">5:45 PM</span></div>
                <div className="sltext">Yes let&apos;s do that thank you</div>
                <span className="slreact">❤️ 1</span>
              </div>
            </div>
          </div>

          <div className="slack">
            <div className="slack__bar">
              <span className="chan"><span className="lk">#</span> huntd-peecai</span>
              <span className="ext">3 people from Peec AI</span>
            </div>
            <div className="slmsg">
              <div className="slav" style={{ background: "#2EB67D" }}>H</div>
              <div>
                <div className="slhead"><span className="slname">Huntd</span><span className="sltime">12:59 PM</span></div>
                <div className="sltext">Scoped your <b>ICP</b> and built the prioritised target-account list. Want me to prioritise any segment first?</div>
              </div>
            </div>
            <div className="slmsg">
              <div className="slav" style={{ background: "#36C5F0" }}>D</div>
              <div>
                <div className="slhead"><span className="slname">Daniel D.</span><span className="sltime">3:53 PM</span></div>
                <div className="sltext">Nice! I&apos;d prioritise B2B over consumer. SaaS is always easiest to close!</div>
              </div>
            </div>
          </div>
        </section>

        {/* WORK */}
        <article className="case" id="work">
          <div className="rail">
            <div className="id">01 / 08 · selected work</div>
            <div className="seg"><div className="h">Type</div><div className="v">Autonomous agent<br />Outbound delivery</div></div>
            <div className="seg"><div className="h">Stack</div><div className="v"><div>Claude Agent SDK</div><div>OpenCLAW</div><div>Aimfox API</div><div>MongoDB · Node</div></div></div>
            <div className="st"><span className="d"></span> live</div>
          </div>
          <div className="body">
            <div className="tag">Partha</div>
            <h3>LinkedIn Campaign Autopilot</h3>
            <div className="lede">Drop a doc, say &ldquo;go,&rdquo; and LinkedIn campaigns go live.</div>
            <p>
              An OpenCLAW agent (Claude Agent SDK) that <b>recreates the Aimfox API</b> to run LinkedIn outreach end to
              end. <b>Phase 1</b> extracts copy from a <code>.docx</code>, builds templated messages, and pulls matching
              leads from MongoDB. <b>Human approval gate.</b> <b>Phase 2</b> runs a 10-step pipeline per campaign —
              create → target → resolve audience → match template → preview → schedule → <b>activate</b> — across separate
              workspaces per account, with a daily cron health-check.
            </p>
            <div className="metrics"><b>~100</b> campaigns live <span className="sep">/</span> doc → live in <b>~6 min</b> <span className="sep">/</span> 2-phase + approval gate</div>
            <div className="ev">
              <div className="term">
                <div className="term__bar"><span className="d r"></span><span className="d y"></span><span className="d g"></span><span className="f">partha · run klaviyo-outreach.docx</span></div>
                <div className="term__body" dangerouslySetInnerHTML={{ __html: term01 }} />
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — representative end-to-end run: doc in, 3 campaigns live</div>
            </div>
            <div className="ev">
              <div className="dash">
                <img src="/aimfox.png" alt="Aimfox campaigns dashboard" />
                <span className="redact" style={{ left: "31.5%", top: "39.5%", width: "11.5%", height: "7.3%" }}></span>
                <span className="redact" style={{ left: "31.5%", top: "53.7%", width: "11.5%", height: "7.3%" }}></span>
                <span className="redact" style={{ left: "31.5%", top: "67.9%", width: "11.5%", height: "7.3%" }}></span>
                <span className="redact" style={{ left: "31.5%", top: "81.9%", width: "11.5%", height: "7.3%" }}></span>
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — the live Aimfox workspace: campaigns activated by Partha, 100% complete (account redacted)</div>
            </div>
          </div>
        </article>

        {/* 02 OVERLAP */}
        <article className="case">
          <div className="rail">
            <div className="id">02 / 08</div>
            <div className="seg"><div className="h">Type</div><div className="v">Signal<br />Headless automation</div></div>
            <div className="seg"><div className="h">Stack</div><div className="v"><div>Puppeteer (stealth)</div><div>Evomi · 2captcha</div><div>Azure OpenAI</div><div>MongoDB · Express</div></div></div>
            <div className="st"><span className="d"></span> shipped</div>
          </div>
          <div className="body">
            <div className="tag">Customer Overlap</div>
            <h3>Customer-Overlap Detection Engine</h3>
            <div className="lede">&ldquo;Does this prospect already use the product?&rdquo; — at the email level.</div>
            <p>
              Outbound burns budget on companies that already use a tool. I built a <b>reusable headless-automation
              engine</b> that drives a target&apos;s own signup flow and reads the &ldquo;email already registered / SSO
              redirect&rdquo; signal — then <b>productized it across 9 SaaS targets</b> (Klaviyo, TaxJar, Harness,
              SimilarWeb, BuiltWith, GitLab, Dynatrace, Bluefish, Second Nature). Stealth browsers, residential proxies,
              AI &amp; 2captcha CAPTCHA solving, MongoDB job queues, and a <b>parallel worker pool</b> behind Express
              batch APIs with polling and 3× retries.
            </p>
            <div className="metrics"><b>9</b> production checkers <span className="sep">/</span> parallel worker pool <span className="sep">/</span> CAPTCHA-solving + retry</div>
            <div className="ev">
              <div className="term">
                <div className="term__bar"><span className="d r"></span><span className="d y"></span><span className="d g"></span><span className="f">overlap-engine/batch.log — target: Klaviyo · 4 workers</span></div>
                <div className="term__body" dangerouslySetInnerHTML={{ __html: term02 }} />
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — live batch: 4 workers detecting existing customers across 200 prospects (emails masked)</div>
            </div>
          </div>
        </article>

        {/* 03 CLASSIFIER */}
        <article className="case">
          <div className="rail">
            <div className="id">03 / 08</div>
            <div className="seg"><div className="h">Type</div><div className="v">LLM pipeline<br />Classification</div></div>
            <div className="seg"><div className="h">Stack</div><div className="v"><div>TypeScript</div><div>Azure OpenAI</div><div>Cheerio · Evomi</div><div>CSV streams</div></div></div>
            <div className="st"><span className="d"></span> shipped</div>
          </div>
          <div className="body">
            <div className="tag">Classifier</div>
            <h3>B2B / SaaS Classifier</h3>
            <div className="lede">Turning noisy Apollo exports into a clean, targetable universe.</div>
            <p>
              Raw exports are full of agencies, holding companies and B2C noise. I built a pipeline that <b>scrapes each
              company&apos;s website, reads it with an LLM, and classifies it</b> as B2B / SaaS or not — with a scrape
              cache, automatic failure re-queue, resumable batch progress, and verified audit CSVs so every verdict is
              traceable.
            </p>
            <div className="metrics"><b>13,700</b> companies / run <span className="sep">/</span> 274 batches · resumable <span className="sep">/</span> 280K+ rows processed</div>
            <div className="ev">
              <div className="term">
                <div className="term__bar"><span className="d r"></span><span className="d y"></span><span className="d g"></span><span className="f">run-classifier.log</span></div>
                <div className="term__body" dangerouslySetInnerHTML={{ __html: term03 }} />
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — real run log: 13,700 companies parsed, resumed at batch 16 of 274</div>
            </div>
          </div>
        </article>

        {/* 04 ENRICHMENT */}
        <article className="case">
          <div className="rail">
            <div className="id">04 / 08</div>
            <div className="seg"><div className="h">Type</div><div className="v">Enrichment<br />Email waterfall</div></div>
            <div className="seg"><div className="h">Stack</div><div className="v"><div>Node</div><div>Apollo API</div><div>LeadMagic API</div><div>MongoDB</div></div></div>
            <div className="st"><span className="d"></span> shipped</div>
          </div>
          <div className="body">
            <div className="tag">Enrichment</div>
            <h3>Apollo × LeadMagic Enrichment Pipeline</h3>
            <div className="lede">Verified emails in, duplicate outreach out.</div>
            <p>
              An interactive pipeline that builds clean outbound lists from Apollo search: a <b>multi-provider email
              waterfall</b> (Apollo People-Match → LeadMagic fallback), domain-to-search-list conversion, rate-limited
              paginated calls, and <b>MongoDB de-duplication against prior sources</b> so a known contact is never
              messaged twice. Every row carries its provenance — see the <code>email_source</code> column.
            </p>
            <div className="metrics"><b>dual-provider</b> fallback <span className="sep">/</span> 2,501 contacts / export <span className="sep">/</span> ~5.7K LOC</div>
            <div className="ev">
              <div className="data">
                <div className="data__bar"><span className="fn">enriched_search_2026-04-23.csv</span><span className="rc">2,501 rows · 14 cols</span></div>
                <table className="dt">
                  <thead><tr><th>name</th><th>email</th><th>status</th><th>email_source</th><th>title</th><th>company</th></tr></thead>
                  <tbody>
                    <tr><td>Josh Beren</td><td>jberen@cisco.com</td><td><span className="pill pill--v">verified</span></td><td><span className="pill pill--a">apollo_original</span></td><td>Dir, Technical Sales Prod.</td><td>Cisco</td></tr>
                    <tr><td>Kathleen Tilly</td><td>ktilly@salesforce.com</td><td><span className="pill pill--v">verified</span></td><td><span className="pill pill--l">leadmagic</span></td><td>Sr Dir, Revenue Enablement</td><td>Salesforce</td></tr>
                    <tr><td>Florian Haerle</td><td><span className="mut">— not found —</span></td><td><span className="pill pill--v">verified</span></td><td><span className="pill pill--n">not_found</span></td><td>Head of Digital Enablement</td><td>Boehringer Ing.</td></tr>
                    <tr><td>Sophie Whelton</td><td>swhelton@salesforce.com</td><td><span className="pill pill--v">verified</span></td><td><span className="pill pill--l">leadmagic</span></td><td>Productivity Mgr, UKI</td><td>Salesforce</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — real, verifiable export: the email_source column shows the Apollo→LeadMagic waterfall</div>
            </div>
          </div>
        </article>

        {/* 05 SALESNAV */}
        <article className="case">
          <div className="rail">
            <div className="id">05 / 08</div>
            <div className="seg"><div className="h">Type</div><div className="v">Browser extension<br />Manifest V3</div></div>
            <div className="seg"><div className="h">Stack</div><div className="v"><div>JS (ES2020+)</div><div>Chrome MV3</div><div>service worker</div><div>page-world inject</div></div></div>
            <div className="st"><span className="d"></span> shipped</div>
          </div>
          <div className="body">
            <div className="tag">Extension</div>
            <h3>Sales Navigator Capture Extension</h3>
            <div className="lede">Export Sales Nav leads natively — no copy-paste, no API keys.</div>
            <p>
              A Manifest V3 Chrome extension that <b>intercepts Sales Navigator&apos;s own API responses</b> in the page
              (patching <code>fetch</code>/<code>XHR</code> from the page world), passively captures and de-duplicates
              leads by <code>profileId</code>, auto-paginates, and exports to CSV / JSON or pushes to a webhook. Runs
              entirely on the user&apos;s session — no build step.
            </p>
            <div className="metrics"><b>real-time</b> capture <span className="sep">/</span> dedup by profileId <span className="sep">/</span> CSV · JSON · webhook</div>
            <div className="ev">
              <div className="shot">
                <div className="shot__f">
                  <div className="ch"><span className="d"></span><span className="t">Sales Nav Scraper · popup</span></div>
                  <img src="/fig-salesnav.png" alt="Sales Nav Scraper popup" />
                </div>
                <div className="shot__n">
                  The capture panel mid-run: leads accrue passively as you browse, with live counts for <b>leads
                  captured</b> and <b>pages auto-paginated</b>. One-click <b>CSV / JSON export</b>, an optional
                  <b>webhook</b> to push leads into a pipeline, and tunable pagination delay + jitter to pace requests.
                  <span className="k">// the actual extension UI, rendered from src/popup/</span>
                </div>
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — the shipped extension&apos;s popup, real UI (not a mockup)</div>
            </div>
          </div>
        </article>

        {/* 06 LD-HUNTING */}
        <article className="case">
          <div className="rail">
            <div className="id">06 / 08</div>
            <div className="seg"><div className="h">Type</div><div className="v">Workflow agent<br />CLI</div></div>
            <div className="seg"><div className="h">Stack</div><div className="v"><div>TypeScript · Mastra</div><div>Azure AI (Claude)</div><div>Zyte · Serper</div><div>MongoDB</div></div></div>
            <div className="st"><span className="d"></span> shipped</div>
          </div>
          <div className="body">
            <div className="tag">Competitor-Customer Discovery</div>
            <h3>Customer Poacher</h3>
            <div className="lede">Point it at a company; surface its customers&apos; decision-makers.</div>
            <p>
              A terminal-run <b>Mastra workflow</b> that turns one company URL into a list of <i>their</i> customers&apos;
              buyers: <b>crawl the sitemap → AI-filter case-study URLs → scrape via Zyte → extract named people → resolve
              LinkedIn profiles via Serper → export CSV.</b> Run it on a competitor and you get a poaching list — real
              exports exist for 10+ companies (gong.io, seismic, dynatrace, connectwise…).
            </p>
            <div className="metrics"><b>10+</b> companies mined <span className="sep">/</span> sitemap → AI → LinkedIn <span className="sep">/</span> CSV exports</div>
            <div className="ev">
              <div className="data">
                <div className="data__bar"><span className="fn">out/gong-io-customer-linkedin-profiles.csv</span><span className="rc">→ LinkedIn profiles</span></div>
                <table className="dt">
                  <thead><tr><th>name</th><th>company</th><th>job title</th><th>linkedin</th><th>source</th></tr></thead>
                  <tbody>
                    <tr><td>Alison Silver</td><td>Brex</td><td>Director, Client Sales</td><td>/in/alison-silver-4a81…</td><td>gong.io</td></tr>
                    <tr><td>Courtney Tucci</td><td>Mirakl</td><td>Director of Sales Enablement</td><td>/in/courtneytucci</td><td>gong.io</td></tr>
                    <tr><td>Kevin Jordan</td><td>Anthropic</td><td>GTM Enablement Lead</td><td>/in/kevindjordan</td><td>gong.io</td></tr>
                    <tr><td>Vineet Ratan</td><td>Rippling</td><td>Team Lead, Implementation</td><td><span className="mut">resolving…</span></td><td>gong.io</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — real CSV output: a company&apos;s customers, resolved to LinkedIn profiles</div>
            </div>
          </div>
        </article>

        {/* 07 KLUE */}
        <article className="case">
          <div className="rail">
            <div className="id">07 / 08</div>
            <div className="seg"><div className="h">Type</div><div className="v">Agent<br />Segmentation</div></div>
            <div className="seg"><div className="h">Stack</div><div className="v"><div>Claude Agent SDK</div><div>Apify Search</div><div>Zod · Node</div></div></div>
            <div className="st"><span className="d"></span> shipped</div>
          </div>
          <div className="body">
            <div className="tag">Segmentation</div>
            <h3>Lead Bucketing Agent</h3>
            <div className="lede">Auto-segmenting a flat lead list into outreach-ready niches.</div>
            <p>
              A <b>Claude Agent SDK</b> agent that researches each lead with live Google search and classifies it into a
              niche — a <b>two-phase pass</b> (broad → deep) that took a <b>1,255-row lead list down to 116 unique
              companies across 8 broad and 109 granular niches</b>, emitting a written report and bucketed CSVs so generic
              blasts become segment-specific campaigns.
            </p>
            <div className="metrics"><b>1,255</b> leads → 116 cos <span className="sep">/</span> 109 granular niches <span className="sep">/</span> 2-phase</div>
            <div className="ev">
              <div className="report">
                <div className="report__top">
                  <div className="s"><div className="v">116</div><div className="l">companies classified</div></div>
                  <div className="s"><div className="v">8</div><div className="l">broad niches</div></div>
                  <div className="s"><div className="v">109</div><div className="l">deep niches</div></div>
                </div>
                <div className="report__b">
                  <div className="h">broad niche distribution — niche_report.md</div>
                  <div className="nrow"><span className="nm">Information Tech &amp; Services</span><span className="bar"><i style={{ width: "100%" }}></i></span><span className="pc">56.0%</span></div>
                  <div className="nrow"><span className="nm">Computer &amp; Network Security</span><span className="bar"><i style={{ width: "38.6%" }}></i></span><span className="pc">21.6%</span></div>
                  <div className="nrow"><span className="nm">Marketing &amp; Advertising</span><span className="bar"><i style={{ width: "15.4%" }}></i></span><span className="pc">8.6%</span></div>
                  <div className="nrow"><span className="nm">Financial Services</span><span className="bar"><i style={{ width: "9.3%" }}></i></span><span className="pc">5.2%</span></div>
                  <div className="nrow"><span className="nm">Nonprofit Management</span><span className="bar"><i style={{ width: "7.7%" }}></i></span><span className="pc">4.3%</span></div>
                </div>
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — generated report: the agent&apos;s own niche breakdown of the lead list</div>
            </div>
          </div>
        </article>

        {/* 08 RECON */}
        <article className="case">
          <div className="rail">
            <div className="id">08 / 08</div>
            <div className="seg"><div className="h">Type</div><div className="v">Autonomous agent<br />Security recon</div></div>
            <div className="seg"><div className="h">Stack</div><div className="v"><div>Python (agent sdk)</div><div>TS · Mastra</div><div>Playwright · MCP</div><div>2captcha</div></div></div>
            <div className="st"><span className="d"></span> shipped</div>
          </div>
          <div className="body">
            <div className="tag">Security Recon</div>
            <h3>Auth-Enumeration Recon Agent</h3>
            <div className="lede">An agent that probes auth flows the way a researcher would.</div>
            <p>
              A two-phase autonomous agent for detecting account-enumeration leaks. <b>Phase 1</b> (TS / Mastra) discovers
              auth pages and mines customer identities from case-study pages; <b>Phase 2</b> (Python /
              <code>claude_agent_sdk</code>) drives a browser through login, signup, SSO and API flows, <b>diffs responses
              and HAR traffic</b> to spot enumeration, solves CAPTCHAs, and persists novel patterns across a long agent
              loop with 10 MCP tools. Confirmed findings across 9 real targets.
            </p>
            <div className="metrics"><b>10</b> MCP tools <span className="sep">/</span> HAR-diff analysis <span className="sep">/</span> findings on 9 targets</div>
            <div className="ev">
              <div className="term">
                <div className="term__bar"><span className="d r"></span><span className="d y"></span><span className="d g"></span><span className="f">agent.log → report.md</span></div>
                <div className="term__body" dangerouslySetInnerHTML={{ __html: term08 }} />
              </div>
              <div className="ev__cap"><b>▸ evidence</b> — real agent run → verdict (target anonymized, identities redacted)</div>
            </div>
          </div>
        </article>

        {/* ALSO BUILT */}
        <div className="shead" id="stack">
          <span className="n">§ 02</span>
          <h2>Also Built &amp; Shipped</h2>
          <span className="c">selected</span>
        </div>

        <div className="grid">
          <div className="gcell"><h4><span className="d"></span>Competitor Recon Agent</h4><p>Maps a niche&apos;s competitive landscape — named competitors, funded startups, comparison pages — from one target.</p><p className="num">→ <b>100+</b> companies mapped · 15+ competitors each</p><p className="tools">Claude Agent SDK · Google SERP · proxy</p></div>
          <div className="gcell"><h4><span className="d"></span>Employee Intelligence DB</h4><p>MongoDB tracking employees at target accounts with first/last-seen + status — for hiring / churn triggers.</p><p className="num">→ <b>3</b> target accounts · daily deltas</p><p className="tools">MongoDB · schema-driven snapshots</p></div>
          <div className="gcell"><h4><span className="d"></span>Shopify Merchant Classifier</h4><p>Agent that discovers &amp; classifies Shopify stores and agencies from search results for outreach.</p><p className="num">→ <b>2,029</b> stores classified</p><p className="tools">Claude Agent SDK · Apify · Cheerio</p></div>
          <div className="gcell"><h4><span className="d"></span>Crunchbase Exporter</h4><p>Resumable batch scraper for funded-company data with progress checkpointing and recovery.</p><p className="num">→ <b>25,200</b> funded companies exported</p><p className="tools">Playwright · resumable state</p></div>
          <div className="gcell"><h4><span className="d"></span>Smartlead Campaign Agent</h4><p>CLI agent that creates and manages outbound campaigns through the Smartlead API.</p><p className="num">→ full campaign lifecycle via API</p><p className="tools">Claude Agent SDK · Smartlead API</p></div>
          <div className="gcell"><h4><span className="d"></span>Email Finder TUI</h4><p>Interactive terminal tool for name-+-company email lookup via LeadMagic, with a live blessed UI.</p><p className="num">→ name + company → verified email</p><p className="tools">Node · blessed · LeadMagic</p></div>
          <div className="gcell"><h4><span className="d"></span>Apollo Headcount Lookup</h4><p>Rate-limited CLI resolving company headcount from Apollo for domains or names, streamed to CSV.</p><p className="num">→ domain / name → headcount</p><p className="tools">TypeScript · Apollo · streaming CSV</p></div>
          <div className="gcell"><h4><span className="d"></span>Post-Engagement Scraper</h4><p>Exports everyone who commented on a target LinkedIn post — warm signals for outreach.</p><p className="num">→ <b>1,210</b> commenters / post</p><p className="tools">Node · Apify</p></div>
        </div>

        <div className="stackwall">
          <span>+ Skeduler — OR-Tools scheduling app (deployed)</span>
          <span>+ Electron desktop app</span>
          <span>+ Flutter mobile app</span>
          <span>+ React dashboards</span>
          <span>+ MCP tool servers</span>
        </div>

        {/* FOOTER */}
        <footer id="contact">
          <hr className="rule" />
          <div className="big">Let&apos;s build the GTM stack. <a href="mailto:adityaspark05@gmail.com">adityaspark05@gmail.com →</a></div>
          <div className="row">
            <div className="links">
              <div><span style={{ color: "var(--mute)" }}>// reach me</span></div>
              <div><a href="mailto:adityaspark05@gmail.com">adityaspark05@gmail.com</a></div>
              <div><a href="https://github.com/Aditya-v05">github.com/Aditya-v05</a></div>
              <div><a href="https://gethuntd.com">gethuntd.com</a> <span className="edit">— building GTM systems @ Huntd</span></div>
            </div>
            <div className="sysline">
              <div>rev. 2026.06</div>
              <div>all figures are real run artifacts</div>
              <div>PII masked · recon target anonymized</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
