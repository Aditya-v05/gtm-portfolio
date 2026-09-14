"use client";

import { useEffect, useState, type ReactNode } from "react";

// A page turn between the pages of an issue. The direction comes from the page last
// shown: a higher page swings in from the right, a lower one from the left. The first
// page a visitor lands on does not animate, so server and client render the same.
let lastPage = 0;

export default function Turn({ page, children }: { page: number; children: ReactNode }) {
  const [dir] = useState<"none" | "fwd" | "back">(() =>
    typeof window === "undefined" || lastPage === 0 || lastPage === page ? "none" : page > lastPage ? "fwd" : "back",
  );

  useEffect(() => {
    lastPage = page;
  }, [page]);

  return <div className={`turn turn--${dir}`}>{children}</div>;
}
