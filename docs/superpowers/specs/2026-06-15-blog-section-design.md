# Blog section — design

**Date:** 2026-06-15
**Status:** Approved (pending spec review)

## Goal

Add a blog to the existing single-page Next.js 15 portfolio so the owner can
publish posts soon. Each post has one cover photo that serves two purposes:

1. **Link-share preview** — the Open Graph / Twitter image shown when the post
   URL is pasted into Slack, LinkedIn, iMessage, X, etc. The site currently has
   no share image at all.
2. **Top-of-post banner** — the same image rendered full-width above the title
   on the post page.

The section is named **Blog** and lives at `/blog`.

## Non-goals (v1)

Tags/categories, search, comments, RSS, pagination, and reading-time estimates
are explicitly out of scope. Each is easy to add later. Keep v1 focused.

## Authoring model

Posts are Markdown/MDX files committed to the repo — no CMS, no database, no new
services. This matches the site's fully static (`○ (Static)`) build.

```
content/posts/
  <slug>.mdx          ← one file per post; filename == URL slug
public/blog/
  <slug>.jpg          ← that post's cover image (jpg/png/webp)
```

Each post file begins with a YAML frontmatter header:

```
---
title: "How I built a self-running enrichment pipeline"
date: 2026-06-15
summary: "One paragraph shown on the index and in link previews."
cover: /blog/my-first-post.jpg
---

Body in Markdown/MDX. Headings, bold, lists, code blocks, images all work.
```

**Publishing flow:** add the `.mdx` file, drop its cover image into
`public/blog/`, `git push`. Vercel rebuilds and the post goes live at
`/blog/<slug>`.

### Frontmatter contract

| Field     | Required | Type   | Notes                                              |
|-----------|----------|--------|----------------------------------------------------|
| `title`   | yes      | string | Post title; used on index, post page, and metadata |
| `date`    | yes      | string | ISO date `YYYY-MM-DD`; drives sort order            |
| `summary` | yes      | string | One paragraph; index card + OG/meta description     |
| `cover`   | yes      | string | Absolute path under `/public`, e.g. `/blog/x.jpg`   |

A missing required field should fail the build with a clear error (not render a
broken post).

## Routes

Both statically generated at build time via `generateStaticParams`, keeping the
site fully static.

- **`/blog`** — index. Lists posts newest-first as cards: small cover thumbnail,
  title (Fraunces), formatted date, and summary. Styled in the parchment/night
  theme to match the homepage.
- **`/blog/[slug]`** — a single post. Layout top-to-bottom:
  cover banner → title + formatted date → rendered post body. Inherits the
  site's custom cursor, theme toggle, and mono-font code blocks.

## Metadata / cover photo wiring

- `app/blog/[slug]/page.tsx` exports `generateMetadata` that reads the post's
  frontmatter and sets:
  - `title`, `description` (from `summary`)
  - `openGraph.images` = `[cover]` and `openGraph.type = "article"`
  - `twitter.card = "summary_large_image"`, `twitter.images = [cover]`
- The same `cover` value renders as the top-of-post banner image.

This is the single source of truth: one `cover` field → both the share preview
and the on-page banner.

## Nav integration

The homepage `<nav>` is currently inline in `app/page.tsx` and uses in-page hash
anchors (`#work`, `#stack`, `#contact`). To put a **Blog** link on both the
homepage and the blog pages without forcing a full reload on the homepage:

- Extract the nav into a shared `components/SiteNav.tsx` with a `variant` prop:
  - `variant="home"` → section links stay as `#work` etc. (in-page scroll).
  - `variant="page"` → section links become `/#work` etc. (route home, then
    scroll), used on blog pages.
- Both variants include the existing brand, theme toggle, and `portfolio.pdf`
  pill, plus the new **Blog** link.
- The homepage renders `<SiteNav variant="home" />`; blog pages render
  `<SiteNav variant="page" />`.

Footer, theme persistence, boot intro, and all existing homepage behavior stay
unchanged.

## Tech

- `gray-matter` — parse frontmatter from each `.mdx` file (build-time only).
- `next-mdx-remote` (RSC `compileMDX`) — render the MDX body in a Server
  Component. Chosen over plain Markdown so a post can embed the site's own React
  components later (e.g. a terminal-style block) without re-architecting.
- A small `lib/posts.ts` helper centralizes reading the `content/posts/`
  directory, parsing frontmatter, sorting by date, and exposing
  `getAllPosts()` / `getPostBySlug(slug)` so both routes share one code path.

## Styling

Reuse existing CSS tokens/theme variables in `app/globals.css`. Add scoped
styles for: the index card grid, the cover banner, and a prose/typography block
for post bodies (headings in Fraunces, body in Archivo, code in JetBrains Mono),
respecting both light (parchment/green) and dark (night-ops) themes and
`prefers-reduced-motion`.

## Seed content

Ship one sample post (`content/posts/hello.mdx`) plus a placeholder cover image
in `public/blog/`, so the index and post pages are visibly working on first
deploy. The owner replaces it with a real post.

## Verification

After build: `npm run build` shows `/blog` and `/blog/[slug]` as static, the
index lists the sample post, the post page renders the banner + body, and
`generateMetadata` emits `og:image`/`twitter:image` pointing at the cover
(checked in the page `<head>` via the existing puppeteer screenshot loop).
