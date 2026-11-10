import SiteNav from "@/components/SiteNav";
import NavHeightVar from "@/components/NavHeightVar";
import EvidenceZoom from "@/components/EvidenceZoom";
import World from "@/components/world/World";
import DotName from "@/components/DotName";
import GradientASCII from "@/components/GradientASCII";
import Pipeline from "@/components/Pipeline";
import Runnel from "@/components/Runnel";

const CLIENTS = ["Brex", "Rho", "Peec AI", "Warp", "Hyperbound", "Qashio"];

// The homepage has a rhythm. The world shows through windows: the hero, a
// small vignette at the head of each project, the human, the ending. Between
// them the page is plain ivory, where the work is, and a thin runnel of water
// carries the aqueduct's water from one window down to the next.
export default function Home() {
  return (
    <>
      <World />
      <NavHeightVar />
      <EvidenceZoom />
      <SiteNav variant="home" />

      <main className="page">
        {/* 01 THE WORLD: the name, and the city below it. Nothing else. */}
        <section className="hero" data-district="hero" data-fade="0,0,140,0" aria-label="Aditya Venkatesan">
          <div className="hero__sky" aria-hidden="true">
            <GradientASCII
              colors={["#dce4f5", "#c5d3f0", "#9fb5e6", "#7a96d8"]}
              shape="horizon"
              characters=" .·:-=+"
              cellSize={14}
              density={0.45}
              glyphOpacity={0.5}
              gradientOpacity={0.18}
              glow={0}
              grain={0}
              flicker={0.2}
              flow={0.6}
              speed={0.45}
              lightMode
              clickEffect="none"
              fontFamily='"JetBrains Mono", ui-monospace, monospace'
              dpr={2}
              style={undefined}
            />
          </div>
          <div className="hero__in">
            <h1 className="hero__name">
              <DotName>Aditya Venkatesan</DotName>
            </h1>
          </div>
        </section>

        <Runnel height={120} bend={6} />

        {/* 02 THE ENGINEER: what he builds, in four stages */}
        <section id="about" className="band band--engineer">
          <div className="band__in">
            <p className="kicker">GTM Engineer · Physical AI</p>
            <h2 className="statement">I build machines that find customers.</h2>
            <p className="statement__sub">
              Find demand, qualify it, discover a way in, and automate the rest. Each stage is a system
              I&apos;ve shipped and run, mostly for robotics, manufacturing and automation, where the data
              layer doesn&apos;t exist until you build it.
            </p>
            <Pipeline />
            <div className="creds">
              <a className="was" href="https://rellingsystems.com" target="_blank" rel="noreferrer">
                ex-Founding GTM Engineer @ <b>Relling</b> <span className="yc">YC S25</span>
              </a>
              <p className="creds__clients">
                <span className="label">Systems shipped for</span> {CLIENTS.join(" · ")}
              </p>
            </div>
          </div>
        </section>

        <Runnel height={160} bend={-8} />

        {/* 03 THE WORK: each project as its own spread */}
        <section id="work" className="band band--work">
          <div className="band__in">
            <header className="band__head">
              <p className="kicker">The work</p>
              <h2 className="band__title">Four systems, shown the way they actually look</h2>
            </header>

            <article id="sift" className="spread">
              {/* the archive's fountain court, where the water comes in */}
              <div className="vignette" data-district="sift" data-fade="120,120,70,0" aria-hidden="true" />
              <header className="spread__head">
                <p className="spread__no">Project 02 · ICP fit</p>
                <h3 className="spread__name">Sift</h3>
                <p className="spread__lede">An open-source browser extension that tells you if a company fits, why now, and who to email.</p>
              </header>
              <div className="spread__grid">
                <div className="spread__text">
                  <p>
                    Click the icon on any company&apos;s website and a side panel answers three questions.{" "}
                    <b>Does it fit</b> your ICP, with every requirement marked met, near miss, unsure or not
                    met. <b>Why now</b>, from hiring, headcount growth, funding and what their own site says.
                    And <b>who to email</b>, ranked, with the address one click away. It also reads LinkedIn
                    profiles from the URL alone, keeps a ranked account list you can export to CSV, and finds
                    lookalikes of your best accounts.
                  </p>
                  <p>
                    <b>There is no backend.</b> The browser talks straight to Apollo and TypeSafe, so there
                    is no server, no account and no analytics, and your keys never leave local storage. Code
                    derives every signal from the data with explicit thresholds and the model only judges
                    relevance, so each line on the card carries its own source link.
                  </p>
                  <ul className="metrics">
                    <li><b>BYOK</b> your keys, no server</li>
                    <li><b>MIT</b> open source</li>
                    <li><b>Free</b> to run</li>
                  </ul>
                  <dl className="spread__meta">
                    <div><dt>Type</dt><dd>Chrome extension, Manifest V3</dd></div>
                    <div><dt>Stack</dt><dd>WXT · React 19 · TypeScript · Vitest · Apollo · treg · Jev (TypeSafe)</dd></div>
                    <div><dt>Status</dt><dd><span className="live" aria-hidden="true" /> shipped · v0.3.1 · open source</dd></div>
                  </dl>
                </div>
                <div className="spread__demo">
                  <figure className="browser">
                    <div className="browser__bar" aria-hidden="true">
                      <span /><span /><span />
                      <span className="browser__url">gorgias.com</span>
                    </div>
                    <div className="browser__body" data-zoom>
                      <video src="/sift-demo.mp4" poster="/sift-fit.png" controls preload="none" playsInline />
                    </div>
                    <figcaption>A real lookup: fit, why now, and the ranked contacts, in the shipped extension.</figcaption>
                  </figure>
                  <figure className="shot shot--inset">
                    <div className="shot__frame" data-zoom>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/sift-fit.png" alt="Sift's side panel scoring a company against the ICP, with each requirement marked" />
                    </div>
                    <figcaption>The fit card, with every requirement shown and its reason.</figcaption>
                  </figure>
                </div>
              </div>
              <div className="install">
                <p className="install__k">This one you can install.</p>
                <div className="install__links">
                  <a className="btn" href="https://sift-through.vercel.app">Get Sift <span aria-hidden="true">→</span></a>
                  <a className="btn btn--quiet" href="https://github.com/Aditya-v05/sift">github.com/Aditya-v05/sift</a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <Runnel height={160} bend={8} />

        {/* 04 THE HUMAN: the forum, the Colosseum, the Pantheon and the gods */}
        <section className="scene scene--forum" data-district="forum" data-fade="0,0,90,0" aria-labelledby="outside">
          <div className="scene__in">
            <p className="kicker">Outside of work</p>
            <h2 id="outside" className="scene__title">Books, games, music, and too many roguelike runs.</h2>
          </div>
        </section>

        {/* 05 THE ENDING: the aqueduct again, from below, water still flowing */}
        <section id="contact" className="scene scene--ending" data-district="ending" aria-labelledby="contact-title">
          <div className="scene__in">
            <h2 id="contact-title" className="scene__title scene__title--big">Have an interesting GTM problem?</h2>
            <p className="contact">
              <a className="contact__mail" href="mailto:adityaspark05@gmail.com">adityaspark05@gmail.com</a>
            </p>
            <p className="contact__links">
              <a href="https://github.com/Aditya-v05">GitHub</a>
              <a href="https://www.linkedin.com/in/aditya-venkatesan-26055531b/">LinkedIn</a>
              <a href="/writing">Writing</a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
