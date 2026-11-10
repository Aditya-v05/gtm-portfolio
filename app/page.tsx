import SiteNav from "@/components/SiteNav";
import NavHeightVar from "@/components/NavHeightVar";
import EvidenceZoom from "@/components/EvidenceZoom";
import Cover from "@/components/notebook/Cover";
import Sheet from "@/components/notebook/Sheet";
import Entry from "@/components/notebook/Entry";
import Taped from "@/components/notebook/Taped";
import Hand from "@/components/notebook/Hand";
import Doodle from "@/components/notebook/Doodle";
import D20 from "@/components/notebook/D20";
import { Underline, Circle, Arrow } from "@/components/notebook/marks";

const CLIENTS = ["Brex", "Rho", "Peec AI", "Warp", "Hyperbound", "Qashio"];

function CoverLabel() {
  return (
    <>
      <div className="cover__label">
        <h1 className="cover__title">
          <Underline double seed="cover-title">
            <Hand>Aditya&apos;s idea dump</Hand>
          </Underline>
        </h1>
        <Hand rush className="cover__sub">
          GTM engineer
        </Hand>
      </div>
      <D20 className="cover__die" size={92} />
      <Hand rush className="cover__hint">
        scroll to open
      </Hand>
    </>
  );
}

export default function Home() {
  return (
    <>
      <NavHeightVar />
      <EvidenceZoom />
      <SiteNav variant="home" />

      <main className="notebook">
        <Cover cover={<CoverLabel />}>
          {/* the first inside page: who this is */}
          <div id="about" className="hi">
            <Hand as="h2" className="hi__title">
              hi, i&apos;m Aditya
            </Hand>
            <p className="hi__line">
              <Hand>I build GTM systems that</Hand>{" "}
              <Underline seed="hi-run">
                <Hand>run themselves.</Hand>
              </Underline>
            </p>
            <p className="hi__body">
              Mostly for the physical world: robotics, manufacturing and automation. That&apos;s a
              market where the data layer doesn&apos;t exist until you build it, so I build it. Signal
              intelligence, enrichment, classification and live outbound, each one running on its
              own. Every system in here comes with a real artifact: a log, a verdict, an export.
            </p>
            <p className="hi__was">
              <a href="https://rellingsystems.com" target="_blank" rel="noreferrer">
                <Hand>ex-Founding GTM Engineer @ Relling, YC S25</Hand>
              </a>
            </p>
            <p className="hi__with">
              <Hand rush className="hi__with-k">
                systems shipped for
              </Hand>{" "}
              {CLIENTS.map((c, i) => (
                <span key={c} className="hi__client">
                  <Hand>{c}</Hand>
                  {i < CLIENTS.length - 1 ? <span className="hi__comma">,</span> : null}{" "}
                </span>
              ))}
            </p>
            {/* personal notes (books, games, music, a note to founders) go here later */}
          </div>
        </Cover>

        <Sheet id="work" paper={2} label="The good stuff">
          <header className="sheet__head">
            <Hand as="h2" className="sheet__title">
              the good stuff
            </Hand>
            <Hand rush className="sheet__aside">
              four things i&apos;d show a founder first
            </Hand>
          </header>

          <Entry
            id="sift"
            margin={
              <>
                <span className="entry__no">i)</span>
                <Circle seed="sift-circle">
                  <Hand as="h3" className="entry__name">
                    Sift
                  </Hand>
                </Circle>
                <Hand rush className="entry__kind">
                  chrome extension
                </Hand>
                <span className="entry__status">shipped · v0.3.1 · open source</span>
              </>
            }
          >
            <Hand as="p" className="entry__lede">
              open a company&apos;s site, know if it fits and who to email.
            </Hand>
            <p>
              Click the icon on any company&apos;s website and a side panel answers three questions.{" "}
              <b>Does it fit</b> your ICP, with every requirement marked met, near miss, unsure or not
              met. <b>Why now</b>, from hiring, headcount growth, funding and what their own site
              says. And <b>who to email</b>, ranked, with the address one click away. It also reads
              LinkedIn profiles from the URL alone, keeps a ranked account list you can export to CSV,
              and finds lookalikes of your best accounts.
            </p>
            <p>
              There&apos;s <b>no backend</b>, on purpose. The browser talks straight to Apollo and
              TypeSafe, so there&apos;s no server, no account and no analytics, and your keys never
              leave local storage. Code works out every signal from the data with explicit
              thresholds, and the model only judges relevance. That&apos;s why every line on the card
              carries its own source link.
            </p>

            <ul className="notes">
              <li>
                <Underline seed="sift-byok">
                  <Hand>BYOK</Hand>
                </Underline>{" "}
                <span>your keys, no server</span>
              </li>
              <li>
                <Underline seed="sift-mit">
                  <Hand>MIT</Hand>
                </Underline>{" "}
                <span>open source</span>
              </li>
              <li>
                <Underline seed="sift-free">
                  <Hand>free</Hand>
                </Underline>{" "}
                <span>to run</span>
              </li>
            </ul>

            <div className="evidence">
              <Doodle name="skeletron" width={170} className="evidence__doodle evidence__doodle--tl" rotate={-6} />
              <Taped seed="sift-video" caption="a real lookup: fit, why now and the ranked contacts, in the shipped extension">
                <video src="/sift-demo.mp4" poster="/sift-fit.png" controls preload="none" playsInline />
              </Taped>
              <Taped seed="sift-fit" caption="the fit card: every requirement shown, with its reason">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sift-fit.png" alt="Sift's side panel scoring a company against the ICP, with each requirement marked" />
              </Taped>
            </div>

            <div className="install">
              <Hand rush className="install__note">
                this one you can actually install
              </Hand>
              <Arrow width={90} height={40} seed="sift-install" bend={0.6} className="install__arrow" />
              <span className="install__links">
                <a href="https://github.com/Aditya-v05/sift">github.com/Aditya-v05/sift</a>
                <a href="https://sift-through.vercel.app">sift-through.vercel.app</a>
              </span>
            </div>

            <p className="built-with">
              <Hand rush>built with</Hand> WXT · React 19 · TypeScript · Vitest · Apollo · treg · Jev
              (TypeSafe) · Manifest V3
            </p>
          </Entry>
        </Sheet>
      </main>
    </>
  );
}
