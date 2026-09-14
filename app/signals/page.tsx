import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import { FrontPage } from "@/components/signals/Paper";
import Turn from "@/components/signals/Turn";
import { getAllWeeks } from "@/lib/signals";

export const metadata: Metadata = {
  title: "Signals - Aditya",
  description:
    "Every week, the companies most likely to buy from a few hot software categories, with the public evidence behind each one.",
};

export default function SignalsLatest() {
  const weeks = getAllWeeks();
  const latest = weeks[0];

  return (
    <>
      <SiteNav variant="page" />
      {latest ? (
        <Turn key="front" page={1}>
          <FrontPage week={latest} weeks={weeks} />
        </Turn>
      ) : (
        <main className="sig">
          <header className="sig__head">
            <h1 className="sig__title">Signals</h1>
            <p className="sig__lede">The first weekly list is on its way.</p>
          </header>
        </main>
      )}
    </>
  );
}
