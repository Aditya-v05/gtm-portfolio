import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import SiteNav from "@/components/SiteNav";
import Sheet from "@/components/notebook/Sheet";
import Taped from "@/components/notebook/Taped";
import Hand from "@/components/notebook/Hand";
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
    title: `${post.title} - Aditya's idea dump`,
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
      <main className="notebook notebook--page">
        <Sheet paper={1} className="post" label={post.title}>
          <Link className="post__back" href="/writing">
            <Hand rush>back to writing</Hand>
          </Link>
          <header className="post__head">
            <time className="post__date" dateTime={post.date}>
              {formatDate(post.date)}
            </time>
            <h1 className="post__title">{post.title}</h1>
            {post.subtitle && <p className="post__sub">{post.subtitle}</p>}
          </header>
          <Taped seed={`cover-${post.slug}`} className="post__cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover} alt={post.title} />
          </Taped>
          <div className="prose">{content}</div>
        </Sheet>
      </main>
    </>
  );
}
