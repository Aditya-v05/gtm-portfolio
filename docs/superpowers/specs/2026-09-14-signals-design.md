# Signals: weekly potential customers for hot software categories

**Date:** 2026-09-14
**Status:** Design approved in conversation, pre-implementation
**Delivery for now:** local commits only, reviewed on localhost. No push, no deploy until asked.

---

## 1. Why this exists

Aditya is job hunting as a GTM engineer. `/signals` is a public, weekly section of the
portfolio that proves the skill in the open: every week, for a few hot software categories,
it lists the companies most likely to buy from that category right now, with the evidence.

**Audience:** GTM people who use the lists weekly (sellers, founders, SDR leads), with a short
"how this works" layer for hiring managers. Built for readers first, because real usage is the
proof a hiring manager trusts most.

**Success, in priority order:**
1. **Inbound.** Founders and hiring managers reach out because they saw it.
2. **Outreach.** The same engine points at Aditya's own search: funded vendors hiring GTM.
3. **Interview proof.** The engine, the precision numbers and the scorecard are something to
   walk through.

**The edge is curation plus proof, not collection.** Research across 24 signal tools
(Sumble, TheirStack, PredictLeads, Crustdata, Coresignal, Harmonic, Autobound, Trigify, Common
Room, UserGems, Champify, LoneScale, Unify, Warmly, Koala, RB2B, Keyplay, Clay, 6sense,
Bombora, G2, ZoomInfo, Apollo, Demandbase) found that public-web signals are already sold
cheaply. None of them publishes whether its signals predicted anything, none turns signals into
a weekly editorial list for a category's buyers, and none ranks which categories are hot.
Those three things are this project.

## 2. What a reader sees

A **niche** is a category of software, for example SOC 2 compliance automation. The niche page
shows that category's **potential customers**: companies whose public signals say they are
likely to buy it now. The readers are the vendors in that category.

Each week covers 3 to 4 niches with 10 ranked companies each. Every company card shows:

- company name and domain
- score (0 to 100) and band
- the stacked signals, each with date, confidence and a link to its evidence
- **why now:** one line tying the signals to the need
- **talk to:** the buying role for this category, never a named person
- **opener:** one suggested first line, grounded in the signals
- a **reviewed** mark on the companies Aditya hand-checked (the top 3 per niche)

## 3. Features and phases

All 17 features are in scope. The phase is forced by what data exists, not by preference.

| # | Feature | Phase |
|---|---|---|
| 1 | Niche tabs, 10 ranked companies each | 1 |
| 2 | Company card (fields in section 2) | 1 |
| 3 | Signal of the week, featured, tied to the LinkedIn post | 1 |
| 6 | Week archive, searchable by company | 1 |
| 7 | Company permalink: every week a company appeared | 1 |
| 10 | Request a company: form, Aditya sends the report by hand | 1 |
| 13 | Private GTM-hiring lens (never deployed) | 1 |
| 14 | One-company report generator (shared with #10) | 1 |
| 15 | How-it-works panel with sources, scoring and precision | 1 |
| 16 | Share images for every week and company page | 1 |
| 4 | Deep dives: long-form write-up on one company or pattern | 2 |
| 5 | Niche trends: change over weeks | 2 (needs 3 to 4 weeks of data) |
| 9 | Filters: signal type, size, region, funding stage | 2 |
| 11 | CSV export of a week | 2 |
| 17 | LinkedIn post outline drafted from the signal of the week | 2 |
| 8 | Scorecard: 30, 60, 90 day outcome checks, public hit rate | 3 (needs 30+ days) |
| 12 | Watch a company, alert when it fires again | 3 (needs notifications) |

## 4. Architecture

Two parts, one direction of data flow.

```
signal-engine (separate repo, ~/Projects/signal-engine)
  collect  ->  resolve to company  ->  store weekly snapshot  ->  detect transitions
  ->  score per niche  ->  write weekly file
                                   |
                                   v
clay-portfolio/content/signals/2026-W38.json
                                   |
                                   v
clay-portfolio  /signals pages, statically generated like the blog
```

- **Static first.** The site reads weekly JSON files, the same way `lib/posts.ts` reads MDX.
  No database on the site side in phases 1 and 2. A database is added in phase 3 for
  requests, watches and the scorecard.
- **The engine keeps history locally** in SQLite. History is required: "first ever" signals
  and baseline comparisons are computed across stored weekly snapshots.
- **The engine runs locally by CLI** for now. Scheduling (GitHub Actions) is deferred until
  deploy is wanted.
- **Engine stack:** TypeScript, Node 24, better-sqlite3, zod, vitest. Same stack as graphld.
- **Two sides of the same data:**
  - **Buyer side (public):** potential customers per niche. This is `/signals`.
  - **Vendor side (private):** which vendors in each niche are funded and hiring GTM. It
    drives niche selection and is Aditya's job-hunt list. It is never written into the
    portfolio repo.

## 5. Company universe

One shared pool of companies. Niches are lenses over it, so adding a niche is a config file,
not new collection code.

**Seeds, all public:**
- **Public ATS job boards:** Greenhouse, Lever, Ashby, Workable. A company enters the pool once
  its board token is known.
- **Board discovery:** crawl a company's careers page for links to those ATS hosts.
- **YC company directory:** name, website, batch, industry tags. Websites feed board discovery.
- **SEC Form D filers:** matched to the pool by normalized company name. Unmatched filings are
  stored but never surfaced, because a wrong match would put the wrong company on a public page.

**Identity:** every company is keyed by its registrable domain. Every signal resolves to one
domain or is dropped.

**Known bias, stated on how-it-works:** public ATS boards over-represent tech startups. That
suits the niches chosen, and traditional companies are underrepresented.

## 6. Signals

Every signal is an **event**: a change detected between weekly snapshots, never a steady state.
"Started hiring security engineers" fires once; "has security roles open" fires nothing.

**Readings (added 2026-09-14, while building).** Change signals need weeks of history, so the
first issues would be empty. Each card can also carry readings: what is true this week, labelled
as a count ("2 open security roles", "Job posts describe SOC 2 work underway or planned", "Site
runs the Meta pixel"). Readings weigh less than changes in every niche config. Tools in use
(`reading_job_tools`, `reading_site_tools`) are fit, not timing, and never list a company on their
own. Need-term mentions are read by the model in context and count only when it says the company
needs the work (`reading_need_terms`) or already has it (`reading_has_term`, negative weight);
several terms from one pasted paragraph merge into one reading.

### 6.1 Version 1

| Group | Signal | Source | Fires when | Confidence |
|---|---|---|---|---|
| Hiring | First role in a function | ATS boards | a function appears with no open role in any stored snapshot | low until 8 weeks of history, then high |
| Hiring | Hiring surge | ATS boards | open roles in a function, averaged over the last 3 snapshots, are at least 1.5x the trailing 12-week mean, and at least 3 roles higher | low with fewer than 4 weeks of history, else high |
| Hiring | GTM or leadership hire posted | ATS boards | a new posting for a GTM role (AE, SDR, RevOps, GTM engineer) or a leadership role (VP, Head of) | high |
| Hiring | First role in a new country or state | ATS boards | a posting location outside every location seen before | medium |
| Hiring | Role closed | ATS boards | a tracked posting disappears | medium (removed is not always filled) |
| Job-post text | Technology adoption | job descriptions | a technology is mentioned for the first time across the company's stored posts | low until 8 weeks, then medium |
| Job-post text | Competitor churn | job descriptions | mentions of a named competitor in the last 90 days fall below half of the prior 90 days, from at least 2 | medium |
| Job-post text | Need keywords | job descriptions | posts in the last 90 days mention a niche's need terms | 4+ posts high, 2 to 3 medium, 1 low |
| Job-post text | Project detected | job descriptions | a post describes a project type (cloud migration, GenAI build, SOC 2 program) | medium |
| Money | Form D filed | SEC EDGAR | a new Form D for a matched company | high |
| Website | Tool detected in page source | company pages | a fingerprinted tool appears or disappears | high |
| Website | Trust or security page appears | company pages | `/security`, `/trust` or an equivalent page is new | high |
| Website | Pricing page changed | company pages | content hash of the pricing page changes and an enterprise tier or contact-sales path appears | medium |
| Website | Yes/no page check | company pages + LLM | a niche-defined question about a page flips to yes | medium |

**How job text is read:** a technology dictionary match runs first. An LLM handles function
classification of titles that rules miss, project detection and need extraction, with
structured output and results cached by content hash (the graphld pattern).

**Website fetching:** homepage, pricing, security or trust, and customers pages, once a week.
Tool detection uses a small fingerprint table maintained in the engine repo, seeded with the
competitor and complementary tools each niche names. No third-party fingerprint database is
copied in, which keeps licensing simple if the engine is open-sourced.

### 6.2 Later

Customer logos on case study pages, Product Hunt and Hacker News mentions, launches and
integrations, state WARN layoff notices, federal awards and solicitations, status page
incidents, GitHub organization activity.

### 6.3 Deliberately not tracked

Website visitor identification, co-op or bidstream intent, G2 buyer intent, named people and
their job changes, LinkedIn scraping or engagement, anything behind a login. All of it is
either not public or is someone else's data.

## 7. Niche configs

A niche is a versioned file in the engine repo. Only generic market categories are allowed.
Client-specific work from Aditya's previous agency (named competitor lists, "ecosystem of"
pages, proposals, customer lists) never becomes a niche.

```ts
interface NicheConfig {
  id: string;                    // "soc2-compliance"
  name: string;                  // "SOC 2 / compliance automation"
  description: string;           // one line shown on the niche tab
  buyer: {
    employees: [number, number]; // e.g. [20, 1000]
    industries?: string[];
    regions?: string[];
  };
  talkTo: string;                // "Head of Security, or the CTO under 100 people"
  sellers: { text: RegExp; tags: string[] }; // YC one-liner or tags that mark a vendor in this category
  openRoles: Array<{ key: string; min: number }>; // readings, e.g. { key: "fn:security", min: 1 }
  needMeaning: string;           // what a need term means here, for the model reading job-post context
  exclude: { competitorOnSite: boolean; competitorInJobs: boolean };
  signals: Array<{ type: SignalType; weight: number; params?: Record<string, unknown> }>;
  needTerms: string[];           // for need keywords
  competitors: string[];         // tools that mean "already bought"
  complements: string[];         // tools that raise fit
  pageChecks: Array<{ page: 'home' | 'pricing' | 'security' | 'customers'; question: string }>;
  excludeIfCompetitorDetected: boolean;
  vendors: string[];             // vendor domains, for the heat score
}
```

**Starting configs** (used to build and test the engine; the heat score decides the launch set):

| Niche | Key buying signals | Excluded when | Talk to |
|---|---|---|---|
| SOC 2 / compliance automation | first security or compliance hire · need terms "SOC 2", "ISO 27001", "security questionnaire" · first enterprise sales role · Form D · trust page appears | a compliance-automation badge or tool is already detected | Head of Security, or the CTO under 100 people |
| Observability | first SRE or platform hire · engineering surge · adoption of or churn from monitoring tools in job posts · Form D | never: a team already paying for monitoring is a buyer of the category and a displacement target | VP Engineering, Head of Platform |
| CTV / programmatic (DSPs) | performance or programmatic marketing hires · need terms "CTV", "programmatic", "streaming ads" · marketing surge · Form D · ad pixels detected | a competing DSP pixel detected and no churn signal | Head of Growth, VP Performance Marketing |

**Niche heat score (vendor side, private):** for each candidate niche, from its `vendors` list:
vendors with a Form D in the last 12 months, vendors with open GTM roles now, and the size of
the buyer pool with at least one signal this week. Each metric is ranked across candidate
niches and the ranks are averaged. The engine suggests the top 3 to 4 each month; Aditya picks.

## 8. Scoring

All numbers below are priors, stored in a versioned scoring config and recorded on every
weekly file, the same discipline as graphld's `scoring.toml`.

For each company that passes a niche's buyer filter and exclusions:

```
event weight   = niche weight for the signal type
               x confidence factor   (high 1.0, medium 0.7, low 0.4)
               x age decay           (0 to 14 days 1.0, 15 to 45 days 0.7, 46 to 90 days 0.4, older 0)

raw score      = sum of event weights
               x stacking factor     (signals from 2 distinct groups within 30 days 1.25,
                                      3 or more groups 1.5, else 1.0)

display score  = percentile of raw score among that niche's scored companies this week
bands          = 90+ very strong, 75+ strong, 50+ medium, below 50 not shown
```

- **Revised 2026-09-14 (scoring 2026-09-14.2): agreement compounds.** Four independent sources:
  job boards (hiring and job-post text together), the company's own LinkedIn posts, its website,
  SEC filings. Within a source, signals count 1, 0.5, then 0.25 each. Across sources, the
  multiplier is 1 + 0.6 per extra source with timing evidence in 30 days, + 0.3 per fit-only
  source. Bands need breadth: very strong = percentile 75+ and 3 sources, strong = 50+ and 2
  sources, medium = 50+. This replaces the 1.25/1.5 stacking factor above.
- **Exclusions remove a company outright** rather than subtracting points.
- **A vendor in the category is never its buyer.** Companies on the niche's vendor list, or whose
  YC one-liner or tags match the niche's `sellers`, are skipped before scoring.
- **Negative weights are allowed** for signals that argue against buying.
- **A company needs at least one high or medium confidence timing signal** to be listed. Fit-only
  readings (tools in use) do not count towards this.
- **Top 10 per niche** by raw score, ties broken by the most recent event.
- **A niche can show fewer than 10.** When fewer companies clear the band floor or the
  confidence rule, the page shows what qualifies rather than padding the list. Early weeks will
  run thin, because "first ever" and baseline signals stay low confidence until history builds.

**Why now and opener** are written by an LLM from that card's events only, with structured
output. Each must reference at least one of the card's signals, and a post-check rejects any
text that names a person, states certainty, or contains an em dash.

## 9. Weekly file contract

`clay-portfolio/content/signals/<ISO week>.json`, for example `2026-W38.json`. Its URL is the same week in
lower case: `/signals/2026-w38`.

```ts
interface SignalsWeek {
  version: 1;
  week: string;              // "2026-W38"
  generatedAt: string;       // ISO 8601
  engineVersion: string;
  scoringVersion: string;
  sample: boolean;           // true only for the hand-written fixture used before real data
  signalOfTheWeek: { nicheId: string; domain: string; headline: string; body: string } | null;
  niches: Array<{
    id: string;
    name: string;
    description: string;
    talkTo: string;
    companies: Array<{
      rank: number;
      domain: string;
      name: string;
      score: number;
      band: 'very strong' | 'strong' | 'medium';
      reviewed: boolean;
      whyNow: string;
      opener: string;
      signals: Array<{
        type: string;
        label: string;       // "First security engineer role"
        firedAt: string;
        confidence: 'high' | 'medium' | 'low';
        evidence: Array<{ url: string; title: string; seenAt: string }>;
      }>;
    }>;
  }>;
}
```

The file holds company-level data only. It never contains the vendor side, the heat score or
the private lens. A test in the portfolio repo fails the build if a weekly file contains
fields outside this contract.

## 10. Site

Built in this repo, following the blog's patterns and the blueprint aesthetic (existing tokens,
Space Grotesk, no em dashes).

| Route | What it shows |
|---|---|
| `/signals` | the latest week |
| `/signals/[week]` | one week: signal of the week, niche tabs, company cards |
| `/signals/companies/[domain]` | every week a company appeared, with its signals over time |
| `/signals/how-it-works` | sources, the event model, scoring, precision numbers with sample sizes and dates, known biases |
| `/signals/request` + `POST /api/signals/request` | request a company: company domain, requester email, optional note |

- **Data access:** `lib/signals.ts` reads and validates weekly files, and builds the company
  index across all weeks at build time.
- **Archive search:** a client-side filter over the company index, no server.
- **Share images:** `opengraph-image` routes for week and company pages.
- **Nav:** a "Signals" link is added.
- **Request handling:** posts to a Slack incoming webhook when `SIGNALS_REQUEST_WEBHOOK` is
  set. Without it (localhost), requests append to a gitignored local file. A webhook is
  required before any deploy.
- **Sample banner:** while `sample` is true, every page shows a clear "sample data" banner.

## 11. Precision and scorecard

**Precision (phase 1, before anything is public):** a labelling CLI samples up to 50 fired
events per signal type into a CSV. Aditya marks each correct or incorrect against the
evidence. The engine computes precision with a 95% interval.
- A signal type needs at least 30 labels before it can appear on a public card.
- A signal type below 70% precision is stored but hidden from public cards.
- How-it-works shows every signal type's precision, sample size and label date.

**Scorecard (phase 3):** every listed company is rechecked at 30, 60 and 90 days against the
outcome its signals predicted.

| Signal | Counts as a hit when |
|---|---|
| First role in a function | the role closes, or more roles open in that function, within 60 days |
| Hiring surge | the higher level holds at 30 days |
| Technology adoption | the tool is still mentioned, or is detected on the site, at 90 days |
| Form D filed | hiring rises within 90 days |
| Trust page appears | a security role or compliance tool is detected within 90 days |

Hit rates are published per signal type and per niche, including the misses.

## 12. Ground rules

- Public data only. Company level only. No named people anywhere.
- No logged-in scraping. Respect `robots.txt`. Per-host rate limits, and a user agent that
  names the project and a contact email.
- SEC EDGAR fair access: a declared user agent with a contact email, at most 10 requests per
  second.
- No client-specific niches from previous agency work.
- Negative signals (role closed, layoffs later) can shape scores but are never featured in the
  signal of the week or in posts.
- Scores are described as "signals worth a look" until the scorecard has results.
- No em dashes in any generated or written text.

## 13. Setup checklist

| Item | Needed for | Status |
|---|---|---|
| Contact email for the SEC and crawler user agents | Form D and website collection | ask Aditya |
| LLM access: reuse the existing Azure OpenAI deployment from graphld | title classification, need extraction, why now | confirm |
| Slack incoming webhook | request form outside localhost | optional until deploy |
| GitHub repo for the engine, and a token for scheduled runs | open-sourcing and automation | deferred |

## 14. Testing and verification

- **Engine unit tests:** transition detection, baseline surge maths, confidence tiers, decay,
  stacking, exclusions and percentile ranking, all as pure functions over fixtures.
- **Purity guard:** scoring code cannot import collectors, touch the network, or read the
  clock except through an injected `now`, enforced by a test (the graphld rule).
- **Collector tests:** recorded ATS, EDGAR and page responses as fixtures, including failure
  shapes.
- **Contract test:** every weekly file validates against the zod schema from section 9, in
  both repos.
- **Site verification on localhost:** every route renders, at 1440 and 390 wide, in light and
  dark, with no horizontal overflow, before each milestone is called done.

## 15. Build order for phase 1

Each milestone ends in something visible or runnable, committed locally.

1. **Site on sample data.** `/signals`, a week page, company cards, a company page, a
   how-it-works stub and the nav link, rendering a hand-written sample week under the sample
   banner. Visible on localhost first.
2. **Engine skeleton.** Repo, SQLite store, snapshot model, company universe from the YC
   directory and board discovery, and the Greenhouse, Lever, Ashby and Workable collectors.
3. **Hiring signals.** Function classification, transition detection, baseline surge, GTM and
   leadership postings, new locations, closed roles.
4. **Job-post text signals.** Technology adoption and churn, need keywords with tiers, project
   detection.
5. **Money and website signals.** Form D collection and matching, page fetching, tool
   fingerprints, trust and pricing changes, yes/no page checks.
6. **Niches and scoring.** The three starting configs, scoring, why now and opener, and the
   weekly export. A real week renders on localhost and the sample banner goes away.
7. **Proof and private side.** Labelling CLI and precision on how-it-works, the private
   GTM-hiring lens and niche heat score, local only.
8. **Reach.** Request-a-company form, share images, signal of the week.

## 16. Open questions

- Which email goes in the SEC and crawler user agents.
- Whether the engine repo is named `signal-engine`, and when it becomes public.
- The launch niche set, decided by the heat score once milestone 7 runs.
