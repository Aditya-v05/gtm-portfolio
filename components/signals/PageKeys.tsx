"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Left and right arrow keys turn the pages of an issue. Ignored while typing, and when
// a modifier is held, so browser shortcuts keep working.
export default function PageKeys({ prev, next }: { prev?: string | undefined; next?: string | undefined }) {
  const router = useRouter();

  useEffect(() => {
    if (prev) router.prefetch(prev);
    if (next) router.prefetch(next);
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      if (e.key === "ArrowRight" && next) router.push(next);
      if (e.key === "ArrowLeft" && prev) router.push(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, router]);

  return null;
}
