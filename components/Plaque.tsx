"use client";

import { useEffect, useRef } from "react";

// A company plaque: a pixel box holding a small marble bust of an Olympian
// and the company's name. Each bust is the same head with a different
// attribute, drawn on a 16x16 grid.
const HEAD = [
  "................",
  "................",
  ".....######.....",
  "....########....",
  "....########....",
  "....#o####o#....",
  "....########....",
  "....###nn###....",
  ".....######.....",
  ".....#mmmm#.....",
  "......####......",
  "......####......",
  "....########....",
  "...##########...",
  "..############..",
  "..############..",
];
// attribute overlays: [x, y, colour key]
const ATTR: Record<string, [number, number, string][]> = {
  laurel: [[3, 3, "g"], [3, 4, "g"], [4, 2, "g"], [12, 3, "g"], [12, 4, "g"], [11, 2, "g"], [6, 1, "g"], [9, 1, "g"]],
  helmet: [[4, 2, "y"], [5, 1, "y"], [6, 1, "y"], [7, 0, "y"], [8, 0, "y"], [9, 1, "y"], [10, 1, "y"], [11, 2, "y"], [7, 1, "y"], [8, 1, "y"], [4, 3, "y"], [11, 3, "y"], [5, 2, "y"], [10, 2, "y"]],
  crown: [[5, 1, "y"], [7, 0, "y"], [8, 0, "y"], [10, 1, "y"], [5, 2, "y"], [6, 2, "y"], [7, 1, "y"], [8, 1, "y"], [9, 2, "y"], [10, 2, "y"]],
  wings: [[2, 2, "b"], [3, 2, "b"], [2, 3, "b"], [12, 2, "b"], [13, 2, "b"], [13, 3, "b"], [1, 1, "b"], [14, 1, "b"]],
  beard: [[5, 9, "d"], [6, 10, "d"], [7, 10, "d"], [8, 10, "d"], [9, 10, "d"], [10, 9, "d"], [6, 11, "d"], [9, 11, "d"], [7, 11, "d"], [8, 11, "d"]],
  trident: [[14, 3, "b"], [14, 4, "b"], [14, 5, "b"], [14, 6, "b"], [14, 7, "b"], [14, 8, "b"], [14, 9, "b"], [13, 3, "b"], [15, 3, "b"], [13, 2, "b"], [15, 2, "b"], [14, 2, "b"]],
};
const COL: Record<string, string> = { g: "#7f9a52", y: "#f0b429", b: "#2f4f9e", d: "#a9b0d6" };

export default function Plaque({ name, attr }: { name: string; attr: keyof typeof ATTR | string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, 16, 16);
    HEAD.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === ".") return;
        const edge = row[x + 1] === "." || row[x + 1] === undefined;
        c.fillStyle = ch === "o" ? "#1b2b5a" : ch === "n" ? "#d9d2e0" : ch === "m" ? "#c9c2d6" : edge ? "#a9b0d6" : x < 6 ? "#fffbe6" : "#ece6d8";
        c.fillRect(x, y, 1, 1);
      })
    );
    for (const [x, y, k] of ATTR[attr] ?? []) {
      c.fillStyle = COL[k];
      c.fillRect(x, y, 1, 1);
    }
  }, [attr]);
  return (
    <li className="plaque">
      <canvas ref={ref} className="plaque__bust" width={16} height={16} aria-hidden="true" />
      <span className="plaque__name">{name}</span>
    </li>
  );
}
