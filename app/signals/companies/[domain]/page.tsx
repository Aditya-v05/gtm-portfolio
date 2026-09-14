import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import Brief from "@/components/signals/Brief";
import { Masthead, SampleBanner } from "@/components/signals/Paper";
import { formatWeek, getAllWeeks, getCompany, getCompanyIndex, issueNumber, weekSlug } from "@/lib/signals";

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
  const latest = weeks[0]!;
  const sample = weeks.some((w) => w.sample && company.appearances.some((a) => a.week === w.week));
  const niches = [...new Set(company.appearances.map((a) => a.nicheName))];

  return (
    <>
      <SiteNav variant="page" />
      <main className="paper">
        {sample && <SampleBanner />}
        <Masthead week={latest} compact />

        <article className="file">
          <p className="lead__kicker">Company file</p>
          <h1 className="lead__hed">{company.name}</h1>
          <p className="lead__deck">
            {company.domain} appeared in {company.appearances.length}{" "}
            {company.appearances.length === 1 ? "issue" : "issues"}, as a potential customer for {niches.join(" and ")}.
          </p>

          {company.appearances.map((a) => {
            const week = weeks.find((w) => w.week === a.week)!;
            const niche = week.niches.find((n) => n.id === a.nicheId)!;
            return (
              <section key={`${a.week}-${a.nicheId}`} className="dispatch">
                <p className="dispatch__line">
                  <Link className="cursor-target" href={`/signals/${weekSlug(a.week)}#${a.nicheId}`}>
                    No. {issueNumber(a.week)} · {formatWeek(a.week)}
                  </Link>
                  <span>{a.nicheName}</span>
                  <span>
                    Rank {a.company.rank} of {niche.companies.length}
                  </span>
                </p>
                <ol className="desk__briefs desk__briefs--single">
                  <Brief company={a.company} talkTo={niche.talkTo} open showFileLink={false} />
                </ol>
              </section>
            );
          })}
        </article>
      </main>
    </>
  );
}
