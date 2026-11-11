import Courtyard from "./Courtyard";

// About: who he is on the left, in plain words; what it is like inside his
// head on the right, as a small courtyard to poke around in.
export default function About() {
  return (
    <section id="about" className="band band--about">
      <div className="band__in about">
        <div className="about__text">
          <p className="kicker">About</p>
          <h2 className="band__title">Hi, I&apos;m Aditya.</h2>
          <p className="about__lead">
            I&apos;m a GTM engineer. I build the systems that sit between a market and a sales team: the
            ones that find signals, work out who fits, and get the right message to the right person
            without anyone copying rows between tabs.
          </p>
          <p>
            Most recently that was at Relling, selling automation into robotics and manufacturing, where
            the data you need doesn&apos;t exist until you build it. Before that I built GTM systems at
            Huntd for B2B teams like Brex, Rho, Warp, Hyperbound and Peec AI.
          </p>
          <p>
            Outside of work it&apos;s D&amp;D, Terraria and roguelikes, Dune and Jules Verne, and rap on
            while I build. Most of what I know about systems I learned from games that punish you for
            ignoring them.
          </p>
        </div>

        <Courtyard />
      </div>
    </section>
  );
}
