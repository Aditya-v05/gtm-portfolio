import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import CompanyCard from "@/components/signals/CompanyCard";
import { SampleBanner } from "@/components/signals/WeekView";
import { formatWeek, getAllWeeks, getCompany, getCompanyIndex, weekSlug } from "@/lib/signals";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getCompanyIndex().keys()].map((domain) => ({ domain }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const c = getCompany(domain);
  if (!c) return {};
  return {
    title: `${c.name} - Signals - Aditya`,
    description: `Every week ${c.name} appeared on Signals, and the public evidence behind it.`,
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const company = getCompany(domain);
  if (!company) notFound();

  const weeks = getAllWeeks();
  const sample = weeks.some((w) => w.sample && company.appearances.some((a) => a.week === w.week));
  const niches = [...new Set(company.appearances.map((a) => a.nicheName))];

  return (
    <>
      <SiteNav variant="page" />
      <main className="sig">
        {sample && <SampleBanner />}
        <header className="sig__head">
          <p className="sig__eyebrow">
            <Link className="cursor-target" href="/signals">
              Signals
            </Link>{" "}
            · company
          </p>
          <h1 className="sig__title">{company.name}</h1>
          <p className="sig__lede">
            {company.domain} · appeared in {company.appearances.length}{" "}
            {company.appearances.length === 1 ? "week" : "weeks"}, as a potential customer for{" "}
            {niches.join(" and ")}.
          </p>
        </header>

        <ol className="sighist">
          {company.appearances.map((a) => {
            const week = weeks.find((w) => w.week === a.week)!;
            const niche = week.niches.find((n) => n.id === a.nicheId)!;
            return (
              <li key={`${a.week}-${a.nicheId}`} className="sighist__item">
                <p className="sighist__k">
                  <Link className="cursor-target" href={`/signals/${weekSlug(a.week)}`}>
                    {a.week}
                  </Link>{" "}
                  · {formatWeek(a.week)} · {a.nicheName} · rank {a.company.rank}
                </p>
                <CompanyCard company={a.company} talkTo={niche.talkTo} />
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
