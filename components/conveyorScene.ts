// The hero machine cell, three.js edition. Transfer line: belt A feeds
// scanner 1, the mid arm transfers items across the gap onto belt B, scanner 2
// checks them again, and the end arm packs them into the box. Vector style:
// bg-colored fills occlude ink edge lines (hidden-line technical drawing),
// orthographic camera fitted so the whole machine is always in frame.
// Scanners wash items in a teal curtain - the one color that isn't theme ink.
//
// IMPORTANT: never touch gsap.globalTimeline here - pausing it froze every
// animation on the site once. Off-screen pausing stops this scene's rAF and
// its own arm timelines only.

import * as THREE from "three";
import { gsap } from "gsap";

// ---- layout (x runs along the line) ----
const BELT_TOP = 1.0;
const A_X0 = -12.0, A_X1 = -2.3; // belt A
const B_X0 = 0.4, B_X1 = 7.0; // belt B
const SCAN_A = -6.6, SCAN_B = 3.1; // scanner gantries
const PICK_A = -2.75, PICK_B = 6.55; // where items wait for an arm
const MID_BASE = new THREE.Vector3(-1.05, 0, -1.7);
const END_BASE = new THREE.Vector3(8.15, 0, -1.7);
const BOX_POS = new THREE.Vector3(10.3, 0, 0.2);
const L1 = 2.05, L2 = 1.85; // arm links
const SHOULDER_Y = 1.18;
const GRIP_DROP = 0.66;
const BELT_SPEED = 1.15;
const SPAWN_EVERY = 4.4;
const ITEM_H = 0.56;

type Palette = { ink: string; accent: string; bg: string; teal: string };

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const dark = document.documentElement.dataset.theme === "dark";
  return {
    ink: cs.getPropertyValue("--ink").trim() || "#181612",
    accent: cs.getPropertyValue("--accent").trim() || "#2F6A47",
    bg: cs.getPropertyValue("--bg").trim() || "#F4F2EC",
    teal: dark ? "#3fe0cf" : "#1fb5a3", // the scan wash: greenish blue, both themes
  };
}

export function mountConveyorScene(host: HTMLElement): () => void {
  const section = host.closest(".belt") as HTMLElement | null;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(-1.4, 6.6, 15);
  camera.lookAt(-0.6, 1.3, 0);

  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 800 ? 1.5 : 2));
    renderer.setSize(w, h);
    // halfW fixed to contain the full machine (x -12.5 .. 11.3): no clipping,
    // whatever the aspect
    const halfW = 12.0;
    const halfH = (halfW * h) / w;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }

  // ---- materials ----
  const pal = readPalette();
  const fillMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(pal.bg),
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const inkMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.8 });
  const faintMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.32 });
  const tealLine = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.teal), transparent: true, opacity: 0.95 });
  const tealCurtain = new THREE.MeshBasicMaterial({
    color: new THREE.Color(pal.teal),
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const tapeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.16 });

  const themeObserver = new MutationObserver(() => {
    const p = readPalette();
    fillMat.color.set(p.bg);
    inkMat.color.set(p.ink);
    faintMat.color.set(p.ink);
    tealLine.color.set(p.teal);
    tealCurtain.color.set(p.teal);
    tapeMat.color.set(p.ink);
    for (const sc of scanners) {
      (sc.curtain.material as THREE.MeshBasicMaterial).color.set(p.teal);
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function part(geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial = inkMat, withFill = true): THREE.Group {
    const g = new THREE.Group();
    if (withFill) g.add(new THREE.Mesh(geo, fillMat));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 12), mat));
    return g;
  }

  // ---- belts ----
  type Belt = { x0: number; x1: number; lay: (shift: number) => void };
  const belts: Belt[] = [];
  function buildBelt(x0: number, x1: number): Belt {
    const len = x1 - x0;
    const mid = (x0 + x1) / 2;
    const body = part(new THREE.BoxGeometry(len, 0.18, 1.7));
    body.position.set(mid, BELT_TOP - 0.1, 0);
    scene.add(body);
    for (const zs of [-0.92, 0.92]) {
      const rail = part(new THREE.BoxGeometry(len, 0.32, 0.1));
      rail.position.set(mid, BELT_TOP - 0.12, zs);
      scene.add(rail);
    }
    for (const xe of [x0, x1]) {
      const drum = part(new THREE.CylinderGeometry(0.2, 0.2, 1.7, 14).rotateX(Math.PI / 2), faintMat);
      drum.position.set(xe, BELT_TOP - 0.1, 0);
      scene.add(drum);
    }
    const legXs: number[] = [];
    for (let lx = x0 + 0.8; lx < x1 - 0.4; lx += 3.4) legXs.push(lx);
    for (const lx of legXs) {
      for (const zs of [-0.78, 0.78]) {
        const leg = part(new THREE.BoxGeometry(0.15, BELT_TOP - 0.26, 0.15), faintMat);
        leg.position.set(lx, (BELT_TOP - 0.26) / 2, zs);
        scene.add(leg);
      }
    }
    // wrapping cleats
    const N = Math.round(len / 0.55);
    const posArr = new Float32Array(N * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    scene.add(new THREE.LineSegments(geo, faintMat));
    const offsets = Array.from({ length: N }, (_, i) => (i / N) * len);
    const lay = (shift: number) => {
      for (let i = 0; i < N; i++) {
        const x = x0 + ((offsets[i] + shift) % len);
        posArr[i * 6 + 0] = x;
        posArr[i * 6 + 1] = BELT_TOP + 0.005;
        posArr[i * 6 + 2] = -0.85;
        posArr[i * 6 + 3] = x;
        posArr[i * 6 + 4] = BELT_TOP + 0.005;
        posArr[i * 6 + 5] = 0.85;
      }
      geo.attributes.position.needsUpdate = true;
    };
    const belt = { x0, x1, lay };
    belts.push(belt);
    return belt;
  }
  buildBelt(A_X0, A_X1);
  buildBelt(B_X0, B_X1);

  // ---- scanners: portal frame + teal curtain + sweep bar ----
  type Scanner = { curtain: THREE.Mesh; sweep: THREE.Group; pulse: () => void };
  function buildScanner(x: number): Scanner {
    const g = new THREE.Group();
    for (const zs of [-1.2, 1.2]) {
      const post = part(new THREE.BoxGeometry(0.22, 1.9, 0.3));
      post.position.set(x, BELT_TOP + 0.95 - 0.2, zs);
      g.add(post);
      const foot = part(new THREE.BoxGeometry(0.5, 0.12, 0.55), faintMat);
      foot.position.set(x, 0.06, zs * 1.05);
      g.add(foot);
    }
    const beam = part(new THREE.BoxGeometry(0.5, 0.34, 2.9));
    beam.position.set(x, BELT_TOP + 1.75, 0);
    g.add(beam);
    // the curtain: a translucent teal sheet items pass through (per-scanner
    // material so each can pulse independently)
    const curtain = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.45).rotateY(Math.PI / 2),
      tealCurtain.clone()
    );
    curtain.position.set(x, BELT_TOP + 0.73, 0);
    g.add(curtain);
    // edge frame of the curtain in bright teal
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.2, 1.45).rotateY(Math.PI / 2)),
      tealLine
    );
    frame.position.copy(curtain.position);
    g.add(frame);
    // sweep bar: a thin teal line scanning up and down inside the curtain
    const sweep = new THREE.Group();
    const bar = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.02, 0.02, 2.1)),
      tealLine
    );
    sweep.add(bar);
    sweep.position.set(x, BELT_TOP + 0.2, 0);
    g.add(sweep);
    scene.add(g);
    const mat = curtain.material as THREE.MeshBasicMaterial;
    const pulse = () => {
      gsap.killTweensOf(mat);
      gsap.fromTo(mat, { opacity: 0.5 }, { opacity: 0.2, duration: 0.8, ease: "power2.out" });
    };
    return { curtain, sweep, pulse };
  }
  const scanners = [buildScanner(SCAN_A), buildScanner(SCAN_B)];

  // ---- box (the final container) ----
  const boxGroup = new THREE.Group();
  const wallX = new THREE.BoxGeometry(1.9, 0.72, 0.09);
  const wallZ = new THREE.BoxGeometry(0.09, 0.72, 1.9);
  for (const [g, x, z] of [
    [wallX, 0, -0.9],
    [wallX, 0, 0.9],
    [wallZ, -0.9, 0],
    [wallZ, 0.9, 0],
  ] as const) {
    const w = part(g as THREE.BoxGeometry);
    w.position.set(BOX_POS.x + (x as number), 0.36, BOX_POS.z + (z as number));
    boxGroup.add(w);
  }
  const boxBase = part(new THREE.BoxGeometry(1.9, 0.08, 1.9), faintMat);
  boxBase.position.set(BOX_POS.x, 0.04, BOX_POS.z);
  boxGroup.add(boxBase);
  scene.add(boxGroup);

  // ---- arms ----
  type Arm = {
    turret: THREE.Group;
    shoulder: THREE.Group;
    elbow: THREE.Group;
    wrist: THREE.Group;
    fingerL: THREE.Group;
    fingerR: THREE.Group;
    joints: { yaw: number; S: number; E: number; grip: number };
    base: THREE.Vector3;
    busy: boolean;
    timeline: gsap.core.Timeline | null;
  };
  function buildArm(base: THREE.Vector3): Arm {
    const root = new THREE.Group();
    root.position.copy(base);
    scene.add(root);
    const basePlate = part(new THREE.BoxGeometry(1.6, 0.18, 1.6));
    basePlate.position.y = 0.09;
    root.add(basePlate);
    const turret = new THREE.Group();
    turret.position.y = 0.18;
    root.add(turret);
    const tb = part(new THREE.CylinderGeometry(0.46, 0.54, 0.62, 12));
    tb.position.y = 0.31;
    turret.add(tb);
    const shoulder = new THREE.Group();
    shoulder.position.set(0, SHOULDER_Y - 0.18, 0);
    turret.add(shoulder);
    shoulder.add(part(new THREE.CylinderGeometry(0.32, 0.32, 0.54, 12).rotateX(Math.PI / 2), faintMat));
    const ua = part(new THREE.BoxGeometry(L1, 0.36, 0.32));
    ua.position.x = L1 / 2;
    shoulder.add(ua);
    const elbow = new THREE.Group();
    elbow.position.x = L1;
    shoulder.add(elbow);
    elbow.add(part(new THREE.CylinderGeometry(0.24, 0.24, 0.46, 12).rotateX(Math.PI / 2), faintMat));
    const fa = part(new THREE.BoxGeometry(L2, 0.28, 0.26));
    fa.position.x = L2 / 2;
    elbow.add(fa);
    const wrist = new THREE.Group();
    wrist.position.x = L2;
    elbow.add(wrist);
    const palm = part(new THREE.BoxGeometry(0.46, 0.18, 0.56));
    palm.position.y = -0.14;
    wrist.add(palm);
    const fingerL = part(new THREE.BoxGeometry(0.09, 0.55, 0.16));
    const fingerR = part(new THREE.BoxGeometry(0.09, 0.55, 0.16));
    fingerL.position.set(-0.24, -0.46, 0);
    fingerR.position.set(0.24, -0.46, 0);
    wrist.add(fingerL, fingerR);
    return {
      turret,
      shoulder,
      elbow,
      wrist,
      fingerL,
      fingerR,
      joints: { yaw: 0, S: 0.7, E: -1.6, grip: 1 },
      base: base.clone(),
      busy: false,
      timeline: null,
    };
  }
  const midArm = buildArm(MID_BASE);
  const endArm = buildArm(END_BASE);

  function solveFor(arm: Arm, target: THREE.Vector3) {
    const dx = target.x - arm.base.x;
    const dz = target.z - arm.base.z;
    const yaw = Math.atan2(-dz, dx);
    const d = Math.hypot(dx, dz);
    const py = target.y + GRIP_DROP - SHOULDER_Y;
    const D = Math.min(Math.hypot(d, py), L1 + L2 - 0.01);
    const a = Math.atan2(py, d);
    const cosS = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D);
    const S = a + Math.acos(THREE.MathUtils.clamp(cosS, -1, 1));
    const cosE = (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2);
    const E = -(Math.PI - Math.acos(THREE.MathUtils.clamp(cosE, -1, 1)));
    return { yaw, S, E };
  }
  function syncArm(arm: Arm) {
    arm.turret.rotation.y = arm.joints.yaw;
    arm.shoulder.rotation.z = arm.joints.S;
    arm.elbow.rotation.z = arm.joints.E;
    arm.wrist.rotation.z = -(arm.joints.S + arm.joints.E);
    const spread = 0.19 * arm.joints.grip + 0.1;
    arm.fingerL.position.x = -spread;
    arm.fingerR.position.x = spread;
  }
  const HOME = { S: 0.72, E: -1.62 };
  midArm.joints.yaw = solveFor(midArm, new THREE.Vector3(PICK_A, BELT_TOP, 0)).yaw;
  endArm.joints.yaw = solveFor(endArm, new THREE.Vector3(PICK_B, BELT_TOP, 0)).yaw;

  // ---- items: plain parcels ----
  type ItemState = "beltA" | "beltB" | "held" | "boxed" | "idle";
  type Item = { group: THREE.Group; state: ItemState; scale: number };
  const items: Item[] = [];
  function makeItem(i: number): Item {
    const s = 0.85 + (i % 4) * 0.09; // gentle size variety, deterministic
    const group = new THREE.Group();
    const body = part(new THREE.BoxGeometry(0.95 * s, ITEM_H, 0.78 * s));
    group.add(body);
    // a tape strip across the top: the one detail a parcel needs
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.96 * s, 0.012, 0.16), tapeMat);
    tape.position.y = ITEM_H / 2 + 0.006;
    group.add(tape);
    group.visible = false;
    scene.add(group);
    const item: Item = { group, state: "idle", scale: s };
    items.push(item);
    return item;
  }
  for (let i = 0; i < 12; i++) makeItem(i);

  function spawn(atX = A_X0 + 0.7) {
    const it = items.find((p) => p.state === "idle");
    if (!it) return;
    it.group.position.set(atX, BELT_TOP + ITEM_H / 2, 0);
    it.group.rotation.set(0, (Math.random() - 0.5) * 0.15, 0);
    it.group.scale.setScalar(1);
    it.group.visible = true;
    it.state = "beltA";
  }
  spawn(-3.4);
  spawn(-6.8);
  spawn(-10.2);
  // one already on belt B so the end arm has work immediately
  const early = items.find((p) => p.state === "idle")!;
  early.group.position.set(3.9, BELT_TOP + ITEM_H / 2, 0);
  early.group.visible = true;
  early.state = "beltB";

  // ---- pick-and-place: hover, descend, grip, lift - no teleporting ----
  const boxStack: Item[] = [];
  function runTransfer(
    arm: Arm,
    item: Item,
    place: THREE.Vector3,
    after: (item: Item) => void
  ) {
    arm.busy = true;
    const pickAt = item.group.position.clone();
    const gripY = pickAt.y + ITEM_H / 2 - 0.18; // fingers wrap the parcel
    const hoverPick = solveFor(arm, new THREE.Vector3(pickAt.x, gripY + 0.85, pickAt.z));
    const atPick = solveFor(arm, new THREE.Vector3(pickAt.x, gripY, pickAt.z));
    const hoverPlace = solveFor(arm, new THREE.Vector3(place.x, place.y + 0.9, place.z));
    const atPlace = solveFor(arm, new THREE.Vector3(place.x, place.y + ITEM_H / 2 - 0.18, place.z));
    const j = arm.joints;
    const tl = gsap.timeline({
      onComplete: () => {
        arm.busy = false;
        arm.timeline = null;
      },
    });
    arm.timeline = tl;
    // swing above the item
    tl.to(j, { yaw: hoverPick.yaw, S: hoverPick.S, E: hoverPick.E, duration: 0.8, ease: "power2.inOut" });
    // straight descent
    tl.to(j, { S: atPick.S, E: atPick.E, duration: 0.38, ease: "power2.in" });
    // close and take
    tl.to(j, { grip: 0.16, duration: 0.18 });
    tl.add(() => {
      arm.wrist.attach(item.group);
      item.state = "held";
      // settle the parcel square under the palm so the grip reads true
      gsap.to(item.group.position, { x: 0, y: -GRIP_DROP + ITEM_H / 2 - 0.03, z: 0, duration: 0.12 });
      gsap.to(item.group.rotation, { x: 0, y: 0, z: 0, duration: 0.12 });
    });
    // straight lift
    tl.to(j, { S: hoverPick.S, E: hoverPick.E, duration: 0.4, ease: "power2.out" }, "+=0.06");
    // carry across
    tl.to(j, { yaw: hoverPlace.yaw, S: hoverPlace.S, E: hoverPlace.E, duration: 0.95, ease: "power2.inOut" });
    // lower onto the target
    tl.to(j, { S: atPlace.S, E: atPlace.E, duration: 0.38, ease: "power2.in" });
    // release
    tl.to(j, { grip: 1, duration: 0.18 });
    tl.add(() => {
      scene.attach(item.group);
      gsap.to(item.group.position, { x: place.x, y: place.y, z: place.z, duration: 0.14 });
      gsap.to(item.group.rotation, { x: 0, z: 0, duration: 0.14 });
      after(item);
    });
    // retract and settle home
    tl.to(j, { S: hoverPlace.S, E: hoverPlace.E, duration: 0.35, ease: "power2.out" }, "+=0.05");
    tl.to(j, { S: HOME.S, E: HOME.E, duration: 0.7, ease: "power2.inOut" }, "-=0.1");
  }

  // ---- loop ----
  const clock = new THREE.Clock();
  let shiftA = 0;
  let shiftB = 0;
  let spawnTimer = 1.6;
  let raf = 0;
  let running = false;
  let markedReady = false;

  function nearestAhead(item: Item, state: ItemState, stopX: number): number {
    let x = stopX;
    for (const o of items) {
      if (o !== item && o.state === state && o.group.position.x > item.group.position.x) {
        x = Math.min(x, o.group.position.x - 1.35);
      }
    }
    return x;
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);

    shiftA = (shiftA + BELT_SPEED * dt) % (A_X1 - A_X0);
    shiftB = (shiftB + BELT_SPEED * dt) % (B_X1 - B_X0);
    belts[0].lay(shiftA);
    belts[1].lay(shiftB);

    // scanner sweep bars breathe up and down
    const sw = (clock.elapsedTime % 2.4) / 2.4;
    const y = BELT_TOP + 0.15 + Math.abs(Math.sin(sw * Math.PI * 2)) * 1.15;
    scanners[0].sweep.position.y = y;
    scanners[1].sweep.position.y = BELT_TOP + 0.15 + Math.abs(Math.cos(sw * Math.PI * 2)) * 1.15;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = SPAWN_EVERY;
      spawn();
    }

    let waitA: Item | null = null;
    let waitB: Item | null = null;
    for (const it of items) {
      if (it.state === "beltA") {
        const prev = it.group.position.x;
        it.group.position.x = Math.min(prev + BELT_SPEED * dt, nearestAhead(it, "beltA", PICK_A));
        if (prev < SCAN_A && it.group.position.x >= SCAN_A) scanners[0].pulse();
        if (it.group.position.x >= PICK_A - 0.001 && !waitA) waitA = it;
      } else if (it.state === "beltB") {
        const prev = it.group.position.x;
        it.group.position.x = Math.min(prev + BELT_SPEED * dt, nearestAhead(it, "beltB", PICK_B));
        if (prev < SCAN_B && it.group.position.x >= SCAN_B) scanners[1].pulse();
        if (it.group.position.x >= PICK_B - 0.001 && !waitB) waitB = it;
      }
    }

    if (waitA && !midArm.busy) {
      runTransfer(midArm, waitA, new THREE.Vector3(B_X0 + 0.55, BELT_TOP + ITEM_H / 2, 0), (item) => {
        item.state = "beltB";
      });
    }
    if (waitB && !endArm.busy) {
      const level = Math.min(boxStack.length, 3);
      runTransfer(
        endArm,
        waitB,
        new THREE.Vector3(
          BOX_POS.x + (Math.random() - 0.5) * 0.16,
          0.12 + ITEM_H / 2 + level * 0.34,
          BOX_POS.z + (Math.random() - 0.5) * 0.16
        ),
        (item) => {
          item.state = "boxed";
          boxStack.push(item);
          if (boxStack.length > 3) {
            const oldest = boxStack.shift()!;
            gsap.to(oldest.group.scale, {
              x: 0.01, y: 0.01, z: 0.01, duration: 0.4,
              onComplete: () => {
                oldest.group.visible = false;
                oldest.state = "idle";
              },
            });
            boxStack.forEach((pl, i) =>
              gsap.to(pl.group.position, { y: 0.12 + ITEM_H / 2 + i * 0.34, duration: 0.4 })
            );
          }
        }
      );
    }

    syncArm(midArm);
    syncArm(endArm);
    renderer.render(scene, camera);

    if (!markedReady) {
      markedReady = true;
      section?.classList.add("belt--3d");
    }
  }

  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    midArm.timeline?.play();
    endArm.timeline?.play();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    // pause only THIS scene's timelines - never gsap.globalTimeline
    midArm.timeline?.pause();
    endArm.timeline?.pause();
  }

  const vis = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) start();
      else stop();
    },
    { rootMargin: "10% 0px" }
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
    section?.classList.remove("belt--3d");
    renderer.dispose();
    scene.traverse((o) => {
      const any = o as THREE.Mesh;
      if (any.geometry) any.geometry.dispose();
    });
    host.innerHTML = "";
  };
}
