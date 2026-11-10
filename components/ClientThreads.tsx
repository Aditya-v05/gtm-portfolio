// Real client conversations, recreated from Slack with names shortened and
// private details masked: Warp, Hyperbound and Peec AI reacting to delivered
// work. Carried over from the original site, word for word.
//
// They hang on the wall of the agora, the Greek marketplace: a stone wall
// with ivy, each letter pinned in its own place and at its own angle.
import Ivy from "./Ivy";

export default function ClientThreads() {
  return (
    <div className="threads agora">
      <Ivy seed={3} className="ivy--l" />
      <Ivy seed={7} className="ivy--r" />
      <Ivy seed={11} className="ivy--m" />
          <div className="threads__grid">
            <div className="exh exh--a">
            <div className="slack">
              <div className="slack__bar">
                <span className="chan"><span className="lk">#</span> huntd-warp</span>
                <span className="ext">2 people from Warp</span>
              </div>
              <div className="slmsg">
                <div className="slav" style={{ background: "#2EB67D" }}>H</div>
                <div>
                  <div className="slhead"><span className="slname">Huntd</span><span className="sltime">5:24 PM</span></div>
                  <div className="sltext">The agent recognises companies using <b>Rippling</b> really well, a big chunk in the 1–100 range. So we can do <b>Rippling, Gusto, Deel</b> &amp; all other PEOs in one place now. Gonna be great!</div>
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
            <div className="exh__note">
              <svg viewBox="0 0 44 30" aria-hidden="true"><path d="M40 27 C28 25 12 20 7 4 M7 4 l-3.5 8 M7 4 l8 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              spotted the PEO pattern unprompted
            </div>
            </div>
          
            <div className="exh exh--b">
            <div className="slack">
              <div className="slack__bar">
                <span className="chan"><span className="lk">#</span> huntd-hyperbound</span>
                <span className="ext">3 people from Hyperbound</span>
              </div>
              <div className="slmsg">
                <div className="slav" style={{ background: "#2EB67D" }}>H</div>
                <div>
                  <div className="slhead"><span className="slname">Huntd</span><span className="sltime">1:57 PM</span></div>
                  <div className="sltext">This contains everything you asked for, <span className="slred" style={{ width: "58px" }}>&nbsp;</span>, the <b>B2B-SaaS</b> and <b>med-device</b> target lists. We can pull a lot more if we loosen the employee-count filter.</div>
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
            <div className="exh__note">
              <svg viewBox="0 0 44 30" aria-hidden="true"><path d="M40 27 C28 25 12 20 7 4 M7 4 l-3.5 8 M7 4 l8 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              two target lists, one thread
            </div>
            </div>
          
            <div className="exh exh--c">
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
            <div className="exh__note">
              <svg viewBox="0 0 44 30" aria-hidden="true"><path d="M40 27 C28 25 12 20 7 4 M7 4 l-3.5 8 M7 4 l8 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              ICP scoped, list prioritised
            </div>
            </div>
          </div>
    </div>
  );
}
