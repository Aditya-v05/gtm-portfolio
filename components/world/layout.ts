import { fbm, smoothstep } from "./rng";

// The geography of Aditya's world: one coast, one water system. The page
// shows it through windows (the hero, a vignette per project, the personal
// scene, the ending), each with its own camera on one district. The water
// runs through all of them, from the hero aqueduct to the harbour:
//   hero    the aqueduct striding through the sea toward the acropolis
//   sift    the archive's fountain court, fed by a stone channel
//   forum   "Outside of work": a garden pool, the Colosseum, the Pantheon, the gods
//   ending  the harbour, where the aqueduct's last arches spill into the sea

export const DISTRICTS = {
  hero: 0,
  raven: 300,
  warmest: 420,
  sift: 540,
  diode: 660,
  forum: 820,
  ending: 1040,
} as const;
export type DistrictName = keyof typeof DISTRICTS;
export const DISTRICT_ORDER: DistrictName[] = ["hero", "raven", "warmest", "sift", "diode", "forum", "ending"];

export const X_MIN = -260;
export const X_MAX = 1240;

const plateau = (d: number, r: number, edge: number) => smoothstep(r + edge, r, d);

/** ground height at (x, z); the sea floor sits just below zero */
export function ground(x: number, z: number) {
  let h = -3;
  const n = fbm(x * 0.03, z * 0.03, 3) - 0.5;

  // hero: the acropolis rock, a flat top with cliffs, and a town on its skirts
  {
    const d = Math.hypot((x - 78) * 0.9, z + 62);
    const rock = (30 + n * 3) * plateau(d, 34, 10);
    const skirt = (11 + n * 4) * plateau(d, 50, 26);
    h = Math.max(h, Math.max(rock, skirt) - 3 * (1 - plateau(d, 50, 26)));
    // a shoulder running off to the right, where more temples and houses sit
    const s = Math.hypot((x - 140) * 0.7, z + 40);
    h = Math.max(h, (9 + n * 3) * plateau(s, 26, 22) - 3 * (1 - plateau(s, 26, 22)));
  }
  // hero: the low shore on the left where the aqueduct comes off the land
  {
    const d = Math.hypot((x + 200) * 0.8, z - 70);
    h = Math.max(h, (6 + n * 3) * plateau(d, 18, 14) - 3 * (1 - plateau(d, 18, 14)));
  }

  // forum: a coastal plain with hills behind it
  {
    const dx = Math.abs(x - DISTRICTS.forum);
    const plain = 3 + n * 1.2;
    const inLand = smoothstep(150, 110, dx) * smoothstep(52, 30, z);
    h = Math.max(h, -3 + (plain + 3) * inLand);
    const mask = smoothstep(-40, -110, z) * smoothstep(190, 120, dx);
    h = Math.max(h, -3 + (23 + n * 14) * mask);
  }

  // sift: a flat paved plaza on a low terrace
  {
    const dx = x - DISTRICTS.sift;
    const land = smoothstep(170, 120, Math.abs(dx)) * smoothstep(60, 36, z);
    const court = smoothstep(70, 50, Math.abs(dx)) * smoothstep(40, 24, Math.abs(z + 8));
    const rise = smoothstep(-36, -90, z) * 18;
    h = Math.max(h, -3 + (8 + n * 3 * (1 - court) + rise) * land);
  }

  // ending: a headland on the left that the aqueduct comes off, the harbour on the right
  {
    const dx = x - DISTRICTS.ending;
    const head = smoothstep(-20, -70, dx) * smoothstep(-260, -200, dx) * smoothstep(70, 30, z);
    h = Math.max(h, -3 + (14 + n * 5 + 3) * head);
    // the quay along the harbour
    const quay = smoothstep(10, 16, dx) * smoothstep(140, 120, dx) * smoothstep(-38, -30, z) * smoothstep(-20, -26, z);
    h = Math.max(h, -3 + 4.5 * quay);
  }

  return h;
}

/** each scene's aqueduct: a polyline it follows, and the level of its channel */
export type Aqueduct = { pts: [number, number][]; top: number; tiers: 1 | 2 };
export const AQUEDUCTS: Aqueduct[] = [
  // hero: from the far left, striding out through the sea toward the rock
  { pts: [[-196, 54], [-120, 34], [-40, 10], [24, -18], [60, -40]], top: 22, tiers: 1 },
  // ending: off the headland and out over the harbour, two tiers, ending in a spill
  { pts: [[DISTRICTS.ending - 160, 20], [DISTRICTS.ending - 60, 4], [DISTRICTS.ending + 4, -6]], top: 30, tiers: 2 },
];

/** where the hero aqueduct breaks and spills into the sea */
export const WATERFALL_AT = { segment: 0, t: 0.48 };

/** where the ending aqueduct pours out into the harbour */
export const HARBOUR_SPILL = { x: DISTRICTS.ending + 4, z: -6 };
