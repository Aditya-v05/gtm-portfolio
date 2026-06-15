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

const STRING_FIELDS: (keyof PostFrontmatter)[] = ["title", "summary", "cover"];

function normalizeDate(slug: string, value: unknown): string {
  // YAML parses an unquoted ISO date (date: 2026-06-15) into a Date object;
  // a quoted one stays a string. Accept either and normalize to YYYY-MM-DD.
  const iso = value instanceof Date ? value.toISOString().slice(0, 10) : value;
  if (typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  throw new Error(
    `Post "${slug}.mdx" has missing or invalid "date" — expected YYYY-MM-DD`,
  );
}

function readPost(slug: string): Post {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  for (const key of STRING_FIELDS) {
    if (!data[key] || typeof data[key] !== "string") {
      throw new Error(
        `Post "${slug}.mdx" is missing required frontmatter field "${key}"`,
      );
    }
  }

  return {
    slug,
    title: data.title,
    date: normalizeDate(slug, data.date),
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
