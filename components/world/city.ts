import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng, fbm } from "./rng";
import { DISTRICTS, X_MIN, X_MAX, ground, AQUEDUCTS, WATERFALL_AT, HARBOUR_SPILL } from "./layout";

// Builds Aditya's world once: three scenes along one coast. Everything is
// procedural and seeded, so it is the same on every visit. Colours sit near
// the palette in palette.ts; the post pass snaps, dithers and outlines them.

const C = (h: string) => new THREE.Color(h);
const STONE = "#ead6bd";
const MARBLE = "#f6ead9";

export type City = {
  root: THREE.Group;
  /** t: smooth seconds. tq: seconds quantised to the pixel cadence. */
  update: (t: number, tq: number, camX: number) => void;
  setNight: (night: boolean) => void;
  setSky: (haze: THREE.Color, sunDir: THREE.Vector3) => void;
};

/* ------------------------------------------------------------------ */
/* shaders                                                             */
/* ------------------------------------------------------------------ */

// the sky is the page: flat ivory, a little haze at the horizon; at night,
// navy with a moon and a scatter of stars
const skyMat = () =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSky: { value: C("#fbf1c4") },
      uHaze: { value: C("#eef1fa") },
      uNight: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSky, uHaze;
      uniform float uNight;
      varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(uHaze, uSky, smoothstep(0.0, 0.1, h));
        vec3 moonDir = normalize(vec3(0.55, 0.32, -1.0));
        float m = max(dot(vDir, moonDir), 0.0);
        col = mix(col, vec3(0.92, 0.89, 0.8), smoothstep(0.9988, 0.9991, m) * uNight);
        // stars: single pixels, sparse, a few of them brighter
        vec3 hq = fract(vec3(floor(gl_FragCoord.xy).xyx) * 0.1031);
        hq += dot(hq, hq.yzx + 33.33);
        float st = fract((hq.x + hq.y) * hq.z);
        col += (step(0.9972, st) * 0.45 + step(0.9993, st) * 0.4) * smoothstep(0.05, 0.25, h) * uNight;
        // alpha 0.6 marks open sky for the outline pass in engine.ts
        gl_FragColor = vec4(col, 0.6);
      }`,
  });

// The sea. It is the same water as the closing scene: trains of long parallel crests travelling toward the
// viewer, arriving in sets, on slow swells whose size is itself random from place to place. Near the camera it
// is a real surface (a fine grid pushed up and down by the big waves, so they pass round the piers); far off it
// is flat. The small waves only shade it. Colours come out as six flat tones with a thin dithered seam.
// Sea space is (x, -z) of the world, so the swell runs toward the viewer.
const SEA_WAVES = /* glsl */ `
  uniform float uTime;
  float shash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
  float svn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(shash(i), shash(i + vec2(1, 0)), f.x), mix(shash(i + vec2(0, 1)), shash(i + vec2(1, 1)), f.x), f.y); }
  float train(vec2 p, vec2 d, float L, float ph, float pk) {
    float k = 6.2832 / L, w = sqrt(9.8 * k) * 0.62;
    return pow(0.5 + 0.5 * sin(k * dot(p, d) - w * uTime + ph), pk);
  }
  const vec2 D0 = vec2(0.287, -0.958);
  vec2 srot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
  float sets(vec2 p) { return 0.35 + 1.05 * svn((p - D0 * uTime * 3.0) / 130.0 + 7.3); }
  float bend(vec2 p) { return 2.6 * svn(p / 85.0 + vec2(0.013, -0.02) * uTime + 2.1) + 1.1 * svn(p / 31.0 + vec2(-0.02, 0.011) * uTime + 9.4); }
  // the waves big enough to move the surface
  float Hbig(vec2 p) {
    float b = bend(p), e = sets(p);
    float h = 1.7 * e * (2.0 * train(p, D0, 62.0, b, 1.8) - 1.0);
    h += 0.95 * e * (2.0 * train(p, srot(D0, 0.16), 39.0, b * 0.8 + 1.7, 1.6) - 1.0);
    h += 0.5 * (2.0 * train(p, srot(D0, -0.21), 25.0, b * 0.6 + 4.1, 1.4) - 1.0);
    float big = 0.12 + 1.5 * pow(svn(p / 230.0 + vec2(-0.012, 0.007) * uTime + 21.3), 1.6);
    float mid = 0.2 + 1.3 * svn(p / 140.0 + vec2(0.009, -0.014) * uTime + 4.9);
    h += 2.6 * big * (2.0 * svn(p / 66.0 + vec2(-0.045, 0.012) * uTime + 3.7) - 1.0);
    h += 1.3 * mid * (2.0 * svn(p / 37.0 + vec2(-0.075, -0.02) * uTime + 11.1) - 1.0);
    // The sea bed is only three below the surface here, so open water rides a little above the shoreline level
    // and troughs are held short of the bed; crests are free to stand well up.
    return clamp(h, -3.6, 5.2) + 1.1;
  }
  // and with the chop on top, for shading
  float Hall(vec2 p) {
    return Hbig(p) + 0.32 * (2.0 * train(p, srot(D0, 0.30), 15.5, 2.9, 1.0) - 1.0)
      + 0.18 * (2.0 * train(p, srot(D0, -0.11), 9.3, 0.4, 1.0) - 1.0) + 0.09 * (2.0 * train(p, srot(D0, 0.42), 5.6, 5.2, 1.0) - 1.0);
  }`;
const SEA_DAY = ["#3f5cab", "#5574c2", "#6f8ed4", "#8aa5e0", "#c5d3f0", "#fff9dc"];
const SEA_NIGHT = ["#162044", "#212d58", "#2a3868", "#34457a", "#4b62a2", "#e9e4cf"];
const seaMat = () =>
  new THREE.ShaderMaterial({
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uHaze: { value: C("#eef1fa") },
      uNight: { value: 0 },
      uHole: { value: new THREE.Vector4(0, 0, 0, 0) }, // x0, z0, x1, z1 the flat sea leaves open for the fine grid
      uRamp: { value: SEA_DAY.map(C) },
    },
    vertexShader: /* glsl */ `
      attribute float aAmp;     // 1 in open water, falling to 0 at the shore and at the grid's edge
      varying vec3 vWorld; varying float vAmp;
      ${SEA_WAVES}
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vAmp = aAmp;
        w.y += aAmp * Hbig(vec2(w.x, -w.z));
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uNight; uniform vec3 uHaze; uniform vec4 uHole;
      varying vec3 vWorld; varying float vAmp;
      ${SEA_WAVES}
      float foam(vec2 p) {
        float b = bend(p), e = sets(p);
        float k = 6.2832 / 62.0, ph = k * dot(p, D0) - sqrt(9.8 * k) * 0.62 * uTime + b;
        float d = mod(ph - 1.5708 + 3.14159, 6.2832) - 3.14159;
        float br = svn(vec2(dot(p, vec2(-D0.y, D0.x)) / 5.0, floor(ph / 6.2832 + 0.25) * 3.7 + uTime * 0.07));
        float strong = smoothstep(0.80, 1.05, e), body = smoothstep(0.42, 0.62, br);
        if (strong > 0.5 && abs(d) < 0.045 * body) return 2.0;
        if (strong > 0.5 && d < 0.0 && d > -0.15 * body * br) return 1.0;
        return 0.0;
      }
      uniform vec3 uRamp[6];    // the six tones, darkest to foam
      vec3 pal(float i) { int k = int(i + 0.5); for (int j = 0; j < 6; j++) if (j == k) return uRamp[j]; return uRamp[5]; }
      float bayer(vec2 p) { vec2 q = mod(floor(p), 4.0); float i = q.x + q.y * 4.0; float v = 5.0;
        if (i < 0.5) v = 0.0; else if (i < 1.5) v = 8.0; else if (i < 2.5) v = 2.0; else if (i < 3.5) v = 10.0; else if (i < 4.5) v = 12.0; else if (i < 5.5) v = 4.0; else if (i < 6.5) v = 14.0; else if (i < 7.5) v = 6.0;
        else if (i < 8.5) v = 3.0; else if (i < 9.5) v = 11.0; else if (i < 10.5) v = 1.0; else if (i < 11.5) v = 9.0; else if (i < 12.5) v = 15.0; else if (i < 13.5) v = 7.0; else if (i < 14.5) v = 13.0;
        return (v + 0.5) / 16.0; }
      void main() {
        // the flat far sea stands aside where the fine grid is
        if (vAmp < 0.0 && vWorld.x > uHole.x && vWorld.z > uHole.y && vWorld.x < uHole.z && vWorld.z < uHole.w) discard;
        float amp = max(vAmp, 0.0);
        vec2 p = vec2(vWorld.x, -vWorld.z);
        float dist = length(cameraPosition - vWorld), e = 0.25 + dist * 0.006;
        vec3 n = normalize(vec3((Hall(p - vec2(e, 0)) - Hall(p + vec2(e, 0))) * amp, (Hall(p - vec2(0, e)) - Hall(p + vec2(0, e))) * amp, 2.0 * e));
        vec3 L = normalize(vec3(-0.42, 0.62, 0.50));
        float away = smoothstep(60.0, 760.0, dist);
        float tone = 2.6 + (dot(n, L) - L.z) * mix(5.4, 3.0, away) + away * (uNight > 0.5 ? -1.6 : 1.1);
        float fo = (dist < 420.0 && dist > 30.0 && amp > 0.6) ? foam(p) : 0.0;
        if (fo > 1.5) tone = 5.0; else if (fo > 0.5) tone = max(tone, 4.0);
        // glitter where a facet throws the sun at the eye
        vec3 v = cameraPosition - vWorld; vec3 rd = -normalize(vec3(v.x, -v.z, v.y));
        float sp = pow(max(dot(reflect(rd, n), normalize(vec3(0.30, 1.0, 0.26))), 0.0), 140.0);
        if (amp > 0.3 && sp * (0.6 + 0.8 * shash(floor(p * vec2(0.5, 1.4)) + floor(uTime * 5.0))) > 0.66) tone = 5.0;
        tone = clamp(tone, 0.0, 5.0);
        float a = floor(tone), fr = tone - a;
        vec3 col = pal(min(5.0, a + (fr > 0.5 + (bayer(gl_FragCoord.xy) - 0.5) * 0.28 ? 1.0 : 0.0)));
        col = mix(col, uHaze, smoothstep(500.0, 1500.0, length(cameraPosition.xz - vWorld.xz)) * 0.7);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });

// the grid of fine water round the hero: open sea moves fully, the shore and the grid's own edge stay level
const SEA_GRID = { x0: -430, x1: 560, z0: -470, z1: 175, step: 3 };
function seaGrid(calm: { x: number; z: number; r: number; low: number }[]): THREE.BufferGeometry {
  const { x0, x1, z0, z1, step } = SEA_GRID;
  const nx = Math.round((x1 - x0) / step) + 1, nz = Math.round((z1 - z0) / step) + 1;
  const pos = new Float32Array(nx * nz * 3), amp = new Float32Array(nx * nz), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  const ss = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let j = 0, k = 0; j < nz; j++)
    for (let i = 0; i < nx; i++, k++) {
      const x = x0 + i * step, z = z0 + j * step;
      pos[k * 3] = x; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = z;
      const edge = Math.min(x - x0, x1 - x, z - z0, z1 - z);
      let a = ss(0, 70, edge) * ss(-1.2, -2.9, ground(x, z)); // the sea floor is at -3; anything shallower is near land
      for (const c of calm) a *= c.low + (1 - c.low) * ss(c.r * 0.4, c.r, Math.hypot(x - c.x, z - c.z));
      amp[k] = a;
    }
  for (let j = 0, k = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aAmp", new THREE.BufferAttribute(amp, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// the waterfall: a curtain in seven lanes, darker at its edges, with pale streaks dropping down each lane at
// its own pace, a bright lip where it leaves the channel and white water where it lands
const fallMat = (len: number) =>
  new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uBase: { value: C("#8aa5e0") }, uLight: { value: C("#eef1fa") }, uFoam: { value: C("#fff9dc") }, uLen: { value: len } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uLen; uniform vec3 uBase, uLight, uFoam;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float lane = floor(vUv.y * 7.0), d = vUv.x;
        vec3 deep = uBase * 0.82, col = (lane < 0.5 || lane > 5.5) ? deep : uBase;
        float s = d * 0.28 - uTime * (1.6 + hash(vec2(lane, 1.0)) * 0.9), cell = floor(s), f = fract(s);
        float h = hash(vec2(cell, lane + 7.0));
        if (h > 0.45 && f < 0.25 + 0.5 * hash(vec2(cell, lane))) col = uLight;        // a falling streak
        else if (h < 0.16 && f < 0.5) col = deep;                                    // a darker gap between them
        if (d < 1.4) col = uLight;                                                   // the lip
        if (d > uLen - 3.5 && hash(vec2(floor(vUv.y * 9.0), floor(d * 1.5 - uTime * 6.0))) > 0.35 + (uLen - d) * 0.12) col = uFoam;   // white water at the foot
        gl_FragColor = vec4(col, 1.0);
      }`,
  });

// flowing water: light streaks sliding along a ribbon
const waterMat = (base: string, light: string, speed = 1, freq = 0.8) =>
  new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: C(base) },
      uLight: { value: C(light) },
      uSpeed: { value: speed },
      uFreq: { value: freq },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uSpeed, uFreq;
      uniform vec3 uBase, uLight;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float s = vUv.x * uFreq - uTime * 2.0 * uSpeed;
        float lane = floor(vUv.y * 4.0);
        float streak = step(0.6, hash(vec2(floor(s + lane * 0.37), lane))) * step(fract(s + lane * 0.37), 0.6);
        vec3 col = mix(uBase, uLight, streak);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });

function addSway(mat: THREE.MeshLambertMaterial, uTime: { value: number }, amount: number) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = "uniform float uTime;\n" + shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float phase = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.21;
       transformed.x += sin(uTime * 1.3 + phase) * ${amount.toFixed(3)} * max(position.y, 0.0);`
    );
  };
}

const lambert = (hex: string) => new THREE.MeshLambertMaterial({ color: C(hex), flatShading: true });

/* ------------------------------------------------------------------ */
/* geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** a wall of stone of width w and height h with a round-headed arch cut out */
function archSpan(w: number, h: number, depth: number, pier = 1.3, crown = 3): THREE.BufferGeometry {
  let r = w / 2 - pier;
  let spring = h - r - crown;
  if (spring < 0.4) {
    r = Math.max(0, Math.min(r, h - crown - 0.4));
    spring = Math.max(0.3, h - r - crown);
  }
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  if (r > 0.8) {
    s.lineTo(-r, 0);
    s.lineTo(-r, spring);
    s.absarc(0, spring, r, Math.PI, 0, true);
    s.lineTo(r, 0);
  }
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h);
  s.lineTo(-w / 2, h);
  s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** a gable prism 1x1x1, ridge along x, base on y=0 */
function gable(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0.5, 0);
  s.lineTo(0, 1);
  s.lineTo(-0.5, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  g.rotateY(Math.PI / 2);
  return g;
}

/** a flat ribbon along a polyline: uv.x is distance along, uv.y across */
function ribbon(points: THREE.Vector3[], width: number, vertical = false): THREE.BufferGeometry {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let dist = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
    let n: THREE.Vector3;
    if (vertical) n = new THREE.Vector3(width / 2, 0, 0);
    else {
      const t = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
      n = new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(width / 2);
    }
    if (i > 0) dist += p.distanceTo(points[i - 1]);
    pos.push(p.x + n.x, p.y + n.y, p.z + n.z, p.x - n.x, p.y - n.y, p.z - n.z);
    uv.push(dist, 0, dist, 1);
    if (i > 0) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** walk a polyline, returning points every `step` units with their heading */
function walk(pts: [number, number][], step: number) {
  const out: { x: number; z: number; ang: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    for (let d = 0; d < len; d += step) {
      const t = d / len;
      out.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, ang });
    }
  }
  return out;
}

/** a classical temple: stepped base, a colonnade, entablature and pediment */
function temple(len: number, wid: number, colH: number, cols: number, sides: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let s = 0; s < 3; s++) parts.push(new THREE.BoxGeometry(len + 3 - s, 0.7, wid + 3 - s).translate(0, 0.35 + s * 0.7, 0));
  const base = 2.1;
  const r = Math.min(0.55, (len / cols) * 0.22);
  const col = new THREE.CylinderGeometry(r * 0.9, r, colH, 6);
  for (let i = 0; i < cols; i++) {
    const x = -len / 2 + 0.8 + (i * (len - 1.6)) / (cols - 1);
    for (const z of [-wid / 2 + 0.8, wid / 2 - 0.8]) parts.push(col.clone().translate(x, base + colH / 2, z));
  }
  for (let i = 1; i < sides - 1; i++) {
    const z = -wid / 2 + 0.8 + (i * (wid - 1.6)) / (sides - 1);
    for (const x of [-len / 2 + 0.8, len / 2 - 0.8]) parts.push(col.clone().translate(x, base + colH / 2, z));
  }
  parts.push(new THREE.BoxGeometry(len - 2.5, colH * 0.92, wid - 3).translate(0, base + colH * 0.46, 0)); // cella
  parts.push(new THREE.BoxGeometry(len + 0.4, 1.1, wid + 0.4).translate(0, base + colH + 0.55, 0));
  // ridge along the long axis, gables at the short ends
  const ped = gable().scale(len + 0.6, Math.max(1.6, wid * 0.2), wid + 0.6);
  parts.push(ped.translate(0, base + colH + 1.1, 0));
  return mergeGeometries(parts.map((p) => p.toNonIndexed()));
}

/** a blocky marble figure, about 6 units tall, with an attribute in hand */
function god(attr: "trident" | "bolt" | "spear" | "lyre"): THREE.BufferGeometry {
  const g: THREE.BufferGeometry[] = [
    new THREE.BoxGeometry(1.3, 2.6, 0.9).translate(0, 1.3, 0), // robe
    new THREE.BoxGeometry(1.5, 1.9, 1).translate(0, 3.5, 0), // chest
    new THREE.BoxGeometry(0.8, 0.9, 0.8).translate(0, 4.95, 0), // head
    new THREE.BoxGeometry(0.4, 1.8, 0.4).translate(-1, 3.4, 0), // left arm down
    new THREE.BoxGeometry(0.4, 1.7, 0.4).translate(1.05, 4.6, 0).rotateZ(-0.15), // right arm raised
  ];
  if (attr === "trident") {
    g.push(new THREE.BoxGeometry(0.18, 6.4, 0.18).translate(1.25, 4.2, 0));
    for (const dx of [-0.45, 0, 0.45]) g.push(new THREE.BoxGeometry(0.16, 0.9, 0.16).translate(1.25 + dx, 7.6, 0));
    g.push(new THREE.BoxGeometry(1.1, 0.16, 0.16).translate(1.25, 7.15, 0));
  } else if (attr === "bolt") {
    g.push(new THREE.BoxGeometry(0.3, 1.6, 0.2).translate(1.3, 6.1, 0).rotateZ(0.4));
    g.push(new THREE.BoxGeometry(0.3, 1.4, 0.2).translate(1.0, 7.1, 0).rotateZ(-0.4));
  } else if (attr === "spear") {
    g.push(new THREE.BoxGeometry(0.16, 7, 0.16).translate(1.2, 3.8, 0));
    g.push(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 8).rotateX(Math.PI / 2).translate(-1.3, 3, 0.4)); // shield
    g.push(new THREE.BoxGeometry(0.9, 0.5, 0.9).translate(0, 5.55, 0)); // helmet
  } else {
    g.push(new THREE.BoxGeometry(0.9, 1.1, 0.25).translate(1.25, 3.2, 0.5));
  }
  return mergeGeometries(g.map((p) => p.toNonIndexed()));
}

/* ------------------------------------------------------------------ */
/* the world                                                           */
/* ------------------------------------------------------------------ */

export function buildCity(): City {
  const root = new THREE.Group();
  const r = rng(20261111);
  const swayTime = { value: 0 };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc = new THREE.Vector3();
  const e = new THREE.Euler();
  const waters: THREE.ShaderMaterial[] = [];
  let foamMesh: THREE.InstancedMesh | null = null;
  let fallWater: THREE.ShaderMaterial | null = null;

  /* sky, sea and a pale island on the horizon */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), skyMat());
  sky.frustumCulled = false;
  root.add(sky);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(8000, 5000), seaMat());
  sea.geometry.setAttribute("aAmp", new THREE.BufferAttribute(new Float32Array(sea.geometry.attributes.position.count).fill(-1), 1));
  (sea.material as THREE.ShaderMaterial).uniforms.uHole.value.set(SEA_GRID.x0 + 2, SEA_GRID.z0 + 2, SEA_GRID.x1 - 2, SEA_GRID.z1 - 2);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(400, 0, -1500);
  root.add(sea);
  const islandMat = lambert("#c5d3f0");
  for (const [x, z, rad, h] of [[330, -820, 330, 70], [520, -900, 200, 38], [1100, -1000, 360, 90]] as const) {
    const isl = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7, 1), islandMat);
    isl.scale.set(1, 1, 0.35);
    isl.position.set(x, h / 2 - 2, z);
    root.add(isl);
  }

  /* terrain: pale stone cliffs, olive and green where plants hold */
  const TW = X_MAX - X_MIN;
  const tz0 = -200, tz1 = 180;
  const terr = new THREE.PlaneGeometry(TW, tz1 - tz0, Math.round(TW / 3), Math.round((tz1 - tz0) / 3));
  terr.rotateX(-Math.PI / 2);
  terr.translate(X_MIN + TW / 2, 0, (tz0 + tz1) / 2);
  const tp = terr.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) tp.setY(i, ground(tp.getX(i), tp.getZ(i)));
  const flat = terr.toNonIndexed();
  flat.computeVertexNormals();
  const fp = flat.attributes.position as THREE.BufferAttribute;
  const fn = flat.attributes.normal as THREE.BufferAttribute;
  const tcol: number[] = [];
  const cliff = C("#d6bea2"), top = C(STONE), olive = C("#b5c071"), green = C("#7f9a52"), sand = C("#f6ead9");
  const tmp = new THREE.Color();
  for (let i = 0; i < fp.count; i += 3) {
    const cx = (fp.getX(i) + fp.getX(i + 1) + fp.getX(i + 2)) / 3;
    const cz = (fp.getZ(i) + fp.getZ(i + 1) + fp.getZ(i + 2)) / 3;
    const cy = (fp.getY(i) + fp.getY(i + 1) + fp.getY(i + 2)) / 3;
    const ny = fn.getY(i);
    const n = fbm(cx * 0.14, cz * 0.14, 3);
    if (cy < 0.8) tmp.copy(sand);
    else if (ny < 0.72) tmp.copy(cliff);
    else if (n > 0.56) tmp.copy(n > 0.66 ? green : olive);
    else tmp.copy(top);
    for (let k = 0; k < 3; k++) tcol.push(tmp.r, tmp.g, tmp.b);
  }
  flat.setAttribute("color", new THREE.Float32BufferAttribute(tcol, 3));
  root.add(new THREE.Mesh(flat, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));

  /* the aqueducts */
  const stoneMat = lambert(STONE);
  const archGeos: THREE.BufferGeometry[] = [];
  const ivySpots: { x: number; y: number; z: number; ang: number }[] = [];
  AQUEDUCTS.forEach((aq, ai) => {
    const SPAN = ai === 0 ? 9 : 10;
    const steps = walk(aq.pts, SPAN);
    for (const st of steps) {
      const cx = st.x + (Math.cos(st.ang) * SPAN) / 2, cz = st.z + (Math.sin(st.ang) * SPAN) / 2;
      const gh = Math.min(ground(st.x, st.z), ground(cx, cz), ground(cx + Math.cos(st.ang) * SPAN / 2, cz + Math.sin(st.ang) * SPAN / 2)) - 1;
      const H = aq.top - gh;
      if (H < 2) continue;
      const place = (g: THREE.BufferGeometry, y: number) => {
        g.rotateY(-st.ang);
        g.translate(cx, y, cz);
        archGeos.push(g.toNonIndexed());
      };
      if (aq.tiers === 2 && H > 18) {
        const upper = 9;
        place(archSpan(SPAN + 0.02, H - upper, 4.2, 1.8, 2.4), gh);
        for (const off of [-SPAN / 4, SPAN / 4]) {
          const g = archSpan(SPAN / 2 + 0.02, upper, 3, 0.8, 1.6);
          g.translate(off, 0, 0);
          place(g, gh + H - upper);
        }
      } else {
        place(archSpan(SPAN + 0.02, H, 3.4, 1.5, 3), gh);
      }
      // channel lips
      for (const side of [-1, 1]) {
        const lip = new THREE.BoxGeometry(SPAN + 0.02, 1.3, 0.55);
        lip.translate(0, 0.65, side * 1.45);
        place(lip, aq.top);
      }
      if (ai === 0) ivySpots.push({ x: cx, y: aq.top, z: cz, ang: st.ang });
    }
    // the water in the channel
    const wp = walk(aq.pts, 2).map((p) => new THREE.Vector3(p.x, aq.top + 1.0, p.z));
    const wm = waterMat("#8aa5e0", "#eef1fa");
    waters.push(wm);
    root.add(new THREE.Mesh(ribbon(wp, 2.3), wm));
  });
  root.add(new THREE.Mesh(mergeGeometries(archGeos), stoneMat));

  /* the waterfall: the hero channel spills into the sea */
  {
    const seg = AQUEDUCTS[WATERFALL_AT.segment];
    const steps = walk(seg.pts, 1);
    // centred on an arch opening, so it never runs down the face of a pier
    const p = steps[Math.round((steps.length * WATERFALL_AT.t - 4.5) / 9) * 9 + 4];
    const out = new THREE.Vector3(-Math.sin(p.ang), 0, Math.cos(p.ang)); // toward the viewer's side
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      pts.push(new THREE.Vector3(p.x + out.x * (1.8 + t * t * 3), seg.top + 1.2 - t * (seg.top + 1.2), p.z + out.z * (1.8 + t * t * 3)));
    }
    let fallLen = 0;
    for (let k = 1; k < pts.length; k++) fallLen += pts[k].distanceTo(pts[k - 1]);
    const fall = new THREE.Mesh(ribbon(pts, 3.6, true), fallMat(fallLen));
    fallWater = fall.material as THREE.ShaderMaterial;
    waters.push(fallWater);
    root.add(fall);
    // the fine water round the hero, calmer where the fall lands so the foam sits on it
    const fine = new THREE.Mesh(seaGrid([
      { x: pts[pts.length - 1].x, z: pts[pts.length - 1].z, r: 18, low: 0.2 },
      { x: -70, z: 118, r: 58, low: 0.3 }, // and right under the hero camera, so no crest can rise in front of the lens
    ]), sea.material);
    fine.frustumCulled = false;
    root.add(fine);
    // foam where it lands
    const foam = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.25, 1), new THREE.MeshBasicMaterial({ color: C("#fff9dc") }), 22);
    const foamSeed = Array.from({ length: 22 }, () => ({ dx: (r() - 0.5) * 9, dz: (r() - 0.5) * 4, s: 0.4 + r() * 0.8, ph: r() * 6 }));
    foam.userData = { at: pts[pts.length - 1], foamSeed };
    root.add(foam);
    foamMesh = foam;
  }

  /* ivy and bushes along the hero aqueduct, the way the reference drapes it */
  const bushGeo = new THREE.IcosahedronGeometry(1, 0);
  const ivyMat = lambert("#b5c071");
  addSway(ivyMat, swayTime, 0.04);
  const ivy = new THREE.InstancedMesh(bushGeo, ivyMat, 900);
  let ivyN = 0;
  const hangGeo = new THREE.BoxGeometry(0.7, 1, 0.5).translate(0, -0.5, 0);
  const hangMat = lambert("#7f9a52");
  const hangs = new THREE.InstancedMesh(hangGeo, hangMat, 400);
  let hangN = 0;
  for (const s of ivySpots) {
    if (r() < 0.6) continue;
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n && ivyN < 900; k++) {
      const a = (r() - 0.5) * 8;
      const side = r() < 0.5 ? -1 : 1;
      const x = s.x + Math.cos(s.ang) * a - Math.sin(s.ang) * side * 1.6;
      const z = s.z + Math.sin(s.ang) * a + Math.cos(s.ang) * side * 1.6;
      const sz = 0.5 + r() * 0.8;
      m4.compose(v3.set(x, s.y + 1.2 + r() * 0.6, z), q.identity(), sc.set(sz * 1.3, sz * 0.8, sz));
      ivy.setMatrixAt(ivyN++, m4);
      if (r() < 0.35 && hangN < 400) {
        m4.compose(v3.set(x, s.y + 1.1, z + side * 0.3), q.identity(), sc.set(0.8, 1.5 + r() * 5, 0.8));
        hangs.setMatrixAt(hangN++, m4);
      }
    }
  }

  /* trees: blue-green cypresses and round shrubs, swaying a few pixels */
  const cyGeo = new THREE.ConeGeometry(1, 9, 6).translate(0, 4.5, 0);
  const cyMat = lambert("#4f6f63");
  addSway(cyMat, swayTime, 0.035);
  const cypress = new THREE.InstancedMesh(cyGeo, cyMat, 500);
  let cyN = 0;
  const shrubs = new THREE.InstancedMesh(bushGeo, ivyMat, 1500);
  let shN = 0;
  const plant = (x: number, z: number, kind: "cy" | "sh", s = 1) => {
    const y = ground(x, z);
    if (y < 1) return;
    if (kind === "cy" && cyN < 500) {
      m4.compose(v3.set(x, y - 0.3, z), q.identity(), sc.set(s, s * (0.8 + r() * 0.7), s));
      cypress.setMatrixAt(cyN++, m4);
    } else if (shN < 1500) {
      m4.compose(v3.set(x, y + 0.3, z), q.identity(), sc.set(s * 1.6, s * 1.1, s * 1.6));
      shrubs.setMatrixAt(shN++, m4);
    }
  };

  /* hero: the acropolis */
  const marble = lambert(MARBLE);
  const marbleGeos: THREE.BufferGeometry[] = [];
  const addMarble = (g: THREE.BufferGeometry, x: number, y: number, z: number, rot = 0) => {
    g.rotateY(rot);
    g.translate(x, y, z);
    marbleGeos.push(g.toNonIndexed());
  };
  const groundTop = (x: number, z: number, w: number, d: number) =>
    Math.max(ground(x - w / 2, z - d / 2), ground(x + w / 2, z - d / 2), ground(x - w / 2, z + d / 2), ground(x + w / 2, z + d / 2), ground(x, z));
  {
    const px = 82, pz = -66;
    addMarble(temple(40, 18, 13, 14, 7), px, groundTop(px, pz, 40, 18) - 0.3, pz, 0.2);
    addMarble(temple(13, 8, 6, 5, 3), 54, groundTop(54, -48, 13, 8) - 0.3, -48, 0.25);
    addMarble(temple(12, 7, 5.5, 5, 3), 138, groundTop(138, -40, 12, 7) - 0.3, -40, 0.15);
    addMarble(temple(10, 6, 5, 4, 3), 120, groundTop(120, -18, 10, 6) - 0.3, -18, 0.3);
    // a stair climbing the rock
    for (let s = 0; s < 14; s++) {
      const x = 104 + s * 1.2, z = -22 - s * 1.6;
      addMarble(new THREE.BoxGeometry(5, 0.8, 2), x, ground(x, z) - 0.2, z, 0.55);
    }
  }

  /* houses: white cubes with small windows on the skirts of the rock */
  type Box = { x: number; z: number; w: number; d: number; h: number; y: number; rot: number };
  const boxes: Box[] = [];
  const houseZone = (x: number, z: number) => {
    const g = ground(x, z);
    return g > 2 && g < 20;
  };
  for (let i = 0; i < 6000 && boxes.length < 110; i++) {
    const x = 20 + r() * 170, z = -100 + r() * 110;
    if (!houseZone(x, z)) continue;
    const w = 3 + r() * 4, d = 3 + r() * 3;
    if (boxes.some((b) => Math.abs(b.x - x) < (b.w + w) / 2 + 0.5 && Math.abs(b.z - z) < (b.d + d) / 2 + 0.5)) continue;
    const y = Math.min(ground(x - w / 2, z - d / 2), ground(x + w / 2, z + d / 2)) - 0.6;
    boxes.push({ x, z, w, d, h: 3 + Math.floor(r() * 2) * 2.6, y, rot: 0.2 + (r() - 0.5) * 0.25 });
  }
  // forum town
  for (let i = 0; i < 6000 && boxes.length < 150; i++) {
    const x = DISTRICTS.forum - 120 + r() * 240, z = -70 + r() * 100;
    if (ground(x, z) < 2 || Math.hypot(x - DISTRICTS.forum, z + 20) < 40) continue;
    const w = 3 + r() * 4, d = 3 + r() * 3;
    if (boxes.some((b) => Math.abs(b.x - x) < (b.w + w) / 2 + 0.5 && Math.abs(b.z - z) < (b.d + d) / 2 + 0.5)) continue;
    boxes.push({ x, z, w, d, h: 3 + Math.floor(r() * 2) * 2.6, y: ground(x, z) - 0.6, rot: (r() - 0.5) * 0.3 });
  }
  const boxGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const houses = new THREE.InstancedMesh(boxGeo, lambert("#fff9dc"), boxes.length);
  const roofs = new THREE.InstancedMesh(gable(), lambert("#a9bdea"), boxes.length);
  const winGeo = new THREE.BoxGeometry(0.6, 0.9, 0.12);
  const winDay = C("#5574c2");
  const winLitMat = new THREE.MeshBasicMaterial({ color: winDay });
  const winDarkMat = new THREE.MeshBasicMaterial({ color: winDay });
  const winLit = new THREE.InstancedMesh(winGeo, winLitMat, boxes.length * 4);
  const winDark = new THREE.InstancedMesh(winGeo, winDarkMat, boxes.length * 4);
  let roofN = 0, litN = 0, darkN = 0;
  boxes.forEach((b, i) => {
    q.setFromEuler(e.set(0, b.rot, 0));
    m4.compose(v3.set(b.x, b.y, b.z), q, sc.set(b.w, b.h, b.d));
    houses.setMatrixAt(i, m4);
    if (r() < 0.3) {
      m4.compose(v3.set(b.x, b.y + b.h, b.z), q, sc.set(b.w + 0.4, 1.2, b.d + 0.4));
      roofs.setMatrixAt(roofN++, m4);
    }
    const storeys = Math.max(1, Math.round((b.h - 0.4) / 2.6));
    for (let s = 0; s < storeys; s++) {
      for (const lx of b.w > 4.5 ? [-b.w * 0.22, b.w * 0.22] : [0]) {
        if (r() < 0.2) continue;
        const local = new THREE.Vector3(lx, b.y + 1.5 + s * 2.6, b.d / 2 + 0.03).applyAxisAngle(new THREE.Vector3(0, 1, 0), b.rot);
        m4.compose(v3.set(b.x + local.x, local.y, b.z + local.z), q, sc.set(1, 1, 1));
        if (r() < 0.6) winLit.setMatrixAt(litN++, m4);
        else winDark.setMatrixAt(darkN++, m4);
      }
    }
    // shrubs and cypresses tucked among the houses
    if (r() < 0.6) plant(b.x + b.w / 2 + 1.5, b.z + (r() - 0.5) * b.d, r() < 0.4 ? "cy" : "sh", 0.8 + r() * 0.4);
  });
  roofs.count = roofN;
  winLit.count = litN;
  winDark.count = darkN;

  // vegetation over the hero rock, shores and the forum hills
  for (let i = 0; i < 9000; i++) {
    const x = X_MIN + r() * (X_MAX - X_MIN), z = -160 + r() * 300;
    const g = ground(x, z);
    if (g < 1.2) continue;
    if (fbm(x * 0.05, z * 0.05, 2) < 0.5) continue;
    if (Math.hypot(x - DISTRICTS.forum, z + 20) < 46) continue;
    plant(x, z, r() < 0.22 ? "cy" : "sh", 0.7 + r() * 0.8);
  }
  // the tall cypresses on the left of the hero, framing it like the reference
  for (const [x, z, s] of [[-176, 64, 2.1], [-168, 58, 1.6], [-186, 52, 1.4], [-158, 70, 1.2]] as const) {
    const y = ground(x, z);
    m4.compose(v3.set(x, Math.max(y, 0) - 0.3, z), q.identity(), sc.set(s, s * 1.5, s));
    cypress.setMatrixAt(cyN++, m4);
  }

  /* forum: the Colosseum, the Pantheon, and the gods */
  const F = DISTRICTS.forum;
  {
    // Colosseum: three tiers of arches round an ellipse, its seaward side broken down
    const cx = F - 24, cz = -24, R = 22;
    const bays = 36;
    for (let tier = 0; tier < 3; tier++) {
      for (let b = 0; b < bays; b++) {
        const a = (b / bays) * Math.PI * 2;
        // the ruin: the top tier is missing across a third of the ring
        if (tier === 2 && a > 0.4 && a < 2.4) continue;
        if (tier === 1 && a > 0.9 && a < 1.8) continue;
        const w = (2 * Math.PI * R) / bays + 0.05;
        const g = archSpan(w, 6.2, 2.2, 0.5, 1.4);
        g.rotateY(-a + Math.PI / 2);
        const x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R * 0.82;
        g.translate(x, ground(cx, cz) - 0.3 + tier * 6.2, z);
        marbleGeos.push(g.toNonIndexed());
      }
    }
    // the arena floor
    const floor = new THREE.CylinderGeometry(R - 2, R - 2, 1, 24);
    floor.scale(1, 1, 0.82);
    addMarble(floor, cx, ground(cx, cz) + 0.2, cz);

    // Pantheon: drum, dome and portico
    const px = F + 46, pz = -30, py = ground(px, pz) - 0.3;
    addMarble(new THREE.CylinderGeometry(12, 12, 13, 20), px, py + 6.5, pz);
    addMarble(new THREE.SphereGeometry(12, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), px, py + 13, pz);
    addMarble(new THREE.CylinderGeometry(2.2, 2.2, 1.2, 10), px, py + 24.6, pz); // the oculus ring
    addMarble(temple(17, 9, 9, 8, 3), px, py, pz + 15, 0);

    // the gods on their plinths along the forum, and Poseidon in the harbour
    const gods: [("trident" | "bolt" | "spear" | "lyre"), number, number, number][] = [
      ["bolt", F + 10, 8, 1.3],
      ["spear", F + 20, 10, 1.15],
      ["lyre", F - 2, 12, 1.1],
      ["trident", F + 30, 8, 1.1],
    ];
    for (const [attr, x, z, s] of gods) {
      const y = ground(x, z);
      addMarble(new THREE.BoxGeometry(3, 2.4, 3), x, y - 0.2, z);
      const g = god(attr);
      g.scale(s, s, s);
      addMarble(g, x, y + 2.2, z, -0.3);
    }
    const colossus = god("trident");
    colossus.scale(5.2, 5.2, 5.2);
    addMarble(new THREE.CylinderGeometry(9, 10, 6, 10), F + 90, 0, 44);
    addMarble(colossus, F + 90, 3, 44, -0.5);
    // a temple of Zeus up on the hill behind
    addMarble(temple(22, 11, 8, 9, 5), F - 70, groundTop(F - 70, -84, 22, 11) - 0.3, -84, 0.1);
  }

  /* sift: the archive's fountain court, fed by a stone channel */
  const S = DISTRICTS.sift;
  const jetPts: THREE.Vector3[] = [];
  {
    const py = ground(S, -10);
    // paving
    for (let i = -6; i <= 6; i++) for (let j = -4; j <= 3; j++) {
      if (r() < 0.25) continue;
      addMarble(new THREE.BoxGeometry(5.8, 0.3, 5.8), S + i * 6, py + 0.05, -10 + j * 6);
    }
    // the archive: a long stoa with a colonnade, and a library hall behind
    addMarble(temple(46, 10, 8, 16, 3), S, groundTop(S, -44, 46, 10) - 0.3, -44, 0);
    addMarble(new THREE.BoxGeometry(30, 12, 12), S - 4, ground(S, -60) - 0.3 + 6, -60);
    // the basin, its rim, and the water in it
    addMarble(new THREE.CylinderGeometry(9, 9.6, 1.6, 18), S, py + 0.8, -10);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.2, 18), waterMat("#8aa5e0", "#eef1fa", 0.4));
    basin.position.set(S, py + 1.55, -10);
    waters.push(basin.material as THREE.ShaderMaterial);
    root.add(basin);
    addMarble(new THREE.CylinderGeometry(1.1, 1.6, 4, 8), S, py + 3, -10);
    for (let k = 0; k <= 8; k++) jetPts.push(new THREE.Vector3(S, py + 5 + k * 0.55, -10));
    const jet = new THREE.Mesh(ribbon(jetPts, 0.9, true), waterMat("#c5d3f0", "#fff9dc", 1.4));
    waters.push(jet.material as THREE.ShaderMaterial);
    root.add(jet);
    // the channel in and out of the court, a stone runnel with water in it
    for (const [x0, x1] of [[S - 90, S - 9], [S + 9, S + 90]]) {
      const len = x1 - x0, cx = (x0 + x1) / 2;
      for (const side of [-1.5, 1.5]) addMarble(new THREE.BoxGeometry(len, 1.2, 0.6), cx, py + 0.4, -10 + side);
      const wp = [new THREE.Vector3(x0, py + 0.9, -10), new THREE.Vector3(x1, py + 0.9, -10)];
      const wm = waterMat("#8aa5e0", "#eef1fa", 0.9);
      waters.push(wm);
      root.add(new THREE.Mesh(ribbon(wp, 2.4), wm));
    }
    for (const [x, z] of [[S - 30, 6], [S + 28, 8], [S - 52, -24], [S + 50, -26]]) plant(x, z, "cy", 1.1);
  }

  /* forum garden: a long pool, fallen and broken columns, urns */
  {
    const px = F + 6, pz = 22, py = ground(px, pz);
    addMarble(new THREE.BoxGeometry(44, 1.2, 10), px, py - 0.2, pz);
    const pool = new THREE.Mesh(new THREE.BoxGeometry(42, 0.2, 8), waterMat("#8aa5e0", "#eef1fa", 0.3));
    pool.position.set(px, py + 0.55, pz);
    waters.push(pool.material as THREE.ShaderMaterial);
    root.add(pool);
    const drum = new THREE.CylinderGeometry(0.9, 0.9, 2.6, 8);
    for (let i = 0; i < 9; i++) {
      const x = F - 60 + r() * 130, z = -6 + r() * 34;
      if (Math.abs(z - pz) < 7 && Math.abs(x - px) < 24) continue;
      const g = drum.clone();
      g.rotateZ(Math.PI / 2);
      g.rotateY(r() * 3);
      addMarble(g, x, ground(x, z) + 0.6, z);
    }
    for (let i = 0; i < 8; i++) {
      const x = F - 50 + i * 15 + r() * 4, z = 8 + (i % 2) * 22;
      const hgt = 3 + r() * 6;
      addMarble(new THREE.CylinderGeometry(0.85, 0.95, hgt, 8), x, ground(x, z) + hgt / 2, z);
    }
    const urnPts = [[0, 0], [0.9, 0.1], [0.5, 0.5], [1.1, 1.3], [1.3, 2], [0.8, 2.3]].map(([a, b]) => new THREE.Vector2(a, b));
    const urn = new THREE.LatheGeometry(urnPts, 8);
    for (const [x, z] of [[px - 24, pz - 4], [px + 24, pz - 4], [px - 24, pz + 4], [px + 24, pz + 4]]) {
      addMarble(new THREE.BoxGeometry(2, 1.2, 2), x, ground(x, z) + 0.6, z);
      addMarble(urn.clone(), x, ground(x, z) + 1.2, z);
    }
  }

  /* ending: the harbour, boats, a lighthouse, the last spill, and a figure
     sitting on the arches with their legs over the edge */
  const E = DISTRICTS.ending;
  const sitter = new THREE.Group();
  const boats: THREE.Group[] = [];
  {
    const top = AQUEDUCTS[1].top;
    const sx = E - 40, sz = 4 + (20 / 64) * -10;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.7).translate(0, 0.7, 0), lambert("#2f4a94"));
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6).translate(0, 1.75, 0), lambert("#ead6bd"));
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.3).translate(0, 0.1, 0.55), lambert("#1b2b5a"));
    const shins = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.4).translate(0, -0.55, 1.15), lambert("#1b2b5a"));
    sitter.add(body, head, legs, shins);
    sitter.position.set(sx, top + 1.3, sz + 1.5);
    sitter.rotation.y = -0.15;
    root.add(sitter);
    // the spill: the channel pours out into the harbour
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      pts.push(new THREE.Vector3(HARBOUR_SPILL.x + 1.5 + t * t * 4, top + 1.2 - t * (top + 1.2), HARBOUR_SPILL.z));
    }
    const sm = waterMat("#c5d3f0", "#fff9dc", 1.9);
    waters.push(sm);
    const spill = new THREE.Mesh(ribbon(pts, 3, true), sm);
    spill.rotation.y = 0;
    root.add(spill);
    // the quay: a row of houses with pitched roofs and windows that light at night
    const roofMat = lambert("#a9bdea");
    for (let i = 2; i < 9; i++) {
      const x = E + 22 + i * 12, z = -36 - r() * 10;
      const w = 6 + r() * 3, hgt = 4 + Math.floor(r() * 3) * 2;
      const base = ground(x, -34) - 0.4;
      addMarble(new THREE.BoxGeometry(w, hgt, 7), x, base + hgt / 2, z);
      const roof = new THREE.Mesh(gable(), roofMat);
      roof.scale.set(w + 0.6, 1.8 + r(), 7.6);
      roof.position.set(x, base + hgt, z);
      root.add(roof);
      for (let fl = 0; fl < hgt / 2 - 1; fl++)
        for (const dx of [-w * 0.24, w * 0.24]) {
          if (r() < 0.25) continue;
          const win = new THREE.Mesh(winGeo, winLitMat);
          win.scale.setScalar(1.5);
          win.position.set(x + dx, base + 2 + fl * 2, z + 3.56);
          root.add(win);
        }
    }
    // the lighthouse, out on a rock beyond the harbour mouth
    {
      const lx = E + 128, lz = -64;
      addMarble(new THREE.CylinderGeometry(7, 10, 3, 9), lx, 0.8, lz);
      addMarble(new THREE.CylinderGeometry(2.2, 3.4, 18, 10), lx, 11, lz);
      const band = lambert("#3f5cab");
      for (const [y, rad] of [[7, 3.05], [13, 2.65]] as const) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(rad - 0.12, rad + 0.12, 2.6, 10), band);
        st.position.set(lx, y, lz);
        root.add(st);
      }
      addMarble(new THREE.CylinderGeometry(3.2, 3.2, 0.6, 10), lx, 20.3, lz); // gallery
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.6, 8), new THREE.MeshBasicMaterial({ color: C("#ffd37a") }));
      lamp.position.set(lx, 21.9, lz);
      root.add(lamp);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.4, 8), band);
      cap.position.set(lx, 24.4, lz);
      root.add(cap);
    }
    // boats
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Group();
      // a small sailing boat: a hull with a raked bow and a raised stern, a
      // rail stripe, a mast, a mainsail and a jib
      const side = new THREE.Shape();
      side.moveTo(-2.9, 1.5);
      side.lineTo(-2.3, 0.15);
      side.lineTo(-1.6, -0.25);
      side.lineTo(1.6, -0.25);
      side.lineTo(2.6, 0.4);
      side.lineTo(3.7, 1.45);
      side.lineTo(2.4, 1.05);
      side.lineTo(-2.2, 1.05);
      side.closePath();
      const hullCol = i % 2 ? "#fff9dc" : "#2f4a94";
      const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(side, { depth: 1.7, bevelEnabled: false }).translate(0, 0, -0.85), lambert(hullCol));
      const rail = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.22, 1.8).translate(0.1, 1.0, 0), lambert(i % 2 ? "#2f4a94" : "#e3b21c"));
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.4, 0.18).translate(0.2, 4.2, 0), lambert("#7b6650"));
      const cloth = new THREE.MeshBasicMaterial({ color: C("#fff9dc"), side: THREE.DoubleSide });
      const main = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-2.7, 0.15), new THREE.Vector2(0, 5.2)])), cloth);
      main.position.set(0.05, 1.7, 0);
      const jib = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(2.9, 0), new THREE.Vector2(0, 4.6)])), cloth);
      jib.position.set(0.4, 1.55, 0);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.06).translate(0.7, 7.2, 0), lambert("#c8673a"));
      b.add(hull, rail, mast, main, jib, flag);
      b.position.set(E + 30 + i * 15 + r() * 6, 0, -6 + r() * 26);
      b.rotation.y = r() * 0.6 - 0.3;
      b.userData.ph = r() * 6;
      // one boat sits close, looking out over the harbour
      if (i === 0) {
        b.position.set(E + 86, 0, 30);
        b.rotation.y = 0.35;
        b.scale.setScalar(2);
      }
      boats.push(b);
      root.add(b);
    }
  }

  root.add(new THREE.Mesh(mergeGeometries(marbleGeos), marble));
  cypress.count = cyN;
  shrubs.count = shN;
  ivy.count = ivyN;
  hangs.count = hangN;
  root.add(houses, roofs, winLit, winDark, cypress, shrubs, ivy, hangs);

  /* clouds: soft white puffs, drifting */
  const cloudGeo = mergeGeometries([0, 1, 2, 3, 4].map((i) =>
    new THREE.IcosahedronGeometry(1, 1).scale(6 + (i % 3) * 2, 3.4 + (i % 2) * 1.6, 4).translate(i * 6 - 12, (i % 2) * 1.8 + (i === 2 ? 2.4 : 0), (i % 3) - 1).toNonIndexed()
  ));
  const clouds = new THREE.InstancedMesh(cloudGeo, lambert("#fff9dc"), 16);
  clouds.frustumCulled = false;
  const cloudSeed = Array.from({ length: 16 }, () => ({ x: r() * 1500 - 300, y: 48 + r() * 40, z: -260 - r() * 220, s: 0.9 + r() * 1.2 }));
  root.add(clouds);

  /* birds: a few small dark Vs crossing now and then */
  const birdGeo = mergeGeometries([
    new THREE.BoxGeometry(1.2, 0.16, 0.3).translate(-0.55, 0, 0).rotateZ(0.4),
    new THREE.BoxGeometry(1.2, 0.16, 0.3).translate(0.55, 0, 0).rotateZ(-0.4),
  ].map((g) => g.toNonIndexed()));
  const BIRDS = 6;
  const birds = new THREE.InstancedMesh(birdGeo, new THREE.MeshBasicMaterial({ color: C("#3f5cab") }), BIRDS);
  birds.frustumCulled = false;
  const birdSeed = Array.from({ length: BIRDS }, (_, i) => ({
    period: 24 + r() * 16,
    offset: (i % 3) * 0.7 + Math.floor(i / 3) * 13,
    y: 46 + r() * 10,
    z: -40 + r() * 30,
    dir: i < 3 ? 1 : -1,
  }));
  root.add(birds);

  /* theme and sky hooks */
  const stoneDay = C(STONE), stoneNight = C("#6c7298");
  const marbleDay = C(MARBLE), marbleNight = C("#8f93b8");
  function setNight(n: boolean) {
    (sky.material as THREE.ShaderMaterial).uniforms.uNight.value = n ? 1 : 0;
    const su = (sky.material as THREE.ShaderMaterial).uniforms;
    su.uSky.value.set(n ? "#0f1630" : "#fbf1c4");
    (sea.material as THREE.ShaderMaterial).uniforms.uNight.value = n ? 1 : 0;
    (sea.material as THREE.ShaderMaterial).uniforms.uRamp.value = (n ? SEA_NIGHT : SEA_DAY).map(C);
    winLitMat.color.set(n ? "#ffd37a" : winDay);
    winDarkMat.color.set(n ? "#162044" : winDay);
    stoneMat.color.copy(n ? stoneNight : stoneDay);
    marble.color.copy(n ? marbleNight : marbleDay);
    islandMat.color.set(n ? "#1a2448" : "#c5d3f0");
    for (const m of waters) {
      m.uniforms.uBase.value.set(n ? "#34457a" : "#8aa5e0");
      m.uniforms.uLight.value.set(n ? "#5a74b8" : "#eef1fa");
    }
  }
  function setSky(haze: THREE.Color, _sunDir: THREE.Vector3) {
    (sky.material as THREE.ShaderMaterial).uniforms.uHaze.value.copy(haze);
    (sea.material as THREE.ShaderMaterial).uniforms.uHaze.value.copy(haze);
  }

  function update(t: number, tq: number, camX: number) {
    swayTime.value = tq;
    // the sea and the waterfall step twelve times a second, the same as the sea in the closing scene
    const t12 = Math.floor(t * 12) / 12;
    (sea.material as THREE.ShaderMaterial).uniforms.uTime.value = t12;
    for (const m of waters) m.uniforms.uTime.value = m === fallWater ? t12 : t;
    // foam at the foot of the waterfall bobs in pixel steps
    if (foamMesh) {
      const { at, foamSeed } = foamMesh.userData as { at: THREE.Vector3; foamSeed: { dx: number; dz: number; s: number; ph: number }[] };
      foamSeed.forEach((f, i) => {
        const b = 0.5 + 0.5 * Math.sin(tq * 3 + f.ph);
        m4.compose(v3.set(at.x + f.dx * (0.7 + b * 0.5), 0.9, at.z + f.dz), q.identity(), sc.setScalar(f.s * (0.8 + b * 0.4)));
        foamMesh!.setMatrixAt(i, m4);
      });
      foamMesh.instanceMatrix.needsUpdate = true;
    }
    // the figure on the arches swings their legs now and then
    sitter.children[3].rotation.x = Math.floor(tq * 2) % 6 === 0 ? 0.3 : 0;
    // boats bob in pixel steps
    for (const b of boats) {
      b.position.y = Math.round(Math.sin(tq * 1.2 + b.userData.ph) * 2) * 0.18;
      b.rotation.z = Math.sin(tq * 0.9 + b.userData.ph) * 0.04;
    }
    // clouds drift east, wrapping around the viewer
    cloudSeed.forEach((c, i) => {
      const span = 1500;
      const x = ((((c.x + t * 0.8 - camX + 600) % span) + span) % span) + camX - 600;
      m4.compose(v3.set(x, c.y, c.z), q.identity(), sc.setScalar(c.s));
      clouds.setMatrixAt(i, m4);
    });
    clouds.instanceMatrix.needsUpdate = true;
    // birds: a small flock crosses every so often, flapping at the pixel cadence
    birdSeed.forEach((b, i) => {
      const ph = ((t + b.offset) % b.period) / 14;
      if (ph > 1) m4.compose(v3.set(0, -200, 0), q.identity(), sc.setScalar(0));
      else {
        const x = camX + b.dir * (-120 + ph * 240) + (i % 3) * 3;
        const flap = Math.floor(tq * 10 + i) % 2 ? 0.4 : 1;
        q.setFromEuler(e.set(0, b.dir > 0 ? 0 : Math.PI, 0));
        m4.compose(v3.set(x, b.y + (i % 3) * 1.6 + Math.sin(ph * 5) * 1.5, b.z + (i % 3) * 2), q, sc.set(1.6, flap * 1.6, 1.6));
      }
      birds.setMatrixAt(i, m4);
    });
    birds.instanceMatrix.needsUpdate = true;
  }

  return { root, update, setNight, setSky };
}

