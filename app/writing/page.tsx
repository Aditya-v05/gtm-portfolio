import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import Sheet from "@/components/notebook/Sheet";
import Hand from "@/components/notebook/Hand";
import { Underline } from "@/components/notebook/marks";
import { getAllPosts, formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing - Aditya's idea dump",
  description: "Notes on building GTM systems that run themselves.",
};

// The notebook's table of contents: one line per piece, newest first.
export default function WritingIndex() {
  const posts = getAllPosts();

  return (
    <>
      <SiteNav variant="page" />
      <main className="notebook notebook--page">
        <Sheet paper={3} label="Writing">
          <header className="sheet__head">
            <Hand as="h1" className="sheet__title">
              writing
            </Hand>
            <Hand rush className="sheet__aside">
              the thinking behind the things i build
            </Hand>
          </header>

          {posts.length === 0 ? (
            <p className="toc__empty">Nothing written yet. Check back soon.</p>
          ) : (
            <ol className="toc">
              {posts.map((post, i) => (
                <li key={post.slug} className="toc__item">
                  <Link className="toc__link" href={`/writing/${post.slug}`}>
                    <span className="toc__no">{["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"][i] ?? i + 1})</span>
                    <span className="toc__main">
                      <Underline seed={`toc-${post.slug}`}>
                        <Hand className="toc__title">{post.title}</Hand>
                      </Underline>
                      <span className="toc__summary">{post.summary}</span>
                      <time className="toc__date" dateTime={post.date}>
                        {formatDate(post.date)}
                      </time>
                    </span>
                    <span className="toc__thumb" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.cover} alt="" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Sheet>
      </main>
    </>
  );
}
