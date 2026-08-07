import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SpotlightCard from "@/components/SpotlightCard";
import { getAllPosts, formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog - Aditya",
  description: "Notes on building GTM systems that run themselves.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <>
      <SiteNav variant="page" />
      <main className="blog-index">
        <header className="blog-index__head">
          <h1>Blog</h1>
          <p>Notes on building GTM systems that run themselves.</p>
        </header>

        {posts.length === 0 ? (
          <p className="blog-index__empty">No posts yet - check back soon.</p>
        ) : (
          <ul className="postcards">
            {posts.map((post) => (
              <li key={post.slug} className="postcard">
                <SpotlightCard
                  className="cursor-target"
                  spotlightColor="rgba(99, 174, 242, 0.12)"
                >
                  <Link className="postcard__link" href={`/blog/${post.slug}`}>
                    <span className="postcard__thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.cover} alt="" />
                    </span>
                    <span className="postcard__body">
                      <time className="postcard__date" dateTime={post.date}>
                        {formatDate(post.date)}
                      </time>
                      <span className="postcard__title">{post.title}</span>
                      <span className="postcard__summary">{post.summary}</span>
                    </span>
                  </Link>
                </SpotlightCard>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
