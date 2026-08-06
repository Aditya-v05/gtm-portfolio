// The three.js scene behind ConveyorCell. Split into its own module so the
// three dependency loads as a lazy chunk only when the band nears the
// viewport. Everything is drawn in "vector" style: background-colored fills
// for hidden-line occlusion + ink/accent edge lines, orthographic camera.

import * as THREE from "three";
import { gsap } from "gsap";

// ---- world layout (x runs along the belt) ----
const BELT_X0 = -13.2; // belt start (offscreen left)
const BELT_X1 = 4.1; // belt end
const BELT_TOP = 1.0; // belt surface height
const SCAN_X = 0; // scanner gantry
const CHIP_X = 0.55; // verdict pops just past the beam
const PICK_X = 3.35; // where plates wait for the arm
const ARM_BASE = new THREE.Vector3(5.95, 0, -1.35);
const BIN_POS = new THREE.Vector3(8.35, 0, 0.15);
const L1 = 1.95; // upper arm
const L2 = 1.75; // forearm
const SHOULDER_Y = 1.12;
const GRIP_DROP = 0.62; // wrist pivot to fingertip
const BELT_SPEED = 1.25; // units/s
const SPAWN_EVERY = 4.6; // seconds

const VERDICTS = [
  { ok: true, label: "✓ 94" },
  { ok: false, label: "✗ excl" },
  { ok: true, label: "✓ 88" },
  { ok: true, label: "✓ 96" },
  { ok: false, label: "✗ excl" },
  { ok: true, label: "✓ 71" },
];

type Palette = { ink: string; accent: string; bg: string; mute: string };

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink: cs.getPropertyValue("--ink").trim() || "#181612",
    accent: cs.getPropertyValue("--accent").trim() || "#2F6A47",
    bg: cs.getPropertyValue("--bg").trim() || "#F4F2EC",
    mute: cs.getPropertyValue("--mute").trim() || "#A39C8E",
  };
}

export function mountConveyorScene(host: HTMLElement): () => void {
  const section = host.closest(".belt") as HTMLElement | null;
  const binLabel = section?.querySelector(".belt__binlabel b") as HTMLElement | null;

  // ---- renderer / camera ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(-1.2, 6.4, 15);
  camera.up.set(0, 1, 0);
  camera.lookAt(-0.9, 0.9, 0);

  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio, w < 800 ? 1.5 : 2));
    renderer.setSize(w, h);
    const halfW = 10.7;
    const halfH = (halfW * h) / w;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }

  // ---- materials (theme-aware) ----
  const pal = readPalette();
  const fillMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(pal.bg),
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const inkMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.75 });
  const faintMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.3 });
  const accentMat = new THREE.LineBasicMaterial({ color: new THREE.Color(pal.accent), transparent: true, opacity: 0.9 });
  const accentDash = new THREE.LineDashedMaterial({
    color: new THREE.Color(pal.accent),
    transparent: true,
    opacity: 0.8,
    dashSize: 0.16,
    gapSize: 0.13,
  });
  const barFillMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.ink), transparent: true, opacity: 0.2 });

  const themeObserver = new MutationObserver(() => {
    const p = readPalette();
    fillMat.color.set(p.bg);
    inkMat.color.set(p.ink);
    faintMat.color.set(p.ink);
    accentMat.color.set(p.accent);
    accentDash.color.set(p.accent);
    barFillMat.color.set(p.ink);
    drawChipTextures(p);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // helper: mesh with bg fill + ink edges (hidden-line look)
  function part(geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial = inkMat, withFill = true): THREE.Group {
    const g = new THREE.Group();
    if (withFill) g.add(new THREE.Mesh(geo, fillMat));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 12), mat));
    return g;
  }

  // ---- conveyor frame ----
  const beltLen = BELT_X1 - BELT_X0;
  const beltMidX = (BELT_X0 + BELT_X1) / 2;

  const beltBody = part(new THREE.BoxGeometry(beltLen, 0.16, 1.7));
  beltBody.position.set(beltMidX, BELT_TOP - 0.09, 0);
  scene.add(beltBody);

  // side rails
  for (const zs of [-0.92, 0.92]) {
    const rail = part(new THREE.BoxGeometry(beltLen, 0.3, 0.1));
    rail.position.set(beltMidX, BELT_TOP - 0.12, zs);
    scene.add(rail);
  }
  // end drums
  for (const xe of [BELT_X0, BELT_X1]) {
    const drum = part(new THREE.CylinderGeometry(0.19, 0.19, 1.7, 14).rotateX(Math.PI / 2), faintMat);
    drum.position.set(xe, BELT_TOP - 0.1, 0);
    scene.add(drum);
  }
  // legs
  for (const lx of [-11.2, -7.4, -3.6, 0.2, 3.6]) {
    for (const zs of [-0.8, 0.8]) {
      const leg = part(new THREE.BoxGeometry(0.14, BELT_TOP - 0.24, 0.14), faintMat);
      leg.position.set(lx, (BELT_TOP - 0.24) / 2, zs);
      scene.add(leg);
    }
    const cross = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(lx, 0.3, -0.8),
      new THREE.Vector3(lx, 0.3, 0.8),
    ]);
    scene.add(new THREE.Line(cross, faintMat));
  }

  // moving cleats: one LineSegments whose verts wrap along the belt
  const CLEATS = 36;
  const cleatPos = new Float32Array(CLEATS * 6);
  const cleatGeo = new THREE.BufferGeometry();
  cleatGeo.setAttribute("position", new THREE.BufferAttribute(cleatPos, 3));
  const cleatOffsets = Array.from({ length: CLEATS }, (_, i) => (i / CLEATS) * beltLen);
  const cleats = new THREE.LineSegments(cleatGeo, faintMat);
  scene.add(cleats);
  function layCleats(shift: number) {
    for (let i = 0; i < CLEATS; i++) {
      const x = BELT_X0 + ((cleatOffsets[i] + shift) % beltLen);
      cleatPos[i * 6 + 0] = x;
      cleatPos[i * 6 + 1] = BELT_TOP + 0.005;
      cleatPos[i * 6 + 2] = -0.85;
      cleatPos[i * 6 + 3] = x;
      cleatPos[i * 6 + 4] = BELT_TOP + 0.005;
      cleatPos[i * 6 + 5] = 0.85;
    }
    cleatGeo.attributes.position.needsUpdate = true;
  }

  // ---- scanner gantry ----
  const gantry = new THREE.Group();
  for (const zs of [-1.15, 1.15]) {
    const post = part(new THREE.BoxGeometry(0.16, 2.5, 0.16));
    post.position.set(SCAN_X, 1.25, zs);
    gantry.add(post);
  }
  const beam = part(new THREE.BoxGeometry(0.34, 0.3, 2.6));
  beam.position.set(SCAN_X, 2.6, 0);
  gantry.add(beam);
  // dashed scan line down to the belt
  const scanGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(SCAN_X, 2.45, 0),
    new THREE.Vector3(SCAN_X, BELT_TOP + 0.02, 0),
  ]);
  const scanLine = new THREE.Line(scanGeo, accentDash);
  scanLine.computeLineDistances();
  gantry.add(scanLine);
  // shuttle: a small accent square sweeping down the beam
  const shuttle = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.26, 0.26)),
    accentMat
  );
  gantry.add(shuttle);
  scene.add(gantry);

  // ---- attio bin ----
  const bin = new THREE.Group();
  const wallGeoX = new THREE.BoxGeometry(1.8, 0.66, 0.08);
  const wallGeoZ = new THREE.BoxGeometry(0.08, 0.66, 1.8);
  for (const [g, x, z] of [
    [wallGeoX, 0, -0.86],
    [wallGeoX, 0, 0.86],
    [wallGeoZ, -0.86, 0],
    [wallGeoZ, 0.86, 0],
  ] as const) {
    const w = part(g as THREE.BoxGeometry);
    w.position.set(BIN_POS.x + (x as number), 0.33, BIN_POS.z + (z as number));
    bin.add(w);
  }
  scene.add(bin);

  // ---- the arm ----
  const armRoot = new THREE.Group();
  armRoot.position.copy(ARM_BASE);
  scene.add(armRoot);

  const basePlate = part(new THREE.BoxGeometry(1.5, 0.16, 1.5));
  basePlate.position.y = 0.08;
  armRoot.add(basePlate);
  const turret = new THREE.Group();
  turret.position.y = 0.16;
  armRoot.add(turret);
  const turretBody = part(new THREE.CylinderGeometry(0.44, 0.5, 0.6, 12));
  turretBody.position.y = 0.3;
  turret.add(turretBody);

  const shoulder = new THREE.Group();
  shoulder.position.set(0, SHOULDER_Y - 0.16, 0);
  turret.add(shoulder);
  const shoulderHub = part(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12).rotateX(Math.PI / 2), faintMat);
  shoulder.add(shoulderHub);
  const upperArm = part(new THREE.BoxGeometry(L1, 0.34, 0.3));
  upperArm.position.x = L1 / 2;
  shoulder.add(upperArm);

  const elbow = new THREE.Group();
  elbow.position.x = L1;
  shoulder.add(elbow);
  const elbowHub = part(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 12).rotateX(Math.PI / 2), faintMat);
  elbow.add(elbowHub);
  const foreArm = part(new THREE.BoxGeometry(L2, 0.26, 0.24));
  foreArm.position.x = L2 / 2;
  elbow.add(foreArm);

  const wrist = new THREE.Group();
  wrist.position.x = L2;
  elbow.add(wrist);
  const palm = part(new THREE.BoxGeometry(0.42, 0.16, 0.5));
  palm.position.y = -0.12;
  wrist.add(palm);
  const fingerL = part(new THREE.BoxGeometry(0.07, 0.5, 0.12));
  const fingerR = part(new THREE.BoxGeometry(0.07, 0.5, 0.12));
  fingerL.position.set(-0.19, -0.42, 0);
  fingerR.position.set(0.19, -0.42, 0);
  wrist.add(fingerL, fingerR);

  // two-link IK in the turret's vertical plane, elbow-up
  function solve(target: THREE.Vector3) {
    const dx = target.x - ARM_BASE.x;
    const dz = target.z - ARM_BASE.z;
    const yaw = Math.atan2(-dz, dx); // rotation.y: positive turns +x toward -z
    const d = Math.hypot(dx, dz);
    const py = target.y + GRIP_DROP - (0.16 + SHOULDER_Y - 0.16);
    const D = Math.min(Math.hypot(d, py), L1 + L2 - 0.01);
    const a = Math.atan2(py, d);
    const cosS = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D);
    const S = a + Math.acos(THREE.MathUtils.clamp(cosS, -1, 1));
    const cosE = (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2);
    const E = -(Math.PI - Math.acos(THREE.MathUtils.clamp(cosE, -1, 1)));
    return { yaw, S, E };
  }
  function applyPose(p: { yaw: number; S: number; E: number }) {
    turret.rotation.y = p.yaw;
    shoulder.rotation.z = p.S;
    elbow.rotation.z = p.E;
    wrist.rotation.z = -(p.S + p.E);
  }
  // pose targets
  const POSE_PICK = solve(new THREE.Vector3(PICK_X, BELT_TOP + 0.16, 0));
  // home: a compact ready-crouch (manual pose - IK's elbow-up triangle pokes
  // above the band for close-in targets)
  const POSE_HOME = { yaw: POSE_PICK.yaw, S: 0.7, E: -1.6 };
  const POSE_LIFT = solve(new THREE.Vector3(PICK_X + 0.3, BELT_TOP + 1.35, 0));
  const POSE_BIN = solve(new THREE.Vector3(BIN_POS.x, 1.95, BIN_POS.z));
  const POSE_TOSS = solve(new THREE.Vector3(5.5, 1.9, 2.2));
  applyPose(POSE_HOME);

  // animated joint state (gsap tweens this, applyPose reads it each frame)
  const joints = { yaw: POSE_HOME.yaw, S: POSE_HOME.S, E: POSE_HOME.E, grip: 1 };
  function syncJoints() {
    applyPose(joints);
    const spread = 0.19 * joints.grip + 0.065;
    fingerL.position.x = -spread;
    fingerR.position.x = spread;
  }

  // ---- verdict chip textures ----
  const chipTex = new Map<string, THREE.CanvasTexture>();
  function drawChipTextures(p: Palette) {
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-m") || "monospace";
    for (const v of VERDICTS) {
      const key = v.label;
      const cv = chipTex.get(key)?.image ?? document.createElement("canvas");
      cv.width = 256;
      cv.height = 96;
      const ctx = cv.getContext("2d")!;
      ctx.clearRect(0, 0, 256, 96);
      const col = v.ok ? p.accent : p.mute;
      ctx.fillStyle = p.bg;
      ctx.strokeStyle = col;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(4, 4, 248, 88, 44);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = `600 44px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(v.label, 128, 52);
      if (!chipTex.has(key)) {
        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = 2;
        chipTex.set(key, tex);
      } else {
        chipTex.get(key)!.needsUpdate = true;
      }
    }
  }
  drawChipTextures(pal);

  // ---- plates ----
  type PlateState = "belt" | "waiting" | "held" | "toBin" | "thrown" | "idle";
  type Plate = {
    group: THREE.Group;
    chip: THREE.Mesh;
    verdict: (typeof VERDICTS)[number];
    state: PlateState;
    v: THREE.Vector3;
    w: THREE.Vector3;
  };
  const plates: Plate[] = [];
  let verdictIdx = 0;

  function makePlate(): Plate {
    const group = new THREE.Group();
    const body = part(new THREE.BoxGeometry(1.5, 0.14, 1.0));
    group.add(body);
    for (const [w, z] of [
      [0.95, -0.16],
      [0.6, 0.18],
    ] as const) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, 0.16), barFillMat);
      bar.position.set(-(1.5 - (w as number)) / 2 + 0.13, 0.085, z as number);
      group.add(bar);
    }
    const chip = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 0.4),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })
    );
    chip.position.set(0.45, 0.62, 0.1);
    chip.visible = false;
    group.add(chip);
    group.visible = false;
    scene.add(group);
    const plate: Plate = {
      group,
      chip,
      verdict: VERDICTS[0],
      state: "idle",
      v: new THREE.Vector3(),
      w: new THREE.Vector3(),
    };
    plates.push(plate);
    return plate;
  }
  for (let i = 0; i < 10; i++) makePlate(); // pool covers belt + held + bin stack + a thrown one

  function spawnPlate(atX = BELT_X0 + 0.8) {
    const p = plates.find((pl) => pl.state === "idle");
    if (!p) return;
    p.verdict = VERDICTS[verdictIdx++ % VERDICTS.length];
    const mat = p.chip.material as THREE.MeshBasicMaterial;
    mat.map = chipTex.get(p.verdict.label)!;
    mat.needsUpdate = true;
    p.chip.visible = false;
    p.chip.scale.setScalar(1);
    p.group.position.set(atX, BELT_TOP + 0.08, 0);
    p.group.rotation.set(0, 0, 0);
    p.group.scale.setScalar(1);
    p.group.visible = true;
    p.state = "belt";
  }
  // pre-warm so the scene starts populated
  spawnPlate(-2.5);
  spawnPlate(-7);
  spawnPlate(-11.4);

  // chips always face the camera
  const camQuat = camera.quaternion.clone();

  // ---- arm cycle (gsap timelines drive the joint state) ----
  let armBusy = false;
  let accepted = 0;
  const binStack: Plate[] = []; // the last few accepted plates stay visible in the bin
  function tweenTo(pose: { yaw: number; S: number; E: number }, dur: number, ease = "power2.inOut") {
    return gsap.to(joints, { yaw: pose.yaw, S: pose.S, E: pose.E, duration: dur, ease });
  }
  function runArmCycle(plate: Plate) {
    armBusy = true;
    const tl = gsap.timeline({
      onComplete: () => {
        armBusy = false;
      },
    });
    tl.add(tweenTo(POSE_PICK, 0.95));
    tl.to(joints, { grip: 0.25, duration: 0.22 });
    tl.add(() => {
      wrist.attach(plate.group);
      plate.state = "held";
    });
    tl.add(tweenTo(POSE_LIFT, 0.5, "power2.out"));
    if (plate.verdict.ok) {
      tl.add(tweenTo(POSE_BIN, 1.05));
      tl.to(joints, { grip: 1, duration: 0.2 });
      tl.add(() => {
        scene.attach(plate.group);
        plate.state = "toBin";
        accepted++;
        if (binLabel) binLabel.textContent = String(accepted).padStart(2, "0");
        plate.chip.visible = false;
        // drop onto the stack inside the bin and STAY there
        const level = Math.min(binStack.length, 3);
        binStack.push(plate);
        gsap.to(plate.group.position, {
          x: BIN_POS.x + (Math.random() - 0.5) * 0.14,
          y: 0.28 + level * 0.18,
          z: BIN_POS.z + (Math.random() - 0.5) * 0.14,
          duration: 0.5,
          ease: "bounce.out",
        });
        gsap.to(plate.group.rotation, {
          y: (Math.random() - 0.5) * 0.5,
          duration: 0.5,
        });
        gsap.to(plate.group.scale, { x: 0.88, y: 0.88, z: 0.88, duration: 0.4 });
        // keep the bin from overflowing: quietly retire the bottom plate
        if (binStack.length > 3) {
          const oldest = binStack.shift()!;
          gsap.to(oldest.group.scale, {
            x: 0.01, y: 0.01, z: 0.01, duration: 0.4,
            onComplete: () => {
              oldest.group.visible = false;
              oldest.state = "idle";
            },
          });
          binStack.forEach((pl, i) =>
            gsap.to(pl.group.position, { y: 0.28 + i * 0.18, duration: 0.4 })
          );
        }
      });
    } else {
      // fling it: release mid-swing with velocity toward the viewer
      tl.add(tweenTo(POSE_TOSS, 0.55, "power2.in"));
      tl.add(() => {
        scene.attach(plate.group);
        plate.state = "thrown";
        plate.v.set(-1.2, 1.6, 5.6);
        plate.w.set(4 + Math.random() * 3, 2, 5 + Math.random() * 3);
      });
    }
    tl.add(tweenTo(POSE_HOME, 1.0), "+=0.15");
  }

  // ---- main loop ----
  const clock = new THREE.Clock();
  let beltShift = 0;
  let spawnTimer = 2.2;
  let raf = 0;
  let running = false;
  let markedReady = false;

  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);

    beltShift = (beltShift + BELT_SPEED * dt) % (BELT_X1 - BELT_X0);
    layCleats(beltShift);

    // shuttle sweep on the scanner
    const t = clock.elapsedTime % 1.6;
    shuttle.position.set(SCAN_X, 2.3 - (t / 1.6) * 1.1, 0);
    (shuttle.material as THREE.LineBasicMaterial).opacity = t < 1.4 ? 0.9 : 0;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = SPAWN_EVERY;
      spawnPlate();
    }

    // plate motion
    let waiting: Plate | null = null;
    for (const p of plates) {
      if (p.state === "belt") {
        // queue behind any plate ahead
        let maxX = PICK_X;
        for (const o of plates) {
          if (o !== p && (o.state === "belt" || o.state === "waiting") && o.group.position.x > p.group.position.x) {
            maxX = Math.min(maxX, o.group.position.x - 1.75);
          }
        }
        p.group.position.x = Math.min(p.group.position.x + BELT_SPEED * dt, maxX);
        if (!p.chip.visible && p.group.position.x > CHIP_X) {
          p.chip.visible = true;
          p.chip.quaternion.copy(camQuat);
          p.chip.scale.setScalar(0.2);
          gsap.to(p.chip.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: "back.out(2.5)" });
        }
        if (p.group.position.x >= PICK_X - 0.001) p.state = "waiting";
      }
      if (p.state === "waiting" && !waiting) waiting = p;
      if (p.state === "thrown") {
        p.v.y -= 9.4 * dt;
        p.group.position.addScaledVector(p.v, dt);
        p.group.rotation.x += p.w.x * dt;
        p.group.rotation.y += p.w.y * dt;
        p.group.rotation.z += p.w.z * dt;
        if (p.group.position.y < -4.5) {
          p.group.visible = false;
          p.state = "idle";
        }
      }
    }
    if (waiting && !armBusy) runArmCycle(waiting);

    syncJoints();
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
    gsap.globalTimeline.play();
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    gsap.globalTimeline.pause();
  }

  // render only while the band is on screen
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
    gsap.globalTimeline.play(); // don't leave the site-wide timeline paused
    section?.classList.remove("belt--3d");
    renderer.dispose();
    scene.traverse((o) => {
      const any = o as THREE.Mesh;
      if (any.geometry) any.geometry.dispose();
    });
    for (const t of chipTex.values()) t.dispose();
    host.innerHTML = "";
  };
}
