// The workshop: the bench where the ten systems got built. The hero is the
// plant (what ships); this is the room behind it. Same line-art language,
// smaller scale, calmer motion - a live terminal, a part-built arm in the
// vise, crates stamped with the system part numbers, and the wall panel the
// visitor actually operates (that panel is HTML, positioned over the mounting
// plate drawn here).

import * as THREE from "three";
import { readPalette, createMats, partFactory, fitToObjects, type Palette } from "./blueprintKit";

const TERM_LINES = [
  "$ node scrape.js --source registry",
  "  parsed 1,412 shops",
  "  classified 318 high-mix",
  "$ enrich --waterfall apollo,clay",
  "  matched 274 / 318",
  "$ raven sweep --signals 10",
  "  9 leads scored > 80",
  "$ diode ship --to attio",
  "  synced. done.",
];

export function mountWorkshopScene(host: HTMLElement): () => void {
  const section = host.closest(".about__stage") as HTMLElement | null;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const CAM_BASE = new THREE.Vector3(-1.1, 3.4, 14);
  const LOOK_AT = new THREE.Vector3(0.2, 1.5, 0);
  camera.position.copy(CAM_BASE);
  camera.lookAt(LOOK_AT);

  const pal = readPalette();
  const mats = createMats(pal);
  const part = partFactory(mats);
  const fit = { halfW: 6, halfH: 3 };

  const canvases: { draw: (p: Palette) => void }[] = [];
  const themeObserver = new MutationObserver(() => {
    const p = readPalette();
    mats.retint(p);
    for (const c of canvases) c.draw(p);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const mustFit: THREE.Object3D[] = [];

  // ---- floor + back wall ----
  {
    const floor = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-6.4, 0, 1.4), new THREE.Vector3(6.4, 0, 1.4),
        new THREE.Vector3(-6.4, 0, -2.2), new THREE.Vector3(6.4, 0, -2.2),
      ]),
      mats.faint
    );
    scene.add(floor);
    const ticks: THREE.Vector3[] = [];
    for (let x = -6; x <= 6; x += 1.2) {
      ticks.push(new THREE.Vector3(x, 0, 1.4), new THREE.Vector3(x - 0.22, -0.16, 1.4));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), mats.ghost));
    // wall grid behind the bench
    const wall: THREE.Vector3[] = [];
    for (let x = -6.2; x <= 6.2; x += 0.62) wall.push(new THREE.Vector3(x, 0, -2.2), new THREE.Vector3(x, 4.6, -2.2));
    for (let y = 0; y <= 4.6; y += 0.62) wall.push(new THREE.Vector3(-6.2, y, -2.2), new THREE.Vector3(6.2, y, -2.2));
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wall), mats.ghost));
  }

  // ---- workbench ----
  const BENCH_TOP = 1.45;
  {
    const top = part(new THREE.BoxGeometry(6.6, 0.16, 1.9));
    top.position.set(0, BENCH_TOP - 0.08, 0);
    scene.add(top);
    mustFit.push(top);
    const lip = part(new THREE.BoxGeometry(6.6, 0.14, 0.08), mats.faint);
    lip.position.set(0, BENCH_TOP - 0.22, 0.93);
    scene.add(lip);
    for (const lx of [-3.0, 3.0]) {
      for (const lz of [-0.75, 0.75]) {
        const leg = part(new THREE.BoxGeometry(0.16, BENCH_TOP - 0.16, 0.16), mats.faint);
        leg.position.set(lx, (BENCH_TOP - 0.16) / 2, lz);
        scene.add(leg);
      }
      const brace = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(lx, 0.42, -0.75), new THREE.Vector3(lx, 0.42, 0.75),
      ]);
      scene.add(new THREE.Line(brace, mats.ghost));
    }
    const shelf = part(new THREE.BoxGeometry(6.0, 0.1, 1.5), mats.faint);
    shelf.position.set(0, 0.5, 0);
    scene.add(shelf);
  }

  // ---- terminal on the bench (live scrolling log) ----
  const terminal = (() => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 320;
    const tex = new THREE.CanvasTexture(cv);
    let shown = 0;
    function draw(p: Palette) {
      const ctx = cv.getContext("2d")!;
      const font = getComputedStyle(document.documentElement).getPropertyValue("--font-m") || "monospace";
      ctx.clearRect(0, 0, 512, 320);
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, 512, 320);
      ctx.font = `500 22px ${font}`;
      ctx.textBaseline = "top";
      for (let i = 0; i < shown; i++) {
        const line = TERM_LINES[i % TERM_LINES.length];
        ctx.fillStyle = line.startsWith("$") ? p.accent : p.ink;
        ctx.globalAlpha = line.startsWith("$") ? 1 : 0.55;
        ctx.fillText(line, 18, 16 + i * 32);
      }
      ctx.globalAlpha = 1;
      tex.needsUpdate = true;
    }
    canvases.push({ draw });
    draw(pal);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.0),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    const body = part(new THREE.BoxGeometry(1.72, 1.12, 0.12));
    body.position.set(-2.75, BENCH_TOP + 0.72, -0.45);
    scene.add(body);
    mustFit.push(body);
    screen.position.set(-2.75, BENCH_TOP + 0.72, -0.38);
    scene.add(screen);
    const stand = part(new THREE.BoxGeometry(0.14, 0.3, 0.14), mats.faint);
    stand.position.set(-2.75, BENCH_TOP + 0.15, -0.45);
    scene.add(stand);
    const base = part(new THREE.BoxGeometry(0.7, 0.06, 0.42), mats.faint);
    base.position.set(-2.75, BENCH_TOP + 0.03, -0.45);
    scene.add(base);
    // keyboard
    const kb = part(new THREE.BoxGeometry(1.2, 0.06, 0.42), mats.faint);
    kb.position.set(-2.75, BENCH_TOP + 0.03, 0.42);
    scene.add(kb);
    return {
      advance() {
        shown = Math.min(shown + 1, 9);
        if (shown >= 9) shown = 0;
        draw(readPalette());
      },
    };
  })();

  // ---- vise holding a part-built arm ----
  {
    const viseBase = part(new THREE.BoxGeometry(0.62, 0.2, 0.5));
    viseBase.position.set(-0.45, BENCH_TOP + 0.1, 0.1);
    scene.add(viseBase);
    for (const jx of [-0.2, 0.2]) {
      const jaw = part(new THREE.BoxGeometry(0.12, 0.34, 0.5));
      jaw.position.set(-0.45 + jx, BENCH_TOP + 0.35, 0.1);
      scene.add(jaw);
    }
    const screw = part(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8).rotateZ(Math.PI / 2), mats.faint);
    screw.position.set(-0.45, BENCH_TOP + 0.3, 0.1);
    scene.add(screw);
    // the arm segment clamped in it, half-assembled
    const seg = part(new THREE.BoxGeometry(0.34, 1.15, 0.3));
    seg.position.set(-0.45, BENCH_TOP + 1.05, 0.1);
    scene.add(seg);
    mustFit.push(seg);
    const hub = part(new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12).rotateX(Math.PI / 2), mats.faint);
    hub.position.set(-0.45, BENCH_TOP + 1.6, 0.1);
    scene.add(hub);
    const fore = part(new THREE.BoxGeometry(1.05, 0.24, 0.22));
    fore.position.set(0.08, BENCH_TOP + 1.6, 0.1);
    fore.rotation.z = 0.42;
    scene.add(fore);
    // loose parts on the bench beside it
    for (const [bx, r] of [[0.62, 0.16], [0.95, 0.11]] as const) {
      const w = part(new THREE.CylinderGeometry(r, r, 0.07, 12).rotateX(Math.PI / 2), mats.faint);
      w.position.set(bx, BENCH_TOP + 0.04, 0.55);
      w.rotation.x = Math.PI / 2;
      scene.add(w);
    }
  }

  // ---- crates: the ten systems, stacked in the corner ----
  {
    const stamps = ["RS-01", "RS-04", "RS-07"];
    stamps.forEach((label, i) => {
      const w = 1.15 - i * 0.06;
      const crate = part(new THREE.BoxGeometry(w, 0.72, 0.95));
      crate.position.set(-4.55 + i * 0.08, 0.36 + i * 0.74, -0.35);
      scene.add(crate);
      if (i === 0) mustFit.push(crate);
      // slats
      const sl: THREE.Vector3[] = [];
      for (const sy of [-0.2, 0.2]) {
        sl.push(
          new THREE.Vector3(-w / 2, sy, 0.48),
          new THREE.Vector3(w / 2, sy, 0.48)
        );
      }
      const slats = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(sl), mats.faint);
      crate.add(slats);
      // stencilled part number
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 96;
      const tex = new THREE.CanvasTexture(cv);
      function draw(p: Palette) {
        const ctx = cv.getContext("2d")!;
        const font = getComputedStyle(document.documentElement).getPropertyValue("--font-m") || "monospace";
        ctx.clearRect(0, 0, 256, 96);
        ctx.fillStyle = p.ink;
        ctx.globalAlpha = 0.55;
        ctx.font = `500 52px ${font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, 128, 52);
        ctx.globalAlpha = 1;
        tex.needsUpdate = true;
      }
      canvases.push({ draw });
      draw(pal);
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.62, 0.23),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      plate.position.set(0, 0.02, 0.481);
      crate.add(plate);
    });
  }

  // ---- pinboard on the wall ----
  {
    const board = part(new THREE.BoxGeometry(2.4, 1.6, 0.06), mats.faint);
    board.position.set(-3.2, 3.0, -2.15);
    scene.add(board);
    mustFit.push(board);
    for (const [px, py, pw, ph] of [
      [-0.62, 0.34, 0.72, 0.5],
      [0.3, 0.42, 0.6, 0.42],
      [-0.4, -0.36, 0.86, 0.44],
      [0.55, -0.3, 0.5, 0.56],
    ] as const) {
      const note = part(new THREE.BoxGeometry(pw as number, ph as number, 0.02), mats.ghost);
      note.position.set(-3.2 + (px as number), 3.0 + (py as number), -2.1);
      note.rotation.z = (px as number) * 0.06;
      scene.add(note);
    }
  }

  // ---- tool rack ----
  {
    const rail = part(new THREE.BoxGeometry(1.9, 0.08, 0.1), mats.faint);
    rail.position.set(2.6, 3.15, -2.12);
    scene.add(rail);
    const tools: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const tx = 1.85 + i * 0.3;
      const len = 0.42 + (i % 3) * 0.16;
      tools.push(new THREE.Vector3(tx, 3.1, -2.12), new THREE.Vector3(tx, 3.1 - len, -2.12));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tools), mats.faint));
  }

  // ---- junction box: the panel's wiring into the room ----
  {
    const jb = part(new THREE.BoxGeometry(0.72, 0.56, 0.2));
    jb.position.set(4.5, 2.15, -2.02);
    scene.add(jb);
    mustFit.push(jb);
    const cond: THREE.Vector3[] = [
      // up toward the mounted panel
      new THREE.Vector3(4.5, 2.43, -2.0), new THREE.Vector3(4.5, 3.3, -2.0),
      new THREE.Vector3(4.5, 3.3, -2.0), new THREE.Vector3(5.6, 3.3, -2.0),
      // down and along to the bench
      new THREE.Vector3(4.5, 1.87, -2.0), new THREE.Vector3(4.5, 0.5, -2.0),
      new THREE.Vector3(4.5, 0.5, -2.0), new THREE.Vector3(2.2, 0.5, -2.0),
    ];
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cond), mats.faint));
  }

  // ---- overhead lamp ----
  {
    const cord = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.9, 4.6, -0.2), new THREE.Vector3(-1.9, 3.85, -0.2),
    ]);
    scene.add(new THREE.Line(cord, mats.faint));
    const shade = part(new THREE.CylinderGeometry(0.16, 0.62, 0.42, 14), mats.faint);
    shade.position.set(-1.9, 3.6, -0.2);
    scene.add(shade);
    mustFit.push(shade);
    // light cone, ghosted
    const cone = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.ConeGeometry(1.55, 2.2, 4).rotateY(Math.PI / 4)),
      mats.ghost
    );
    cone.position.set(-1.9, 2.4, -0.2);
    cone.rotation.x = Math.PI;
    scene.add(cone);
  }

  // ---- stool ----
  {
    const seat = part(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16), mats.faint);
    seat.position.set(-2.4, 0.92, 1.15);
    scene.add(seat);
    const post = part(new THREE.CylinderGeometry(0.07, 0.07, 0.85, 8), mats.faint);
    post.position.set(-2.4, 0.48, 1.15);
    scene.add(post);
    const foot = part(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 16), mats.ghost);
    foot.position.set(-2.4, 0.05, 1.15);
    scene.add(foot);
  }

  // ---- camera fit ----
  {
    const f = fitToObjects(camera, CAM_BASE, LOOK_AT, mustFit, 0.55);
    fit.halfW = f.halfW;
    fit.halfH = f.halfH;
  }

  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 800 ? 1.5 : 2));
    renderer.setSize(w, h);
    const halfW = Math.max(fit.halfW, (fit.halfH * w) / h);
    const halfH = (halfW * h) / w;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }

  let raf = 0;
  let running = false;
  let ready = false;
  let acc = 0;
  const clock = new THREE.Clock();

  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    acc += dt;
    if (acc > 0.9) {
      acc = 0;
      terminal.advance();
    }
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      section?.classList.add("about--3d");
    }
  }
  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const vis = new IntersectionObserver(
    (e) => (e.some((x) => x.isIntersecting) ? start() : stop()),
    { rootMargin: "12% 0px" }
  );
  vis.observe(host);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  start();

  return () => {
    stop();
    vis.disconnect();
    ro.disconnect();
    themeObserver.disconnect();
    section?.classList.remove("about--3d");
    renderer.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    host.innerHTML = "";
  };
}
