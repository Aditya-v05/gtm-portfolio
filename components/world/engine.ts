import * as THREE from "three";
import { buildCity } from "./city";
import { DISTRICTS, ground, type DistrictName } from "./layout";
import { DAY_PALETTE, NIGHT_PALETTE, DAY_BG, NIGHT_BG, DAY_SKY, NIGHT_SKY, hexToRgb } from "./palette";
import { smoothstep } from "./rng";

// Colours are authored as sRGB and treated as plain numbers end to end: the
// look is a palette painting, not a physically lit render.
THREE.ColorManagement.enabled = false;

/** a place on the page that looks into the world */
export type WorldWindow = {
  district: DistrictName;
  rect: { left: number; top: number; width: number; height: number };
  /** which edges dissolve into the page, in CSS px */
  fade: { left: number; right: number; bottom: number; top: number };
};

export type WorldHandle = {
  setNight: (night: boolean) => void;
  /** play the opening water sequence in the hero */
  intro: () => void;
  resize: () => void;
  /** redraw now (used when scrolling with reduced motion) */
  poke: () => void;
  dispose: () => void;
};

const MAX_COLOURS = 24;
const MAX_WINDOWS = 6;
// the shader's palette array is fixed-size; pad with the last colour (unused past uCount)
const padPalette = (pal: string[]) =>
  Array.from({ length: MAX_COLOURS }, (_, i) => new THREE.Vector3(...hexToRgb(pal[Math.min(i, pal.length - 1)])));

const postMat = () =>
  new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    transparent: true,
    uniforms: {
      tScene: { value: null },
      uLow: { value: new THREE.Vector2(1, 1) },
      uCell: { value: 4 },
      uDot: { value: 0.5 },
      uBg: { value: new THREE.Vector3(...hexToRgb(DAY_BG)) },
      uOutline: { value: new THREE.Vector3(...hexToRgb("#5574c2")) },
      uPal: { value: padPalette(DAY_PALETTE) },
      uCount: { value: DAY_PALETTE.length },
      uWin: { value: Array.from({ length: MAX_WINDOWS }, () => new THREE.Vector4()) },
      uFade: { value: Array.from({ length: MAX_WINDOWS }, () => new THREE.Vector4()) },
      uWinCount: { value: 0 },
    },
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tScene;
      uniform vec2 uLow;
      uniform float uCell, uDot;
      uniform vec3 uBg, uOutline;
      uniform vec3 uPal[${MAX_COLOURS}];
      uniform int uCount;
      uniform vec4 uWin[${MAX_WINDOWS}];   // x0, y0, x1, y1 in low-res cells (y up)
      uniform vec4 uFade[${MAX_WINDOWS}];  // left, right, bottom, top fade widths in cells
      uniform int uWinCount;

      float bayer4(vec2 p) {
        vec2 q = mod(p, 4.0);
        int i = int(q.x) + int(q.y) * 4;
        float m[16];
        m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0; m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
        m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0; m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;
        for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0;
        return 0.5;
      }
      float dist2(vec3 a, vec3 b) { vec3 d = a - b; return dot(d * d, vec3(0.30, 0.59, 0.11)); }
      vec4 at(vec2 cell) { return texture2D(tScene, (cell + 0.5) / uLow); }
      // the sky draws itself with alpha 0.6, everything else with 1, empty is 0
      bool isSky(vec2 cell) {
        float a = at(cell).a;
        return a > 0.3 && a < 0.8;
      }

      void main() {
        vec2 cell = floor(gl_FragCoord.xy / uCell);
        vec4 src = at(cell);
        if (src.a < 0.3) discard;

        // dissolve each window's chosen edges into the page, in dithered steps
        float keep = 1.0;
        for (int w = 0; w < ${MAX_WINDOWS}; w++) {
          if (w >= uWinCount) break;
          vec4 r = uWin[w];
          if (cell.x < r.x || cell.x >= r.z || cell.y < r.y || cell.y >= r.w) continue;
          vec4 f = uFade[w];
          if (f.x > 0.0) keep = min(keep, (cell.x - r.x) / f.x);
          if (f.y > 0.0) keep = min(keep, (r.z - 1.0 - cell.x) / f.y);
          if (f.z > 0.0) keep = min(keep, (cell.y - r.y) / f.z);
          if (f.w > 0.0) keep = min(keep, (r.w - 1.0 - cell.y) / f.w);
        }
        if (bayer4(cell) >= clamp(keep, 0.0, 1.0)) discard;

        vec3 c = src.rgb;
        bool sky = src.a < 0.8;
        if (!sky && (isSky(cell + vec2(1.0, 0.0)) || isSky(cell - vec2(1.0, 0.0)) || isSky(cell + vec2(0.0, 1.0)) || isSky(cell - vec2(0.0, 1.0)))) {
          gl_FragColor = vec4(uOutline, 1.0);
          return;
        }
        vec3 a = uPal[0], b = uPal[0];
        float da = 1e9, db = 1e9;
        // leaf greens only for surfaces that are actually green, so warm
        // stone in shade never dithers toward olive
        float green = c.g - (c.r + c.b) * 0.5;
        for (int k = 0; k < ${MAX_COLOURS}; k++) {
          if (k >= uCount) break;
          vec3 p = uPal[k];
          if (p.g - (p.r + p.b) * 0.5 > 0.08 && green < 0.05) continue;
          float d = dist2(c, p);
          if (d < da) { db = da; b = a; da = d; a = uPal[k]; }
          else if (d < db) { db = d; b = uPal[k]; }
        }
        float ratio = da / max(da + db, 1e-6);
        // dither only where two colours are genuinely close, so flats stay flat
        vec3 col = (ratio > 0.32 && bayer4(cell) < ratio * 0.9) ? b : a;
        vec2 local = fract(gl_FragCoord.xy / uCell) - 0.5;
        float aa = 1.0 / uCell;
        float m = uDot >= 0.5 ? 1.0 : 1.0 - smoothstep(uDot - aa, uDot + aa, length(local));
        gl_FragColor = vec4(mix(uBg, col, m), 1.0);
      }`,
  });

type Station = { pos: THREE.Vector3; look: THREE.Vector3; fov: number };

/** each district's camera */
function station(name: DistrictName): Station {
  const x = DISTRICTS[name];
  switch (name) {
    case "hero":
      // low over the water: the aqueduct striding away on the left, the
      // acropolis on the right, the horizon low so the sky holds the name
      return { pos: new THREE.Vector3(-70, 8, 118), look: new THREE.Vector3(48, 30, -52), fov: 44 };
    case "sift":
      return { pos: new THREE.Vector3(x - 6, 26, 58), look: new THREE.Vector3(x, 10, -30), fov: 40 };
    case "forum":
      return { pos: new THREE.Vector3(x + 4, 13, 150), look: new THREE.Vector3(x + 10, 15, -20), fov: 40 };
    case "ending":
      // open harbour: a boat in the foreground, the quay and lighthouse beyond
      // the same height and upward tilt as the hero, so the sea and its waves read the same
      return { pos: new THREE.Vector3(x + 100, 8, 112), look: new THREE.Vector3(x + 112, 30, -58), fov: 44 };
    default:
      return { pos: new THREE.Vector3(x - 10, ground(x - 10, 60) + 16, 60), look: new THREE.Vector3(x, 10, -12), fov: 42 };
  }
}

export function createWorld(
  canvas: HTMLCanvasElement,
  opts: { reduced: boolean; night: boolean; windows: () => WorldWindow[] }
): WorldHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdce4f5, 260, 1300);
  // blue in the shadows, like the reference: the ground colour is periwinkle.
  // (three.js divides diffuse by pi, hence the high intensities)
  const hemi = new THREE.HemisphereLight(0xfffaf2, 0x7a96d8, 2.2);
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.0);
  scene.add(hemi, sun, sun.target);
  const city = buildCity();
  scene.add(city.root);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 5000);

  const rt = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
  });
  const post = postMat();
  post.uniforms.tScene.value = rt.texture;
  const postScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post);
  quad.frustumCulled = false;
  postScene.add(quad);
  const postCam = new THREE.Camera();

  // one pixel per `cellCss` CSS pixels
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let cellCss = window.innerWidth < 720 ? 1.6 : 2;
  let lw = 1, lh = 1, vw = 1, vh = 1;
  let dirty = true;
  function resize() {
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    const W = Math.round(vw * dpr), H = Math.round(vh * dpr);
    renderer.setSize(W, H, false);
    const cell = cellCss * dpr;
    lw = Math.ceil(W / cell);
    lh = Math.ceil(H / cell);
    rt.setSize(lw, lh);
    post.uniforms.uLow.value.set(lw, lh);
    post.uniforms.uCell.value = cell;
    dirty = true;
  }

  let night = opts.night;
  function setNight(n: boolean, instant = false) {
    night = n;
    city.setNight(n, instant || opts.reduced);
    const pal = n ? NIGHT_PALETTE : DAY_PALETTE;
    post.uniforms.uPal.value = padPalette(pal);
    post.uniforms.uCount.value = pal.length;
    post.uniforms.uBg.value.set(...hexToRgb(n ? NIGHT_BG : DAY_BG));
    post.uniforms.uOutline.value.set(...hexToRgb(n ? "#5a74b8" : "#5574c2"));
    hemi.color.set(n ? 0x6f7aa8 : 0xfffaf2);
    hemi.groundColor.set(n ? 0x141a38 : 0x7a96d8);
    hemi.intensity = n ? 1.5 : 2.2;
    sun.intensity = n ? 1.0 : 2.0;
    sun.color.set(n ? 0xbfc8ff : 0xfff3e0);
    dirty = true;
  }

  const haze = new THREE.Color();
  const sunDir = new THREE.Vector3();
  const fogDay = new THREE.Color(0xdce4f5);
  function lightFor(x: number) {
    let i = 0;
    while (i < DAY_SKY.length - 2 && x > DAY_SKY[i + 1][0]) i++;
    const a = DAY_SKY[i], b = DAY_SKY[i + 1];
    const t = smoothstep(a[0], b[0], x);
    const el = ((a[1] + (b[1] - a[1]) * t) * Math.PI) / 180;
    const az = ((a[2] + (b[2] - a[2]) * t) * Math.PI) / 180;
    sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    if (night) sunDir.set(0.55, 0.5, -1).normalize();
    haze.set(night ? NIGHT_SKY.haze : t < 0.5 ? a[3] : b[3]);
    city.setSky(haze, sunDir);
    (scene.fog as THREE.Fog).color.copy(night ? haze : fogDay);
    sun.position.copy(sunDir).multiplyScalar(400).add(camera.position);
    sun.target.position.copy(camera.position);
  }

  let raf = 0;
  const t0 = performance.now();
  let frames = 0, acc = 0;
  let lastScroll = -1;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    if (opts.reduced) {
      // still frames only: redraw when the page moves
      if (window.scrollY !== lastScroll) dirty = true;
      if (!dirty) return;
    }
    lastScroll = window.scrollY;
    const t = opts.reduced ? 0 : (now - t0) / 1000;
    const tq = Math.floor(t * 10) / 10;

    const wins = opts.windows().filter((w) => w.rect.top < vh && w.rect.top + w.rect.height > 0).slice(0, MAX_WINDOWS);
    renderer.setRenderTarget(rt);
    renderer.setScissorTest(false);
    renderer.clear();
    const kx = lw / vw, ky = lh / vh;
    let n = 0;
    for (const w of wins) {
      // the window in low-res cells, y measured from the bottom
      const x0 = Math.floor(w.rect.left * kx), x1 = Math.ceil((w.rect.left + w.rect.width) * kx);
      const y0 = Math.floor((vh - (w.rect.top + w.rect.height)) * ky), y1 = Math.ceil((vh - w.rect.top) * ky);
      const cw = x1 - x0, ch = y1 - y0;
      if (cw < 2 || ch < 2) continue;
      post.uniforms.uWin.value[n].set(x0, y0, x1, y1);
      post.uniforms.uFade.value[n].set(w.fade.left * kx, w.fade.right * kx, w.fade.bottom * ky, w.fade.top * ky);
      n++;
      const st = station(w.district);
      camera.fov = st.fov;
      camera.aspect = w.rect.width / w.rect.height;
      camera.updateProjectionMatrix();
      camera.position.copy(st.pos);
      // a slow breath, so the view never feels frozen
      if (!opts.reduced) {
        camera.position.x += Math.sin(t * 0.07 + n) * 0.8;
        camera.position.y += Math.sin(t * 0.05 + 1 + n) * 0.3;
      }
      camera.lookAt(st.look);
      lightFor(st.look.x);
      city.update(t, tq, camera.position.x);
      renderer.setViewport(x0, y0, cw, ch);
      renderer.setScissor(x0, y0, cw, ch);
      renderer.setScissorTest(true);
      renderer.render(scene, camera);
    }
    post.uniforms.uWinCount.value = n;
    renderer.setScissorTest(false);
    renderer.setRenderTarget(null);
    renderer.setViewport(0, 0, Math.round(vw * dpr), Math.round(vh * dpr));
    renderer.clear();
    if (n) renderer.render(postScene, postCam);
    dirty = false;

    // watchdog: if frames run slow, draw fewer, bigger pixels
    const ms = performance.now() - now;
    acc += ms;
    if (++frames === 90) {
      if (acc / frames > 16 && cellCss < 4) {
        cellCss += 0.5;
        resize();
      }
      frames = 0;
      acc = 0;
    }
  }

  resize();
  setNight(night, true);
  raf = requestAnimationFrame(frame);

  return {
    setNight: (n: boolean) => setNight(n),
    intro: () => {
      if (!opts.reduced) city.intro();
    },
    resize,
    poke: () => {
      dirty = true;
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      rt.dispose();
    },
  };
}
