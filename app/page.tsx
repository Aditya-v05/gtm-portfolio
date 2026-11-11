import SiteNav from "@/components/SiteNav";
import NavHeightVar from "@/components/NavHeightVar";
import EvidenceZoom from "@/components/EvidenceZoom";
import World from "@/components/world/World";
import PixelName from "@/components/PixelName";
import GradientASCII from "@/components/GradientASCII";
import ClientThreads from "@/components/ClientThreads";
import About from "@/components/About";
import Deck from "@/components/deck/Deck";
import Fountain from "@/components/Fountain";
import Stream from "@/components/Stream";
import fs from "node:fs";
import path from "node:path";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";

// which gods already have card art in public/cards
function cardArt(): string[] {
  try {
    return fs
      .readdirSync(path.join(process.cwd(), "public", "cards"))
      .filter((f) => f.endsWith(".png") && f !== "back.png")
      .map((f) => f.replace(/\.png$/, ""));
  } catch {
    return [];
  }
}

// footer links, each with a small pixel icon drawn on a 12px grid
const CLIENTS = ["Brex", "Rho", "Peec AI", "Warp", "Hyperbound", "Qashio"];

// The homepage has a rhythm: the world (the hero), the engineer (what he
// builds), the work (a deck of red-figure cards, one Olympian per system),
// and the ending (the harbour). The world shows through windows in the page.
export default function Home() {
  return (
    <>
      <Loader />
      <World />
      <Stream />
      <NavHeightVar />
      <EvidenceZoom />
      <SiteNav variant="home" />

      <main id="top" className="page">
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
              <PixelName>Aditya Venkatesan</PixelName>
            </h1>
            <p className="hero__role">GTM Engineer</p>
          </div>
        </section>

        <About />

        {/* 02 THE ENGINEER: what he builds */}
        <section className="band band--engineer">
          <div className="band__in">
            <h2 className="statement">I build machines that find customers.</h2>
            <p className="statement__sub">
              Find demand, qualify it, discover a way in, and automate the rest. Each stage is a system
              I&apos;ve shipped and run, mostly for robotics, manufacturing and automation, where the data
              layer doesn&apos;t exist until you build it.
            </p>
            <div className="creds">
              {/* experience, carved in stone: newest first */}
              <div className="stone xp">
                <div className="xp__top">
                  <span className="stone__k">Experience</span>
                  <a className="xp__open" href="#contact">
                    <span className="xp__dot" aria-hidden="true" />
                    Open to new roles
                  </a>
                </div>
                <ol className="xp__list">
                  <li>
                    <span className="xp__when">Jun 2026 - Aug 2026</span>
                    <span className="xp__what">
                      <span className="xp__role">Founding GTM Engineer</span>
                      <span className="xp__org">
                        <a href="https://rellingsystems.com" target="_blank" rel="noreferrer">
                          Relling
                        </a>{" "}
                        <span className="stone__yc">YC S25</span> · full-time · San Francisco Bay Area
                      </span>
                      <span className="xp__org">Started as GTM Engineer Intern, remote</span>
                    </span>
                  </li>
                  <li>
                    <span className="xp__when">Dec 2025 - Jun 2026</span>
                    <span className="xp__what">
                      <span className="xp__role">GTM Engineer</span>
                      <span className="xp__org">
                        <a href="https://gethuntd.com" target="_blank" rel="noreferrer">
                          Huntd
                        </a>{" "}
                        · internship · Chennai, on-site
                      </span>
                    </span>
                  </li>
                </ol>
              </div>
            </div>
            <Fountain />
            {/* one clay plaque across the whole page; the water falls through a slot in it */}
            <div className="clay">
              <div className="clay__in">
                <span className="clay__k">Systems shipped for</span>
                <ul className="clay__names">
                  {CLIENTS.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PROOF: what clients said when the work landed */}
        <section className="band band--proof">
          <div className="band__in">
            <header className="band__head">
              <p className="kicker">In their words</p>
              <h2 className="band__title">What clients said</h2>
              <p className="band__sub">Three threads from shared Slack channels, recreated with private details masked.</p>
            </header>
            <ClientThreads />
          </div>
        </section>

        {/* 03 THE WORK: twelve systems, twelve Olympians. Pick a card. */}
        <section id="work" className="band band--work">
          <div className="band__in">
            <header className="band__head">
              <p className="kicker">The work</p>
              <h2 className="band__title">Selected work</h2>
              <p className="band__sub">
                Four systems I&apos;d show first. Click a card for the details. The other eight are in the
                deck.
              </p>
            </header>
            <Deck art={cardArt()} />
          </div>
        </section>

        {/* 05 THE ENDING: the aqueduct again, from below, water still flowing */}
        {/* 04 THE ENDING: a whole page of sea */}
        <Footer />
      </main>
    </>
  );
}
