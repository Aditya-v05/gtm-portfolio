# Blog Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a statically-generated `/blog` to the existing Next.js 15 portfolio where each post is an MDX file whose single `cover` image powers both the link-share (Open Graph) preview and a top-of-post banner.

**Architecture:** Posts are `.mdx` files in `content/posts/` with YAML frontmatter; covers are images in `public/blog/`. A `lib/posts.ts` helper reads/parses/sorts them with `gray-matter`. Two App Router routes (`/blog` index, `/blog/[slug]` post) are prerendered via `generateStaticParams`. `next-mdx-remote/rsc` renders post bodies in Server Components. The homepage nav is extracted into a shared `SiteNav` so a **Blog** link appears everywhere.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, `gray-matter`, `next-mdx-remote`. Path alias `@/*` → repo root. No unit-test framework exists in this repo — verification is `npm run build` (type-check + static-route confirmation) plus the established puppeteer-screenshot + `<head>` inspection loop. That is this project's test harness; do not add a test runner.

---

## File Structure

**Create:**
- `lib/posts.ts` — post data layer: `Post` type, `getAllPosts()`, `getPostBySlug()`, `getAllSlugs()`, `formatDate()`, frontmatter validation.
- `components/SiteNav.tsx` — shared nav with `variant: "home" | "page"`.
- `app/blog/layout.tsx` — mounts ambient FX (`CursorFX`, `Noise`) around all blog pages.
- `app/blog/page.tsx` — blog index (post cards).
- `app/blog/[slug]/page.tsx` — single post + `generateMetadata` + `generateStaticParams`.
- `content/posts/hello.mdx` — sample post.
- `public/blog/hello.png` — placeholder cover image.

**Modify:**
- `app/page.tsx` — replace inline `<nav>…</nav>` with `<SiteNav variant="home" />`.
- `app/layout.tsx` — add `metadataBase` so relative OG image paths resolve to absolute URLs.
- `app/globals.css` — add blog index/card, cover banner, and `.prose` styles.
- `package.json` / `package-lock.json` — add `gray-matter`, `next-mdx-remote`.

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install gray-matter and next-mdx-remote**

Run:
```bash
npm install gray-matter next-mdx-remote
```
If npm errors on React 19 peer ranges, retry once with:
```bash
npm install gray-matter next-mdx-remote --legacy-peer-deps
```
Expected: both appear under `dependencies` in `package.json`.

- [ ] **Step 2: Verify install**

Run: `node -e "require('gray-matter'); require('next-mdx-remote/rsc'); console.log('ok')"`
Expected: prints `ok` (no module-not-found error).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add gray-matter and next-mdx-remote for blog"
```

---

### Task 2: Post data layer (`lib/posts.ts`)

**Files:**
- Create: `lib/posts.ts`

- [ ] **Step 1: Write `lib/posts.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostFrontmatter = {
  title: string;
  date: string; // ISO YYYY-MM-DD
  summary: string;
  cover: string; // absolute path under /public, e.g. /blog/hello.png
};

export type Post = PostFrontmatter & {
  slug: string;
  content: string; // MDX body with frontmatter stripped
};

const REQUIRED: (keyof PostFrontmatter)[] = ["title", "date", "summary", "cover"];

function readPost(slug: string): Post {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  for (const key of REQUIRED) {
    if (!data[key] || typeof data[key] !== "string") {
      throw new Error(
        `Post "${slug}.mdx" is missing required frontmatter field "${key}"`,
      );
    }
  }

  return {
    slug,
    title: data.title,
    date: data.date,
    summary: data.summary,
    cover: data.cover,
    content,
  };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getAllPosts(): Post[] {
  return getAllSlugs()
    .map(readPost)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;
  return readPost(slug);
}

export function formatDate(iso: string): string {
  // Parse as UTC to avoid timezone off-by-one on date-only strings.
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
```

- [ ] **Step 2: Type-check compiles**

Run: `npx tsc --noEmit`
Expected: no errors referencing `lib/posts.ts`. (Pre-existing errors elsewhere, if any, are unrelated — confirm none mention `lib/posts.ts`.)

- [ ] **Step 3: Commit**

```bash
git add lib/posts.ts
git commit -m "Add blog post data layer"
```

---

### Task 3: Sample post + placeholder cover

**Files:**
- Create: `content/posts/hello.mdx`
- Create: `public/blog/hello.png` (copied from an existing image)

- [ ] **Step 1: Create the placeholder cover image**

Run:
```bash
mkdir -p public/blog && cp public/fig-salesnav.png public/blog/hello.png
```
Expected: `public/blog/hello.png` exists. (This is a stand-in; the owner replaces it later.)

- [ ] **Step 2: Write the sample post**

Create `content/posts/hello.mdx`:
```mdx
---
title: "Building GTM systems that run themselves"
date: 2026-06-15
summary: "A first note on why I treat go-to-market like an engineering problem — pipelines, enrichment, and automation that keep working after I close the laptop."
cover: /blog/hello.png
---

This is the first post. Replace it with your own.

## Why write here

Most GTM work is invisible: a scraper that quietly collects leads, an enrichment
step that fills in the gaps, a classifier that decides who's worth a message.
I'll write about how those pieces fit together.

## What to expect

- Short, concrete notes on systems I've built
- The occasional teardown of a workflow
- Code where it helps

```ts
// even fenced code blocks render
const leads = await enrich(scraped);
```

More soon.
```

- [ ] **Step 3: Commit**

```bash
git add content/posts/hello.mdx public/blog/hello.png
git commit -m "Add sample blog post and placeholder cover"
```

---

### Task 4: Shared `SiteNav` component + wire into homepage

**Files:**
- Create: `components/SiteNav.tsx`
- Modify: `app/page.tsx` (replace inline `<nav>` at lines ~82-99; add import)

- [ ] **Step 1: Write `components/SiteNav.tsx`**

```tsx
import ThemeToggle from "@/components/ThemeToggle";

// variant "home": in-page section anchors (#work). variant "page": route back
// to the homepage first (/#work) so the links work from /blog pages.
export default function SiteNav({
  variant = "home",
}: {
  variant?: "home" | "page";
}) {
  const base = variant === "home" ? "" : "/";
  return (
    <nav>
      <div className="in">
        <div className="brand">
          {variant === "home" ? (
            <>
              Aditya <em>Venkatesan</em>
              <span className="tail">gtm engineer</span>
            </>
          ) : (
            <a className="cursor-target" href="/">
              Aditya <em>Venkatesan</em>
              <span className="tail">gtm engineer</span>
            </a>
          )}
        </div>
        <div className="links">
          <a className="cursor-target" href={`${base}#work`}>
            Work
          </a>
          <a className="cursor-target" href={`${base}#stack`}>
            Stack
          </a>
          <a className="cursor-target" href="/blog">
            Blog
          </a>
          <a className="cursor-target" href="https://github.com/Aditya-v05">
            GitHub
          </a>
          <a className="cursor-target" href={`${base}#contact`}>
            Contact
          </a>
          <ThemeToggle />
          <a
            className="modebtn navpdf cursor-target"
            href="/Aditya-GTM-Engineering-Portfolio.pdf"
            download
          >
            <span className="navpdf__t">portfolio.</span>pdf ↓
          </a>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Import `SiteNav` in `app/page.tsx`**

Add this import near the other component imports (after line 8, the `ThemeToggle` import):
```tsx
import SiteNav from "@/components/SiteNav";
```

- [ ] **Step 3: Replace the inline `<nav>` block in `app/page.tsx`**

Find this block (currently ~lines 81-99):
```tsx
      {/* NAV */}
      <nav>
        <div className="in">
          <div className="brand">
            Aditya <em>Venkatesan</em>
            <span className="tail">gtm engineer</span>
          </div>
          <div className="links">
            <a className="cursor-target" href="#work">Work</a>
            <a className="cursor-target" href="#stack">Stack</a>
            <a className="cursor-target" href="https://github.com/Aditya-v05">GitHub</a>
            <a className="cursor-target" href="#contact">Contact</a>
            <ThemeToggle />
            <a className="modebtn navpdf cursor-target" href="/Aditya-GTM-Engineering-Portfolio.pdf" download>
              <span className="navpdf__t">portfolio.</span>pdf ↓
            </a>
          </div>
        </div>
      </nav>
```
Replace it entirely with:
```tsx
      {/* NAV */}
      <SiteNav variant="home" />
```

- [ ] **Step 4: Remove the now-unused `ThemeToggle` import from `app/page.tsx` IF nothing else uses it**

Run: `grep -n "ThemeToggle" app/page.tsx`
- If the only remaining match is the `import` line, delete that import line (`import ThemeToggle from "@/components/ThemeToggle";`).
- If `ThemeToggle` is used elsewhere in the file, leave the import.

- [ ] **Step 5: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors; no "unused import" complaint for `ThemeToggle`.

- [ ] **Step 6: Commit**

```bash
git add components/SiteNav.tsx app/page.tsx
git commit -m "Extract shared SiteNav with Blog link"
```

---

### Task 5: Add `metadataBase` to root layout

**Files:**
- Modify: `app/layout.tsx` (the `metadata` export, ~lines 25-29)

- [ ] **Step 1: Add `metadataBase` resolved from the Vercel production domain**

In `app/layout.tsx`, replace the existing `metadata` export:
```tsx
export const metadata: Metadata = {
  title: "Aditya — GTM Engineer",
  description:
    "GTM Engineer · Data & Automation. I build GTM systems that run themselves — collection, enrichment, customer-overlap detection, LLM classification, and live outbound.",
};
```
with:
```tsx
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aditya — GTM Engineer",
  description:
    "GTM Engineer · Data & Automation. I build GTM systems that run themselves — collection, enrichment, customer-overlap detection, LLM classification, and live outbound.",
};
```
`VERCEL_PROJECT_PRODUCTION_URL` is provided automatically by Vercel at build time; locally it falls back to `localhost:3000`. With `metadataBase` set, relative OG image paths like `/blog/hello.png` resolve to absolute URLs in the emitted tags.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/layout.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "Set metadataBase for absolute OG image URLs"
```

---

### Task 6: Blog layout (ambient FX)

**Files:**
- Create: `app/blog/layout.tsx`

- [ ] **Step 1: Write `app/blog/layout.tsx`**

```tsx
import CursorFX from "@/components/CursorFX";
import Noise from "@/components/Noise";

// Blog pages reuse the site's ambient FX (custom cursor + film-grain noise) but
// NOT the homepage boot intro. Theme persistence is handled globally by the
// inline script in the root layout, so the ThemeToggle in SiteNav just works.
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CursorFX />
      <Noise patternSize={250} patternAlpha={10} patternRefreshInterval={3} />
      {children}
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/blog/layout.tsx` (props match how `page.tsx` uses `Noise`/`CursorFX`).

- [ ] **Step 3: Commit**

```bash
git add app/blog/layout.tsx
git commit -m "Add blog layout with ambient FX"
```

---

### Task 7: Blog index page (`/blog`)

**Files:**
- Create: `app/blog/page.tsx`

- [ ] **Step 1: Write `app/blog/page.tsx`**

```tsx
import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import { getAllPosts, formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog — Aditya",
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
          <p className="blog-index__empty">No posts yet — check back soon.</p>
        ) : (
          <ul className="postcards">
            {posts.map((post) => (
              <li key={post.slug} className="postcard">
                <a className="postcard__link cursor-target" href={`/blog/${post.slug}`}>
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
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/blog/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/blog/page.tsx
git commit -m "Add blog index page"
```

---

### Task 8: Blog post page (`/blog/[slug]`)

**Files:**
- Create: `app/blog/[slug]/page.tsx`

- [ ] **Step 1: Write `app/blog/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import SiteNav from "@/components/SiteNav";
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
    title: `${post.title} — Aditya`,
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

export default async function BlogPost({
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
      <main className="post">
        <div className="post__banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt={post.title} />
        </div>
        <article className="post__body">
          <header className="post__head">
            <time className="post__date" dateTime={post.date}>
              {formatDate(post.date)}
            </time>
            <h1 className="post__title">{post.title}</h1>
          </header>
          <div className="prose">{content}</div>
        </article>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/blog/[slug]/page.tsx`. (`compileMDX` returns `{ content }`; `params` is awaited per Next 15 async params.)

- [ ] **Step 3: Commit**

```bash
git add "app/blog/[slug]/page.tsx"
git commit -m "Add blog post page with cover OG metadata and banner"
```

---

### Task 9: Blog styles

**Files:**
- Modify: `app/globals.css` (append a new blog section near the end, before any `@media print` block if present — if unsure, append at end of file)

- [ ] **Step 1: Append blog styles to `app/globals.css`**

```css
/* ============================ BLOG ============================ */
/* Uses existing theme tokens (--accent, --ink, --bg, fonts) so light
   (parchment/green) and dark (night-ops) themes both work automatically. */

.blog-index {
  max-width: 760px;
  margin: 0 auto;
  padding: 140px 24px 120px;
}
.blog-index__head h1 {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 3.6rem);
  line-height: 1.05;
  margin: 0 0 0.4rem;
}
.blog-index__head p {
  font-family: var(--font-body);
  opacity: 0.7;
  margin: 0 0 3rem;
}
.blog-index__empty {
  font-family: var(--font-body);
  opacity: 0.7;
}

.postcards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.postcard__link {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 1.25rem;
  align-items: stretch;
  text-decoration: none;
  color: inherit;
  border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
  border-radius: 14px;
  padding: 14px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.postcard__link:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}
.postcard__thumb {
  display: block;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
}
.postcard__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.postcard__body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.postcard__date {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.6;
}
.postcard__title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  line-height: 1.15;
}
.postcard__summary {
  font-family: var(--font-body);
  font-size: 0.95rem;
  opacity: 0.75;
}

@media (max-width: 560px) {
  .postcard__link {
    grid-template-columns: 1fr;
  }
}

/* ---- single post ---- */
.post {
  padding-bottom: 120px;
}
.post__banner {
  width: 100%;
  max-height: 420px;
  overflow: hidden;
}
.post__banner img {
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
}
.post__body {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px;
}
.post__head {
  padding: 2.5rem 0 1.5rem;
}
.post__date {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.6;
}
.post__title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.08;
  margin: 0.4rem 0 0;
}

/* ---- prose (rendered MDX body) ---- */
.prose {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.7;
}
.prose h2 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  margin: 2.2rem 0 0.8rem;
}
.prose h3 {
  font-family: var(--font-display);
  font-size: 1.3rem;
  margin: 1.8rem 0 0.6rem;
}
.prose p {
  margin: 0 0 1.1rem;
}
.prose ul,
.prose ol {
  margin: 0 0 1.1rem;
  padding-left: 1.4rem;
}
.prose li {
  margin: 0.3rem 0;
}
.prose a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.prose img {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 1.4rem 0;
}
.prose code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: color-mix(in srgb, var(--ink) 8%, transparent);
  padding: 0.12em 0.36em;
  border-radius: 5px;
}
.prose pre {
  font-family: var(--font-mono);
  background: color-mix(in srgb, var(--ink) 10%, transparent);
  padding: 1rem 1.2rem;
  border-radius: 10px;
  overflow-x: auto;
  margin: 0 0 1.4rem;
  font-size: 0.86rem;
  line-height: 1.55;
}
.prose pre code {
  background: none;
  padding: 0;
}

@media (prefers-reduced-motion: reduce) {
  .postcard__link {
    transition: none;
  }
}
```

NOTE: This uses CSS variables `--accent`, `--ink`, `--bg`, `--font-display`, `--font-body`, `--font-mono`. Before committing, confirm these token names exist in `globals.css`:
Run: `grep -nE "\-\-(accent|ink|bg|font-display|font-body|font-mono)\b" app/globals.css | head`
- If `--ink` or `--bg` is named differently (e.g. `--fg`, `--paper`), substitute the actual token name used elsewhere in the file. Do not invent new tokens.

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "Add blog index, banner, and prose styles"
```

---

### Task 10: Build + full verification

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: build succeeds. In the route table, `/blog` is listed as static (`○`) and `/blog/[slug]` shows as `●` (SSG) with `/blog/hello` prerendered. No errors about missing frontmatter.

- [ ] **Step 2: Start the production server**

Run:
```bash
lsof -ti :3000 | xargs kill -9 2>/dev/null; npm start &
```
Wait ~3s for "Ready". (Background it; kill at the end.)

- [ ] **Step 3: Verify the OG/Twitter image tags point at the cover**

Run:
```bash
curl -s http://localhost:3000/blog/hello | grep -Eo '<meta property="og:image[^>]*>|<meta name="twitter:image[^>]*>'
```
Expected: at least one `og:image` and one `twitter:image` meta tag whose `content` ends in `/blog/hello.png` (absolute URL, e.g. `http://localhost:3000/blog/hello.png`).

- [ ] **Step 4: Verify index lists the post**

Run:
```bash
curl -s http://localhost:3000/blog | grep -Eo 'Building GTM systems that run themselves|/blog/hello'
```
Expected: both the title text and the `/blog/hello` link appear.

- [ ] **Step 5: Screenshot index + post in both themes (existing puppeteer loop)**

Write a temporary `scripts/_tmp-blog-shot.mjs` (project dir so `node_modules` resolves) that launches `puppeteer-core` against the installed Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `headless: "new"`, `deviceScaleFactor: 1`, and screenshots:
  - `http://localhost:3000/blog`
  - `http://localhost:3000/blog/hello`
  - the post page again with `localStorage.theme = "dark"` set before load
Read each screenshot and confirm: nav shows the **Blog** pill, the index shows the post card with thumbnail, the post page shows the cover banner above the title, prose is styled, and dark theme renders correctly.

- [ ] **Step 6: Verify nav Blog link on the homepage**

Run:
```bash
curl -s http://localhost:3000/ | grep -Eo 'href="/blog"'
```
Expected: `href="/blog"` present (the homepage nav now links to the blog).

- [ ] **Step 7: Clean up**

Run:
```bash
rm -f scripts/_tmp-blog-shot.mjs
lsof -ti :3000 | xargs kill -9 2>/dev/null
```
Expected: temp script removed, server stopped. Confirm `git status` shows no stray temp files.

- [ ] **Step 8: Final commit (only if Step 7 left tracked changes — normally nothing to commit)**

```bash
git status
# if clean, nothing to do
```

---

## Notes for the implementer

- **No Co-Authored-By lines in commit messages** (standing owner constraint). Commit messages above already omit them — keep it that way.
- This repo has **no unit-test runner**; do not add one. Verification is `npx tsc --noEmit`, `npm run build`, and the puppeteer/`curl` checks in Task 10 — the same harness used for prior features.
- Async `params` (`Promise<{ slug }>`) is required by Next 15 — always `await params`.
- If `compileMDX` emits a React 19 peer-dep warning at install, it is non-fatal; the RSC build still renders.
