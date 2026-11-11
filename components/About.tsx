"use client";

import { useState } from "react";
import Ivy from "./Ivy";

// About: a small classical courtyard. Words on the left; on the right a
// stone-backed display with the user's pixel bust in an arched niche, an
// engraved pedestal, and a few things from his room scattered round it.
// The bust blinks now and then, and the d20 can be rolled.
export default function About() {
  const [roll, setRoll] = useState<number | null>(null);
  const [spin, setSpin] = useState(0);
  const throwDie = () => {
    setSpin((n) => n + 1);
    setRoll(null);
    setTimeout(() => setRoll(1 + Math.floor(Math.random() * 20)), 480);
  };
  /* eslint-disable @next/next/no-img-element */
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

        <div className="shrine">
          <Ivy seed={5} className="shrine__ivy" />
          <div className="shrine__niche">
            <div className="bust">
              <img src="/art/bust.png" alt="A pixel-art marble bust of Aditya, smiling, with curly hair and glasses" width={1000} height={1400} />
              <span className="bust__lid bust__lid--l" aria-hidden="true" />
              <span className="bust__lid bust__lid--r" aria-hidden="true" />
            </div>
          </div>
          <p className="stone shrine__plaque">
            <span className="shrine__name">Aditya, first of his name</span>
            <span className="shrine__motto">He came. He saw. He followed up.</span>
          </p>

          <img className="thing thing--note" src="/art/note.png" alt="" />
          <img className="thing thing--watcher" src="/art/watcher.png" alt="" />
          <img className="thing thing--dragon" src="/art/dragon.png" alt="" />
          <img className="thing thing--phones" src="/art/headphones.png" alt="" />
          <button className="thing thing--d20" onClick={throwDie} aria-label="Roll the d20">
            <img key={spin} className={spin ? "is-rolling" : ""} src="/art/d20.png" alt="" />
            {roll !== null && (
              <span className={`thing__roll${roll === 20 ? " is-crit" : ""}`} aria-live="polite">
                {roll === 20 ? "20! crit" : roll === 1 ? "1. ouch" : roll}
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
