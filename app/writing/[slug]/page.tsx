import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import SiteNav from "@/components/SiteNav";
import Link from "next/link";
import { getAllSlugs, getPostBySlug, formatDate } from "@/lib/posts";

// Only prerender known slugs; unknown slugs 404 instead of rendering on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} - Aditya Venkatesan`,
    alternates: { canonical: `/writing/${post.slug}` },
    description: post.summary,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      images: [{ url: post.cover }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [post.cover],
    },
  };
}

export default async function WritingPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { content } = await compileMDX({ source: post.content });

  return (
    <>
      <SiteNav variant="page" />
      <main className="page page--sub">
        {/* the archive court of the same city, above the writing */}
        <div className="vignette vignette--page" data-district="sift" data-fade="120,120,60,0" aria-hidden="true" />
        <article className="panel post">
          <Link className="post__back" href="/writing">
            <span aria-hidden="true">←</span> All writing
          </Link>
          <header className="post__head">
            <time className="post__date" dateTime={post.date}>
              {formatDate(post.date)}
            </time>
            <h1 className="post__title">{post.title}</h1>
            {post.subtitle && <p className="post__sub">{post.subtitle}</p>}
          </header>
          <figure className="post__cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover} alt={post.title} />
          </figure>
          <div className="prose">{content}</div>
        </article>
        <div className="vista vista--end" aria-hidden="true" />
      </main>
    </>
  );
}
