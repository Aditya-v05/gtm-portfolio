import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { getAllPosts, formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing - Aditya Venkatesan",
  description: "Notes on building GTM systems that run themselves.",
};

export default function WritingIndex() {
  const posts = getAllPosts();

  return (
    <>
      <SiteNav variant="page" />
      <main className="page page--sub">
        {/* the archive court of the same city, above the writing */}
        <div className="vignette vignette--page" data-district="sift" data-fade="120,120,60,0" aria-hidden="true" />
        <section className="panel">
          <header className="panel__head">
            <p className="kicker">Writing</p>
            <h1 className="panel__title">The thinking behind the things I build</h1>
          </header>

          {posts.length === 0 ? (
            <p className="empty">Nothing written yet. Check back soon.</p>
          ) : (
            <ol className="posts">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link className="postrow" href={`/writing/${post.slug}`}>
                    <span className="postrow__thumb" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.cover} alt="" />
                    </span>
                    <span className="postrow__main">
                      <time className="postrow__date" dateTime={post.date}>
                        {formatDate(post.date)}
                      </time>
                      <span className="postrow__title">{post.title}</span>
                      <span className="postrow__summary">{post.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
        <div className="vista vista--end" aria-hidden="true" />
      </main>
    </>
  );
}
