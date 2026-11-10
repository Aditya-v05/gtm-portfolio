// The world is snapped to these colours (sRGB hex), dithered between the two
// nearest. Taken from the reference: cobalt and periwinkle blues on warm
// ivory, peach stone, and a little olive and yellow-green for plants.

export const DAY_BG = "#fbf1c4";
export const NIGHT_BG = "#0f1630";

export const DAY_PALETTE = [
  "#fbf1c4", // ivory sky and page
  "#fff9dc", // white highlights
  "#f6ead9", // warm stone light
  "#ead6bd", // stone
  "#d6bea2", // stone shade
  "#d9d2e0", // stone in blue shade, like the reference
  "#bcbfdc",
  "#eef1fa", // haze
  "#dce4f5", // palest blue
  "#c5d3f0",
  "#a9bdea",
  "#8aa5e0",
  "#6f8ed4",
  "#5574c2",
  "#3f5cab",
  "#2f4a94",
  "#243a78",
  "#1b2b5a", // deepest
  "#e2df9a", // light yellow-green
  "#b5c071", // olive
  "#7f9a52", // green
  "#4f6f63", // blue-green cypress
  "#365a6e", // cypress shade
];

export const NIGHT_PALETTE = [
  "#0f1630", // night sky and page
  "#e9e4cf", // moonlight
  "#8f93b8",
  "#6c7298",
  "#4c5378",
  "#1a2448",
  "#212d58",
  "#2a3868",
  "#34457a",
  "#3f538d",
  "#4b62a2",
  "#5a74b8",
  "#162044",
  "#111a38",
  "#0b1128",
  "#070b1c",
  "#ffd37a", // window and torch light
  "#c9a45a",
  "#3c5a52",
  "#26403f",
  "#1a2c33",
];

export function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// The sky stays ivory like the reference; only the haze toward the horizon
// and the sun's angle change between scenes. [x, elevation, azimuth, haze]
export const DAY_SKY: [number, number, number, string][] = [
  [0, 38, 230, "#eef1fa"],
  [420, 46, 200, "#eef1fa"],
  [840, 24, 250, "#f3ece6"],
];
export const NIGHT_SKY = { haze: "#1a2448" };
