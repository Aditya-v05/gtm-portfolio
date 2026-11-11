import Courtyard from "./Courtyard";

// About: a few plain sentences, and the corner of the city he works in. The
// words start top left; the room grows out of the bottom right and runs off
// the page. One composition, no frame round either half.
export default function About() {
  return (
    <section id="about" className="band band--about">
      <div className="band__in about">
        <div className="about__text">
          <p className="stone about__tag">Field notes</p>
          <h2 className="about__hey">Hey, I&apos;m Aditya.</h2>
          <p className="about__lead">
            I&apos;m a GTM engineer. I like building systems that find customers, uncover weird buying
            signals, and save people from spending their lives copying spreadsheets.
          </p>
          <p>Before this, I built GTM infrastructure at Relling and Huntd.</p>
          <p>
            Outside work, I&apos;m usually playing a roguelike, reading something by Jules Verne,
            listening to hip-hop, or convincing myself that another three-hour research rabbit hole is
            completely necessary.
          </p>
          <p className="stone about__status">
            <span>Current status</span>
            Probably following up.
          </p>
          <p className="about__hint">Poke around. Some of it moves.</p>
        </div>
        <Courtyard />
      </div>
    </section>
  );
}
